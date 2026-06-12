import requests
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

base_url = "http://127.0.0.1:8000"


print("Waiting 3 seconds for server to start...")
time.sleep(3.0)

try:
    # 1. Health check
    print("\n--- Testing GET /health ---")
    r = requests.get(f"{base_url}/health", timeout=5)
    print("Status:", r.status_code)
    print("Response:", r.json())

    # 2. Risk check (Baseline)
    print("\n--- Testing GET /risk/PDGL_THULAGI_01 (Baseline) ---")
    r = requests.get(f"{base_url}/risk/PDGL_THULAGI_01", timeout=25)
    print("Status:", r.status_code)
    res_data = r.json()
    print("Risk score:", res_data.get("risk_score"))
    print("Risk tier:", res_data.get("risk_tier"))
    print("Weather Source:", res_data.get("weather_source"))
    print("Report:", res_data.get("report"))
    print("Audio URL:", res_data.get("audio_url"))
    print("Agent Trace:")
    for trace in res_data.get("agent_trace", []):
        print(f"  [{trace.get('agent')}]: {trace.get('status')}")

    # 3. Enable Simulation
    print("\n--- Testing POST /simulate/PDGL_THULAGI_01 (Enable) ---")
    r = requests.post(f"{base_url}/simulate/PDGL_THULAGI_01?active=true", timeout=5)
    print("Status:", r.status_code)
    print("Response:", r.json())

    # 4. Risk check (RED / simulated - triggers ElevenLabs)
    print("\n--- Testing GET /risk/PDGL_THULAGI_01 (RED Alert - ElevenLabs) ---")
    r = requests.get(f"{base_url}/risk/PDGL_THULAGI_01", timeout=30)
    print("Status:", r.status_code)
    res_data = r.json()
    print("Risk score:", res_data.get("risk_score"))
    print("Risk tier:", res_data.get("risk_tier"))
    print("Report:", res_data.get("report"))
    print("Audio URL:", res_data.get("audio_url"))

    # 5. Explain check (Neo4j integration)
    print("\n--- Testing GET /explain/PDGL_THULAGI_01 (Neo4j Integration) ---")
    r = requests.get(f"{base_url}/explain/PDGL_THULAGI_01", timeout=15)
    print("Status:", r.status_code)
    explain_data = r.json()
    print("Explanation:", explain_data.get("explanation"))
    print("Impact details:", explain_data.get("impact"))
    print("Graph Paths:", explain_data.get("graph_paths"))

except Exception as e:
    print(f"Error during testing: {e}")
