from __future__ import annotations

from typing import Annotated, cast

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.api.dependencies import get_container, get_current_user
from backend.app.container import AppContainer
from backend.app.domain.models import ExplainResponse, RiskAssessment, SimulateRequest, UserPublic
from backend.app.repositories.protocols import AppRepository
from backend.app.services.audit import AuditService
from backend.app.services.graph import GraphService
from backend.app.services.risk import RiskService

router = APIRouter(tags=["lakes"])


@router.get("/risk/{lake_id}", response_model=RiskAssessment)
@router.get("/lakes/{lake_id}/risk", response_model=RiskAssessment)
async def get_risk(
    lake_id: str,
    container: Annotated[AppContainer, Depends(get_container)],
) -> RiskAssessment:
    risk_service = cast(RiskService, container.risk_service)
    try:
        return await risk_service.assess_lake(lake_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/explain/{lake_id}", response_model=ExplainResponse)
@router.get("/lakes/{lake_id}/explain", response_model=ExplainResponse)
async def explain(
    lake_id: str,
    container: Annotated[AppContainer, Depends(get_container)],
) -> ExplainResponse:
    risk_service = cast(RiskService, container.risk_service)
    graph_service = cast(GraphService, container.graph_service)
    try:
        assessment = await risk_service.assess_lake(lake_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return await graph_service.explain(assessment)


@router.post("/simulate/{lake_id}", response_model=RiskAssessment)
@router.post("/lakes/{lake_id}/simulate", response_model=RiskAssessment)
async def simulate(
    lake_id: str,
    request: SimulateRequest,
    container: Annotated[AppContainer, Depends(get_container)],
    current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> RiskAssessment:
    repository = cast(AppRepository, container.repository)
    await repository.set_simulated_score(lake_id, request.forced_score)
    audit_service = cast(AuditService, container.audit_service)
    await audit_service.record(
        action="simulate_risk_score",
        resource_type="lake",
        resource_id=lake_id,
        actor_id=current_user.user_id,
        metadata={"forced_score": request.forced_score, "reason": request.reason},
    )
    risk_service = cast(RiskService, container.risk_service)
    return await risk_service.assess_lake(lake_id)
