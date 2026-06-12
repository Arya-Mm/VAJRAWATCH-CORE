import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  TrendingUp,
  Users,
  Zap,
  GitBranch,
  Volume2,
  Play,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronRight,
  BarChart2,
  Waves,
} from 'lucide-react';
import RiskGauge from './RiskGauge';
import { THULAGI_LAKE_DATA } from '../data/mockData';

/**
 * Sidebar — Right panel (40% width)
 * The Action & Data Command panel.
 *
 * States managed via useState:
 *   'idle'     → default hardcoded metric state
 *   'loading'  → skeleton for 1.5s (anticipation loop)
 *   'critical' → RED alert state (the reward)
 */

// ─── Skeleton loader block ────────────────────────────────────────────────────
function SkeletonBlock({ height = '1.25rem', width = '100%', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ height, width, borderRadius: '0.375rem', ...style }}
    />
  );
}

// ─── Loading skeleton layout ──────────────────────────────────────────────────
function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* Gauge skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem 0' }}>
        <SkeletonBlock height="180px" width="180px" style={{ borderRadius: '50%' }} />
        <SkeletonBlock height="0.875rem" width="80px" />
      </div>
      {/* Metric skeletons */}
      {[1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SkeletonBlock height="0.875rem" width="40%" />
          <SkeletonBlock height="2.5rem" />
        </div>
      ))}
      {/* Impact skeleton */}
      <div style={{ display: 'flex', gap: '0.625rem' }}>
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} height="4rem" style={{ flex: 1 }} />
        ))}
      </div>
      {/* Button skeleton */}
      <SkeletonBlock height="3.25rem" />
    </motion.div>
  );
}

// ─── Critical alert panel ──────────────────────────────────────────────────────
function CriticalAlertBanner({ data }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="alert-critical glow-red"
      style={{ marginBottom: '0.25rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <AlertTriangle size={18} color="var(--accent-red)" />
        </motion.div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--accent-red)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
            }}
          >
            ⚠ GLOF RISK CRITICAL — IMMEDIATE ACTION REQUIRED
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(248,250,252,0.75)', lineHeight: 1.5 }}>
            LangGraph agent analysis complete. Risk score <strong style={{ color: 'var(--accent-red)' }}>84/100</strong>.
            Estimated flood front ETA: <strong style={{ color: '#f8fafc' }}>~4 hours</strong>.
            Population at risk: <strong style={{ color: '#f8fafc' }}>{data.impact.population.toLocaleString()}</strong>.
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Agent trace row ──────────────────────────────────────────────────────────
function AgentTrace({ trace, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.12, duration: 0.3 }}
      style={{
        display: 'flex',
        gap: '0.625rem',
        padding: '0.5rem 0',
        borderBottom: index < 3 ? '1px solid var(--border-subtle)' : 'none',
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'rgba(59,130,246,0.15)',
          border: '1px solid rgba(59,130,246,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '0.6rem',
          fontWeight: 700,
          color: 'var(--accent-blue)',
          marginTop: '1px',
        }}
      >
        {trace.step}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '1px' }}>
          {trace.agent}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {trace.message}
        </div>
      </div>
      <CheckCircle size={12} color="var(--accent-green)" style={{ marginTop: '4px', flexShrink: 0 }} />
    </motion.div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar() {
  const [analysisState, setAnalysisState] = useState('idle'); // 'idle' | 'loading' | 'critical'
  const data = THULAGI_LAKE_DATA;

  const handleRunAnalysis = useCallback(() => {
    if (analysisState === 'loading') return;

    setAnalysisState('loading');

    // Anticipation loop: 1.5s skeleton → reward (critical state)
    setTimeout(() => {
      setAnalysisState('critical');
    }, 1500);
  }, [analysisState]);

  const isLoading = analysisState === 'loading';
  const isCritical = analysisState === 'critical';

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
      style={{
        width: '40%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        overflow: 'hidden',
      }}
    >
      {/* ── SCROLLABLE CONTENT ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* ── LAKE HEADER ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            paddingBottom: '0.875rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginBottom: '0.25rem',
              }}
            >
              <MapPin size={13} color="var(--accent-blue)" />
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                Selected Lake
              </span>
            </div>
            <h1
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {data.name}
            </h1>
            <div
              style={{
                fontSize: '0.65rem',
                fontFamily: 'monospace',
                color: 'var(--text-muted)',
                marginTop: '3px',
              }}
            >
              {data.lake_id}
            </div>
          </div>

          {/* Risk tier pill */}
          <motion.div
            animate={
              isCritical
                ? { boxShadow: ['0 0 12px rgba(239,68,68,0.3)', '0 0 24px rgba(239,68,68,0.5)', '0 0 12px rgba(239,68,68,0.3)'] }
                : {}
            }
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              background: isCritical
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(100,116,139,0.15)',
              border: `1px solid ${isCritical ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: isCritical ? 'var(--accent-red)' : 'var(--text-muted)',
              transition: 'all 0.4s ease',
            }}
          >
            {isCritical ? '● CRITICAL' : data.risk_tier}
          </motion.div>
        </div>

        {/* ── MAIN CONTENT — switch between loading & data ── */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <LoadingState key="loading" />
          ) : (
            <motion.div
              key="data"
              initial={isCritical ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {/* ── CRITICAL ALERT BANNER ── */}
              {isCritical && <CriticalAlertBanner data={data} />}

              {/* ── RISK GAUGE ── */}
              <div className="card" style={{ padding: '0.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <BarChart2 size={13} color="var(--accent-blue)" />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    AI Risk Assessment
                  </span>
                </div>
                <RiskGauge score={data.risk_score} animated={!isCritical || analysisState === 'critical'} />
              </div>

              {/* ── TOP DRIVERS ── */}
              <div className="card" style={{ padding: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <TrendingUp size={13} color="var(--accent-blue)" />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Top Risk Drivers
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.top_drivers.map((driver, i) => (
                    // Von Restorff Effect: highlighted driver uses red-tinted card
                    <motion.div
                      key={driver.feature}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={driver.highlighted ? 'metric-highlight' : 'metric-card'}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {driver.highlighted ? (
                            <Waves size={13} color="var(--accent-red)" />
                          ) : (
                            <TrendingUp size={13} color="var(--text-muted)" />
                          )}
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: driver.highlighted ? 'var(--text-primary)' : 'var(--text-secondary)',
                            }}
                          >
                            {driver.feature}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 800,
                              color: driver.highlighted ? 'var(--accent-red)' : 'var(--text-primary)',
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {driver.value}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              color: driver.highlighted ? 'rgba(239,68,68,0.7)' : 'var(--text-muted)',
                              background: driver.highlighted
                                ? 'rgba(239,68,68,0.1)'
                                : 'var(--bg-elevated)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {driver.anomaly_ratio}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── IMPACT ZONE ── */}
              <div className="card" style={{ padding: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <AlertTriangle size={13} color="var(--accent-orange)" />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Impact Zone — Downstream
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {/* Population */}
                  <div className="metric-card" style={{ flex: 1, textAlign: 'center' }}>
                    <Users size={14} color="var(--accent-orange)" style={{ margin: '0 auto 4px' }} />
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                      }}
                    >
                      {data.impact.population.toLocaleString()}
                    </div>
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                        marginTop: '2px',
                      }}
                    >
                      Population
                    </div>
                  </div>

                  {/* Hydropower MW */}
                  <div className="metric-card" style={{ flex: 1, textAlign: 'center' }}>
                    <Zap size={14} color="var(--accent-yellow)" style={{ margin: '0 auto 4px' }} />
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                      }}
                    >
                      {data.impact.hydropower_mw}
                      <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {' '}MW
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                        marginTop: '2px',
                      }}
                    >
                      Hydropower
                    </div>
                  </div>

                  {/* Bridges */}
                  <div className="metric-card" style={{ flex: 1, textAlign: 'center' }}>
                    <GitBranch size={14} color="var(--accent-red)" style={{ margin: '0 auto 4px' }} />
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                      }}
                    >
                      {data.impact.bridges_at_risk}
                    </div>
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                        marginTop: '2px',
                      }}
                    >
                      Bridges at Risk
                    </div>
                  </div>
                </div>

                {/* Historical analog */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <ChevronRight size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Historical analog:
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--accent-orange)',
                    }}
                  >
                    {data.impact.historical_analog}
                  </span>
                </div>
              </div>

              {/* ── ALERT CONSOLE (agent traces) — shown only in critical state ── */}
              <AnimatePresence>
                {isCritical && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="card"
                    style={{ padding: '1rem', overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.625rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <GitBranch size={13} color="var(--accent-blue)" />
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          }}
                        >
                          LangGraph Agent Traces
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          color: 'var(--accent-green)',
                          fontWeight: 600,
                        }}
                      >
                        ✓ Complete
                      </span>
                    </div>

                    {data.agent_traces.map((trace, i) => (
                      <AgentTrace key={trace.step} trace={trace} index={i} />
                    ))}

                    {/* Play Nepali Warning Audio */}
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        marginTop: '0.75rem',
                        padding: '0.625rem 1rem',
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--accent-red)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Volume2 size={14} />
                      <span>Play Nepali Warning Broadcast</span>
                      <Play size={11} style={{ marginLeft: 'auto' }} />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── PRIMARY ACTION BUTTON — Fitts's Law: largest interactive element ── */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}
      >
        <motion.button
          id="run-analysis-btn"
          onClick={handleRunAnalysis}
          disabled={isLoading}
          className="btn-primary"
          whileHover={!isLoading ? { scale: 1.015 } : {}}
          whileTap={!isLoading ? { scale: 0.985 } : {}}
          style={{
            fontSize: '0.875rem',
            padding: '1.1rem 2rem',
            background: isCritical
              ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #ef4444 100%)'
              : isLoading
              ? 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)'
              : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
            boxShadow: isCritical
              ? '0 4px 24px rgba(239,68,68,0.4)'
              : '0 4px 24px rgba(59,130,246,0.3)',
            transition: 'all 0.4s ease',
          }}
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={16} />
              </motion.div>
              <span>Analyzing Satellite Data...</span>
            </>
          ) : isCritical ? (
            <>
              <AlertTriangle size={16} />
              <span>RE-RUN ANALYSIS</span>
            </>
          ) : (
            <>
              <Zap size={16} />
              <span>RUN ANALYSIS</span>
            </>
          )}
        </motion.button>

        {/* Sub-label */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '0.5rem',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}
        >
          {isLoading
            ? 'Running LangGraph multi-agent pipeline...'
            : isCritical
            ? 'Last analysis: just now · Model accuracy: 94.2%'
            : 'Triggers LangGraph AI · XGBoost · Sentinel-2 pipeline'}
        </div>
      </div>
    </motion.aside>
  );
}
