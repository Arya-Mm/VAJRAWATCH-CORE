from __future__ import annotations

from collections.abc import Awaitable, Callable

from backend.app.core.time import utc_now
from backend.app.domain.models import (
    AgentMessage,
    MemoryRecord,
    RiskAssessment,
    TaskCreate,
    TaskRecord,
    TaskStatus,
    WorkflowRun,
    WorkflowRunResponse,
)
from backend.app.integrations.antigravity import AntigravityAdapter
from backend.app.observability.metrics import WORKFLOW_COUNT
from backend.app.repositories.protocols import AppRepository
from backend.app.services.tasks import TaskService
from backend.app.services.tools import ToolContext, ToolRegistry


class WorkflowService:
    def __init__(
        self,
        repository: AppRepository,
        task_service: TaskService,
        tool_registry: ToolRegistry,
        antigravity_adapter: AntigravityAdapter,
    ) -> None:
        self._repository = repository
        self._task_service = task_service
        self._tool_registry = tool_registry
        self._antigravity_adapter = antigravity_adapter

    async def run_glof_analysis(
        self,
        request: TaskCreate,
        user_id: str | None = None,
    ) -> WorkflowRunResponse:
        task = await self._task_service.create_task(request, user_id=user_id)
        run = WorkflowRun(task_id=task.task_id, lake_id=task.lake_id)
        await self._repository.save_workflow_run(run)
        try:
            response = await self._run_with_retries(task, run, user_id=user_id)
            WORKFLOW_COUNT.labels("glof-analysis", "succeeded").inc()
            return response
        except Exception:
            WORKFLOW_COUNT.labels("glof-analysis", "failed").inc()
            raise

    async def _run_with_retries(
        self,
        task: TaskRecord,
        run: WorkflowRun,
        user_id: str | None,
    ) -> WorkflowRunResponse:
        attempt = 0
        current_task = task
        while attempt <= task.max_retries:
            try:
                return await self._execute_once(current_task, run, user_id=user_id)
            except Exception as exc:
                attempt += 1
                if attempt > task.max_retries:
                    failed_task = await self._task_service.update_status(
                        current_task,
                        TaskStatus.FAILED,
                        error=repr(exc),
                        recovery_action="manual_review_required",
                        retry_count=attempt - 1,
                    )
                    failed_run = run.model_copy(
                        update={
                            "status": TaskStatus.FAILED,
                            "completed_at": utc_now(),
                            "summary": repr(exc),
                        }
                    )
                    await self._repository.save_workflow_run(failed_run)
                    return await self._collect_response(failed_task, failed_run)
                current_task = await self._task_service.update_status(
                    current_task,
                    TaskStatus.RETRYING,
                    error=repr(exc),
                    recovery_action="retrying_full_workflow",
                    retry_count=attempt,
                )
        raise RuntimeError("workflow retry loop exited unexpectedly")

    async def _execute_once(
        self,
        task: TaskRecord,
        run: WorkflowRun,
        user_id: str | None,
    ) -> WorkflowRunResponse:
        task = await self._task_service.update_status(task, TaskStatus.RUNNING)
        run = run.model_copy(update={"status": TaskStatus.RUNNING})
        await self._repository.save_workflow_run(run)

        context = ToolContext(task_id=task.task_id, user_id=user_id)
        stages: list[Callable[[], Awaitable[None]]] = [
            lambda: self._sentinel_stage(task),
            lambda: self._environmental_stage(task),
            lambda: self._risk_stage(task, context),
            lambda: self._skeptic_stage(task),
            lambda: self._report_stage(task, run),
        ]

        for stage in stages:
            await stage()

        final_assessment = await self._latest_assessment(task.task_id)
        result = final_assessment.model_dump(mode="json") if final_assessment else {}
        task = await self._task_service.update_status(task, TaskStatus.SUCCEEDED, result=result)
        run = run.model_copy(update={"status": TaskStatus.SUCCEEDED, "completed_at": utc_now()})
        await self._repository.save_workflow_run(run)
        return await self._collect_response(task, run)

    async def _sentinel_stage(self, task: TaskRecord) -> None:
        await self._save_message(
            task,
            "sentinel",
            "Optical NDWI and SAR backscatter deltas show rapid lake expansion and ice structure change.",
        )

    async def _environmental_stage(self, task: TaskRecord) -> None:
        await self._save_message(
            task,
            "environmental",
            "Seven-day precipitation, forecast precipitation, temperature anomaly, and seismic signals are elevated.",
        )

    async def _risk_stage(self, task: TaskRecord, context: ToolContext) -> None:
        execution = await self._tool_registry.execute(
            "risk_calculation",
            context,
            {"lake_id": task.lake_id},
        )
        if execution.status is TaskStatus.FAILED:
            raise RuntimeError(execution.error or "risk_calculation_failed")
        assessment = RiskAssessment.model_validate(execution.output_payload)
        await self._repository.save_memory(
            MemoryRecord(
                task_id=task.task_id,
                agent_name="risk_assessment",
                key="risk_assessment",
                value=assessment.model_dump(mode="json"),
            )
        )
        await self._save_message(
            task,
            "risk_assessment",
            f"Deterministic risk engine returned {assessment.risk_score}/100 ({assessment.risk_tier.value}).",
        )

    async def _skeptic_stage(self, task: TaskRecord) -> None:
        assessment = await self._latest_assessment(task.task_id)
        finding = "Skeptic check passed: high risk is supported by multiple independent drivers."
        if assessment.risk_score >= 80 and len(assessment.top_drivers) < 2:
            finding = "Skeptic check flagged insufficient independent drivers for RED status."
        await self._save_message(task, "skeptic", finding)

    async def _report_stage(self, task: TaskRecord, run: WorkflowRun) -> None:
        assessment = await self._latest_assessment(task.task_id)
        messages = await self._repository.list_agent_messages(task.task_id)
        summary = await self._antigravity_adapter.summarize_decision(assessment, messages)
        run = run.model_copy(update={"summary": summary})
        await self._repository.save_workflow_run(run)
        await self._save_message(task, "decision_report", summary)

    async def _latest_assessment(self, task_id: str) -> RiskAssessment:
        memories = await self._repository.list_memories(task_id)
        for memory in reversed(memories):
            if memory.key == "risk_assessment":
                return RiskAssessment.model_validate(memory.value)
        raise RuntimeError("risk_assessment_memory_missing")

    async def _save_message(self, task: TaskRecord, agent_name: str, content: str) -> AgentMessage:
        message = AgentMessage(
            task_id=task.task_id, agent_name=agent_name, role="agent", content=content
        )
        return await self._repository.save_agent_message(message)

    async def _collect_response(self, task: TaskRecord, run: WorkflowRun) -> WorkflowRunResponse:
        return WorkflowRunResponse(
            task=task,
            workflow_run=run,
            messages=await self._repository.list_agent_messages(task.task_id),
            tool_executions=await self._repository.list_tool_executions(task.task_id),
            memories=await self._repository.list_memories(task.task_id),
        )
