from backend.agents.perception.perception_nodes import (
    sentinel_node,
    weather_node,
    seismic_node,
    nvidia_forecast_node
)
from backend.agents.orchestrator import GLOFState

def run_tests():
    print("Initializing test GLOFState...")
    state: GLOFState = {
        "lake_id": "PDGL_THULAGI_01",
        "raw_data": {},
        "risk_result": {},
        "graph_context": "",
        "skeptic_verdict": "",
        "report": "",
        "agent_trace": []
    }

    # 1. Test Sentinel Agent
    print("\n--- Testing Sentinel Agent ---")
    state = sentinel_node(state)
    print("Raw Data:", state["raw_data"])
    print("Trace:", state["agent_trace"][-1])

    # 2. Test Weather Agent
    print("\n--- Testing Weather Agent ---")
    state = weather_node(state)
    print("Raw Data:", state["raw_data"])
    print("Trace:", state["agent_trace"][-1])

    # 3. Test Seismic Agent
    print("\n--- Testing Seismic Agent ---")
    state = seismic_node(state)
    print("Raw Data:", state["raw_data"])
    print("Trace:", state["agent_trace"][-1])

    # 4. Test NVIDIA Forecast Agent
    print("\n--- Testing NVIDIA Forecast Agent ---")
    state = nvidia_forecast_node(state)
    print("Raw Data:", state["raw_data"])
    print("Trace:", state["agent_trace"][-1])

    print("\nState validation:")
    keys = [
        "ndwi_delta", "sar_backscatter_change", "precip_7d_mm", 
        "temp_anomaly_c", "seismic_count_14d", "seismic_max_magnitude", 
        "nvidia_precip_5day_mm"
    ]
    for key in keys:
        val = state["raw_data"].get(key)
        print(f"  {key}: {val} ({type(val).__name__})")

if __name__ == "__main__":
    run_tests()
