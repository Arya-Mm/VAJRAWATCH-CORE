/**
 * RunAnalysisButton — Phase 2
 * Reads runAnalysis action + analysisState from useLakeStore.
 * Disabled + label change during loading.
 */

import useLakeStore from '../store/useLakeStore';

function RunAnalysisButton() {
  const runAnalysis   = useLakeStore(s => s.runAnalysis);
  const analysisState = useLakeStore(s => s.analysisState);
  const isLoading     = analysisState === 'loading';

  return (
    <button
      className={`run-analysis-btn${isLoading ? ' run-analysis-btn--loading' : ''}`}
      onClick={runAnalysis}
      disabled={isLoading}
      aria-label="Run VAJRAWATCH glacial risk analysis"
      aria-busy={isLoading}
    >
      <span className="run-analysis-btn__label">
        {isLoading ? 'Analyzing...' : 'Run Analysis'}
      </span>
    </button>
  );
}

export default RunAnalysisButton;
