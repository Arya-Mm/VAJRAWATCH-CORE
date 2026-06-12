/* ─────────────────────────────────────────────────────
 * Overview
 * Command-center shell: sticky header, sub-bar,
 * CSS Grid layout wiring all four panel components.
 * ───────────────────────────────────────────────────── */

import RiskGauge        from '../components/RiskGauge';
import TopDrivers       from '../components/TopDrivers';
import ImpactPanel      from '../components/ImpactPanel';
import RunAnalysisButton from '../components/RunAnalysisButton';
import { thulagiData }  from '../data/thulagiMock';

function Overview() {
  const { lakeId, name, riskScore, riskTier, topDrivers, impact } = thulagiData;
  const tierLower = riskTier.toLowerCase();

  return (
    <div className="command-center">

      {/* ── Sticky header ─────────────────────────────── */}
      <header className="cc-header">

        {/* Brand */}
        <div className="cc-brand">
          <div className="cc-brand__icon" aria-hidden="true">⚡</div>
          <span className="cc-brand__name">VAJRAWATCH</span>
          <span className="cc-brand__tag">CORE v1</span>
        </div>

        {/* Lake metadata */}
        <div className="cc-meta">
          <span className="cc-meta__id">{lakeId}</span>
          <span className="cc-meta__name">{name}</span>
          <span className="cc-meta__sep" aria-hidden="true" />
          <span className="cc-meta__coords">28.5143°N · 84.4231°E</span>
        </div>

        {/* System status + alert */}
        <div className="cc-header__right">
          <div className="cc-status" aria-label="System status: active">
            <span className="cc-status__dot" aria-hidden="true" />
            SYSTEM ACTIVE
          </div>
          <div
            className={`cc-alert cc-alert--${tierLower}`}
            role="status"
            aria-label={`Risk alert level: ${riskTier}`}
          >
            <span className="cc-alert__dot" aria-hidden="true" />
            {riskTier} ALERT
          </div>
        </div>

      </header>

      {/* ── Sub-bar ───────────────────────────────────── */}
      <div className="cc-subbar" aria-label="Lake metadata">
        <div className="cc-subbar__item">
          ELEVATION <strong>4,149m ASL</strong>
        </div>
        <div className="cc-subbar__sep" aria-hidden="true" />
        <div className="cc-subbar__item">
          BASIN <strong>Marsyangdi River</strong>
        </div>
        <div className="cc-subbar__sep" aria-hidden="true" />
        <div className="cc-subbar__item">
          LAST SCAN <strong>2026-06-12 15:00 UTC</strong>
        </div>
        <div className="cc-subbar__sep" aria-hidden="true" />
        <div className="cc-subbar__item">
          DATA SOURCE <strong>SAR + OPTICAL FUSION</strong>
        </div>
      </div>

      {/* ── Main CSS Grid ─────────────────────────────── */}
      <main className="cc-grid">

        {/* Left column — Risk Gauge */}
        <section className="cc-card cc-card--gauge" aria-label="Risk gauge">
          <RiskGauge score={riskScore} tier={riskTier} />
        </section>

        {/* Right column — stacked panels */}
        <div className="cc-right-panel">

          <section className="cc-card" aria-label="Top risk drivers">
            <TopDrivers drivers={topDrivers} />
          </section>

          <section className="cc-card" aria-label="Impact assessment">
            <ImpactPanel impact={impact} />
          </section>

        </div>

        {/* Footer row — Run Analysis */}
        <div className="cc-card cc-card--footer">
          <RunAnalysisButton tier={riskTier} />
        </div>

      </main>
    </div>
  );
}

export default Overview;
