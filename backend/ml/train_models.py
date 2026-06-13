import os
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import IsolationForest
import shap

# Set random seed for reproducibility
np.random.seed(42)

def generate_synthetic_data(num_samples: int = 2000) -> pd.DataFrame:
    """Generate realistic Himalayan GLOF risk indicators with physical interaction logic."""
    # Generate random features across realistic ranges
    ndwi_delta = np.random.uniform(0.0, 0.6, num_samples)
    sar_backscatter_change = np.random.uniform(-4.0, 2.0, num_samples)
    precip_7d_mm = np.random.uniform(0.0, 450.0, num_samples)
    temp_anomaly_c = np.random.uniform(-2.0, 8.0, num_samples)
    seismic_count_14d = np.random.poisson(lam=1.5, size=num_samples)
    seismic_max_magnitude = np.random.uniform(0.0, 7.5, num_samples)
    nvidia_precip_5day_mm = np.random.uniform(0.0, 250.0, num_samples)
    lake_area_km2 = np.random.uniform(0.05, 3.5, num_samples)

    # 1. Structural Vulnerability (0.0 to 1.0+)
    # Driven by lake expansion (ndwi_delta), SAR structural shifts (negative is dangerous), and lake size.
    vuln_score = (ndwi_delta * 1.5) + (np.maximum(0.0, -sar_backscatter_change) * 0.25) + (np.maximum(0.0, lake_area_km2 - 0.4) * 0.15)

    # 2. Dynamic Triggers (0.0 to 1.0+)
    # Driven by heavy rain (past 7 days or forecast 5 days), seismic activity, and temperature melt.
    max_precip = np.maximum(precip_7d_mm, nvidia_precip_5day_mm)
    precip_trigger = np.maximum(0.0, max_precip - 80.0) / 300.0  # significant above 80mm
    
    seismic_trigger = np.where(
        (seismic_count_14d > 0) & (seismic_max_magnitude >= 3.5),
        (seismic_max_magnitude - 3.5) * 0.2,
        0.0
    )
    
    temp_trigger = np.maximum(0.0, temp_anomaly_c) * 0.05

    trigger_score = precip_trigger + seismic_trigger + temp_trigger

    # 3. GLOF Occurrence Criteria (Interaction Model)
    # A GLOF occurs if there is significant vulnerability AND a major trigger event,
    # OR if the structural vulnerability is so catastrophic that it triggers a dam breach on its own.
    prob = (vuln_score * 0.3) + (vuln_score * trigger_score * 0.7)
    
    glof_occurred = np.where((prob > 0.4) | (vuln_score > 1.3), 1, 0)

    return pd.DataFrame({
        "ndwi_delta": ndwi_delta,
        "sar_backscatter_change": sar_backscatter_change,
        "precip_7d_mm": precip_7d_mm,
        "temp_anomaly_c": temp_anomaly_c,
        "seismic_count_14d": seismic_count_14d,
        "seismic_max_magnitude": seismic_max_magnitude,
        "nvidia_precip_5day_mm": nvidia_precip_5day_mm,
        "lake_area_km2": lake_area_km2,
        "glof_occurred": glof_occurred
    })



def train_and_export():
    models_dir = os.path.join("backend", "ml", "models")
    os.makedirs(models_dir, exist_ok=True)

    print("Generating synthetic GLOF training dataset...")
    df = generate_synthetic_data(1000)

    # Features list
    features = [
        "ndwi_delta", "sar_backscatter_change", "precip_7d_mm", 
        "temp_anomaly_c", "seismic_count_14d", "seismic_max_magnitude", 
        "nvidia_precip_5day_mm", "lake_area_km2"
    ]
    
    X = df[features]
    y = df["glof_occurred"]

    # 1. Train XGBoost classifier
    print("Training XGBoost Classifier...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=50,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        eval_metric="logloss"
    )
    xgb_model.fit(X, y)

    xgb_path = os.path.join(models_dir, "risk_model.pkl")
    joblib.dump(xgb_model, xgb_path)
    print(f"XGBoost risk model saved to: {xgb_path}")

    # 2. Train IsolationForest skeptic model (excluding seismic and lake_area)
    skeptic_features = [
        "ndwi_delta", "sar_backscatter_change", "precip_7d_mm", 
        "temp_anomaly_c", "nvidia_precip_5day_mm"
    ]
    skeptic_path = os.path.join(models_dir, "skeptic_model.pkl")
    print(f"Training IsolationForest Skeptic Model on: {skeptic_features}")
    skeptic_model = IsolationForest(
        n_estimators=100,
        contamination=0.1,
        random_state=42
    )
    # Train exclusively on normal baseline observations
    normal_data = df[df["glof_occurred"] == 0][skeptic_features]
    skeptic_model.fit(normal_data)

    joblib.dump(skeptic_model, skeptic_path)
    print(f"IsolationForest skeptic model saved to: {skeptic_path}")

def get_shap_explainer(model_path: str) -> shap.TreeExplainer:
    """Load the trained XGBoost model and return a SHAP TreeExplainer."""
    model = joblib.load(model_path)
    return shap.TreeExplainer(model)

if __name__ == "__main__":
    train_and_export()
