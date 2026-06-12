from __future__ import annotations

from typing import Annotated, cast

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.api.dependencies import get_container, get_current_user
from backend.app.container import AppContainer
from backend.app.domain.models import (
    AgentMessage,
    MemoryRecord,
    TaskCreate,
    TaskRecord,
    ToolExecution,
    UserPublic,
)
from backend.app.repositories.protocols import AppRepository
from backend.app.services.tasks import TaskService
from backend.app.services.workflow import WorkflowService

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskEventsResponse(TaskRecord):
    messages: list[AgentMessage]
    tool_executions: list[ToolExecution]
    memories: list[MemoryRecord]


@router.post("", response_model=TaskRecord, status_code=status.HTTP_201_CREATED)
async def create_task(
    request: TaskCreate,
    container: Annotated[AppContainer, Depends(get_container)],
    current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> TaskRecord:
    if request.execute_immediately:
        workflow_service = cast(WorkflowService, container.workflow_service)
        response = await workflow_service.run_glof_analysis(request, user_id=current_user.user_id)
        return response.task
    task_service = cast(TaskService, container.task_service)
    return await task_service.create_task(request, user_id=current_user.user_id)


@router.get("/{task_id}", response_model=TaskRecord)
async def get_task(
    task_id: str,
    container: Annotated[AppContainer, Depends(get_container)],
    _current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> TaskRecord:
    task_service = cast(TaskService, container.task_service)
    task = await task_service.get_task(task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="task not found")
    return task


@router.get("/{task_id}/events", response_model=TaskEventsResponse)
async def get_task_events(
    task_id: str,
    container: Annotated[AppContainer, Depends(get_container)],
    _current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> TaskEventsResponse:
    task_service = cast(TaskService, container.task_service)
    task = await task_service.get_task(task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="task not found")
    repository = cast(AppRepository, container.repository)
    return TaskEventsResponse(
        **task.model_dump(),
        messages=await repository.list_agent_messages(task_id),
        tool_executions=await repository.list_tool_executions(task_id),
        memories=await repository.list_memories(task_id),
    )
