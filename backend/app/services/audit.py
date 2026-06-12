from __future__ import annotations

from backend.app.domain.models import AuditEvent, JsonObject
from backend.app.repositories.protocols import AppRepository


class AuditService:
    def __init__(self, repository: AppRepository) -> None:
        self._repository = repository

    async def record(
        self,
        *,
        action: str,
        resource_type: str,
        resource_id: str,
        actor_id: str | None = None,
        metadata: JsonObject | None = None,
    ) -> AuditEvent:
        event = AuditEvent(
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata=metadata or {},
        )
        return await self._repository.save_audit_event(event)
