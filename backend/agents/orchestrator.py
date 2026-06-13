from __future__ import annotations

from typing import Any, cast
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


def route_after_graph_rag(state: GLOFState) -> str:
    """Conditional routing: Determines whether to trigger alerts or jump straight to report synthesis."""
    risk_result = state.get("risk_result", {})
    score = risk_result.get("risk_score", 0.0)
    verdict = state.get("skeptic_verdict", "MONITORING")

    # If risk is high/RED and confirmed by the skeptic, or moderate/YELLOW and confirmed
    if score >= 80.0 and verdict == "CONFIRMED":
        return "alert_path"
    elif 60.0 <= score < 80.0:
        if verdict == "CONFIRMED":
            return "alert_path"
        else:
            return "report_path"
    else:
        return "report_path"


def build_graph() -> Any:
    g = StateGraph(cast(Any, GLOFState))

    # Add all 11 nodes to the graph
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

    # Set up static sequential flow for perception and reasoning
    g.set_entry_point("sentinel")
    g.add_edge("sentinel", "weather")
    g.add_edge("weather", "seismic")
    g.add_edge("seismic", "nvidia_forecast")
    g.add_edge("nvidia_forecast", "risk_fusion")
    g.add_edge("risk_fusion", "skeptic")
    g.add_edge("skeptic", "graph_rag")

    # Add conditional router node connection
    g.add_conditional_edges(
        "graph_rag",
        route_after_graph_rag,
        {
            "alert_path": "alert_dispatch",
            "report_path": "report",
        }
    )

    # Wire alert path to report synthesis
    g.add_edge("alert_dispatch", "evacuation_router")
    g.add_edge("evacuation_router", "nepali_tts")
    g.add_edge("nepali_tts", "report")

    # Exit the graph
    g.add_edge("report", END)

    return g.compile()


GRAPH = build_graph()
