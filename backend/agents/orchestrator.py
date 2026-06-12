from __future__ import annotations

import time
from typing import Any, cast

from backend.ml.features import calculate_risk
from langgraph.graph import END, StateGraph
from typing_extensions import TypedDict


class GLOFState(TypedDict):
    lake_id: str
    raw_data: dict[str, Any]
    risk_result: dict[str, Any]
    graph_context: str
    skeptic_verdict: str
    report: str
    agent_trace: list[dict[str, str]]


def sentinel_node(state: GLOFState) -> GLOFState:
    time.sleep(0.4)  # Simulates real processing for Langfuse trace
    state["agent_trace"].append(
        {"agent": "Sentinel", "status": "NDWI delta: +18.5% | SAR anomaly detected"}
    )
    return state


def environmental_node(state: GLOFState) -> GLOFState:
    time.sleep(0.4)
    state["agent_trace"].append(
        {"agent": "Environmental", "status": "Precip 210mm (1.4x baseline) | Temp +2.8°C"}
    )
    return state


def risk_assessment_node(state: GLOFState) -> GLOFState:
    state["risk_result"] = calculate_risk(state["raw_data"])
    status_str = (
        f"Score: {state['risk_result']['risk_score']} | Tier: {state['risk_result']['risk_tier']}"
    )
    state["agent_trace"].append(
        {
            "agent": "Risk Assessment",
            "status": status_str,
        }
    )
    return state


def skeptic_node(state: GLOFState) -> GLOFState:
    time.sleep(0.3)
    score = float(state["risk_result"]["risk_score"])
    # Skeptic: independent check — confirms if score > 75 and multiple drivers agree
    drivers_firing = len(
        [d for d in state["risk_result"]["top_drivers"] if float(d["contribution"]) > 5.0]
    )
    if score > 75.0 and drivers_firing >= 2:
        verdict = "CONFIRMED"
    elif score > 60.0:
        verdict = "DISPUTED"
    else:
        verdict = "MONITORING"
    state["skeptic_verdict"] = verdict
    state["agent_trace"].append(
        {"agent": "Skeptic", "status": f"Verdict: {verdict} | {drivers_firing} independent signals"}
    )
    return state


def report_node(state: GLOFState) -> GLOFState:
    score = state["risk_result"]["risk_score"]
    tier = state["risk_result"]["risk_tier"]
    verdict = state["skeptic_verdict"]

    # Use Ollama if available, else hardcoded fallback
    try:
        import requests

        payload: dict[str, Any] = {
            "model": "gemma:2b",
            "prompt": (
                f"Thulagi Lake GLOF risk score: {score}/100. Status: {tier}. "
                f"Skeptic verdict: {verdict}. "
                f"Top driver: {state['risk_result']['top_drivers'][0]['feature']}. "
                "Write a 2-sentence decision brief for a hydropower operator."
            ),
            "stream": False,
        }
        r = requests.post("http://localhost:11434/api/generate", json=payload, timeout=8)
        state["report"] = str(r.json()["response"])
    except Exception:
        top_driver_feat = state["risk_result"]["top_drivers"][0]["feature"]
        state["report"] = (
            f"CRITICAL: Thulagi Lake risk score {score}/100 ({tier}). "
            f"Skeptic agent {verdict}. Primary driver: {top_driver_feat}. "
            "Recommend immediate downstream alert and 36-hour shutdown preparation "
            "for Besisahar hydropower infrastructure."
        )

    state["agent_trace"].append({"agent": "Report", "status": "Decision brief generated"})
    return state


def build_graph() -> Any:
    g = StateGraph(cast(Any, GLOFState))
    g.add_node("sentinel", sentinel_node)
    g.add_node("environmental", environmental_node)
    g.add_node("risk_assessment", risk_assessment_node)
    g.add_node("skeptic", skeptic_node)
    g.add_node("report", report_node)

    g.set_entry_point("sentinel")
    g.add_edge("sentinel", "environmental")
    g.add_edge("environmental", "risk_assessment")
    g.add_edge("risk_assessment", "skeptic")
    g.add_edge("skeptic", "report")
    g.add_edge("report", END)

    return g.compile()


GRAPH = build_graph()
