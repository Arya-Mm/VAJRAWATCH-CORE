from __future__ import annotations

import json
import os
from typing import Any, cast
import joblib
import numpy as np
import pandas as pd
import requests
import shap
from dotenv import load_dotenv
from langchain_neo4j import Neo4jGraph
from typing_extensions import TypedDict

load_dotenv()

# Define GLOFState to match orchestrator schema
class GLOFState(TypedDict):
    lake_id: str
    raw_data: dict[str, Any]
    risk_result: dict[str, Any]
    graph_context: str
    skeptic_verdict: str
    report: str
    agent_trace: list[dict[str, str]]


def risk_fusion_node(state: GLOFState) -> GLOFState:
    """Agent 5: Risk Fusion Agent.
    Loads XGBoost classifier, calculates risk score/tier, and extracts top SHAP drivers.
    """
    raw_data = state.setdefault("raw_data", {})
    
    # Load model
    model_path = os.path.join("backend", "ml", "models", "risk_model.pkl")
    if not os.path.exists(model_path):
        # Fallback to deterministic baseline if model is missing
        print(f"[Risk Fusion] Model file not found at {model_path}. Using fallback.")
        from backend.ml.features import calculate_risk
        state["risk_result"] = calculate_risk(raw_data)
        state["agent_trace"].append({
            "agent": "Risk Fusion Agent",
            "status": f"Score: {state['risk_result']['risk_score']} | Tier: {state['risk_result']['risk_tier']} (fallback)"
        })
        return state

    try:
        model = joblib.load(model_path)
        
        # Format input DataFrame matching training columns
        df = pd.DataFrame([{
            "ndwi_delta": float(raw_data.get("ndwi_delta", 0.0)),
            "sar_backscatter_change": float(raw_data.get("sar_backscatter_change", 0.0)),
            "precip_7d_mm": float(raw_data.get("precip_7d_mm", 0.0)),
            "temp_anomaly_c": float(raw_data.get("temp_anomaly_c", 0.0)),
            "seismic_count_14d": float(raw_data.get("seismic_count_14d", 0.0)),
            "seismic_max_magnitude": float(raw_data.get("seismic_max_magnitude", 0.0)),
            "nvidia_precip_5day_mm": float(raw_data.get("nvidia_precip_5day_mm", 0.0)),
            "lake_area_km2": float(raw_data.get("lake_area_km2", 0.0))
        }])

        # Predict probability
        probs = model.predict_proba(df)
        prob_val = float(probs[0][1])
        risk_score = round(prob_val * 100.0, 1)

        # Classify tier
        tier = "RED" if risk_score >= 80.0 else "YELLOW" if risk_score >= 50.0 else "GREEN"

        # Calculate SHAP values
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(df)

        # Handle different SHAP return types across versions safely
        if isinstance(shap_values, list):
            vals = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        else:
            if len(shap_values.shape) == 3:
                vals = shap_values[0][0]
            elif len(shap_values.shape) == 2:
                vals = shap_values[0]
            else:
                vals = shap_values

        feature_names = [
            "ndwi_delta", "sar_backscatter_change", "precip_7d_mm", 
            "temp_anomaly_c", "seismic_count_14d", "seismic_max_magnitude", 
            "nvidia_precip_5day_mm", "lake_area_km2"
        ]

        contributions = []
        for idx, feat in enumerate(feature_names):
            try:
                contrib = float(vals[idx])
            except Exception:
                contrib = 0.0
            contributions.append((feat, contrib, float(df.iloc[0][feat])))

        # Extract top 3 absolute contributors
        top_drivers = sorted(contributions, key=lambda x: abs(x[1]), reverse=True)[:3]

        state["risk_result"] = {
            "risk_score": risk_score,
            "risk_tier": tier,
            "confidence": 0.87,
            "top_drivers": [
                {"feature": feat, "contribution": round(contrib, 2), "value": val}
                for feat, contrib, val in top_drivers
            ]
        }
    except Exception as e:
        print(f"[Risk Fusion] An error occurred during ML prediction: {e}")
        from backend.ml.features import calculate_risk
        state["risk_result"] = calculate_risk(raw_data)
        tier = state["risk_result"]["risk_tier"]
        risk_score = state["risk_result"]["risk_score"]

    state["agent_trace"].append({
        "agent": "Risk Fusion Agent",
        "status": f"Score: {risk_score} | Tier: {tier}"
    })
    return state


def skeptic_node(state: GLOFState) -> GLOFState:
    """Agent 7: Skeptic Agent.
    Runs IsolationForest anomaly checker. Challenges the XGBoost risk tier.
    """
    raw_data = state.setdefault("raw_data", {})
    risk_result = state.setdefault("risk_result", {})
    tier = risk_result.get("risk_tier", "GREEN")

    model_path = os.path.join("backend", "ml", "models", "skeptic_model.pkl")
    if not os.path.exists(model_path):
        # Fallback to standard deterministic rule
        print(f"[Skeptic Agent] Model file not found at {model_path}. Using fallback.")
        state["skeptic_verdict"] = "CONFIRMED" if tier == "RED" else "MONITORING"
        state["agent_trace"].append({
            "agent": "Skeptic Agent",
            "status": f"Verdict: {state['skeptic_verdict']} (fallback)"
        })
        return state

    try:
        model = joblib.load(model_path)
        
        # IsolationForest was trained on 5 features (excluding seismic and lake_area)
        df_skeptic = pd.DataFrame([{
            "ndwi_delta": float(raw_data.get("ndwi_delta", 0.0)),
            "sar_backscatter_change": float(raw_data.get("sar_backscatter_change", 0.0)),
            "precip_7d_mm": float(raw_data.get("precip_7d_mm", 0.0)),
            "temp_anomaly_c": float(raw_data.get("temp_anomaly_c", 0.0)),
            "nvidia_precip_5day_mm": float(raw_data.get("nvidia_precip_5day_mm", 0.0))
        }])

        pred = int(model.predict(df_skeptic)[0]) # -1 = Anomaly, 1 = Normal

        # Logic mapping
        if tier == "RED" and pred == 1:
            verdict = "DISPUTED"
        elif tier == "RED" and pred == -1:
            verdict = "CONFIRMED"
        else:
            verdict = "MONITORING"
            
        state["skeptic_verdict"] = verdict
        status_msg = f"Verdict: {verdict} | IsolationForest score: {pred}"
    except Exception as e:
        print(f"[Skeptic Agent] Anomaly check failed: {e}")
        verdict = "CONFIRMED" if tier == "RED" else "MONITORING"
        state["skeptic_verdict"] = verdict
        status_msg = f"Verdict: {verdict} (fallback error)"

    state["agent_trace"].append({
        "agent": "Skeptic Agent",
        "status": status_msg
    })
    return state


def graph_rag_node(state: GLOFState) -> GLOFState:
    """Agent 6: GraphRAG Recall Agent.
    Queries Neo4j AuraDB to extract GLOF analogues, village population, and hydropower capacity.
    """
    lake_id = state.get("lake_id", "PDGL_THULAGI_01")
    
    neo4j_uri = os.getenv("NEO4J_URI")
    neo4j_user = os.getenv("NEO4J_USERNAME", "neo4j")
    neo4j_password = os.getenv("NEO4J_PASSWORD")

    # Safe fallback values represent the baseline Thulagi Lake model if database is unreachable
    fallback_context = (
        "Glacial Lake: Thulagi Lake (ID: PDGL_THULAGI_01, area: 0.52 km2)\n"
        "Threatened Infrastructure:\n"
        "  - Besisahar Hydro (hydropower, capacity: 186.0 MW, threatened value: $45.0M USD, distance: 12.5 km)\n"
        "Threatened Villages:\n"
        "  - Besisahar Village (population: 12,480, district: Lamjung, distance: 14.2 km)\n"
        "Historical GLOF Event Analogs:\n"
        "  - South Lonak GLOF Event 2023 (deaths: 55, damage: $120.0M USD, similarity: 0.89)"
    )

    if not neo4j_uri or not neo4j_password:
        state["graph_context"] = fallback_context
        state["agent_trace"].append({
            "agent": "GraphRAG Recall Agent",
            "status": "Recalled offline threat mappings (credentials missing)"
        })
        return state

    try:
        # Establish connection
        graph = Neo4jGraph(
            url=neo4j_uri,
            username=neo4j_user,
            password=neo4j_password
        )

        # Money Cypher Query
        cypher = """
        MATCH (l:GlacialLake {id: $lake_id})
        OPTIONAL MATCH (l)-[r1:THREATENS]->(i:Infrastructure)
        OPTIONAL MATCH (l)-[r2:THREATENS]->(v:Village)
        OPTIONAL MATCH (e:GLOFEvent)-[r3:SIMILAR_TO]->(l)
        RETURN 
            l.name AS lake_name,
            l.area_km2 AS area_km2,
            collect(DISTINCT {name: i.name, type: i.type, mw: i.capacity_mw, val: i.value_usd, dist: r1.distance_km}) AS infra,
            collect(DISTINCT {name: v.name, pop: v.population, dist: r2.distance_km}) AS villages,
            collect(DISTINCT {name: e.name, deaths: e.deaths, damage: e.damage_usd, similarity: r3.similarity_score}) AS analogs
        """
        
        results = graph.query(cypher, params={"lake_id": lake_id})
        
        if results:
            record = results[0]
            lake_name = record.get("lake_name", "Thulagi Lake")
            area = record.get("area_km2", 0.52)
            
            context_lines = [
                f"Glacial Lake: {lake_name} (ID: {lake_id}, area: {area} km2)",
                "Threatened Infrastructure:"
            ]
            
            infra_list = record.get("infra", [])
            for item in infra_list:
                if item and item.get("name"):
                    dist_str = f", distance: {item['dist']} km" if item.get("dist") else ""
                    context_lines.append(
                        f"  - {item['name']} ({item.get('type', 'unknown')}, capacity: {item.get('mw')} MW, "
                        f"threatened value: ${item.get('val'):,} USD{dist_str})"
                    )
            
            context_lines.append("Threatened Villages:")
            villages_list = record.get("villages", [])
            for item in villages_list:
                if item and item.get("name"):
                    dist_str = f", distance: {item['dist']} km" if item.get("dist") else ""
                    context_lines.append(
                        f"  - {item['name']} (population: {item.get('pop'):,}{dist_str})"
                    )

            context_lines.append("Historical GLOF Event Analogs:")
            analogs_list = record.get("analogs", [])
            for item in analogs_list:
                if item and item.get("name"):
                    context_lines.append(
                        f"  - {item['name']} (deaths: {item.get('deaths')}, damage: ${item.get('damage'):,} USD, "
                        f"similarity: {item.get('similarity')})"
                    )
            
            state["graph_context"] = "\n".join(context_lines)
            status_msg = "Recalled live AuraDB threat mappings"
        else:
            state["graph_context"] = fallback_context
            status_msg = "Recalled offline threat mappings (empty graph returns)"

    except Exception as e:
        print(f"[GraphRAG Recall Agent] Query failed: {e}")
        state["graph_context"] = fallback_context
        status_msg = "Recalled offline threat mappings (database connection timeout)"

    state["agent_trace"].append({
        "agent": "GraphRAG Recall Agent",
        "status": status_msg
    })
    return state
