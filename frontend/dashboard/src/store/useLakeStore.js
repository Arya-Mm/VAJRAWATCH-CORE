import { create } from 'zustand';
import { lakesData } from '../data/thulagiMock';
import { fetchRisk } from '../services/riskApi';
import { fetchImpact } from '../services/impactApi';
import { fetchAgents, fetchTimeline } from '../services/traceApi';

const DEFAULT_LAKE_ID = 'PDGL_THULAGI_01';

function normalizeAnalysis({ riskRes, impactRes, agentsRes, timelineRes }) {
  return {
    riskScore: riskRes?.riskScore ?? riskRes?.score ?? null,
    riskTier: riskRes?.riskTier ?? riskRes?.tier ?? null,
    topDrivers: riskRes?.topDrivers ?? riskRes?.drivers ?? [],
    coordinates: riskRes?.coordinates ?? null,
    impact: impactRes ?? null,
    agents: agentsRes?.agents ?? [],
    evidence: agentsRes?.evidence ?? '',
    reasoning: agentsRes?.reasoning ?? '',
    recommendedAction: agentsRes?.recommendedAction ?? agentsRes?.action ?? '',
    decisionLogs: timelineRes?.decisionLogs ?? timelineRes?.logs ?? [],
    raw: { riskRes, impactRes, agentsRes, timelineRes },
  };
}

const useLakeStore = create((set, get) => ({
  selectedLakeId: DEFAULT_LAKE_ID,
  lakesList: Object.values(lakesData),
  analysisState: 'awaiting', // 'awaiting' | 'loading' | 'complete' | 'offline'
  backendStatus: 'unknown', // 'unknown' | 'online' | 'offline'
  lastAnalysisAt: null,
  analysisResult: null,
  viewMode: '2d', // '2d' | '3d' | 'simulation'
  reset3DTrigger: 0,

  selectLake: (lakeId) => {
    if (!lakesData[lakeId]) return;
    set({
      selectedLakeId: lakeId,
      analysisState: 'awaiting',
      backendStatus: 'unknown',
      lastAnalysisAt: null,
      analysisResult: null,
    });
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  trigger3DReset: () => set((state) => ({ reset3DTrigger: state.reset3DTrigger + 1 })),

  runAnalysis: async () => {
    if (get().analysisState === 'loading') return;

    set({
      analysisState: 'loading',
      backendStatus: 'unknown',
      analysisResult: null,
    });

    try {
      const lakeId = get().selectedLakeId;
      const [riskRes, impactRes, agentsRes, timelineRes] = await Promise.all([
        fetchRisk(lakeId),
        fetchImpact(lakeId),
        fetchAgents(lakeId),
        fetchTimeline(lakeId),
      ]);

      set({
        analysisResult: normalizeAnalysis({ riskRes, impactRes, agentsRes, timelineRes }),
        analysisState: 'complete',
        backendStatus: 'online',
        lastAnalysisAt: new Date(),
      });
    } catch (err) {
      console.warn('[VAJRAWATCH] Backend offline. Analysis data unavailable.');
      console.error(err);

      set({
        analysisResult: null,
        analysisState: 'offline',
        backendStatus: 'offline',
        lastAnalysisAt: new Date(),
      });
    }
  },
}));

export function getSelectedLake(state) {
  return lakesData[state.selectedLakeId] ?? lakesData[DEFAULT_LAKE_ID];
}

export function getDisplayStatus(state) {
  if (state.analysisState === 'loading') return 'Analyzing';
  if (state.analysisState === 'complete') return 'System Status: Online';
  if (state.analysisState === 'offline') return 'Backend Offline';
  return 'Awaiting Analysis';
}

export default useLakeStore;
