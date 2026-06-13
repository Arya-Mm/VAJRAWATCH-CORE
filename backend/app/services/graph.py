from __future__ import annotations

from backend.app.domain.models import ExplainResponse, ImpactSummary, RiskAssessment
from backend.app.repositories.protocols import GraphRepository


class GraphService:
    def __init__(self, graph_repository: GraphRepository) -> None:
        self._graph_repository = graph_repository

    async def impact_for_lake(self, lake_id: str) -> ImpactSummary | None:
        return await self._graph_repository.get_impact(lake_id)

    async def explain(self, assessment: RiskAssessment) -> ExplainResponse:
        impact = await self._graph_repository.get_impact(assessment.lake_id)
        if impact is None:
            impact = assessment.impact

        from backend.ml.features import calculate_risk
        risk_calc = calculate_risk(assessment.features.model_dump())
        base_explanation = risk_calc.get("explanation", "")

        explanation = (
            f"{base_explanation} "
            f"Furthermore, the downstream GraphRAG layer identifies {impact.population} people, "
            f"{impact.hydropower_mw:g} MW of hydropower exposure, and the closest "
            f"historical analog is {impact.historical_analog}."
        )

        return ExplainResponse(
            lake_id=assessment.lake_id,
            name=assessment.name,
            risk_tier=assessment.risk_tier,
            risk_score=assessment.risk_score,
            explanation=explanation,
            impact=impact,
            graph_paths=[
                {
                    "from": assessment.lake_id,
                    "relationship": "THREATENS",
                    "to": item.get("infrastructure_id", item.get("name", "unknown")),
                }
                for item in impact.infrastructure
            ],
        )
