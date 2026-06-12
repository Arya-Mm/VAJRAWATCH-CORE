from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import cast

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.router import api_router
from backend.app.container import AppContainer
from backend.app.core.config import Settings, get_settings
from backend.app.core.logging import configure_logging, get_logger
from backend.app.db.neo4j import Neo4jConnectionManager
from backend.app.db.schema import initialize_schema, seed_demo_graph
from backend.app.integrations.antigravity import AntigravityAdapter
from backend.app.observability.middleware import RequestContextMiddleware
from backend.app.repositories.memory import InMemoryRepository, StaticGraphRepository
from backend.app.repositories.neo4j import Neo4jRepository
from backend.app.repositories.protocols import AppRepository, GraphRepository
from backend.app.services.audit import AuditService
from backend.app.services.auth import AuthService
from backend.app.services.graph import GraphService
from backend.app.services.memory import MemoryService
from backend.app.services.risk import RiskService
from backend.app.services.tasks import TaskService
from backend.app.services.tools import ToolRegistry
from backend.app.services.workflow import WorkflowService


async def build_container(settings: Settings) -> AppContainer:
    logger = get_logger(__name__)
    neo4j_manager: Neo4jConnectionManager | None = None

    if settings.has_neo4j_config:
        neo4j_manager = Neo4jConnectionManager(settings)
        await neo4j_manager.connect()
        await initialize_schema(neo4j_manager)
        await seed_demo_graph(neo4j_manager)
        repository: AppRepository = Neo4jRepository(neo4j_manager)
        graph_repository: GraphRepository = cast(GraphRepository, repository)
        await logger.ainfo("neo4j_repository_enabled", config=settings.neo4j_safe_config)
    else:
        repository = InMemoryRepository()
        graph_repository = StaticGraphRepository()
        await logger.ainfo("in_memory_repository_enabled")

    auth_service = AuthService(repository, settings)
    risk_service = RiskService(settings, repository, graph_repository)
    graph_service = GraphService(graph_repository)
    audit_service = AuditService(repository)
    memory_service = MemoryService(repository)
    antigravity_adapter = AntigravityAdapter(settings)
    tool_registry = ToolRegistry(
        repository, risk_service, graph_service, memory_service, audit_service
    )
    task_service = TaskService(repository)
    workflow_service = WorkflowService(repository, task_service, tool_registry, antigravity_adapter)

    return AppContainer(
        settings=settings,
        repository=repository,
        graph_repository=graph_repository,
        neo4j_manager=neo4j_manager,
        auth_service=auth_service,
        risk_service=risk_service,
        graph_service=graph_service,
        audit_service=audit_service,
        memory_service=memory_service,
        tool_registry=tool_registry,
        task_service=task_service,
        workflow_service=workflow_service,
        antigravity_adapter=antigravity_adapter,
    )


def create_app(settings: Settings | None = None) -> FastAPI:
    runtime_settings = settings or get_settings()
    configure_logging(runtime_settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
        container = await build_container(runtime_settings)
        app.state.container = container
        try:
            yield
        finally:
            if container.neo4j_manager is not None:
                manager = cast(Neo4jConnectionManager, container.neo4j_manager)
                await manager.close()

    app = FastAPI(
        title=runtime_settings.app_name,
        version="0.3.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=runtime_settings.api_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)
    return app


app = create_app()
