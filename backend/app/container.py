from __future__ import annotations

from dataclasses import dataclass

from backend.app.core.config import Settings


@dataclass(slots=True)
class AppContainer:
    settings: Settings
    repository: object
    graph_repository: object
    neo4j_manager: object | None
    auth_service: object
    risk_service: object
    graph_service: object
    audit_service: object
    memory_service: object
    tool_registry: object
    task_service: object
    workflow_service: object
    antigravity_adapter: object
