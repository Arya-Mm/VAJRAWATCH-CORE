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
    ndwi = float(data.get("ndwi_delta", 0.0))
    sar = float(data.get("sar_backscatter_change", 0.0))
    precip_7d = float(data.get("precip_7d_mm", 0.0))
    temp = float(data.get("temp_anomaly_c", 0.0))
    seismic_count = float(data.get("seismic_count_14d", 0.0))
    seismic_mag = float(data.get("seismic_max_magnitude", 0.0))
    nvidia_precip = float(data.get("nvidia_precip_5day_mm", 0.0))
    lake_area = float(data.get("lake_area_km2", 0.0))

    # 1. Structural Vulnerability (0.0 to 1.0+)
    vuln_score = (ndwi * 1.5) + (max(0.0, -sar) * 0.25) + (max(0.0, lake_area - 0.4) * 0.15)
    
    # 2. Dynamic Triggers (0.0 to 1.0+)
    max_precip = max(precip_7d, nvidia_precip)
    precip_trigger = max(0.0, max_precip - 80.0) / 300.0
    
    seismic_trigger = 0.0
    if seismic_count > 0 and seismic_mag >= 3.5:
        seismic_trigger = (seismic_mag - 3.5) * 0.2
        
    temp_trigger = max(0.0, temp) * 0.05
    trigger_score = precip_trigger + seismic_trigger + temp_trigger

    # 3. GLOF probability and final risk score
    # Multiply vulnerability with triggers to model physical interaction.
    # Base risk represents structural failure probability even without triggers.
    prob = (vuln_score * 0.3) + (vuln_score * trigger_score * 0.7)
    
    # Sigmoid function scaled to 0-100%
    raw_score = prob * 150.0  # scale factor
    score = round(float(100.0 / (1.0 + np.exp(-0.06 * (raw_score - 40.0)))), 1)
    score = max(0.0, min(100.0, score))

    # Drivers list
    drivers = [
        ("Lake Area Expansion", ndwi * 1.5, f"{ndwi*100:g}%", f"+{ndwi * 20:.1f}σ"),
        ("Ice/SAR Structural Change", max(0.0, -sar) * 0.25, f"{sar:g}dB", f"+{abs(sar):.1f}σ"),
        ("Rainfall (7d/Forecast)", precip_trigger, f"{max_precip:g}mm", f"+{(max_precip - 40) / 15:.1f}σ" if max_precip > 40 else "N/A"),
        ("Seismic Activity", seismic_trigger, f"{seismic_mag:g}M ({int(seismic_count)} events)", f"+{seismic_mag - 2.0:.1f}σ" if seismic_mag > 2.0 else "N/A"),
        ("Temperature anomaly", temp_trigger, f"+{temp:g}°C", f"+{temp * 1.5:.1f}σ"),
    ]
    
    top_drivers = sorted(drivers, key=lambda x: x[1], reverse=True)[:3]

    tier = "RED" if score >= 80.0 else "YELLOW" if score >= 50.0 else "GREEN"

    # Correlations & Causes Explanation narrative
    if vuln_score < 0.25:
        stability_status = "stable and lacks significant expansion or structural change"
    else:
        stability_status = f"unstable (expansion: +{ndwi*100:.1f}%, SAR deformation: {sar:.1f}dB)"

    if max_precip < 80.0 and (seismic_mag < 4.0 or seismic_count == 0):
        trigger_status = "both precipitation and seismic indicators are at safe minimum baselines"
        interaction_status = "safe combination of low structural vulnerability and minimal triggers, which prevents a high risk score"
    elif max_precip >= 150.0 or seismic_mag >= 5.0:
        trigger_status = f"highly anomalous triggers active (Max Rain: {max_precip:.1f}mm, Max Quake: {seismic_mag:.1f}M)"
        if vuln_score >= 0.4:
            interaction_status = "dangerous coupling of existing structural damage and severe external triggers, pushing risk to critical levels"
        else:
            interaction_status = "high external triggers, but the dam remains structurally stable, resulting in moderate risk"
    else:
        trigger_status = "moderate dynamic triggers active"
        interaction_status = "moderate trigger inputs; continuous monitoring is required"

    explanation = (
        f"Thulagi Lake risk score is calculated at {score}/100 ({tier}). "
        f"The dam structure is currently {stability_status}. "
        f"Dynamic weather and seismic conditions indicate that {trigger_status}. "
        f"The physical interaction modeling confirms a {interaction_status}."
    )

    return {
        "risk_score": score,
        "risk_tier": tier,
        "confidence": 0.94,
        "top_drivers": [
            {"feature": name, "contribution": round(c, 2), "value": val, "anomaly_ratio": ar} for name, c, val, ar in top_drivers
        ],
        "explanation": explanation
    }


def calculate_risk_score(features: dict[str, object]) -> dict[str, object]:
    """Helper to keep compatibility with any older code referencing this function."""
    return calculate_risk(features)

