import json
import math
from typing import Dict, Any, Tuple, List

# Feature baselines and weights for the deterministic risk engine
# Weights are assigned based on relative importance for GLOF triggering
FEATURE_WEIGHTS = {
    "ndwi_delta_30d": 0.25,          # High weight: actual lake area growth
    "sar_backscatter_change": 0.15,  # Moderate weight: ice movement/calving
    "precip_7d_mm": 0.15,            # Moderate weight: upstream water load
    "temp_anomaly_c": 0.10,          # Lower weight: baseline melting
    "seismic_count_14d": 0.05,       # Lower weight: general instability
    "seismic_max_magnitude": 0.15,   # Moderate weight: direct moraine shock
    "nvidia_precip_5day_mm": 0.10,   # Lower weight: forecast (uncertainty)
    "lake_area_km2": 0.05            # Lower weight: baseline capacity
}

# Normalization bounds: (min_val, max_val)
# Used to scale features between 0 and 1 before applying weights
FEATURE_BOUNDS = {
    "ndwi_delta_30d": (0, 20),           # 0% to 20% area growth
    "sar_backscatter_change": (0, 10),   # 0 to 10 dB change
    "precip_7d_mm": (0, 300),            # 0 to 300 mm
    "temp_anomaly_c": (0, 5),            # 0 to 5 C anomaly
    "seismic_count_14d": (0, 10),        # 0 to 10 earthquakes
    "seismic_max_magnitude": (0, 6),     # 0 to 6.0 magnitude
    "nvidia_precip_5day_mm": (0, 300),   # 0 to 300 mm
    "lake_area_km2": (0, 3)              # 0 to 3 km2
}

def normalize_feature(name: str, value: float) -> float:
    """Normalize a feature value to a 0-1 range based on predefined bounds."""
    min_val, max_val = FEATURE_BOUNDS.get(name, (0, 1))
    # Clamp value between min and max
    clamped_val = max(min_val, min(value, max_val))
    return (clamped_val - min_val) / (max_val - min_val)

def calculate_risk_score(features: Dict[str, float]) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Calculate a deterministic risk score (0-100) using a weighted sum passed through a sigmoid.
    Returns the score and the top driving factors (simulating SHAP values).
    """
    weighted_sum = 0.0
    contributions = []

    for feature_name, value in features.items():
        if feature_name in FEATURE_WEIGHTS:
            norm_val = normalize_feature(feature_name, value)
            weight = FEATURE_WEIGHTS[feature_name]
            contribution = norm_val * weight
            weighted_sum += contribution
            
            contributions.append({
                "feature": feature_name,
                "value": value,
                "contribution": contribution
            })

    # Base risk score calculation
    # A perfect max out of all features gives a weighted sum of 1.0
    # We map this 0-1.0 range to a 0-100 score, optionally applying a sigmoid for non-linearity
    # For simplicity and predictability in demo, linear mapping with a slight curve
    
    # Sigmoid-like curve centered around 0.5
    # score = 1 / (1 + e^(-k * (x - x0)))
    k = 10     # Steepness
    x0 = 0.5   # Midpoint
    
    sigmoid_val = 1 / (1 + math.exp(-k * (weighted_sum - x0)))
    
    # Normalize the sigmoid output so that 0 -> 0 and 1 -> 1
    min_sig = 1 / (1 + math.exp(-k * (0 - x0)))
    max_sig = 1 / (1 + math.exp(-k * (1 - x0)))
    
    final_score_normalized = (sigmoid_val - min_sig) / (max_sig - min_sig)
    final_score = int(round(final_score_normalized * 100))
    
    # Sort contributions to find top drivers
    contributions.sort(key=lambda x: x["contribution"], reverse=True)
    top_drivers = contributions[:3]

    return final_score, top_drivers

def evaluate_lake_risk(lake_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate the risk for a single lake data payload.
    """
    features = lake_data.get("features", {})
    score, top_drivers = calculate_risk_score(features)
    
    # Determine risk tier
    if score >= 80:
        tier = "RED"
    elif score >= 60:
        tier = "ORANGE"
    elif score >= 40:
        tier = "YELLOW"
    else:
        tier = "GREEN"

    return {
        "lake_id": lake_data.get("lake_id"),
        "timestamp": lake_data.get("timestamp"),
        "risk_score": score,
        "risk_tier": tier,
        "top_drivers": top_drivers
    }

if __name__ == "__main__":
    # Test with the Thulagi mock data
    import os
    mock_data_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'thulagi_mock_data.json')
    
    try:
        with open(mock_data_path, 'r') as f:
            lake_data = json.load(f)
            
        result = evaluate_lake_risk(lake_data)
        print("Risk Evaluation Result:")
        print(json.dumps(result, indent=2))
    except FileNotFoundError:
        print(f"Mock data file not found at {mock_data_path}")
