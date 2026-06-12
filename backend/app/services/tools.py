from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from backend.app.core.time import utc_now
from backend.app.domain.models import (
    JsonObject,
    TaskStatus,
    ToolExecution,
    ToolSpec,
)
from backend.app.repositories.protocols import AppRepository
from backend.app.services.audit import AuditService
from backend.app.services.graph import GraphService
from backend.app.services.memory import MemoryService
from backend.app.services.risk import RiskService


@dataclass(frozen=True, slots=True)
class ToolContext:
    task_id: str | None
    user_id: str | None


ToolHandler = Callable[[ToolContext, JsonObject], Awaitable[JsonObject]]


class ToolRegistry:
    def __init__(
        self,
        repository: AppRepository,
        risk_service: RiskService,
        graph_service: GraphService,
        memory_service: MemoryService,
        audit_service: AuditService,
    ) -> None:
        self._repository = repository
        self._handlers: dict[str, ToolHandler] = {
            "risk_calculation": self._risk_calculation,
            "graph_impact_lookup": self._graph_impact_lookup,
            "memory_write": self._memory_write,
            "memory_read": self._memory_read,
            "audit_log": self._audit_log,
            "status_report": self._status_report,
        }
        self._risk_service = risk_service
        self._graph_service = graph_service
        self._memory_service = memory_service
        self._audit_service = audit_service

    def list_specs(self) -> list[ToolSpec]:
        return [
            ToolSpec(
                name="risk_calculation",
                description="Calculate deterministic 8-feature GLOF risk for a lake.",
                input_schema={"type": "object", "properties": {"lake_id": {"type": "string"}}},
            ),
            ToolSpec(
                name="graph_impact_lookup",
                description="Lookup downstream population and infrastructure exposure.",
                input_schema={"type": "object", "properties": {"lake_id": {"type": "string"}}},
            ),
            ToolSpec(
                name="memory_write",
                description="Persist workflow memory.",
                input_schema={"type": "object", "properties": {"key": {}, "value": {}}},
            ),
            ToolSpec(
                name="memory_read",
                description="Read task-scoped workflow memory.",
                input_schema={"type": "object", "properties": {"task_id": {"type": "string"}}},
            ),
            ToolSpec(
                name="audit_log",
                description="Write an audit event.",
                input_schema={"type": "object", "properties": {"action": {"type": "string"}}},
            ),
            ToolSpec(
                name="status_report",
                description="Return task status and agent event counts.",
                input_schema={"type": "object", "properties": {"task_id": {"type": "string"}}},
            ),
        ]

    async def execute(self, name: str, context: ToolContext, payload: JsonObject) -> ToolExecution:
        handler = self._handlers.get(name)
        if handler is None:
            raise KeyError(name)
        execution = ToolExecution(
            task_id=context.task_id,
            tool_name=name,
            status=TaskStatus.RUNNING,
            input_payload=payload,
        )
        await self._repository.save_tool_execution(execution)
        try:
            output = await handler(context, payload)
            execution = execution.model_copy(
                update={
                    "status": TaskStatus.SUCCEEDED,
                    "output_payload": output,
                    "completed_at": utc_now(),
                }
            )
        except Exception as exc:
            execution = execution.model_copy(
                update={
                    "status": TaskStatus.FAILED,
                    "error": repr(exc),
                    "completed_at": utc_now(),
                }
            )
        return await self._repository.save_tool_execution(execution)

    async def _risk_calculation(self, _context: ToolContext, payload: JsonObject) -> JsonObject:
        lake_id = str(payload.get("lake_id", "PDGL_THULAGI_01"))
        assessment = await self._risk_service.assess_lake(lake_id)
        return assessment.model_dump(mode="json")

    async def _graph_impact_lookup(self, _context: ToolContext, payload: JsonObject) -> JsonObject:
        lake_id = str(payload.get("lake_id", "PDGL_THULAGI_01"))
        impact = await self._graph_service.impact_for_lake(lake_id)
        return impact.model_dump(mode="json") if impact else {"impact": None}

    async def _memory_write(self, context: ToolContext, payload: JsonObject) -> JsonObject:
        key = str(payload["key"])
        value = payload.get("value", {})
        if not isinstance(value, dict):
            value = {"value": value}
        memory = await self._memory_service.write(key=key, value=value, task_id=context.task_id)
        return memory.model_dump(mode="json")

    async def _memory_read(self, context: ToolContext, payload: JsonObject) -> JsonObject:
        task_id = str(payload.get("task_id") or context.task_id)
        memories = await self._memory_service.read_for_task(task_id)
        return {"memories": [memory.model_dump(mode="json") for memory in memories]}

    async def _audit_log(self, context: ToolContext, payload: JsonObject) -> JsonObject:
        event = await self._audit_service.record(
            action=str(payload.get("action", "tool_execution")),
            resource_type=str(payload.get("resource_type", "task")),
            resource_id=str(payload.get("resource_id", context.task_id or "unknown")),
            actor_id=context.user_id,
            metadata=dict(payload.get("metadata", {})),
        )
        return event.model_dump(mode="json")

    async def _status_report(self, context: ToolContext, payload: JsonObject) -> JsonObject:
        task_id = str(payload.get("task_id") or context.task_id)
        task = await self._repository.get_task(task_id)
        messages = await self._repository.list_agent_messages(task_id)
        tool_executions = await self._repository.list_tool_executions(task_id)
        return {
            "task": task.model_dump(mode="json") if task else None,
            "message_count": len(messages),
            "tool_execution_count": len(tool_executions),
        }
