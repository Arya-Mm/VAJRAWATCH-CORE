import os
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import IsolationForest
import shap

# Set random seed for reproducibility
np.random.seed(42)

def generate_synthetic_data(num_samples: int = 1000) -> pd.DataFrame:
    """Generate realistic Himalayan GLOF risk indicators with synthetic GLOF target."""
    ndwi_delta = np.random.uniform(0.0, 0.6, num_samples)
    sar_backscatter_change = np.random.uniform(-4.0, 2.0, num_samples)
    precip_7d_mm = np.random.uniform(0.0, 400.0, num_samples)
    temp_anomaly_c = np.random.uniform(-2.0, 8.0, num_samples)
    seismic_count_14d = np.random.poisson(lam=2.0, size=num_samples)
    seismic_max_magnitude = np.random.exponential(scale=1.5, size=num_samples)
    seismic_max_magnitude = np.clip(seismic_max_magnitude, 0.0, 7.5)
    nvidia_precip_5day_mm = np.random.uniform(0.0, 250.0, num_samples)
    lake_area_km2 = np.random.uniform(0.05, 3.5, num_samples)

    df = pd.DataFrame({
        "ndwi_delta": ndwi_delta,
        "sar_backscatter_change": sar_backscatter_change,
        "precip_7d_mm": precip_7d_mm,
        "temp_anomaly_c": temp_anomaly_c,
        "seismic_count_14d": seismic_count_14d,
        "seismic_max_magnitude": seismic_max_magnitude,
        "nvidia_precip_5day_mm": nvidia_precip_5day_mm,
        "lake_area_km2": lake_area_km2
    })

    # GLOF occurrence logic combining geological and atmospheric triggers
    threat_score = (
        (ndwi_delta * 30.0) +
        (np.clip(2.0 - sar_backscatter_change, 0, None) * 15.0) +
        (precip_7d_mm * 0.1) +
        (np.clip(temp_anomaly_c - 2.0, 0, None) * 6.0) +
        (seismic_count_14d * 4.0) +
        (np.clip(seismic_max_magnitude - 3.5, 0, None) * 8.0) +
        (nvidia_precip_5day_mm * 0.08) +
        (lake_area_km2 * 10.0)
    )

    # Sigmoid function maps to binary classification probabilities
    prob = 1.0 / (1.0 + np.exp(-0.06 * (threat_score - 45.0)))
    df["glof_occurred"] = np.random.binomial(1, prob)
    return df

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
    print(f"Training IsolationForest Skeptic Model on: {skeptic_features}")
    skeptic_model = IsolationForest(
        n_estimators=100,
        contamination=0.1,
        random_state=42
    )
    skeptic_model.fit(df[skeptic_features])

    skeptic_path = os.path.join(models_dir, "skeptic_model.pkl")
    joblib.dump(skeptic_model, skeptic_path)
    print(f"IsolationForest skeptic model saved to: {skeptic_path}")

def get_shap_explainer(model_path: str) -> shap.TreeExplainer:
    """Load the trained XGBoost model and return a SHAP TreeExplainer."""
    model = joblib.load(model_path)
    return shap.TreeExplainer(model)

if __name__ == "__main__":
    train_and_export()
