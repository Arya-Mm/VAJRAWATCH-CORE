import os
import sys
from dotenv import load_dotenv

# Ensure backend can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.agents.orchestrator import GRAPH, GLOFState

load_dotenv()

def run_integration_test():
    print("=== STARTING 11-AGENT STATE GRAPH INTEGRATION TEST ===")
    
    # Configure env to print webhook logs locally
    os.environ["ICIMOD_WEBHOOK_URL"] = "http://localhost:8000/webhook/icimod"
    
    # 1. Test case: GREEN State (low values, should skip alerts/routing/tts and go straight to report)
    print("\n--- Running GREEN Baseline State ---")
    green_state: GLOFState = {
        "lake_id": "PDGL_THULAGI_01",
        "raw_data": {
            "ndwi_delta": 0.05,
            "sar_backscatter_change": 0.5,
            "precip_7d_mm": 20.0,
            "temp_anomaly_c": 0.5,
            "seismic_count_14d": 0,
            "seismic_max_magnitude": 0.0,
            "nvidia_precip_5day_mm": 10.0,
            "lake_area_km2": 0.52
        },
        "risk_result": {},
        "graph_context": "",
        "skeptic_verdict": "",
        "evacuation_route": "",
        "audio_url": "",
        "alert_dispatched": False,
        "report": "",
        "agent_trace": []
    }

    result_green = GRAPH.invoke(green_state)
    
    print("\nResulting GREEN State:")
    print(f"Risk Score: {result_green.get('risk_result', {}).get('risk_score')}")
    print(f"Risk Tier: {result_green.get('risk_result', {}).get('risk_tier')}")
    print(f"Skeptic Verdict: {result_green.get('skeptic_verdict')}")
    print(f"Evacuation Route: {result_green.get('evacuation_route')}")
    print(f"Audio URL: {result_green.get('audio_url')}")
    print(f"Alert Dispatched: {result_green.get('alert_dispatched')}")
    print(f"Report Brief: {result_green.get('report')}")
    print("\nAgent Trace:")
    for trace in result_green.get("agent_trace", []):
        print(f" - [{trace['agent']}]: {trace['status']}")

    # 2. Test case: RED State (extremely elevated values, should trigger alerts, routing, tts, and report)
    print("\n--- Running RED Emergency State ---")
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
        "evacuation_route": "",
        "audio_url": "",
        "alert_dispatched": False,
        "report": "",
        "agent_trace": []
    }

    result_red = GRAPH.invoke(red_state)
    
    print("\nResulting RED State:")
    print(f"Risk Score: {result_red.get('risk_result', {}).get('risk_score')}")
    print(f"Risk Tier: {result_red.get('risk_result', {}).get('risk_tier')}")
    print(f"Skeptic Verdict: {result_red.get('skeptic_verdict')}")
    print(f"Evacuation Route: {result_red.get('evacuation_route')}")
    print(f"Audio URL: {result_red.get('audio_url')}")
    print(f"Alert Dispatched: {result_red.get('alert_dispatched')}")
    print(f"Report Brief: {result_red.get('report')}")
    print("\nAgent Trace:")
    for trace in result_red.get("agent_trace", []):
        print(f" - [{trace['agent']}]: {trace['status']}")

if __name__ == "__main__":
    run_integration_test()
