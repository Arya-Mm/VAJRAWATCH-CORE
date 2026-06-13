import { useState } from 'react';
import '../styles/fonts.css';
import '../styles/theme.css';

interface AnalysisMapProps {
  onBack: () => void;
  onEnterDashboard: () => void;
}

// ── Design tokens ──────────────────────────────────────────────────────────
const BG      = '#050505';
const GLASS   = 'rgba(0,0,0,0.7)';
const BORDER  = 'rgba(255,255,255,0.08)';
const T_SEC   = '#6F6F6F';
const T_PRI   = '#FFFFFF';

// ── Topographic map background ─────────────────────────────────────────────
function MapBackground({ isCritical }: { isCritical: boolean }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#07090f',
      overflow: 'hidden',
    }}>
      <svg
        viewBox="0 0 1400 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {/* Topographic contour lines covering the full canvas */}
        {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map((i) => (
          <path key={i}
            d={`M${-100 + i * 30},900 C${250 + i * 35},${600 - i * 30} ${500 + i * 25},${400 - i * 22} ${700},${300 - i * 16} S${1000 + i * 20},${250 - i * 12} ${1550},${900}`}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            fill="none"
          />
        ))}

        {/* Longitude/latitude grid */}
        {[200,400,600,800,1000,1200].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="900" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
        ))}
        {[150,300,450,600,750].map(y => (
          <line key={y} x1="0" y1={y} x2="1400" y2={y} stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
        ))}

        {/* River path from lake downstream */}
        <path
          d="M700,280 C695,340 688,420 680,500 C672,580 675,660 680,750 C683,800 686,860 690,900"
          stroke={isCritical ? '#EF4444' : 'rgba(255,255,255,0.15)'}
          strokeWidth="2"
          strokeDasharray="6 5"
          opacity="0.7"
        />

        {/* Lake polygon — centered */}
        <polygon
          points="665,255 695,245 720,252 728,268 712,280 688,282 665,272"
          fill={isCritical ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}
          stroke={isCritical ? '#EF4444' : 'rgba(255,255,255,0.2)'}
          strokeWidth="1.5"
        />
        {/* Lake label */}
        <text x="696" y="242" fill={isCritical ? '#EF4444' : 'rgba(255,255,255,0.3)'}
          fontSize="8" fontFamily="Inter,monospace" textAnchor="middle" letterSpacing="1">
          THULAGI LAKE
        </text>

        {/* Impact zone downstream */}
        {isCritical && (
          <polygon
            points="658,600 742,600 748,700 700,720 652,700"
            fill="rgba(239,68,68,0.07)"
            stroke="#EF4444"
            strokeWidth="1"
            strokeDasharray="5 4"
            opacity="0.6"
          />
        )}

        {/* Other lake dots (distant) */}
        {[
          { x: 300, y: 200, label: 'IMJA TSHO' },
          { x: 1050, y: 170, label: 'LOWER BARUN' },
          { x: 180, y: 420, label: 'SABAI TSHO' },
          { x: 1200, y: 380, label: 'TSHO ROLPA' },
        ].map(({ x, y, label }) => (
          <g key={label}>
            <circle cx={x} cy={y} r="5" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <text x={x} y={y - 10} fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="Inter,monospace" textAnchor="middle" letterSpacing="0.5">
              {label}
            </text>
          </g>
        ))}
      </svg>

      {/* Subtle vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.7) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Scan line */}
      <div className="scan-overlay" />
    </div>
  );
}

// ── Toggle Pill ─────────────────────────────────────────────────────────────
function ModePill({ mode, onChange }: { mode: 'public' | 'industry'; onChange: (m: 'public' | 'industry') => void }) {
  return (
    <div style={{
      display: 'inline-flex',
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${BORDER}`,
      borderRadius: '9999px',
      padding: '0.3rem',
      gap: '0.15rem',
    }}>
      {(['public', 'industry'] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            style={{
              padding: '0.45rem 1.5rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: active ? 600 : 400,
              fontFamily: 'Inter, sans-serif',
              background: active ? T_PRI : 'transparent',
              color: active ? '#050505' : T_SEC,
              transition: 'all 0.25s ease',
              letterSpacing: '0.01em',
            }}
          >
            {m === 'public' ? 'Public Analysis' : 'Industry Grade'}
          </button>
        );
      })}
    </div>
  );
}

// ── Glassmorphic Risk Panel ──────────────────────────────────────────────────
function RiskPanel({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const [audioPlayed, setAudioPlayed] = useState(false);

  const drivers = [
    { label: 'Precipitation Anomaly', val: '+1.4×', detail: '210mm / 7d' },
    { label: 'Ice Area Expansion',    val: '+18.5%', detail: 'NDWI delta' },
  ];

  const impact = [
    { label: 'Population',  val: '12,480', sub: 'downstream' },
    { label: 'Hydropower',  val: '186 MW', sub: 'Besisahar' },
  ];

  return (
    <div
      className="glass-panel"
      style={{
        width: '340px',
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.14em', color: T_SEC, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Thulagi Lake Risk Status
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>
            PDGL_THULAGI_01 · Nepal
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="live-dot" />
          <span style={{ fontSize: '0.6rem', color: '#EF4444', fontWeight: 700, letterSpacing: '0.1em' }}>LIVE</span>
        </div>
      </div>

      {/* ── CHUNK 1: Hero metric — Von Restorff ────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
          <div
            className="animate-risk-rise"
            style={{ fontSize: '5.5rem', fontWeight: 800, color: '#EF4444', letterSpacing: '-0.05em', lineHeight: 1 }}
          >
            84
          </div>
          <div style={{ paddingBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.15rem' }}>/100</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#EF4444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ● CRITICAL
            </div>
          </div>
        </div>
        <div style={{ marginTop: '0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'rgba(239,68,68,0.8)' }}>
            ⚠ GLOF risk exceeds RED threshold. Immediate response recommended.
          </span>
        </div>
      </div>

      {/* ── CHUNK 2: Drivers ──────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '1.25rem' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.14em', color: T_SEC, textTransform: 'uppercase', marginBottom: '0.875rem' }}>
          Drivers
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {drivers.map(({ label, val, detail }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: T_PRI }}>{label}</div>
                <div style={{ fontSize: '0.675rem', color: T_SEC, marginTop: '0.1rem' }}>{detail}</div>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#EF4444' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CHUNK 3: Downstream Impact ───────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '1.25rem' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.14em', color: T_SEC, textTransform: 'uppercase', marginBottom: '0.875rem' }}>
          Downstream Impact
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          {impact.map(({ label, val, sub }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: '0.5rem', padding: '0.75rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: T_PRI, letterSpacing: '-0.02em' }}>{val}</div>
              <div style={{ fontSize: '0.65rem', color: T_SEC, marginTop: '0.15rem' }}>{label}</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.1rem' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {/* Audio warning — minimal design */}
        <button
          onClick={() => setAudioPlayed(true)}
          style={{
            padding: '0.75rem 1rem',
            background: audioPlayed ? 'rgba(255,255,255,0.04)' : 'transparent',
            border: `1px solid ${BORDER}`,
            borderRadius: '0.5rem',
            color: audioPlayed ? T_SEC : T_PRI,
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!audioPlayed) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { if (!audioPlayed) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <span style={{ fontSize: '1rem' }}>{audioPlayed ? '✓' : '▶'}</span>
          {audioPlayed ? 'Audio Played (Nepali Broadcast)' : 'Play Local Audio Warning'}
        </button>

        {/* Enterprise CTA */}
        <button
          onClick={onEnterDashboard}
          style={{
            padding: '0.875rem 1rem',
            background: T_PRI,
            border: 'none',
            borderRadius: '0.5rem',
            color: '#050505',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'opacity 0.2s',
            minHeight: '44px',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          Open Command Center →
        </button>
      </div>
    </div>
  );
}

// ── Industry locked panel ────────────────────────────────────────────────────
function LockedPanel() {
  return (
    <div
      className="glass-panel"
      style={{
        width: '340px',
        padding: '3rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ fontSize: '2rem', opacity: 0.25 }}>⬡</div>
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Awaiting Enterprise Authentication…
      </div>
      <div style={{ width: '40px', height: '1px', background: BORDER }} />
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
        Hydropower operators and government agencies receive<br />
        full LangGraph agent traces, SHAP explainability,<br />
        and audio-graded alert packages.
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AnalysisMap({ onBack, onEnterDashboard }: AnalysisMapProps) {
  const [mode, setMode] = useState<'public' | 'industry'>('public');

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: BG, fontFamily: 'Inter, sans-serif' }}>

      {/* ── MAP BACKGROUND ─────────────────────────────────────────────── */}
      <MapBackground isCritical={mode === 'public'} />

      {/* ── TOP NAVIGATION BAR ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: GLASS, backdropFilter: 'blur(16px)',
            border: `1px solid ${BORDER}`, borderRadius: '0.5rem',
            padding: '0.5rem 1rem', fontSize: '0.8rem', color: T_SEC,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T_PRI; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T_SEC; }}
        >
          ← VajraWatch
        </button>

        {/* Center toggle — PUBLIC / INDUSTRY */}
        <ModePill mode={mode} onChange={setMode} />

        {/* Right: coordinates HUD */}
        <div style={{
          background: GLASS, backdropFilter: 'blur(16px)',
          border: `1px solid ${BORDER}`, borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.675rem', color: T_SEC, fontFamily: 'Inter, monospace',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          28.538°N · 84.393°E · 3,144 m ASL
        </div>
      </div>

      {/* ── BOTTOM-LEFT FLOATING PANEL ──────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: '2rem', left: '1.75rem', zIndex: 30,
      }}>
        {mode === 'public'
          ? <RiskPanel onEnterDashboard={onEnterDashboard} />
          : <LockedPanel />
        }
      </div>

      {/* ── BOTTOM-RIGHT: scale + attribution ───────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: '2rem', right: '1.75rem', zIndex: 30,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem',
      }}>
        {/* Scale bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, monospace' }}>0</span>
          <div style={{ width: '60px', height: '2px', background: 'rgba(255,255,255,0.15)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-3px', left: 0, width: '1px', height: '8px', background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ position: 'absolute', top: '-3px', right: 0, width: '1px', height: '8px', background: 'rgba(255,255,255,0.2)' }} />
          </div>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, monospace' }}>5 km</span>
        </div>
        {/* Attribution */}
        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.12)', fontFamily: 'Inter, monospace', letterSpacing: '0.04em' }}>
          VajraWatch · DeerHack 2026 · Sentinel-2 Composite
        </div>
      </div>
    </div>
  );
}
