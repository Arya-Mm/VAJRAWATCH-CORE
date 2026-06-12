import subprocess
import time
import requests
import sys

print("Starting Uvicorn server...")
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Wait for server to start
time.sleep(3.0)

# Check if process is still running
if proc.poll() is not None:
    print("Failed to start Uvicorn server!")
    stdout, stderr = proc.communicate()
    print("Stdout:", stdout)
    print("Stderr:", stderr)
    sys.exit(1)

print("Server started successfully.")

base_url = "http://127.0.0.1:8000"

try:
    # 1. Health check
    print("\n--- Testing GET /health ---")
    r = requests.get(f"{base_url}/health", timeout=5)
    print("Status:", r.status_code)
    print("Response:", r.json())

    # 2. Risk check (GREEN / baseline)
    print("\n--- Testing GET /risk/PDGL_THULAGI_01 (Baseline) ---")
    r = requests.get(f"{base_url}/risk/PDGL_THULAGI_01", timeout=10)
    print("Status:", r.status_code)
    res_data = r.json()
    print("Risk score:", res_data.get("risk_score"))
    print("Risk tier:", res_data.get("risk_tier"))
    print("Weather Source:", res_data.get("weather_source"))
    print("Report:", res_data.get("report"))
    print("Audio URL:", res_data.get("audio_url"))
    print("Agent Trace count:", len(res_data.get("agent_trace", [])))

    # 3. Enable Simulation
    print("\n--- Testing POST /simulate/PDGL_THULAGI_01 (Enable) ---")
    r = requests.post(f"{base_url}/simulate/PDGL_THULAGI_01?active=true", timeout=5)
    print("Status:", r.status_code)
    print("Response:", r.json())

    # 4. Risk check (RED / simulated)
    print("\n--- Testing GET /risk/PDGL_THULAGI_01 (Simulated RED Alert) ---")
    r = requests.get(f"{base_url}/risk/PDGL_THULAGI_01", timeout=10)
    print("Status:", r.status_code)
    res_data = r.json()
    print("Risk score:", res_data.get("risk_score"))
    print("Risk tier:", res_data.get("risk_tier"))
    print("Report:", res_data.get("report"))
    print("Audio URL:", res_data.get("audio_url"))
    print("Agent Trace count:", len(res_data.get("agent_trace", [])))

    # 5. Get Lakes list
    print("\n--- Testing GET /lakes ---")
    r = requests.get(f"{base_url}/lakes", timeout=5)
    print("Status:", r.status_code)
    print("Response:", r.json())

    # 6. Explain check
    print("\n--- Testing GET /explain/PDGL_THULAGI_01 ---")
    r = requests.get(f"{base_url}/explain/PDGL_THULAGI_01", timeout=10)
    print("Status:", r.status_code)
    print("Response explanation:", r.json().get("explanation"))

except Exception as e:
    print(f"Error during testing: {e}")

finally:
    print("\nStopping Uvicorn server...")
    proc.terminate()
    try:
        proc.wait(timeout=5)
        print("Server stopped.")
    except Exception:
        proc.kill()
        print("Server killed.")
