/**
 * DemoMode — Phase 4
 * Auto-cycles idle → loading → critical on repeat for presentations.
 * Cycle timing: 1 000 ms idle → analysis runs (1 500 ms) → 3 000 ms critical → reset.
 * Total loop: ~5.5 s per cycle.
 * Placed in the dashboard header.
 */

import { useEffect, useRef, useState } from 'react';
import useLakeStore from '../store/useLakeStore';

function DemoMode() {
  const [isActive, setIsActive] = useState(false);

  const runAnalysis   = useLakeStore(s => s.runAnalysis);
  const resetAnalysis = useLakeStore(s => s.resetAnalysis);
  const analysisState = useLakeStore(s => s.analysisState);

  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (!isActive) return;

    if (analysisState === 'idle') {
      // Wait 1 s, then kick off analysis
      timerRef.current = setTimeout(() => runAnalysis(), 1000);
    } else if (analysisState === 'critical') {
      // Hold the peak state for 3 s, then reset for next cycle
      timerRef.current = setTimeout(() => resetAnalysis(), 3000);
    }

    return () => clearTimeout(timerRef.current);
  }, [isActive, analysisState, runAnalysis, resetAnalysis]);

  // Clean up on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <button
      className={`demo-btn${isActive ? ' demo-btn--active' : ''}`}
      onClick={() => setIsActive(prev => !prev)}
      aria-label={isActive ? 'Stop demo mode' : 'Start demo mode'}
      aria-pressed={isActive}
    >
      {isActive ? '■ STOP' : '▶ DEMO'}
    </button>
  );
}

export default DemoMode;
