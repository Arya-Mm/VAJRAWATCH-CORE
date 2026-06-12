/**
 * VAJRAWATCH — Hardcoded mock data for Phase 1 (zero backend dependency)
 * This exact state object matches the master prompt specification.
 */
export const THULAGI_LAKE_DATA = {
  lake_id: "PDGL_THULAGI_01",
  name: "Thulagi Lake",
  risk_score: 84,
  risk_tier: "RED",
  coordinates: {
    lat: 28.5333,
    lng: 84.3833,
  },
  top_drivers: [
    {
      feature: "Rainfall Anomaly",
      value: "210.0mm",
      anomaly_ratio: "1.4x",
      highlighted: true, // Von Restorff Effect — visually distinct
    },
    {
      feature: "Lake Area Expansion",
      value: "+18.5%",
      anomaly_ratio: "1.2x",
      highlighted: false,
    },
  ],
  impact: {
    population: 124800,
    hydropower_mw: 186,
    bridges_at_risk: 7,
    historical_analog: "South Lonak 2023",
  },
  agent_traces: [
    { step: 1, agent: "SatelliteAgent", message: "Sentinel-2 L2A scene ingested. Cloud cover: 12%." },
    { step: 2, agent: "HydroAgent", message: "PERSIANN rainfall anomaly detected. Δ+210mm above baseline." },
    { step: 3, agent: "GLOFClassifier", message: "XGBoost ensemble score: 84/100. Tier: RED CRITICAL." },
    { step: 4, agent: "AlertComposer", message: "Downstream impact zone confirmed. ETA flood front: ~4h." },
  ],
  last_updated: "2026-06-12T14:00:00Z",
};

export const SYSTEM_STATS = {
  lakes_monitored: 47,
  satellites_active: 3,
  model_accuracy: "94.2%",
  last_scan: "2 min ago",
};
