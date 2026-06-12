from __future__ import annotations

import asyncio

from backend.app.domain.models import (
    AgentMessage,
    AuditEvent,
    ImpactSummary,
    MemoryRecord,
    StoredUser,
    TaskRecord,
    ToolExecution,
    WorkflowRun,
)


class InMemoryRepository:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._users_by_id: dict[str, StoredUser] = {}
        self._users_by_email: dict[str, StoredUser] = {}
        self._tasks: dict[str, TaskRecord] = {}
        self._workflow_runs: dict[str, WorkflowRun] = {}
        self._messages: list[AgentMessage] = []
        self._tool_executions: list[ToolExecution] = []
        self._memories: list[MemoryRecord] = []
        self._audit_events: list[AuditEvent] = []
        self._simulated_scores: dict[str, int] = {}

    async def create_user(self, user: StoredUser) -> StoredUser:
        async with self._lock:
            if user.email.lower() in self._users_by_email:
                raise ValueError("user_email_already_exists")
            self._users_by_id[user.user_id] = user
            self._users_by_email[user.email.lower()] = user
        return user

    async def get_user_by_email(self, email: str) -> StoredUser | None:
        async with self._lock:
            return self._users_by_email.get(email.lower())

    async def get_user_by_id(self, user_id: str) -> StoredUser | None:
        async with self._lock:
            return self._users_by_id.get(user_id)

    async def save_task(self, task: TaskRecord) -> TaskRecord:
        async with self._lock:
            self._tasks[task.task_id] = task
        return task

    async def get_task(self, task_id: str) -> TaskRecord | None:
        async with self._lock:
            return self._tasks.get(task_id)

    async def save_workflow_run(self, run: WorkflowRun) -> WorkflowRun:
        async with self._lock:
            self._workflow_runs[run.run_id] = run
        return run

    async def get_workflow_run(self, run_id: str) -> WorkflowRun | None:
        async with self._lock:
            return self._workflow_runs.get(run_id)

    async def save_agent_message(self, message: AgentMessage) -> AgentMessage:
        async with self._lock:
            self._messages.append(message)
        return message

    async def list_agent_messages(self, task_id: str) -> list[AgentMessage]:
        async with self._lock:
            return [message for message in self._messages if message.task_id == task_id]

    async def save_tool_execution(self, execution: ToolExecution) -> ToolExecution:
        async with self._lock:
            self._tool_executions.append(execution)
        return execution

    async def list_tool_executions(self, task_id: str) -> list[ToolExecution]:
        async with self._lock:
            return [
                execution for execution in self._tool_executions if execution.task_id == task_id
            ]

    async def save_memory(self, memory: MemoryRecord) -> MemoryRecord:
        async with self._lock:
            self._memories.append(memory)
        return memory

    async def list_memories(self, task_id: str | None = None) -> list[MemoryRecord]:
        async with self._lock:
            if task_id is None:
                return list(self._memories)
            return [memory for memory in self._memories if memory.task_id == task_id]

    async def save_audit_event(self, event: AuditEvent) -> AuditEvent:
        async with self._lock:
            self._audit_events.append(event)
        return event

    async def list_audit_events(self, resource_id: str | None = None) -> list[AuditEvent]:
        async with self._lock:
            if resource_id is None:
                return list(self._audit_events)
            return [event for event in self._audit_events if event.resource_id == resource_id]

    async def set_simulated_score(self, lake_id: str, score: int) -> None:
        async with self._lock:
            self._simulated_scores[lake_id] = score

    async def get_simulated_score(self, lake_id: str) -> int | None:
        async with self._lock:
            return self._simulated_scores.get(lake_id)


class StaticGraphRepository:
    async def health_check(self) -> dict[str, object]:
        return {"backend": "static-fallback", "connected": False}

    async def get_impact(self, lake_id: str) -> ImpactSummary | None:
        if lake_id not in {"PDGL_THULAGI_01", "thulagi"}:
            return None
        return ImpactSummary(
            population=12_480,
            hydropower_mw=186.0,
            bridges=7,
            historical_analog="South Lonak 2023",
            infrastructure=[
                {
                    "infrastructure_id": "INF_BESISAHAR_HYDRO_01",
                    "name": "Besisahar Hydropower Corridor",
                    "type": "hydropower",
                    "capacity_mw": 50.0,
                    "distance_km": 42.5,
                },
                {
                    "infrastructure_id": "INF_MARSYANGDI_BRIDGE_01",
                    "name": "Marsyangdi River Bridge",
                    "type": "bridge",
                    "distance_km": 31.2,
                },
            ],
        )
