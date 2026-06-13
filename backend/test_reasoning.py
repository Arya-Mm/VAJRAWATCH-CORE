from backend.agents.reasoning.reasoning_nodes import (
    risk_fusion_node,
    skeptic_node,
    graph_rag_node
)
from backend.agents.orchestrator import GLOFState

def run_tests():
    # 1. Test case: GREEN State (low values)
    print("=== Testing Standard GREEN State ===")
    green_state: GLOFState = {
        "lake_id": "PDGL_THULAGI_01",
        "raw_data": {
            "ndwi_delta": 0.05,
            "sar_backscatter_change": 0.5,
            "precip_7d_mm": 25.0,
            "temp_anomaly_c": 0.5,
            "seismic_count_14d": 0,
            "seismic_max_magnitude": 0.0,
            "nvidia_precip_5day_mm": 12.0,
            "lake_area_km2": 0.52
        },
        "risk_result": {},
        "graph_context": "",
        "skeptic_verdict": "",
        "report": "",
        "agent_trace": []
    }

    green_state = risk_fusion_node(green_state)
    print("Risk Fusion Output:", green_state["risk_result"])
    print("Trace:", green_state["agent_trace"][-1])

    green_state = skeptic_node(green_state)
    print("Skeptic Verdict:", green_state["skeptic_verdict"])
    print("Trace:", green_state["agent_trace"][-1])

    # 2. Test case: RED State (extremely elevated values triggering anomaly & high risk)
    print("\n=== Testing Simulated RED Alert State ===")
    red_state: GLOFState = {
        "lake_id": "PDGL_THULAGI_01",
        "raw_data": {
            "ndwi_delta": 0.55,
            "sar_backscatter_change": -3.5,
            "precip_7d_mm": 380.0,
            "temp_anomaly_c": 6.5,
            "seismic_count_14d": 12,
            "seismic_max_magnitude": 6.2,
            "nvidia_precip_5day_mm": 220.0,
            "lake_area_km2": 0.52
        },
        "risk_result": {},
        "graph_context": "",
        "skeptic_verdict": "",
        "report": "",
        "agent_trace": []
    }

    red_state = risk_fusion_node(red_state)
    print("Risk Fusion Output:", red_state["risk_result"])
    print("Trace:", red_state["agent_trace"][-1])

    red_state = skeptic_node(red_state)
    print("Skeptic Verdict:", red_state["skeptic_verdict"])
    print("Trace:", red_state["agent_trace"][-1])

    # 3. Test case: GraphRAG recall
    print("\n=== Testing GraphRAG Recall Node ===")
    red_state = graph_rag_node(red_state)
    print("Graph Context retrieved:\n", red_state["graph_context"])
    print("Trace:", red_state["agent_trace"][-1])

if __name__ == "__main__":
    run_tests()
