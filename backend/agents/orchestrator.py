from __future__ import annotations

import os
import time
from typing import Any, cast
import requests
from langgraph.graph import END, StateGraph
from typing_extensions import TypedDict

# Import perception nodes
from backend.agents.perception.perception_nodes import (
    sentinel_node,
    weather_node,
    seismic_node,
    nvidia_forecast_node,
)

# Import reasoning nodes
from backend.agents.reasoning.reasoning_nodes import (
    risk_fusion_node,
    skeptic_node,
    graph_rag_node,
)

# Import action nodes
from backend.agents.action.action_nodes import (
    evacuation_router_node,
    nepali_tts_node,
    alert_dispatch_node,
    report_synthesizer_node,
)


class GLOFState(TypedDict):
    lake_id: str
    raw_data: dict[str, Any]
    risk_result: dict[str, Any]
    graph_context: str
    skeptic_verdict: str
    evacuation_route: str
    audio_url: str
    alert_dispatched: bool
    report: str
    agent_trace: list[dict[str, str]]


def diagnostic_node(state: GLOFState) -> GLOFState:
    """Agent 0: Diagnostic Agent.
    Measures latency to OpenMeteo API and checks for API credentials to decide pipeline routing.
    """
    raw_data = state.setdefault("raw_data", {})
    agent_trace = state.setdefault("agent_trace", [])

    has_nvidia = bool(os.getenv("NVIDIA_API_KEY"))
    has_neo4j = bool(os.getenv("NEO4J_URI"))

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": 28.538,
        "longitude": 84.393,
        "daily": "precipitation_sum",
        "forecast_days": 1,
        "timezone": "Asia/Kathmandu"
    }

    start_time = time.time()
    latency_ok = False
    latency = 999.0
    try:
        r = requests.get(url, params=params, timeout=0.8)
        latency = (time.time() - start_time) * 1000.0
        if r.status_code == 200 and latency < 500.0:
            latency_ok = True
    except Exception:
        pass

    # Diagnostics pass if key credentials are present and API responds fast enough
    diagnostics_pass = has_nvidia and has_neo4j and latency_ok
    raw_data["diagnostics_pass"] = diagnostics_pass
    raw_data["latency_ms"] = latency

    agent_trace.append({
        "agent": "Diagnostic Agent",
        "status": (
            f"NVIDIA API: {'OK' if has_nvidia else 'MISSING'} | "
            f"Neo4j URI: {'OK' if has_neo4j else 'MISSING'} | "
            f"OpenMeteo Latency: {latency:.1f}ms (OK: {latency_ok})"
        )
    })
    return state


def route_pipeline(state: GLOFState) -> str:
    """Conditional router determining subgraph path: lean_pipeline vs prod_pipeline."""
    raw_data = state.get("raw_data", {})
    is_demo = raw_data.get("is_demo_mode", False)
    diagnostics_pass = raw_data.get("diagnostics_pass", False)

    if is_demo or not diagnostics_pass:
        return "lean_pipeline"
    else:
        return "prod_pipeline"


# --- LEAN PIPELINE SUBGRAPH NODES ---

def environmental_node_lean(state: GLOFState) -> GLOFState:
    """Simplified Environmental Node for lean pipeline execution.
    Avoids external live API latency by injecting default baseline environment metrics.
    """
    raw_data = state.setdefault("raw_data", {})
    agent_trace = state.setdefault("agent_trace", [])

    raw_data["precip_7d_mm"] = float(raw_data.get("precip_7d_mm", 45.0))
    raw_data["temp_anomaly_c"] = float(raw_data.get("temp_anomaly_c", 1.2))
    raw_data["seismic_count_14d"] = int(raw_data.get("seismic_count_14d", 0))
    raw_data["seismic_max_magnitude"] = float(raw_data.get("seismic_max_magnitude", 0.0))
    raw_data["nvidia_precip_5day_mm"] = float(raw_data.get("nvidia_precip_5day_mm", 12.0))
    raw_data["lake_area_km2"] = float(raw_data.get("lake_area_km2", 0.52))

    agent_trace.append({
        "agent": "Environmental Lean Agent",
        "status": "Injected local offline environment baselines"
    })
    return state


def math_risk_node_lean(state: GLOFState) -> GLOFState:
    """Calculates deterministic GLOF risk mathematically using pre-defined formulas."""
    from backend.ml.features import calculate_risk
    raw_data = state.setdefault("raw_data", {})
    agent_trace = state.setdefault("agent_trace", [])

    state["risk_result"] = calculate_risk(raw_data)
    status_str = f"Score: {state['risk_result']['risk_score']} | Tier: {state['risk_result']['risk_tier']}"

    agent_trace.append({
        "agent": "Mathematical Risk Agent",
        "status": status_str
    })
    return state


def skeptic_node_lean(state: GLOFState) -> GLOFState:
    """Rule-based skeptic checks for lean execution path."""
    risk_result = state.setdefault("risk_result", {})
    agent_trace = state.setdefault("agent_trace", [])
    score = risk_result.get("risk_score", 0.0)

    if score >= 80.0:
        verdict = "CONFIRMED"
    elif score >= 50.0:
        verdict = "DISPUTED"
    else:
        verdict = "MONITORING"

    state["skeptic_verdict"] = verdict
    agent_trace.append({
        "agent": "Skeptic Lean Agent",
        "status": f"Verdict: {verdict} (local rule-based)"
    })
    return state


def stub_report_node_lean(state: GLOFState) -> GLOFState:
    """Template decision brief generation without hitting external LLM NIM endpoints."""
    risk_result = state.setdefault("risk_result", {})
    agent_trace = state.setdefault("agent_trace", [])
    score = risk_result.get("risk_score", 0.0)
    tier = risk_result.get("risk_tier", "GREEN")
    verdict = state.get("skeptic_verdict", "MONITORING")

    state["report"] = (
        f"LEAN REPORT: GLOF early warning analysis completed for Thulagi Lake. "
        f"Calculated mathematical risk score: {score}/100 ({tier}). "
        f"Skeptic baseline verification: {verdict}."
    )
    agent_trace.append({
        "agent": "Report Stub Agent",
        "status": "Synthesized decision brief template locally"
    })
    return state


def build_lean_pipeline() -> Any:
    """Assemble the local offline fallback pipeline subgraph."""
    g = StateGraph(cast(Any, GLOFState))
    g.add_node("sentinel", sentinel_node)
    g.add_node("environmental", environmental_node_lean)
    g.add_node("math_risk", math_risk_node_lean)
    g.add_node("skeptic", skeptic_node_lean)
    g.add_node("stub_report", stub_report_node_lean)

    g.set_entry_point("sentinel")
    g.add_edge("sentinel", "environmental")
    g.add_edge("environmental", "math_risk")
    g.add_edge("math_risk", "skeptic")
    g.add_edge("skeptic", "stub_report")
    g.add_edge("stub_report", END)

    return g.compile()


# --- PROD PIPELINE SUBGRAPH ---

def route_after_graph_rag(state: GLOFState) -> str:
    """Conditional routing for the prod pipeline warning nodes."""
    risk_result = state.get("risk_result", {})
    score = risk_result.get("risk_score", 0.0)
    verdict = state.get("skeptic_verdict", "MONITORING")

    if score >= 80.0 and verdict == "CONFIRMED":
        return "alert_path"
    elif 60.0 <= score < 80.0:
        if verdict == "CONFIRMED":
            return "alert_path"
        else:
            return "report_path"
    else:
        return "report_path"


def build_prod_pipeline() -> Any:
    """Assemble the comprehensive 11-agent production graph."""
    g = StateGraph(cast(Any, GLOFState))
    g.add_node("sentinel", sentinel_node)
    g.add_node("weather", weather_node)
    g.add_node("seismic", seismic_node)
    g.add_node("nvidia_forecast", nvidia_forecast_node)
    
    g.add_node("risk_fusion", risk_fusion_node)
    g.add_node("skeptic", skeptic_node)
    g.add_node("graph_rag", graph_rag_node)
    
    g.add_node("alert_dispatch", alert_dispatch_node)
    g.add_node("evacuation_router", evacuation_router_node)
    g.add_node("nepali_tts", nepali_tts_node)
    
    g.add_node("report", report_synthesizer_node)

    g.set_entry_point("sentinel")
    g.add_edge("sentinel", "weather")
    g.add_edge("weather", "seismic")
    g.add_edge("seismic", "nvidia_forecast")
    g.add_edge("nvidia_forecast", "risk_fusion")
    g.add_edge("risk_fusion", "skeptic")
    g.add_edge("skeptic", "graph_rag")

    g.add_conditional_edges(
        "graph_rag",
        route_after_graph_rag,
        {
            "alert_path": "alert_dispatch",
            "report_path": "report",
        }
    )

    g.add_edge("alert_dispatch", "evacuation_router")
    g.add_edge("evacuation_router", "nepali_tts")
    g.add_edge("nepali_tts", "report")
    g.add_edge("report", END)

    return g.compile()


# --- ADAPTIVE ORCHESTRATOR GRAPH ---

def build_adaptive_orchestrator() -> Any:
    """Construct the main orchestrator directing traffic based on diagnostics."""
    lean_subgraph = build_lean_pipeline()
    prod_subgraph = build_prod_pipeline()

    g = StateGraph(cast(Any, GLOFState))
    g.add_node("diagnostic", diagnostic_node)
    g.add_node("lean_pipeline", lean_subgraph)
    g.add_node("prod_pipeline", prod_subgraph)

    g.set_entry_point("diagnostic")
    g.add_conditional_edges(
        "diagnostic",
        route_pipeline,
        {
            "lean_pipeline": "lean_pipeline",
            "prod_pipeline": "prod_pipeline"
        }
    )
    g.add_edge("lean_pipeline", END)
    g.add_edge("prod_pipeline", END)

    return g.compile()


GRAPH = build_adaptive_orchestrator()
