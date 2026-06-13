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
    """Generate realistic Himalayan GLOF risk indicators with balanced normal and hazard groups."""
    n_normal = num_samples // 2
    n_hazard = num_samples - n_normal

    # Normal samples: low NDWI, low precip, positive/low backscatter change, low seismic
    ndwi_delta_normal = np.random.uniform(0.0, 0.08, n_normal)
    sar_normal = np.random.uniform(-0.5, 2.0, n_normal)
    precip_normal = np.random.uniform(0.0, 80.0, n_normal)
    temp_normal = np.random.uniform(-2.0, 1.5, n_normal)
    seismic_cnt_normal = np.random.poisson(lam=0.5, size=n_normal)
    seismic_mag_normal = np.random.uniform(0.0, 2.5, n_normal)
    nv_precip_normal = np.random.uniform(0.0, 50.0, n_normal)
    lake_area_normal = np.random.uniform(0.05, 0.38, n_normal)

    # Hazard samples: high NDWI, high precip, negative backscatter change, high seismic
    ndwi_delta_hazard = np.random.uniform(0.1, 0.6, n_hazard)
    sar_hazard = np.random.uniform(-4.0, -1.2, n_hazard)
    precip_hazard = np.random.uniform(150.0, 450.0, n_hazard)
    temp_hazard = np.random.uniform(2.0, 8.0, n_hazard)
    seismic_cnt_hazard = np.random.poisson(lam=5.0, size=n_hazard)
    seismic_mag_hazard = np.random.uniform(3.5, 7.5, n_hazard)
    nv_precip_hazard = np.random.uniform(80.0, 250.0, n_hazard)
    lake_area_hazard = np.random.uniform(0.4, 3.5, n_hazard)

    df_normal = pd.DataFrame({
        "ndwi_delta": ndwi_delta_normal,
        "sar_backscatter_change": sar_normal,
        "precip_7d_mm": precip_normal,
        "temp_anomaly_c": temp_normal,
        "seismic_count_14d": seismic_cnt_normal,
        "seismic_max_magnitude": seismic_mag_normal,
        "nvidia_precip_5day_mm": nv_precip_normal,
        "lake_area_km2": lake_area_normal,
        "glof_occurred": 0
    })

    df_hazard = pd.DataFrame({
        "ndwi_delta": ndwi_delta_hazard,
        "sar_backscatter_change": sar_hazard,
        "precip_7d_mm": precip_hazard,
        "temp_anomaly_c": temp_hazard,
        "seismic_count_14d": seismic_cnt_hazard,
        "seismic_max_magnitude": seismic_mag_hazard,
        "nvidia_precip_5day_mm": nv_precip_hazard,
        "lake_area_km2": lake_area_hazard,
        "glof_occurred": 1
    })

    return pd.concat([df_normal, df_hazard], ignore_index=True)


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
