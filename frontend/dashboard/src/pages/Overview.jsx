/**
 * Overview — Phase 4
 * Adds:
 *   - AlertBanner inside AnimatePresence (shown when critical)
 *   - DemoMode button in header
 *   - LIVE pulse dot in header
 *   - ErrorBoundary wrapping each intel section
 *   - is-critical class on hero-panel for glow CSS
 */

import { motion, AnimatePresence } from 'framer-motion';

import useLakeStore         from '../store/useLakeStore';
import ThreatMonitoringZone from '../components/ThreatMonitoringZone';
import RiskGauge            from '../components/RiskGauge';
import TopDrivers           from '../components/TopDrivers';
import ImpactPanel          from '../components/ImpactPanel';
import AlertBanner          from '../components/AlertBanner';
import ErrorBoundary        from '../components/ErrorBoundary';
import AlertConsole         from '../components/AlertConsole';
import PortfolioView        from '../components/PortfolioView';
import CrossLakeComparison  from '../components/CrossLakeComparison';


function Overview() {
  const riskScore     = useLakeStore(s => s.riskScore);
  const riskTier      = useLakeStore(s => s.riskTier);
  const topDrivers    = useLakeStore(s => s.topDrivers);
  const impactData    = useLakeStore(s => s.impactData);
  const analysisState = useLakeStore(s => s.analysisState);

  const intelViewMode = useLakeStore(s => s.intelViewMode);
  const setIntelViewMode = useLakeStore(s => s.setIntelViewMode);

  const isLoading  = analysisState === 'loading';
  const isCritical = analysisState === 'critical';

  return (
    <div className="dashboard">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className={`dashboard-header status--${riskTier.toLowerCase()}`}>

        {/* Brand — live dot + wordmark */}
        <div className="header-brand">
          <motion.span
            className="header-live-dot"
            animate={{ opacity: [1, 0.15, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            aria-label="Live monitoring active"
          />
          <span className="wordmark">VAJRAWATCH</span>
        </div>

        {/* Controls — monitoring stat */}
        <div className="header-controls">
          <div className="header-stat">
            <span className="header-stat__value">MONITORING: 47 LAKES <span className="header-stat__sep">//</span> ACTIVE ALERTS: 4</span>
          </div>
        </div>

      </header>

      {/* ── Alert Banner — Peak-End Rule ───────────────────────── */}
      <AnimatePresence>
        {isCritical && <AlertBanner key="alert-banner" />}
      </AnimatePresence>

      {/* ── Body — Left/Right Split mission control ───────────────────── */}
      <div className="dashboard-body">

        {/* Left Column — TMZ + Timeline + AlertConsole */}
        <div className={`left-column${isCritical ? ' is-critical' : ''}`}>
          <div className="left-column-top">
            <ThreatMonitoringZone />
          </div>
          <div className="left-column-bottom">
            <ErrorBoundary>
              <AlertConsole />
            </ErrorBoundary>
          </div>
        </div>

        {/* Right Column — Intel Panels */}
        <div className="right-column">

          <div className="intel-toggle-bar">
            <button
              type="button"
              className={`intel-toggle-btn ${intelViewMode === 'single' ? 'is-active' : ''}`}
              onClick={() => setIntelViewMode('single')}
            >
              LAKE INTELLIGENCE
            </button>
            <button
              type="button"
              className={`intel-toggle-btn ${intelViewMode === 'regional' ? 'is-active' : ''}`}
              onClick={() => setIntelViewMode('regional')}
            >
              REGIONAL PORTFOLIO
            </button>
          </div>

          <div className="right-column-content">
            {intelViewMode === 'single' ? (
              <>
                <div className="intel-section">
                  <ErrorBoundary>
                    <RiskGauge score={riskScore} tier={riskTier} isLoading={isLoading} />
                  </ErrorBoundary>
                </div>

                <div className="intel-section">
                  <ErrorBoundary>
                    <TopDrivers drivers={topDrivers} isLoading={isLoading} />
                  </ErrorBoundary>
                </div>

                <div className="intel-section">
                  <ErrorBoundary>
                    <ImpactPanel impact={impactData} isLoading={isLoading} />
                  </ErrorBoundary>
                </div>
              </>
            ) : (
              <>
                <div className="intel-section">
                  <ErrorBoundary>
                    <PortfolioView />
                  </ErrorBoundary>
                </div>

                <div className="intel-section">
                  <ErrorBoundary>
                    <CrossLakeComparison />
                  </ErrorBoundary>
                </div>
              </>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

export default Overview;
