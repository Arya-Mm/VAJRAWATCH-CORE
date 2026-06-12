from __future__ import annotations

from typing import Any

import numpy as np

WEIGHTS: dict[str, float] = {
    "ndwi_delta": 25.0,
    "sar_backscatter_change": 15.0,
    "precip_7d_mm": 0.08,
    "temp_anomaly_c": 5.0,
    "seismic_count_14d": 4.0,
    "seismic_max_magnitude": 3.0,
    "nvidia_precip_5day_mm": 0.05,
    "lake_area_km2": 8.0,
}

THRESHOLDS: dict[str, float] = {
    "ndwi_delta": 0.1,
    "sar_backscatter_change": -2.0,
    "precip_7d_mm": 150.0,
    "temp_anomaly_c": 2.0,
    "seismic_count_14d": 2.0,
    "seismic_max_magnitude": 3.5,
    "nvidia_precip_5day_mm": 80.0,
    "lake_area_km2": 0.4,
}


def calculate_risk(data: dict[str, Any]) -> dict[str, Any]:
    raw: float = 0.0
    drivers: list[tuple[str, float, float]] = []

    for feature, weight in WEIGHTS.items():
        val = float(data.get(feature, 0.0))
        threshold = THRESHOLDS[feature]
        # Normalize: how much over threshold
        if feature == "sar_backscatter_change":  # negative = bad
            contribution = max(0.0, (threshold - val)) * weight
        else:
            contribution = max(0.0, (val - threshold)) * weight
        raw += contribution
        drivers.append((feature, contribution, val))

    # Sigmoid to 0-100
    score = round(float(100.0 / (1.0 + np.exp(-0.08 * (raw - 30.0)))), 1)

    top_drivers = sorted(drivers, key=lambda x: x[1], reverse=True)[:3]

    tier = "RED" if score >= 80.0 else "YELLOW" if score >= 50.0 else "GREEN"

    return {
        "risk_score": score,
        "risk_tier": tier,
        "confidence": 0.87,
        "top_drivers": [
            {"feature": f, "contribution": round(c, 2), "value": v} for f, c, v in top_drivers
        ],
    }


def calculate_risk_score(features: dict[str, object]) -> dict[str, object]:
    """Helper to keep compatibility with any older code referencing this function."""
    return calculate_risk(features)
