import math

def calculate_risk_score(features: dict) -> dict:
    """
    Deterministic math engine mimicking XGBoost outputs.
    Uses a weighted logistic function to generate a 0-100 score.
    """
    # Weights for the 8 core features
    weights = {
        "ndwi_delta": 1.5,
        "sar_backscatter_change": 2.0,
        "precip_7d_mm": 0.05,
        "temp_anomaly_c": 3.0,
        "seismic_count_14d": 4.0,
        "seismic_max_magnitude": 5.0,
        "nvidia_precip_5day_mm": 0.06,
        "lake_area_km2": 10.0
    }

    # Calculate raw weighted sum
    raw_score = sum(features.get(k, 0) * w for k, w in weights.items())
    
    # Sigmoid normalization (0 to 1) mapped to 0-100
    # Adjusting the bias (-60) to fit the mock data to an ~84 score
    risk_score = 100 / (1 + math.exp(-0.05 * (raw_score - 60)))
    final_score = round(risk_score)

    # Determine Tier
    if final_score >= 80:
        tier = "RED"
    elif final_score >= 60:
        tier = "ORANGE"
    elif final_score >= 40:
        tier = "YELLOW"
    else:
        tier = "GREEN"

    # Mock SHAP Values (Top Drivers)
    top_drivers = [
        {"feature": "Rainfall Anomaly", "value": f"{features.get('precip_7d_mm', 0)}mm", "anomaly_ratio": "1.4x"},
        {"feature": "Lake Area Expansion", "value": f"{features.get('ndwi_delta', 0)}%", "anomaly_ratio": "1.2x"}
    ]

    return {
        "score": final_score,
        "tier": tier,
        "top_drivers": top_drivers
    }
