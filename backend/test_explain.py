import requests

base_url = "http://127.0.0.1:8000"

try:
    print("Sending GET /explain/PDGL_THULAGI_01...")
    r = requests.get(f"{base_url}/explain/PDGL_THULAGI_01", timeout=10)
    print("Status:", r.status_code)
    print("Response:", r.json())
except Exception as e:
    print("Error:", e)
