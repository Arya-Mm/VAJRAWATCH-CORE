/**
 * useLakeStore — VAJRAWATCH Zustand store
 * State machine: idle → loading → critical
 * Initialized from thulagiMock.js — no backend.
 *
 * Hardening (Phase 5):
 *   - Module-level `analysisTimer` prevents orphaned setTimeout.
 *   - runAnalysis cancels any in-flight timer before setting a new one.
 */

import { create } from 'zustand';
import { thulagiData, lakesData } from '../data/thulagiMock';
import { fetchRisk } from '../services/riskApi';
import { fetchImpact } from '../services/impactApi';
import { fetchAgents, fetchTimeline } from '../services/traceApi';

// Pre-seed to "2 minutes ago" so the UI shows it on first load
const PRESEED = new Date(Date.now() - 2 * 60 * 1000);

/** Module-level ref — prevents orphaned timers if runAnalysis fires rapidly */
let analysisTimer = null;

/** Compute relative time string — pure, no timer, updates on render */
export function formatRelativeTime(date) {
  if (!date) return 'Never';
  const diffMs   = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)   return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60)  return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
}

const useLakeStore = create((set, get) => ({
  /* ── Lake data (seeded from mock) ──────────────── */
  selectedLake:   thulagiData,
  selectedLakeId: 'PDGL_THULAGI_01',
  lakesList:      Object.values(lakesData),
  riskScore:      thulagiData.riskScore,
  riskTier:       thulagiData.riskTier,
  topDrivers:     thulagiData.topDrivers,
  impactData:     thulagiData.impact,

  /* ── Agent Activity & Alert Evidence ───────────── */
  agentData:    thulagiData.agents,
  evidence:     thulagiData.evidence,
  reasoning:    thulagiData.reasoning,
  decisionLogs: thulagiData.decisionLogs,

  /* ── Analysis state machine ────────────────────── */
  analysisState:  'idle',   // 'idle' | 'loading' | 'critical'
  lastAnalysisAt: PRESEED,

  /* ── 2D/3D Geospatial View Modes ───────────────── */
  viewMode:       '2d',     // '2d' | '3d' | 'simulation'
  reset3DTrigger: 0,
  zoom3DClick:    null,     // { action: 'in' | 'out', id: number }

  /* ── View Controls (Single Lake vs Portfolio) ──── */
  intelViewMode:  'single', // 'single' | 'regional'

  /* ── Actions ───────────────────────────────────── */
  setViewMode: (mode) => set({ viewMode: mode }),
  
  trigger3DReset: () => set((state) => ({ reset3DTrigger: state.reset3DTrigger + 1 })),

  zoom3D: (action) => set({ zoom3DClick: { action, id: Date.now() } }),

  setIntelViewMode: (mode) => set({ intelViewMode: mode }),

  selectLake: (lakeId) => {
    const data = lakesData[lakeId];
    if (!data) return;

    // Reset timers on lake switch
    if (analysisTimer !== null) {
      clearTimeout(analysisTimer);
      analysisTimer = null;
    }

    set({
      selectedLakeId: lakeId,
      selectedLake:   data,
      riskScore:      data.riskScore,
      riskTier:       data.riskTier,
      topDrivers:     data.topDrivers,
      impactData:     data.impact,
      agentData:      data.agents,
      evidence:       data.evidence,
      reasoning:      data.reasoning,
      decisionLogs:   data.decisionLogs,
      analysisState:  'idle'
    });
  },

  runAnalysis: async () => {
    if (get().analysisState === 'loading') return; // guard: no double-fire

    /* Cancel any orphaned in-flight timer */
    if (analysisTimer !== null) {
      clearTimeout(analysisTimer);
      analysisTimer = null;
    }

    set({ analysisState: 'loading' });

    try {
      const lakeId = get().selectedLakeId;
      // Parallel fetches to FastAPI backend
      const [riskRes, impactRes, agentsRes, timelineRes] = await Promise.all([
        fetchRisk(lakeId),
        fetchImpact(lakeId),
        fetchAgents(lakeId),
        fetchTimeline(lakeId)
      ]);

      set({
        riskScore: riskRes.riskScore,
        riskTier: riskRes.riskTier,
        selectedLake: {
          ...get().selectedLake,
          coordinates: riskRes.coordinates || get().selectedLake.coordinates
        },
        impactData: impactRes,
        agentData: agentsRes.agents || agentsRes,
        evidence: agentsRes.evidence || '',
        reasoning: agentsRes.reasoning || '',
        decisionLogs: timelineRes.decisionLogs || timelineRes || [],
        analysisState: 'critical',
        lastAnalysisAt: new Date()
      });
    } catch (err) {
      console.warn('[VAJRAWATCH] Backend offline. Falling back to Mock Intelligence.');
      console.error(err);

      // Keep mock computational delay for realistic feel
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const fallback = lakesData[get().selectedLakeId] || thulagiData;

      set({
        riskScore: fallback.riskScore,
        riskTier: fallback.riskTier,
        impactData: fallback.impact,
        agentData: fallback.agents,
        evidence: fallback.evidence,
        reasoning: fallback.reasoning,
        decisionLogs: fallback.decisionLogs,
        analysisState: 'critical',
        lastAnalysisAt: new Date()
      });
    }
  },

  /* DemoMode uses this to restart the cycle after the peak state */
  resetAnalysis: () => {
    if (analysisTimer !== null) {
      clearTimeout(analysisTimer);
      analysisTimer = null;
    }
    set({ analysisState: 'idle' });
  },
}));

export default useLakeStore;
