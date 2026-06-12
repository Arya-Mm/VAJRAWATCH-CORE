from __future__ import annotations

from typing import Annotated, cast

from fastapi import APIRouter, Depends

from backend.app.api.dependencies import get_container
from backend.app.container import AppContainer
from backend.app.domain.models import DependencyStatus, HealthResponse
from backend.app.observability.metrics import metrics_response
from backend.app.repositories.protocols import GraphRepository

router = APIRouter(tags=["health"])


@router.get("/health/live", response_model=HealthResponse)
async def live(container: Annotated[AppContainer, Depends(get_container)]) -> HealthResponse:
    return HealthResponse(status="ok", service=container.settings.app_name, version="0.3.0")


@router.get("/health", response_model=HealthResponse)
async def legacy_health(
    container: Annotated[AppContainer, Depends(get_container)],
) -> HealthResponse:
    return await ready(container)


@router.get("/health/ready", response_model=HealthResponse)
async def ready(container: Annotated[AppContainer, Depends(get_container)]) -> HealthResponse:
    dependencies = await _dependency_statuses(container)
    status = "ok" if all(item.status == "ok" for item in dependencies) else "degraded"
    return HealthResponse(
        status=status,
        service=container.settings.app_name,
        version="0.3.0",
        dependencies=dependencies,
    )


@router.get("/health/dependencies", response_model=list[DependencyStatus])
async def dependencies(
    container: Annotated[AppContainer, Depends(get_container)],
) -> list[DependencyStatus]:
    return await _dependency_statuses(container)


@router.get("/metrics")
async def metrics() -> object:
    return metrics_response()


async def _dependency_statuses(container: AppContainer) -> list[DependencyStatus]:
    graph_repository = cast(GraphRepository, container.graph_repository)
    graph_health = await graph_repository.health_check()
    neo4j_status = "ok" if graph_health.get("connected") else "missing_config"
    if container.settings.has_neo4j_config and not graph_health.get("connected"):
        neo4j_status = "failed"

    return [
        DependencyStatus(name="neo4j", status=neo4j_status, details=graph_health),
        DependencyStatus(
            name="antigravity",
            status="ok" if container.settings.antigravity_enabled else "missing_config",
            details={"enabled": container.settings.antigravity_enabled},
        ),
        DependencyStatus(
            name="repository", status="ok", details={"type": type(container.repository).__name__}
        ),
    ]
