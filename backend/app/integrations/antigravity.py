from __future__ import annotations

import httpx
from backend.app.core.config import Settings
from backend.app.core.logging import get_logger
from backend.app.domain.models import AgentMessage, RiskAssessment


class AntigravityAdapter:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._logger = get_logger(__name__)

    @property
    def enabled(self) -> bool:
        return self._settings.antigravity_enabled

    async def summarize_decision(
        self, assessment: RiskAssessment, messages: list[AgentMessage]
    ) -> str:
        fallback = self._fallback_summary(assessment)

        if self._settings.antigravity_enabled:
            try:
                from google.antigravity import Agent, LocalAgentConfig

                prompt = (
                    "Summarize this GLOF risk assessment in three concise operational sentences. "
                    f"Lake: {assessment.name}. Score: {assessment.risk_score}. "
                    f"Tier: {assessment.risk_tier.value}. "
                    f"Agent findings: {[message.content for message in messages[-5:]]}"
                )
                config = LocalAgentConfig(
                    system_instructions="You are the VajraWatch decision report agent.",
                    api_key=self._settings.gemini_api_key,
                )
                async with Agent(config) as agent:
                    response = await agent.chat(prompt)
                    summary = await response.text()
                return summary.strip() or fallback
            except Exception as exc:
                await self._logger.awarning("antigravity_summary_failed", error=repr(exc))

        if self._settings.nvidia_api_key:
            try:
                driver_feat = (
                    assessment.top_drivers[0].feature if assessment.top_drivers else "unknown"
                )
                prompt = (
                    f"You are a GLOF risk analyst. "
                    f"Thulagi Lake GLOF risk score: {assessment.risk_score}/100. "
                    f"Status: {assessment.risk_tier.value}. "
                    f"Primary driver: {driver_feat}. "
                    f"Write a 2-sentence decision brief for a hydropower plant operator. Be direct."
                )
                async with httpx.AsyncClient() as client:
                    r = await client.post(
                        "https://integrate.api.nvidia.com/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self._settings.nvidia_api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": "meta/llama-3.3-70b-instruct",
                            "messages": [{"role": "user", "content": prompt}],
                            "max_tokens": 150,
                            "temperature": 0.3,
                        },
                        timeout=10.0,
                    )
                    if r.status_code == 200:
                        content = r.json()["choices"][0]["message"]["content"]
                        return str(content).strip()
            except Exception as exc:
                await self._logger.awarning("nvidia_summary_failed", error=repr(exc))

        return fallback

    @staticmethod
    def _fallback_summary(assessment: RiskAssessment) -> str:
        drivers = ", ".join(driver.feature for driver in assessment.top_drivers[:2])
        return (
            f"{assessment.name} is at {assessment.risk_score}/100 "
            f"({assessment.risk_tier.value}). Main drivers: {drivers}. "
            "Recommend immediate downstream readiness checks and hydropower shutdown review."
        )
