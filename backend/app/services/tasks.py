from __future__ import annotations

from backend.app.core.time import utc_now
from backend.app.domain.models import TaskCreate, TaskRecord, TaskStatus
from backend.app.repositories.protocols import AppRepository


class TaskService:
    def __init__(self, repository: AppRepository) -> None:
        self._repository = repository

    async def create_task(self, request: TaskCreate, user_id: str | None = None) -> TaskRecord:
        task = TaskRecord(
            task_type=request.task_type,
            lake_id=request.lake_id,
            payload=request.payload,
            created_by=user_id,
        )
        return await self._repository.save_task(task)

    async def get_task(self, task_id: str) -> TaskRecord | None:
        return await self._repository.get_task(task_id)

    async def update_status(
        self,
        task: TaskRecord,
        status: TaskStatus,
        *,
        result: dict[str, object] | None = None,
        error: str | None = None,
        recovery_action: str | None = None,
        retry_count: int | None = None,
    ) -> TaskRecord:
        updated = task.model_copy(
            update={
                "status": status,
                "result": result if result is not None else task.result,
                "error": error,
                "recovery_action": recovery_action,
                "retry_count": retry_count if retry_count is not None else task.retry_count,
                "updated_at": utc_now(),
            }
        )
        return await self._repository.save_task(updated)
