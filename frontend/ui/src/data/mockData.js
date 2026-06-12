/**
 * VAJRAWATCH — Hardcoded mock data for Phase 1 & 5 (zero backend dependency)
 * This exact state object matches the master prompt specification.
 */

// Generate 21 Potentially Dangerous Glacial Lakes (PDGLs) for Phase 5
const generateMockLakes = () => {
  const baseLakes = {
    "PDGL_THULAGI_01": {
      lake_id: "PDGL_THULAGI_01",
      name: "Thulagi Lake",
      risk_score: 84,
      risk_tier: "RED",
      coordinates: { lat: 28.5333, lng: 84.3833 },
      top_drivers: [
        { feature: "Rainfall Anomaly", value: "210.0mm", anomaly_ratio: "1.4x", highlighted: true },
        { feature: "Lake Area Expansion", value: "+18.5%", anomaly_ratio: "1.2x", highlighted: false },
      ],
      impact: { population: 124800, hydropower_mw: 186, bridges_at_risk: 7, historical_analog: "South Lonak 2023" },
      polygon: [
        [[84.475, 28.530], [84.485, 28.528], [84.490, 28.535], [84.480, 28.538], [84.475, 28.530]]
      ],
      flow_path: [
        [84.485, 28.528], [84.490, 28.510], [84.495, 28.480], [84.505, 28.450]
      ],
      agent_traces: [
        { step: 1, agent: "SatelliteAgent", message: "Sentinel-2 L2A scene ingested. Cloud cover: 12%." },
        { step: 2, agent: "HydroAgent", message: "PERSIANN rainfall anomaly detected. Δ+210mm above baseline." },
        { step: 3, agent: "GLOFClassifier", message: "XGBoost ensemble score: 84/100. Tier: RED CRITICAL." },
        { step: 4, agent: "AlertComposer", message: "Downstream impact zone confirmed. ETA flood front: ~4h." },
      ],
      last_updated: "2026-06-12T14:00:00Z",
    },
    "PDGL_TSHO_ROPLA_02": {
      lake_id: "PDGL_TSHO_ROPLA_02",
      name: "Tsho Rolpa",
      risk_score: 92,
      risk_tier: "RED",
      coordinates: { lat: 27.8833, lng: 86.4833 },
      top_drivers: [
        { feature: "Ice Avalanche Risk", value: "High", anomaly_ratio: "1.8x", highlighted: true },
        { feature: "Moraine Seepage", value: "0.5m³/s", anomaly_ratio: "1.5x", highlighted: false },
      ],
      impact: { population: 45000, hydropower_mw: 60, bridges_at_risk: 3, historical_analog: "Dig Tsho 1985" },
      agent_traces: [
        { step: 1, agent: "SatelliteAgent", message: "SAR imagery confirms hanging glacier instability." },
        { step: 2, agent: "GeoAgent", message: "End moraine seepage flow increased by 50%." },
        { step: 3, agent: "GLOFClassifier", message: "XGBoost ensemble score: 92/100. Tier: RED CRITICAL." },
        { step: 4, agent: "AlertComposer", message: "Tamakoshi valley alert triggered. ETA flood front: ~2h." },
      ],
      last_updated: "2026-06-12T14:00:00Z",
    },
    "PDGL_IMJA_TSHO_03": {
      lake_id: "PDGL_IMJA_TSHO_03",
      name: "Imja Tsho",
      risk_score: 65,
      risk_tier: "AMBER",
      coordinates: { lat: 27.8933, lng: 86.9244 },
      top_drivers: [
        { feature: "Lake Expansion", value: "+4.2%", anomaly_ratio: "1.1x", highlighted: true },
        { feature: "Temperature Shift", value: "+1.2°C", anomaly_ratio: "1.0x", highlighted: false },
      ],
      impact: { population: 15000, hydropower_mw: 0, bridges_at_risk: 1, historical_analog: "None" },
      agent_traces: [
        { step: 1, agent: "SatelliteAgent", message: "Sentinel-1 expansion analysis normal." },
        { step: 2, agent: "ThermalAgent", message: "Moderate thermal warming detected." },
        { step: 3, agent: "GLOFClassifier", message: "XGBoost ensemble score: 65/100. Tier: AMBER WARNING." },
        { step: 4, agent: "AlertComposer", message: "Monitoring status elevated. No immediate downstream threat." },
      ],
      last_updated: "2026-06-12T14:00:00Z",
    }
  };

  // Procedurally generate the remaining 18 lakes to hit 21 PDGLs
  const names = ["Lower Barun", "Lumding Tsho", "Moi Tsho", "Barun Tsho", "Dudh Pokhari", "Chhamjang", "Dig Tsho", "Nuptse Lake", "Gokyo Cho", "Phoksundo", "Rara Lake", "Tilicho", "Gosaikunda", "Panch Pokhari", "Shey Phoksundo", "Tsho Pema", "Khumbu Lake", "Ngozumpa"];
  for (let i = 0; i < 18; i++) {
    const id = `PDGL_MOCK_${(i + 4).toString().padStart(2, '0')}`;
    const lat = 27.5 + Math.random() * 2.0; // Scatter around Nepal
    const lng = 84.0 + Math.random() * 4.0;
    
    baseLakes[id] = {
      lake_id: id,
      name: names[i] || `Glacial Lake ${i + 4}`,
      risk_score: Math.floor(Math.random() * 40) + 20, // 20-60 (Green/Amber)
      risk_tier: "GREEN",
      coordinates: { lat, lng },
      top_drivers: [
        { feature: "Stable Volume", value: "0%", anomaly_ratio: "1.0x", highlighted: true },
        { feature: "Thermal Scan", value: "Normal", anomaly_ratio: "0.9x", highlighted: false },
      ],
      impact: { population: Math.floor(Math.random() * 5000), hydropower_mw: Math.floor(Math.random() * 20), bridges_at_risk: 1, historical_analog: "N/A" },
      agent_traces: [
        { step: 1, agent: "SatelliteAgent", message: "Clear scan. No expansion." },
        { step: 2, agent: "HydroAgent", message: "Inflow/outflow balanced." },
        { step: 3, agent: "GLOFClassifier", message: "Score stable. Tier: GREEN." },
        { step: 4, agent: "AlertComposer", message: "Routine monitoring." },
      ],
      last_updated: "2026-06-12T14:00:00Z",
    };
  }

  return baseLakes;
};

export const MOCK_LAKES = generateMockLakes();
// Maintain legacy export for compatibility if needed, pointing to Thulagi
export const THULAGI_LAKE_DATA = MOCK_LAKES["PDGL_THULAGI_01"];

export const SYSTEM_STATS = {
  lakes_monitored: Object.keys(MOCK_LAKES).length, // Dynamically set to 21
  satellites_active: 3,
  model_accuracy: "94.2%",
  last_scan: "2 min ago",
};
