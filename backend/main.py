import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.ml.features import calculate_risk_score

app = FastAPI(title="VajraWatch V4 Core API")

# Aggressive CORS for hackathon parallel development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "operational", "agents": "standby"}

@app.get("/risk/{lake_id}")
async def get_risk_assessment(lake_id: str):
    # Phase 1: Hardcoded to the Thulagi Mock JSON
    if lake_id != "PDGL_THULAGI_01":
        raise HTTPException(status_code=404, detail="Lake data not cached for offline demo.")

    try:
        with open("data/thulagi_mock_data.json", "r") as f:
            mock_data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Mock data missing.")

    # Run deterministic math
    risk_results = calculate_risk_score(mock_data["features"])

    return {
        "lake_id": mock_data["lake_id"],
        "name": mock_data["name"],
        "risk_score": risk_results["score"],
        "risk_tier": risk_results["tier"],
        "top_drivers": risk_results["top_drivers"],
        "impact": {
            "population": 12480,
            "hydropower_mw": 186,
            "historical_analog": "South Lonak 2023"
        }
    }
