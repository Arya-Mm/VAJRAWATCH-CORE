import { useState, useCallback, useRef, useEffect } from 'react';
import { runAnalysis, fetchAudioWarning } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  TrendingUp,
  Users,
  Zap,
  GitBranch,
  Volume2,
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronRight,
  BarChart2,
  Waves,
} from 'lucide-react';
import RiskGauge from './RiskGauge';
import { MOCK_LAKES } from '../data/mockData';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const BG      = '#0a0a0a';
const PANEL   = '#111111';
const BORDER  = 'rgba(255,255,255,0.06)';
const BORDER2 = 'rgba(255,255,255,0.04)';
const T_PRI   = '#FFFFFF';
const T_SEC   = 'rgba(255,255,255,0.35)';
const T_DIM   = 'rgba(255,255,255,0.18)';
const RED     = '#EF4444';
const AMBER   = '#F97316';

const SIMULATED_LOADING_MS = 1500;

// ─── Skeleton Block ──────────────────────────────────────────────────────────
function SkeletonBlock({ height = '1.25rem', width = '100%', style = {} }) {
  return (
    <div
      style={{
        height, width, borderRadius: '0.375rem',
        background: 'rgba(255,255,255,0.05)',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <motion.div
      key="loading-skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', paddingBottom: '0.5rem' }}>
        <SkeletonBlock height="180px" width="180px" style={{ borderRadius: '50%' }} />
        <SkeletonBlock height="12px" width="80px" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SkeletonBlock height="12px" width="40%" />
          <SkeletonBlock height="40px" />
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        {[1, 2, 3].map((i) => <SkeletonBlock key={i} height="80px" />)}
      </div>
    </motion.div>
  );
}

// ─── Critical Alert Banner ───────────────────────────────────────────────────
function CriticalAlertBanner({ data }) {
  const isRed = data.risk_tier === 'RED';
  const color = isRed ? RED : AMBER;
  return (
    <div style={{
      marginBottom: '0.25rem',
      padding: '1rem',
      borderRadius: '0.75rem',
      border: `1px solid ${isRed ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.3)'}`,
      background: isRed ? 'rgba(239,68,68,0.08)' : 'rgba(249,115,22,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <AlertTriangle size={16} color={color} style={{ flexShrink: 0, marginTop: '1px' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.4rem', color, fontFamily: 'Inter, monospace' }}>
            ⚠ GLOF RISK {data.risk_tier} — IMMEDIATE ACTION REQUIRED
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
            LangGraph analysis complete. Risk score{' '}
            <strong style={{ color }}>{data.risk_score}/100</strong>.
            {' '}Estimated flood front ETA:{' '}
            <strong style={{ color: T_PRI }}>~4 hours</strong>.
            {' '}Population at risk:{' '}
            <strong style={{ color: T_PRI }}>{data.impact.population.toLocaleString()}</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Agent Trace Row ─────────────────────────────────────────────────────────
function AgentTrace({ trace, index, visible }) {
  const colors = [
    '#60A5FA', // Sentinel (blue)
    '#34D399', // Weather (green-cyan)
    '#0284c7', // Seismic (sky-blue)
    '#818cf8', // NVIDIA (indigo)
    '#c084fc', // Risk Fusion (purple)
    '#FBBF24', // Skeptic (yellow)
    '#f472b6', // GraphRAG (pink)
    '#fb7185', // Evacuation (rose)
    '#e11d48', // Report (crimson)
    '#F97316', // Alert Dispatcher (orange)
    '#ef4444'  // Nepali TTS (red)
  ];
  const dotColor = colors[index % colors.length];
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
      transition={{ duration: 0.35, delay: index * 0.22 }}
      style={{
        display: 'flex', gap: '0.75rem', paddingTop: '0.6rem', paddingBottom: '0.6rem',
        borderBottom: index < 3 ? `1px solid ${BORDER}` : 'none',
      }}
    >
      <div style={{
        width: '22px', height: '22px', borderRadius: '50%',
        background: `${dotColor}15`,
        border: `1px solid ${dotColor}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontSize: '0.6rem', fontWeight: 800, color: dotColor,
        fontFamily: 'Inter, monospace',
        marginTop: '1px',
      }}>
        {trace.step}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T_PRI, marginBottom: '2px', fontFamily: 'Inter, sans-serif' }}>{trace.agent}</div>
        <div style={{ fontSize: '0.72rem', color: T_SEC, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>{trace.message}</div>
      </div>
      <CheckCircle size={12} color="#22c55e" style={{ marginTop: '4px', flexShrink: 0 }} />
    </motion.div>
  );
}

// ─── MAIN SIDEBAR ────────────────────────────────────────────────────────────
export default function Sidebar({ activeLakeId, setActiveLakeId }) {
  const [analysisState, setAnalysisState] = useState('idle');
  const [liveData, setLiveData]           = useState(MOCK_LAKES[activeLakeId]);
  const [audioPlaying, setAudioPlaying]   = useState(false);
  const [tracesVisible, setTracesVisible] = useState(false);
  const audioRef = useRef(null);

  // Reset when lake changes
  useEffect(() => {
    setAnalysisState('idle');
    setTracesVisible(false);
    setLiveData(MOCK_LAKES[activeLakeId]);
    if (audioPlaying && audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(false);
    }
  }, [activeLakeId]);

  const isLoading  = analysisState === 'loading';
  const isCritical = analysisState === 'critical';
  const data       = liveData || MOCK_LAKES['PDGL_THULAGI_01'];
  const isRed      = data.risk_tier === 'RED';
  const tierColor  = isRed ? RED : (data.risk_tier === 'AMBER' ? AMBER : '#22c55e');

  const handlePlayWarning = useCallback(() => {
    if (audioRef.current && audioPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioPlaying(false);
      return;
    }
    const audioUrl = data.audio_url ? fetchAudioWarning(data.audio_url) : '/warning.mp3';
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.addEventListener('ended', () => setAudioPlaying(false));
    audio.addEventListener('error', () => setTimeout(() => setAudioPlaying(false), 3000));
    audio.play().catch(() => setTimeout(() => setAudioPlaying(false), 3000));
    setAudioPlaying(true);
  }, [audioPlaying, data.audio_url]);

  const handleRunAnalysis = useCallback(async () => {
    if (isLoading) return;
    setAnalysisState('loading');
    setTracesVisible(false);

    const startTime = Date.now();

    try {
      const result = await runAnalysis(activeLakeId);
      setLiveData(result);
    } catch {
      // Deterministic fallback — keep mock data
    } finally {
      const elapsed   = Date.now() - startTime;
      const remaining = Math.max(0, SIMULATED_LOADING_MS - elapsed);
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
      setAnalysisState('critical');
      setTracesVisible(true);

      // ── Fire CustomEvent so MapContainer turns red reliably ──────────────
      window.dispatchEvent(
        new CustomEvent('vajrawatch-risk-state', { detail: { isCritical: true } })
      );
    }
  }, [isLoading, activeLakeId]);

  return (
    <aside
      style={{
        minWidth: '400px',
        flex: '0 0 40%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: BG,
        overflow: 'hidden',
        borderLeft: `1px solid ${BORDER}`,
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* ── Header Section ─────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <MapPin size={11} color={T_SEC} />
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: T_SEC, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Inter, monospace' }}>
                Selected Target
              </span>
            </div>

            <select
              value={activeLakeId}
              onChange={(e) => setActiveLakeId(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${BORDER}`,
                borderRadius: '0.5rem',
                color: T_PRI,
                fontSize: '1.6rem',
                fontWeight: 400,
                fontFamily: 'var(--font-serif)',
                padding: '0.25rem 0.5rem',
                marginTop: '0.25rem',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '280px',
              }}
            >
              {Object.values(MOCK_LAKES).map((lake) => (
                <option key={lake.lake_id} value={lake.lake_id} style={{ background: '#111', color: '#fff', fontSize: '1rem' }}>
                  {lake.name}
                </option>
              ))}
            </select>

            <div style={{ fontSize: '0.6rem', fontFamily: 'Inter, monospace', color: T_DIM, marginTop: '0.35rem', letterSpacing: '0.06em' }}>
              {data.lake_id}
            </div>
          </div>

          {/* Risk tier badge */}
          <div
            style={{
              padding: '0.35rem 0.875rem',
              borderRadius: '9999px',
              border: `1px solid ${isCritical ? `${tierColor}40` : BORDER}`,
              background: isCritical ? `${tierColor}12` : BORDER2,
              fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.14em',
              textTransform: 'uppercase', flexShrink: 0,
              color: isCritical ? tierColor : T_DIM,
              fontFamily: 'Inter, monospace',
              transition: 'all 0.4s ease',
            }}
          >
            {isCritical ? `● ${data.risk_tier}` : 'STANDBY'}
          </div>
        </div>

        {/* ── Animated Content ────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <LoadingState key="loading" />
          ) : (
            <motion.div
              key={`data-${analysisState}-${activeLakeId}`}
              initial={isCritical ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
            >
              {isCritical && <CriticalAlertBanner data={data} />}

              {/* ── Risk Gauge ─────────────────────────────────── */}
              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: '0.875rem', padding: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.625rem' }}>
                  <BarChart2 size={12} color={T_SEC} />
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: T_SEC, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'Inter, monospace' }}>
                    AI Risk Assessment
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.58rem', fontWeight: 600, fontFamily: 'Inter, monospace', letterSpacing: '0.08em', color: isCritical ? '#22c55e' : T_DIM }}>
                    {isCritical ? '● ONLINE' : '● STANDBY'}
                  </span>
                </div>
                <RiskGauge score={data.risk_score} animated={false} />
              </div>

              {/* ── Top Risk Drivers ───────────────────────────── */}
              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: '0.875rem', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.875rem' }}>
                  <TrendingUp size={12} color={T_SEC} />
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: T_SEC, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'Inter, monospace' }}>
                    Top Risk Drivers
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.top_drivers.map((driver, i) => {
                    const isHighlighted = i === 0;
                    return (
                      <div
                        key={`${driver.feature}-${i}`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.5rem 0.625rem',
                          borderRadius: '0.5rem',
                          background: isHighlighted && isCritical ? `${tierColor}10` : 'transparent',
                          border: isHighlighted && isCritical ? `1px solid ${tierColor}25` : '1px solid transparent',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isHighlighted
                            ? <Waves size={12} color={isCritical ? tierColor : T_SEC} />
                            : <TrendingUp size={12} color={T_DIM} />
                          }
                          <span style={{ fontSize: '0.8rem', fontWeight: isHighlighted ? 600 : 400, color: isHighlighted ? T_PRI : T_SEC, fontFamily: 'Inter, sans-serif' }}>
                            {driver.feature}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 800, letterSpacing: '-0.02em', color: isHighlighted && isCritical ? tierColor : T_PRI, fontFamily: 'Inter, monospace' }}>
                            {driver.value}
                          </span>
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 700, padding: '1px 0.45rem',
                            borderRadius: '0.25rem', letterSpacing: '0.06em', fontFamily: 'Inter, monospace',
                            background: isHighlighted && isCritical ? `${tierColor}20` : 'rgba(255,255,255,0.05)',
                            color: isHighlighted && isCritical ? tierColor : T_DIM,
                          }}>
                            {driver.anomaly_ratio}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Impact Zone ────────────────────────────────── */}
              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: '0.875rem', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                  <AlertTriangle size={12} color={T_SEC} />
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: T_SEC, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'Inter, monospace' }}>
                    Impact Zone — Downstream
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[
                    { icon: Users,     val: data.impact.population.toLocaleString(), label: 'Population' },
                    { icon: Zap,       val: `${data.impact.hydropower_mw}`, unit: 'MW', label: 'Hydropower' },
                    { icon: GitBranch, val: data.impact.bridges_at_risk || 4, label: 'Bridges' },
                  ].map(({ icon: Icon, val, unit, label }) => (
                    <div key={label} style={{ background: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '0.625rem', padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                      <Icon size={14} color={T_SEC} />
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: T_PRI, lineHeight: 1, letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
                        {val}{unit && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: T_SEC }}> {unit}</span>}
                      </div>
                      <div style={{ fontSize: '0.58rem', color: T_DIM, fontWeight: 500, letterSpacing: '0.06em', fontFamily: 'Inter, monospace', textTransform: 'uppercase' }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#0d0d0d', borderRadius: '0.5rem', border: `1px solid ${BORDER}` }}>
                  <ChevronRight size={11} color={T_DIM} />
                  <span style={{ fontSize: '0.72rem', color: T_DIM, fontFamily: 'Inter, sans-serif' }}>Historical analog:</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: T_PRI, marginLeft: 'auto', fontFamily: 'Inter, sans-serif' }}>{data.impact.historical_analog}</span>
                </div>
              </div>

              {/* ── Agent Traces (post-analysis) ───────────────── */}
              {isCritical && (
                <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: '0.875rem', padding: '1rem', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <GitBranch size={12} color={T_SEC} />
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: T_SEC, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'Inter, monospace' }}>
                        LangGraph Agent Traces
                      </span>
                    </div>
                    <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#22c55e', fontFamily: 'Inter, monospace', letterSpacing: '0.06em' }}>✓ Complete</span>
                  </div>

                  {data.agent_traces.map((trace, i) => (
                    <AgentTrace key={`${trace.step}-${trace.agent}`} trace={trace} index={i} visible={tracesVisible} />
                  ))}

                  {/* Nepali Audio Warning Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.2 }}
                    onClick={handlePlayWarning}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      width: '100%', marginTop: '0.875rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.625rem',
                      border: audioPlaying ? `1px solid ${RED}` : `1px solid rgba(239,68,68,0.35)`,
                      background: audioPlaying ? `${RED}15` : `${RED}08`,
                      color: audioPlaying ? RED : 'rgba(239,68,68,0.7)',
                      fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Inter, sans-serif',
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      animation: audioPlaying ? 'pulse-red 1.5s ease-in-out infinite' : 'none',
                    }}
                    onMouseEnter={e => { if (!audioPlaying) { e.currentTarget.style.background = `${RED}15`; e.currentTarget.style.borderColor = `rgba(239,68,68,0.6)`; e.currentTarget.style.color = RED; } }}
                    onMouseLeave={e => { if (!audioPlaying) { e.currentTarget.style.background = `${RED}08`; e.currentTarget.style.borderColor = `rgba(239,68,68,0.35)`; e.currentTarget.style.color = 'rgba(239,68,68,0.7)'; } }}
                  >
                    <Volume2 size={14} />
                    <span>{audioPlaying ? 'Playing Nepali Broadcast…' : 'Play Nepali Warning Audio'}</span>
                    {audioPlaying
                      ? <Square size={11} style={{ marginLeft: 'auto' }} fill="currentColor" />
                      : <Play   size={11} style={{ marginLeft: 'auto' }} />
                    }
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Primary Action Button ───────────────────────────────── */}
      <div style={{ padding: '1rem', borderTop: `1px solid ${BORDER}`, background: BG, flexShrink: 0 }}>
        <button
          onClick={handleRunAnalysis}
          disabled={isLoading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            width: '100%', borderRadius: '9999px', border: 'none',
            fontWeight: 800, fontSize: '0.8125rem', letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '1rem',
            fontFamily: 'Inter, monospace',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            background: isLoading
              ? 'rgba(255,255,255,0.08)'
              : isCritical
              ? `linear-gradient(135deg, ${RED} 0%, #b91c1c 100%)`
              : 'linear-gradient(135deg, #FFFFFF 0%, #e5e5e5 100%)',
            color: isLoading ? T_DIM : isCritical ? '#fff' : '#000',
            transform: 'scale(1)',
            transition: 'all 0.2s ease',
            boxShadow: isCritical && !isLoading ? `0 0 32px ${RED}40` : 'none',
          }}
          onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.025)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {isLoading ? (
            <>
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite', color: T_SEC }} />
              <span>Analyzing Satellite Data…</span>
            </>
          ) : isCritical ? (
            <>
              <AlertTriangle size={15} />
              <span>Re-Run Analysis</span>
            </>
          ) : (
            <>
              <Zap size={15} />
              <span>Run Analysis</span>
            </>
          )}
        </button>
        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.6rem', color: T_DIM, letterSpacing: '0.08em', fontFamily: 'Inter, monospace' }}>
          {isLoading ? 'Running local XGBoost + LangGraph simulation…' : isCritical ? 'Analysis complete · Deterministic fallback active' : 'Ready · Offline capable · No internet required'}
        </div>
      </div>
    </aside>
  );
}