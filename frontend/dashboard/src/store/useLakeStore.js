/**
 * useLakeStore — VAJRAWATCH Zustand store
 * State machine: idle → loading → critical
 * Initialized from thulagiMock.js — no backend.
 */

import { create } from 'zustand';
import { thulagiData } from '../data/thulagiMock';

// Pre-seed to "2 minutes ago" so the UI shows it on first load
const PRESEED = new Date(Date.now() - 2 * 60 * 1000);

/** Compute relative time string — pure, no timer, updates on render */
export function formatRelativeTime(date) {
  if (!date) return 'Never';
  const diffMs   = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)  return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60)  return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
}

const useLakeStore = create((set, get) => ({
  /* ── Lake data (seeded from mock) ──────────────── */
  selectedLake: thulagiData,
  riskScore:    thulagiData.riskScore,
  riskTier:     thulagiData.riskTier,
  topDrivers:   thulagiData.topDrivers,
  impactData:   thulagiData.impact,

  /* ── Analysis state machine ────────────────────── */
  analysisState:  'idle',   // 'idle' | 'loading' | 'critical'
  lastAnalysisAt: PRESEED,

  /* ── Actions ───────────────────────────────────── */
  runAnalysis: () => {
    if (get().analysisState === 'loading') return; // guard: no double-fire
    set({ analysisState: 'loading' });
    setTimeout(
      () => set({ analysisState: 'critical', lastAnalysisAt: new Date() }),
      1500,
    );
  },

  // DemoMode uses this to restart the cycle after the peak state
  resetAnalysis: () => set({ analysisState: 'idle' }),
}));

export default useLakeStore;
