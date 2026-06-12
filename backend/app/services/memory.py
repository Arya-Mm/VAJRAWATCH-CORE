from __future__ import annotations

from backend.app.domain.models import JsonObject, MemoryRecord
from backend.app.repositories.protocols import AppRepository


class MemoryService:
    def __init__(self, repository: AppRepository) -> None:
        self._repository = repository

    async def write(
        self,
        *,
        key: str,
        value: JsonObject,
        task_id: str | None = None,
        agent_name: str | None = None,
    ) -> MemoryRecord:
        record = MemoryRecord(task_id=task_id, agent_name=agent_name, key=key, value=value)
        return await self._repository.save_memory(record)

    async def read_for_task(self, task_id: str) -> list[MemoryRecord]:
        return await self._repository.list_memories(task_id)
