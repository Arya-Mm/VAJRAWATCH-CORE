from __future__ import annotations

from fastapi import APIRouter

from backend.app.api.routes import auth, health, lakes, tasks, tools, workflows

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(lakes.router)
api_router.include_router(tasks.router)
api_router.include_router(tools.router)
api_router.include_router(workflows.router)
