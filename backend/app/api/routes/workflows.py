from __future__ import annotations

from typing import Annotated, cast

from fastapi import APIRouter, Depends

from backend.app.api.dependencies import get_container, get_current_user
from backend.app.container import AppContainer
from backend.app.domain.models import TaskCreate, UserPublic, WorkflowRunResponse
from backend.app.services.workflow import WorkflowService

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("/glof-analysis/run", response_model=WorkflowRunResponse)
async def run_glof_analysis(
    request: TaskCreate,
    container: Annotated[AppContainer, Depends(get_container)],
    current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> WorkflowRunResponse:
    workflow_service = cast(WorkflowService, container.workflow_service)
    return await workflow_service.run_glof_analysis(request, user_id=current_user.user_id)
