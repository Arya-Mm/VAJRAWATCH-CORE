import os
import sys
from dotenv import load_dotenv

# Ensure backend can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.agents.orchestrator import GRAPH, GLOFState

load_dotenv()

def run_integration_test():
    print("=== STARTING ADAPTIVE ORCHESTRATOR INTEGRATION TEST ===")
    
    # Configure env to print webhook logs locally
    os.environ["ICIMOD_WEBHOOK_URL"] = "http://localhost:8000/webhook/icimod"
    
    # 1. Test case: Lean Pipeline (force is_demo_mode = True)
    print("\n--- Running LEAN Pipeline (is_demo_mode = True) ---")
    lean_state: GLOFState = {
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
        "report": "",
        "agent_trace": [],
        "is_demo_mode": True,
        "diagnostics": {},
        "active_pipeline": ""
    }

    result_lean = GRAPH.invoke(lean_state)
    
    print("\nResulting LEAN State:")
    print(f"Active Pipeline: {result_lean.get('active_pipeline')}")
    print(f"Risk Score: {result_lean.get('risk_result', {}).get('risk_score')}")
    print(f"Risk Tier: {result_lean.get('risk_result', {}).get('risk_tier')}")
    print(f"Skeptic Verdict: {result_lean.get('skeptic_verdict')}")
    print(f"Evacuation Route: {result_lean.get('evacuation_route')}")
    print(f"Audio URL: {result_lean.get('audio_url')}")
    print(f"Report Brief: {result_lean.get('report')}")
    print("\nAgent Trace:")
    for trace in result_lean.get("agent_trace", []):
        print(f" - [{trace['agent']}]: {trace['status']}")

    # 2. Test case: Prod Pipeline (is_demo_mode = False, diagnostics check will determine)
    print("\n--- Running PRODUCTION Pipeline (is_demo_mode = False) ---")
    prod_state: GLOFState = {
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
        "report": "",
        "agent_trace": [],
        "is_demo_mode": False,
        "diagnostics": {},
        "active_pipeline": ""
    }

    result_prod = GRAPH.invoke(prod_state)
    
    print("\nResulting PRODUCTION State:")
    print(f"Active Pipeline: {result_prod.get('active_pipeline')}")
    print(f"Diagnostics: {result_prod.get('diagnostics')}")
    print(f"Risk Score: {result_prod.get('risk_result', {}).get('risk_score')}")
    print(f"Risk Tier: {result_prod.get('risk_result', {}).get('risk_tier')}")
    print(f"Skeptic Verdict: {result_prod.get('skeptic_verdict')}")
    print(f"Evacuation Route: {result_prod.get('evacuation_route')}")
    print(f"Audio URL: {result_prod.get('audio_url')}")
    print(f"Report Brief: {result_prod.get('report')}")
    print("\nAgent Trace:")
    for trace in result_prod.get("agent_trace", []):
        print(f" - [{trace['agent']}]: {trace['status']}")

if __name__ == "__main__":
    run_integration_test()
