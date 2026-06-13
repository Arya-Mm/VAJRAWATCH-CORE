const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const MOCK_DATA = {
  lake_id: "PDGL_THULAGI_01",
  name: "Thulagi Lake",
  risk_score: 84,
  risk_tier: "RED",
  top_drivers: [
    { feature: "Rainfall Anomaly", value: "210.0mm", anomaly_ratio: "1.4x" },
    { feature: "Lake Area Expansion", value: "18.5%", anomaly_ratio: "1.2x" }
  ],
  impact: {
    population: 12480,
    hydropower_mw: 186,
    historical_analog: "South Lonak 2023"
  },
  agent_traces: [
    { agent: "Sentinel", step: 1, message: "Satellite NDWI scan complete. 18.5% expansion detected." },
    { agent: "Environmental", step: 2, message: "Weather pattern anomalous. 210mm precip expected." },
    { agent: "Risk Assessment", step: 3, message: "Risk score calculated: 84/100 (RED TIER)." },
    { agent: "Skeptic", step: 4, message: "Verdict CONFIRMED based on 2 independent signals." },
    { agent: "Report", step: 5, message: "Decision brief generated for downstream operators." }
  ],
  spatial_data: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { layer_type: "lake", name: "Thulagi Lake" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [[84.485, 28.530], [84.495, 28.530], [84.495, 28.520], [84.485, 28.520], [84.485, 28.530]]
          ]
        }
      },
      {
        type: "Feature",
        properties: { layer_type: "river", flow_rate_m3s: 450.5, status: "critical" },
        geometry: {
          type: "LineString",
          coordinates: [
            [84.490, 28.520], [84.490, 28.500], [84.480, 28.480], [84.480, 28.450]
          ]
        }
      },
      {
        type: "Feature",
        properties: { layer_type: "impact_boundary" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [[84.470, 28.490], [84.500, 28.490], [84.490, 28.440], [84.460, 28.440], [84.470, 28.490]]
          ]
        }
      }
    ]
  },
  isMock: true // Flag to identify fallback data
};

/**
 * Normalizes backend response to match the exact schema expected by the frontend.
 */
function normalizeResponse(data) {
  return {
    ...data,
    // Map backend 'agent_trace' to frontend 'agent_traces'
    agent_traces: data.agent_trace ? data.agent_trace.map((trace, i) => ({
      agent: trace.agent,
      step: i + 1,
      message: trace.status
    })) : MOCK_DATA.agent_traces,
    // Provide absolute URL for audio if relative path is returned (keeping base64 data URIs as is)
    audio_url: data.audio_url ? (data.audio_url.startsWith('data:') ? data.audio_url : `${API_BASE_URL}${data.audio_url}`) : null,
    isMock: false
  };
}

/**
 * Fetch health status.
 */
export async function fetchHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error('Health check failed');
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("Backend health check failed. System is offline.");
    return { status: "offline" };
  }
}

/**
 * Run risk analysis for a given lake.
 */
export async function runAnalysis(lakeId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    // 1. hit POST /simulate to flip state
    await fetch(`${API_BASE_URL}/simulate/${lakeId}?active=true`, { 
      method: 'POST',
      signal: controller.signal 
    });
    
    // 2. Fetch the actual risk assessment data
    const response = await fetch(`${API_BASE_URL}/risk/${lakeId}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API returned status ${response.status}`);
    const data = await response.json();
    const normalized = normalizeResponse(data);
    window.dispatchEvent(new CustomEvent('vajrawatch-data-mode', { detail: { isMock: false } }));
    window.dispatchEvent(new CustomEvent('vajrawatch-data-update', { detail: { data: normalized } }));
    return normalized;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`Backend offline or timed out. Falling back to MOCK_DATA for ${lakeId}. Error: ${error.message}`);
    // If a different lake is requested, we still fallback to Thulagi mock data but patch the ID so UI doesn't crash
    const fallbackData = { ...MOCK_DATA, lake_id: lakeId };
    window.dispatchEvent(new CustomEvent('vajrawatch-data-mode', { detail: { isMock: true } }));
    window.dispatchEvent(new CustomEvent('vajrawatch-data-update', { detail: { data: fallbackData } }));
    return fallbackData;
  }
}

/**
 * Legacy alias if needed by other components
 */
export const fetchRiskData = runAnalysis;

/**
 * Helper to fetch audio warning URL.
 */
export function fetchAudioWarning(audioPath) {
  if (!audioPath) return null;
  if (audioPath.startsWith('http') || audioPath.startsWith('data:')) return audioPath;
  return `${API_BASE_URL}${audioPath}`;
}
