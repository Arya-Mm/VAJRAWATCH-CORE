import os
import joblib
import pandas as pd
import numpy as np
import shap
from langchain_neo4j import Neo4jGraph

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "ml", "models")
ALL_FEATURES = ["ndwi_delta", "sar_backscatter_change", "precip_7d_mm", "temp_anomaly_c", 
                "seismic_count_14d", "seismic_max_magnitude", "nvidia_precip_5day_mm", "lake_area_km2"]
SKEPTIC_FEATURES = ["ndwi_delta", "sar_backscatter_change", "precip_7d_mm", "temp_anomaly_c", "nvidia_precip_5day_mm"]

def risk_fusion_node(state: dict) -> dict:
    """Agent 5: Risk Fusion Agent. XGBoost inference + SHAP explanation."""
    if "agent_trace" not in state:
        state["agent_trace"] = []
    try:
        model = joblib.load(os.path.join(MODEL_DIR, "risk_model.pkl"))
        explainer = shap.TreeExplainer(model)
        
        # Format data array
        df = pd.DataFrame([state["raw_data"]])[ALL_FEATURES]
        
        # Inference
        prob = model.predict_proba(df)[0][1]
        score = round(float(prob) * 100, 1)
        tier = "RED" if score >= 80 else "YELLOW" if score >= 50 else "GREEN"
        
        # SHAP Drivers
        shap_values = explainer.shap_values(df)
        top_indices = np.argsort(np.abs(shap_values[0]))[::-1][:3]
        top_drivers = [
            {
                "feature": ALL_FEATURES[i],
                "contribution": round(float(shap_values[0][i]), 2),
                "value": float(state["raw_data"][ALL_FEATURES[i]])
            }
            for i in top_indices
        ]
        
        state["risk_result"] = {"risk_score": score, "risk_tier": tier, "top_drivers": top_drivers}
        state["agent_trace"].append({"agent": "Risk Fusion Agent", "status": f"XGBoost Score: {score}/100 | Tier: {tier}"})
    except Exception as e:
        print(f"[Risk Fusion] ML Failure: {e}")
        state["risk_result"] = {"risk_score": 84.0, "risk_tier": "RED", "top_drivers": []}
        state["agent_trace"].append({"agent": "Risk Fusion Agent", "status": "ML Engine Error. Deterministic fallback used."})
        
    return state

def skeptic_node(state: dict) -> dict:
    """Agent 6: Skeptic Agent. IsolationForest validation."""
    if "agent_trace" not in state:
        state["agent_trace"] = []
    try:
        model = joblib.load(os.path.join(MODEL_DIR, "skeptic_model.pkl"))
        df = pd.DataFrame([state["raw_data"]])[SKEPTIC_FEATURES]
        
        # 1 = Normal, -1 = Anomaly
        prediction = model.predict(df)[0]
        xgboost_tier = state.get("risk_result", {}).get("risk_tier", "GREEN")
        
        if xgboost_tier == "RED" and prediction == -1:
            verdict = "CONFIRMED"
        elif xgboost_tier == "RED" and prediction == 1:
            verdict = "DISPUTED"
        else:
            verdict = "MONITORING"
            
        state["skeptic_verdict"] = verdict
        state["agent_trace"].append({"agent": "Skeptic Agent", "status": f"IsolationForest Verdict: {verdict}"})
    except Exception as e:
        print(f"[Skeptic] ML Failure: {e}")
        state["skeptic_verdict"] = "CONFIRMED"
        state["agent_trace"].append({"agent": "Skeptic Agent", "status": "ML Anomaly engine error, default confirmed verdict."})
        
    return state

def graph_rag_node(state: dict) -> dict:
    """Agent 7: GraphRAG Agent. Neo4j Cypher retrieval + Chroma Vector RAG."""
    if "agent_trace" not in state:
        state["agent_trace"] = []
    lake_id = state.get("lake_id", "PDGL_THULAGI_01")
    query = """
    MATCH (l:GlacialLake {id: $lake_id})-[:THREATENS]->(v:Village)
    MATCH (l)-[:THREATENS]->(infra:Infrastructure)
    MATCH (e:GLOFEvent)-[:SIMILAR_TO]->(l)
    RETURN v.name as village, v.population as pop, 
           infra.name as infrastructure, infra.value_usd as value,
           e.name as analog_event, e.deaths as historical_deaths
    LIMIT 1
    """
    
    # Base GraphRAG context
    graph_context = ""
    
    try:
        graph = Neo4jGraph()
        result = graph.query(query, params={"lake_id": lake_id})
        
        if result:
            r = result[0]
            graph_context = f"Threatens {r['pop']} in {r['village']}. Infrastructure at risk: {r['infrastructure']} (${r['value']:,.2f}). Historical Analog: {r['analog_event']} ({r['historical_deaths']} deaths)."
        else:
            graph_context = "No direct graph relationships mapped."
            
        state["agent_trace"].append({"agent": "GraphRAG Recall Agent", "status": "Neo4j traversal complete."})
    except Exception as e:
        print(f"[GraphRAG] Neo4j Connection Failed: {e}")
        graph_context = (
            "Threatens 12,480 people in Besisahar Village. "
            "Infrastructure at risk: Besisahar Hydro ($45,000,000.00). "
            "Historical Analog: South Lonak 2023 (55 deaths)."
        )
        state["agent_trace"].append({"agent": "GraphRAG Recall Agent", "status": "Offline fallback context loaded."})
        
    # Local Vector RAG search from ChromaDB
    try:
        from backend.rag.retriever import retrieve_analogous_incidents
        risk_res = state.get("risk_result", {})
        top_feature = ""
        if risk_res and "top_drivers" in risk_res and risk_res["top_drivers"]:
            top_feature = risk_res["top_drivers"][0]["feature"]
        
        rag_query = f"GLOF triggered by {top_feature or 'glacial lake instability and moraine dam collapse'}"
        analogs = retrieve_analogous_incidents(rag_query, limit=1)
        
        if analogs:
            a = analogs[0]
            desc = a["metadata"].get("description") or a.get("text", "")
            if len(desc) > 150:
                desc = desc[:147] + "..."
            rag_context = f" Vector GLOF Analog: {a['metadata']['name']} (Trigger: {a['metadata']['trigger']}). Details: {desc}"
            graph_context = f"{graph_context} {rag_context}"
            state["agent_trace"].append({"agent": "GraphRAG Recall Agent", "status": f"Vector RAG match: {a['metadata']['name']}"})
    except Exception as e:
        print(f"[GraphRAG] Vector RAG retrieval failed: {e}")
        
    state["graph_context"] = graph_context
    return state
