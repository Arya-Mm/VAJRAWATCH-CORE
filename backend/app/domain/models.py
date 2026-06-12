from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from backend.app.core.ids import new_id
from backend.app.core.time import utc_now

JsonObject = dict[str, Any]


class RiskTier(StrEnum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    ORANGE = "ORANGE"
    RED = "RED"


class TaskStatus(StrEnum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    RETRYING = "RETRYING"
    CANCELLED = "CANCELLED"


class UserRole(StrEnum):
    OPERATOR = "operator"
    ADMIN = "admin"


class RiskFeatures(BaseModel):
    ndwi_delta: float
    sar_backscatter_change: float
    precip_7d_mm: float
    temp_anomaly_c: float
    seismic_count_14d: int = Field(ge=0)
    seismic_max_magnitude: float = Field(ge=0)
    nvidia_precip_5day_mm: float
    lake_area_km2: float = Field(gt=0)


class TopDriver(BaseModel):
    feature: str
    value: str
    anomaly_ratio: str
    contribution: float


class ImpactSummary(BaseModel):
    population: int
    hydropower_mw: float
    bridges: int = 0
    historical_analog: str
    infrastructure: list[JsonObject] = Field(default_factory=list)


class RiskAssessment(BaseModel):
    lake_id: str
    name: str
    risk_score: int = Field(ge=0, le=100)
    risk_tier: RiskTier
    top_drivers: list[TopDriver]
    features: RiskFeatures
    impact: ImpactSummary
    audio_url: str | None = None
    weather_source: str | None = None
    report: str | None = None
    agent_trace: list[dict[str, str]] | None = None
    generated_at: datetime = Field(default_factory=utc_now)


class ExplainResponse(BaseModel):
    lake_id: str
    name: str
    risk_tier: RiskTier
    risk_score: int = Field(ge=0, le=100)
    explanation: str
    impact: ImpactSummary
    graph_paths: list[JsonObject] = Field(default_factory=list)


class SimulateRequest(BaseModel):
    forced_score: int = Field(default=85, ge=0, le=100)
    reason: str = "manual demo trigger"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10)
    full_name: str = Field(min_length=1, max_length=120)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    user_id: str
    email: EmailStr
    full_name: str
    role: UserRole
    created_at: datetime


class StoredUser(UserPublic):
    password_hash: str


class TokenPair(BaseModel):
    token_type: Literal["bearer"] = "bearer"
    access_token: str
    refresh_token: str


class TokenPayload(BaseModel):
    subject: str = Field(alias="sub")
    token_type: Literal["access", "refresh"] = Field(alias="type")
    issued_at: int = Field(alias="iat")
    expires_at: int = Field(alias="exp")


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AuditEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: new_id("audit"))
    actor_id: str | None = None
    action: str
    resource_type: str
    resource_id: str
    metadata: JsonObject = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)


class MemoryRecord(BaseModel):
    memory_id: str = Field(default_factory=lambda: new_id("mem"))
    task_id: str | None = None
    agent_name: str | None = None
    key: str
    value: JsonObject
    created_at: datetime = Field(default_factory=utc_now)


class AgentMessage(BaseModel):
    message_id: str = Field(default_factory=lambda: new_id("msg"))
    task_id: str
    agent_name: str
    role: Literal["system", "agent", "tool", "error"]
    content: str
    metadata: JsonObject = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)


class ToolSpec(BaseModel):
    name: str
    description: str
    input_schema: JsonObject
    requires_auth: bool = True


class ToolExecutionRequest(BaseModel):
    payload: JsonObject = Field(default_factory=dict)


class ToolExecution(BaseModel):
    execution_id: str = Field(default_factory=lambda: new_id("tool"))
    task_id: str | None = None
    tool_name: str
    status: TaskStatus
    input_payload: JsonObject
    output_payload: JsonObject = Field(default_factory=dict)
    error: str | None = None
    started_at: datetime = Field(default_factory=utc_now)
    completed_at: datetime | None = None


class TaskCreate(BaseModel):
    task_type: str = "glof_analysis"
    lake_id: str = "PDGL_THULAGI_01"
    payload: JsonObject = Field(default_factory=dict)
    execute_immediately: bool = True


class TaskRecord(BaseModel):
    task_id: str = Field(default_factory=lambda: new_id("task"))
    task_type: str
    lake_id: str
    status: TaskStatus = TaskStatus.QUEUED
    payload: JsonObject = Field(default_factory=dict)
    result: JsonObject = Field(default_factory=dict)
    error: str | None = None
    retry_count: int = 0
    max_retries: int = 3
    recovery_action: str | None = None
    created_by: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    @field_validator("retry_count", "max_retries")
    @classmethod
    def validate_retries(cls, value: int) -> int:
        if value < 0:
            raise ValueError("retry values must be non-negative")
        return value


class WorkflowRun(BaseModel):
    run_id: str = Field(default_factory=lambda: new_id("run"))
    task_id: str
    workflow_name: str = "glof-analysis"
    lake_id: str
    status: TaskStatus = TaskStatus.QUEUED
    started_at: datetime = Field(default_factory=utc_now)
    completed_at: datetime | None = None
    summary: str | None = None
    metadata: JsonObject = Field(default_factory=dict)


class WorkflowRunResponse(BaseModel):
    task: TaskRecord
    workflow_run: WorkflowRun
    messages: list[AgentMessage]
    tool_executions: list[ToolExecution]
    memories: list[MemoryRecord]


class DependencyStatus(BaseModel):
    name: str
    status: Literal["ok", "degraded", "missing_config", "failed"]
    details: JsonObject = Field(default_factory=dict)


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    service: str
    version: str
    dependencies: list[DependencyStatus] = Field(default_factory=list)

    model_config = ConfigDict(use_enum_values=True)
