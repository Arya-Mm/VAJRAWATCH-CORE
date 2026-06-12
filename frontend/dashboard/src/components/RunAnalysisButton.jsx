/* ─────────────────────────────────────────────────────
 * RunAnalysisButton
 * Full-width CTA with shimmer scan animation,
 * pulsing indicator dot, and tier-aware styling.
 * ───────────────────────────────────────────────────── */

function RunAnalysisButton({ tier = 'RED' }) {
  return (
    <button
      className={`run-analysis-btn run-analysis-btn--${tier.toLowerCase()}`}
      aria-label="Run VAJRAWATCH analysis"
    >
      {/* Pulsing dot — left edge */}
      <span className="run-analysis-btn__pulse" aria-hidden="true" />

      {/* Label + engine tag */}
      <div className="run-analysis-btn__body">
        <span className="run-analysis-btn__label">RUN ANALYSIS</span>
        <span className="run-analysis-btn__sub">VAJRAWATCH ENGINE v2.1</span>
      </div>
    </button>
  );
}

export default RunAnalysisButton;
