from __future__ import annotations

from typing import Annotated, cast

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.api.dependencies import get_container, get_current_user
from backend.app.container import AppContainer
from backend.app.domain.models import ToolExecution, ToolExecutionRequest, ToolSpec, UserPublic
from backend.app.services.tools import ToolContext, ToolRegistry

router = APIRouter(prefix="/tools", tags=["tools"])


@router.get("", response_model=list[ToolSpec])
async def list_tools(container: Annotated[AppContainer, Depends(get_container)]) -> list[ToolSpec]:
    registry = cast(ToolRegistry, container.tool_registry)
    return registry.list_specs()


@router.post("/{tool_name}/execute", response_model=ToolExecution)
async def execute_tool(
    tool_name: str,
    request: ToolExecutionRequest,
    container: Annotated[AppContainer, Depends(get_container)],
    current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> ToolExecution:
    registry = cast(ToolRegistry, container.tool_registry)
    try:
        return await registry.execute(
            tool_name,
            ToolContext(
                task_id=(
                    str(request.payload.get("task_id")) if request.payload.get("task_id") else None
                ),
                user_id=current_user.user_id,
            ),
            request.payload,
        )
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="tool not found") from exc
