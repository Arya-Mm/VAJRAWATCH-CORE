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
import AnalysisTimeline     from '../components/AnalysisTimeline';
import AgentActivityPanel   from '../components/AgentActivityPanel';
import RiskGauge            from '../components/RiskGauge';
import TopDrivers           from '../components/TopDrivers';
import ImpactPanel          from '../components/ImpactPanel';
import RunAnalysisButton    from '../components/RunAnalysisButton';
import AlertBanner          from '../components/AlertBanner';
import DemoMode             from '../components/DemoMode';
import ErrorBoundary        from '../components/ErrorBoundary';
import AlertConsole         from '../components/AlertConsole';
import PortfolioView        from '../components/PortfolioView';
import RiskLeaderboard      from '../components/RiskLeaderboard';
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
      <header className="dashboard-header">

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

        <span className="header-subtitle">GLOF Command Center</span>

        {/* Controls — Demo mode + lakes stat */}
        <div className="header-controls">
          <DemoMode />
          <div className="header-stat">
            <span className="header-stat__value">4</span>
            <span className="header-stat__label">Lakes Monitored</span>
          </div>
        </div>

      </header>

      {/* ── Alert Banner — Peak-End Rule ───────────────────────── */}
      <AnimatePresence>
        {isCritical && <AlertBanner key="alert-banner" />}
      </AnimatePresence>

      {/* ── Body — 3-column mission control ───────────────────── */}
      <div className="dashboard-body">

        {/* Sidebar — Analysis Timeline + Agent Activity */}
        <div className="sidebar-panel">
          <AnalysisTimeline />
          <div className="sidebar-divider" aria-hidden="true" />
          <AgentActivityPanel />
        </div>

        {/* Hero — ThreatMonitoringZone + AlertConsole */}
        <div className={`hero-panel${isCritical ? ' is-critical' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ThreatMonitoringZone />
          </div>
          <AlertConsole />
        </div>

        {/* Intel — Risk Gauge · Top Drivers · Impact Severity */}
        <div className="intel-panel">

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
                  <RiskLeaderboard />
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

      {/* ── Footer — Run Analysis ──────────────────────────────── */}
      <div className="run-analysis-footer">
        <RunAnalysisButton />
      </div>

    </div>
  );
}

export default Overview;
