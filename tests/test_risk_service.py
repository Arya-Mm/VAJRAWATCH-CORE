from __future__ import annotations

import pytest
from backend.app.core.config import Settings
from backend.app.domain.models import RiskTier
from backend.app.repositories.memory import InMemoryRepository, StaticGraphRepository
from backend.app.services.risk import RiskService


@pytest.mark.asyncio
async def test_risk_service_assessment() -> None:
    settings = Settings()
    repository = InMemoryRepository()
    graph_repository = StaticGraphRepository()

    risk_service = RiskService(settings, repository, graph_repository)

    # Assess Thulagi Lake
    assessment = await risk_service.assess_lake("PDGL_THULAGI_01")

    assert assessment.lake_id == "PDGL_THULAGI_01"
    assert assessment.name == "Thulagi Lake"
    assert 0 <= assessment.risk_score <= 100
    assert assessment.risk_tier in {
        RiskTier.GREEN,
        RiskTier.YELLOW,
        RiskTier.ORANGE,
        RiskTier.RED,
    }
    assert len(assessment.top_drivers) > 0
    assert assessment.weather_source is not None
    assert assessment.report is not None
    assert assessment.agent_trace is not None

    # Simulate RED alert (forced score 90) to trigger TTS alert path
    await repository.set_simulated_score("PDGL_THULAGI_01", 90)
    assessment_red = await risk_service.assess_lake("PDGL_THULAGI_01")
    assert assessment_red.risk_tier is RiskTier.RED
    assert assessment_red.audio_url is not None
    assert assessment_red.audio_url.endswith(".mp3")
