import { useEffect, useRef } from 'react';
import '../styles/fonts.css';
import '../styles/theme.css';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4';

interface HeroProps {
  onEnterDashboard: () => void;
}

// ─── Shared token constants ─────────────────────────────────────────────────
const BG       = '#050505';
const TEXT_PRI = '#FFFFFF';
const TEXT_SEC = '#6F6F6F';
const BORDER   = 'rgba(255,255,255,0.07)';

// ─── Terrain SVG – map visual ───────────────────────────────────────────────
function TerrainViz() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '4/3',
      background: '#080808',
      border: `1px solid ${BORDER}`,
      borderRadius: '0.75rem',
      overflow: 'hidden',
    }}>
      <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>

        {/* Topographic contour lines */}
        {[0,1,2,3,4,5,6,7,8].map((i) => (
          <path key={i}
            d={`M${-30 + i*12},360 C${80 + i*18},${220 - i*14} ${200 + i*10},${130 - i*12} ${240},${100 - i*9} S${380 + i*10},${90 - i*6} ${520},${360}`}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            fill="none"
          />
        ))}

        {/* River / outflow path */}
        <path d="M238,108 C236,140 232,175 228,210 C224,245 226,275 230,360"
          stroke="#EF4444"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          opacity="0.6"
        />

        {/* Lake polygon – filled red for critical state */}
        <polygon
          points="215,95 238,88 258,92 265,104 250,115 228,113 213,105"
          fill="rgba(239,68,68,0.22)"
          stroke="#EF4444"
          strokeWidth="1.5"
        />

        {/* Impact boundary – dashed red zone downstream */}
        <polygon
          points="198,235 264,235 272,300 240,315 208,300"
          fill="rgba(239,68,68,0.06)"
          stroke="#EF4444"
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.75"
        />

        {/* Grid overlay – subtle */}
        {[60,120,180,240,300,360,420].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="360" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
        ))}
        {[60,120,180,240,300].map(y => (
          <line key={y} x1="0" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Scan line overlay */}
      <div className="scan-overlay" />

      {/* HUD – coordinate tag */}
      <div style={{
        position: 'absolute', top: '0.75rem', left: '0.75rem',
        display: 'flex', flexDirection: 'column', gap: '0.3rem',
      }}>
        <div style={{
          fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
          background: 'rgba(0,0,0,0.6)', border: `1px solid ${BORDER}`,
          borderRadius: '4px', padding: '0.2rem 0.5rem',
          fontFamily: 'Inter, monospace',
        }}>
          PDGL_THULAGI_01 · 28.538°N 84.393°E
        </div>
        <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Inter, monospace' }}>
          SENTINEL-2 · SAR COMPOSITE
        </div>
      </div>

      {/* HUD – risk score */}
      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', textAlign: 'right' }}>
        <div style={{ fontSize: '0.55rem', color: TEXT_SEC, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Inter, monospace', marginBottom: '0.1rem' }}>
          RISK INDEX
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#EF4444', letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>
          84
        </div>
        <div style={{ fontSize: '0.55rem', color: '#EF4444', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'Inter, monospace' }}>
          ● CRITICAL
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.75)', borderTop: `1px solid ${BORDER}`,
        padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, monospace' }}>
          VajraWatch · Live Terrain Analysis
        </span>
        <span style={{ fontSize: '0.6rem', color: '#EF4444', fontWeight: 600, letterSpacing: '0.08em', fontFamily: 'Inter, monospace' }}>
          124,800 DOWNSTREAM · 186 MW
        </span>
      </div>
    </div>
  );
}

// ─── Pipeline step card ─────────────────────────────────────────────────────
function PipelineStep({ num, title, desc, isAlert }: { num: string; title: string; desc: string; isAlert?: boolean }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{
        height: '1px',
        background: isAlert ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)',
        marginBottom: '1.25rem',
      }} />
      <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.16em', color: isAlert ? '#EF4444' : TEXT_SEC, fontFamily: 'Inter, monospace', marginBottom: '0.75rem' }}>
        {num}
      </div>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: TEXT_PRI, letterSpacing: '-0.01em', marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>
        {title}
      </div>
      <div style={{ fontSize: '0.78rem', color: TEXT_SEC, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
        {desc}
      </div>
    </div>
  );
}

// ─── MAIN HERO COMPONENT ────────────────────────────────────────────────────
export default function Hero({ onEnterDashboard }: HeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef   = useRef<number>(0);

  // Custom video fade loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.style.opacity = '0';
    video.style.transition = 'opacity 0.5s ease';

    const onCanPlay = () => { video.play().catch(() => {}); };
    const onPlay    = () => { video.style.opacity = '1'; };
    const onEnded   = () => {
      video.style.opacity = '0';
      setTimeout(() => { video.currentTime = 0; video.play().catch(() => {}); }, 100);
    };

    const tick = () => {
      if (video.duration && !video.paused) {
        const t = video.currentTime, d = video.duration, rem = d - t;
        if (rem < 0.5 && rem > 0)  video.style.opacity = String(Math.max(0, rem / 0.5));
        else if (t < 0.5)           video.style.opacity = String(Math.min(1, t / 0.5));
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    video.addEventListener('canplay',  onCanPlay);
    video.addEventListener('play',     onPlay);
    video.addEventListener('ended',    onEnded);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener('canplay',  onCanPlay);
      video.removeEventListener('play',     onPlay);
      video.removeEventListener('ended',    onEnded);
    };
  }, []);

  const maxW: React.CSSProperties = {
    maxWidth: '75rem', margin: '0 auto', padding: '0 3rem', width: '100%', boxSizing: 'border-box' as const,
  };

  return (
    <div className="landing-scroll" style={{
      background: BG,
      color: TEXT_PRI,
      fontFamily: 'Inter, -apple-system, sans-serif',
      overflowX: 'hidden',
      overflowY: 'auto',
      width: '100%',
      height: '100%',
    }}>

      {/* ── FIXED VIDEO BACKGROUND ─────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted playsInline preload="auto"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0 }}
        />
        {/* Top-to-bottom gradient: solid black → transparent → solid black */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, ${BG} 0%, rgba(5,5,5,0.45) 30%, rgba(5,5,5,0.6) 70%, ${BG} 100%)`,
        }} />
      </div>

      {/* ── ALL PAGE CONTENT ───────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* ╔══ NAVIGATION ══════════════════════════════════════════════╗ */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(5,5,5,0.75)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{ ...maxW, padding: '1.25rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

            {/* Logo — Instrument Serif, not red */}
            <span className="font-serif-display" style={{ fontSize: '1.6rem', color: TEXT_PRI, letterSpacing: '-0.02em' }}>
              VajraWatch
            </span>

            {/* Nav — Hick's Law: exactly 4 items */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.25rem' }}>
            {[
                { label: 'The Threat', href: '#threat' },
                { label: 'The Science', href: '#science' },
                { label: 'Live Map', onClick: onEnterDashboard },
              ].map(({ label, href, onClick }) => (
                <a
                  key={label}
                  href={href ?? '#'}
                  onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : (e) => {
                    e.preventDefault();
                    const el = document.querySelector(href ?? '');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{ fontSize: '0.875rem', color: TEXT_SEC, textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s', fontFamily: 'Inter, sans-serif' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = TEXT_PRI; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_SEC; }}
                >
                  {label}
                </a>
              ))}

              {/* Dashboard button — intentionally inert until backend auth is wired */}
              <button
                disabled
                style={{
                  background: 'transparent', color: 'rgba(255,255,255,0.2)', border: `1px solid rgba(255,255,255,0.05)`,
                  borderRadius: '0.375rem', padding: '0.5rem 1.25rem', fontSize: '0.8125rem',
                  fontWeight: 500, cursor: 'not-allowed', fontFamily: 'Inter, sans-serif',
                }}
              >
                Dashboard
              </button>
            </div>
          </div>
        </nav>

        {/* ╔══ HERO SECTION ════════════════════════════════════════════╗ */}
        <section style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', padding: '5rem 0 4rem' }}>
          <div style={{ ...maxW, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center' }}>

            {/* ─ Left: Copy ─ */}
            <div>
              {/* Live eyebrow */}
              <div className="animate-fade-rise" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.25rem' }}>
                <span className="live-dot" />
                <span style={{ fontSize: '0.675rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: TEXT_SEC, fontFamily: 'Inter, monospace' }}>
                  21 PDGLs Monitored · Nepal Himalayas
                </span>
              </div>

              {/* Headline — Instrument Serif */}
              <h1
                className="animate-fade-rise-d1 font-serif-display"
                style={{
                  fontSize: 'clamp(3rem, 5.5vw, 5rem)',
                  lineHeight: 0.95,
                  letterSpacing: '-2px',
                  color: TEXT_PRI,
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                21 Lakes.
                <br />36 Hours.
                <br /><span style={{ color: '#EF4444' }}>One Warning.</span>
              </h1>

              {/* Subheadline anchored in a real event */}
              <p
                className="animate-fade-rise-d2"
                style={{
                  fontSize: '1rem', color: TEXT_SEC, lineHeight: 1.75,
                  marginTop: '2rem', maxWidth: '30rem',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Beyond the ice, we predict the flood. VajraWatch fuses satellite optics and XGBoost to give downstream communities the ultimate advantage:{' '}
                <em style={{ color: 'rgba(255,255,255,0.55)', fontStyle: 'normal' }}>time.</em>
              </p>

              <p className="animate-fade-rise-d2" style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                Bhote Koshi 2025: 4 hydropower plants destroyed. 8% of Nepal's grid wiped. 36 hours of warning would have changed everything.
              </p>

              {/* CTA — single primary action, Fitts's Law */}
              <div className="animate-fade-rise-d3" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
                <button
                  onClick={onEnterDashboard}
                  style={{
                    padding: '1.1rem 3rem',
                    fontSize: '0.9375rem', fontWeight: 500,
                    background: '#FFFFFF', color: '#050505',
                    border: 'none', borderRadius: '9999px',
                    cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                    minHeight: '52px', fontFamily: 'Inter, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={e => { const b = e.currentTarget; b.style.transform = 'scale(1.04)'; b.style.boxShadow = '0 8px 40px rgba(255,255,255,0.15)'; }}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.transform = 'scale(1)'; b.style.boxShadow = 'none'; }}
                >
                  Enter Live Map
                </button>
              </div>
            </div>

            {/* ─ Right: Terrain viz ─ */}
            <div className="animate-fade-rise-d3">
              <TerrainViz />
              {/* Caption */}
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.75rem', textAlign: 'center', fontFamily: 'Inter, monospace', letterSpacing: '0.05em' }}>
                Thulagi Lake, Gandaki, Nepal · Risk Score 84/100 · CRITICAL
              </p>
            </div>
          </div>
        </section>

        {/* ╔══ THE THREAT ══════════════════════════════════════════════╗ */}
        <section id="threat" style={{ padding: '8rem 0' }}>
          <div style={maxW}>
            <div className="section-divider" style={{ marginBottom: '5rem' }} />

            <div style={{ marginBottom: '4rem' }}>
              <span style={{ fontSize: '0.675rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: TEXT_SEC, fontFamily: 'Inter, monospace' }}>
                The Cost of No Warning
              </span>
              <h2 className="font-serif-display" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', fontWeight: 400, letterSpacing: '-1.5px', color: TEXT_PRI, margin: '1rem 0 0', lineHeight: 1.1 }}>
                Three events. Billions in damages. Zero warning.
              </h2>
            </div>

            {/* Stat blocks — numbers only, no prose */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: BORDER }}>
              {[
                { stat: '55', unit: 'deaths', event: 'South Lonak, Sikkim', year: '2023', sub: '$120M in damage', dominant: false },
                { stat: '$200M+', unit: 'economic loss', event: 'Bhote Koshi GLOF', year: 'Jul 2025', sub: '4 plants · 8% of Nepal\'s grid', dominant: true },
                { stat: '1', unit: 'village destroyed', event: 'Thame, Khumbu', year: 'Aug 2024', sub: 'Entire community displaced', dominant: false },
              ].map(({ stat, unit, event, year, sub, dominant }) => (
                <div key={event} style={{
                  background: dominant ? 'rgba(239,68,68,0.1)' : 'rgba(5,5,5,0.4)',
                  backdropFilter: 'blur(12px)',
                  padding: '3rem 2.5rem',
                  borderLeft: dominant ? '1px solid rgba(239,68,68,0.25)' : 'none',
                  borderRight: dominant ? '1px solid rgba(239,68,68,0.25)' : 'none',
                }}>
                  {/* Von Restorff — dominant is 5xl, others 3xl */}
                  <div style={{ fontSize: dominant ? '5rem' : '3.5rem', fontWeight: 800, letterSpacing: '-0.05em', color: '#EF4444', lineHeight: 1, marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>
                    {stat}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
                    {unit}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: TEXT_PRI, fontWeight: 600, marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif' }}>
                    {event}
                  </div>
                  <div style={{ fontSize: '0.675rem', color: TEXT_SEC, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Inter, monospace', marginBottom: '0.5rem' }}>
                    {year}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.4, fontFamily: 'Inter, sans-serif' }}>
                    {sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Credibility line */}
            <p style={{ marginTop: '2rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
              Aligned with the{' '}
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>$36.1M UNDP Green Climate Fund grant</span>
              {' '}for Nepal's Department of Hydrology and Meteorology.
            </p>
          </div>
        </section>

        {/* ╔══ THE SCIENCE ═════════════════════════════════════════════╗ */}
        <section id="science" style={{ padding: '8rem 0' }}>
          <div style={maxW}>
            <div className="section-divider" style={{ marginBottom: '5rem' }} />

            <div style={{ marginBottom: '4rem' }}>
              <span style={{ fontSize: '0.675rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: TEXT_SEC, fontFamily: 'Inter, monospace' }}>
                Technical Architecture
              </span>
              <h2 className="font-serif-display" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', fontWeight: 400, letterSpacing: '-1.5px', color: TEXT_PRI, margin: '1rem 0 0', lineHeight: 1.1 }}>
                Satellite to alert.<br />Under 10 minutes.
              </h2>
            </div>

            {/* 4-step horizontal pipeline */}
            <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>
              <PipelineStep
                num="01"
                title="Sentinel Analysis"
                desc="Optical + SAR satellite data detects lake area expansion and ice movement anomalies via NDWI delta."
              />
              <div style={{ width: '1px', background: BORDER, height: '100px', alignSelf: 'center', flexShrink: 0, marginBottom: '2rem' }} />
              <PipelineStep
                num="02"
                title="Environmental Cross-Check"
                desc="7-day precipitation and seismic event data validate the satellite signal against atmospheric baselines."
              />
              <div style={{ width: '1px', background: BORDER, height: '100px', alignSelf: 'center', flexShrink: 0, marginBottom: '2rem' }} />
              <PipelineStep
                num="03"
                title="XGBoost Risk Score"
                desc="8-feature deterministic model outputs a 0–100 risk index in under 10 milliseconds with 87% precision."
                isAlert
              />
              <div style={{ width: '1px', background: 'rgba(239,68,68,0.2)', height: '100px', alignSelf: 'center', flexShrink: 0, marginBottom: '2rem' }} />
              <PipelineStep
                num="04"
                title="Nepali Audio Alert"
                desc="ElevenLabs multilingual TTS generates a local-language broadcast for downstream communities within the 36-hour window."
                isAlert
              />
            </div>

            {/* Precision numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: BORDER, marginTop: '5rem' }}>
              {[
                { val: '87%', label: 'model precision', dominant: false },
                { val: '$50–200M', label: 'prevented per plant', dominant: true },
                { val: '36h', label: 'advance warning window', dominant: false },
              ].map(({ val, label, dominant }) => (
                <div key={label} style={{ background: 'rgba(5,5,5,0.4)', backdropFilter: 'blur(12px)', padding: '2.5rem 2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: dominant ? '3.5rem' : '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: dominant ? TEXT_PRI : 'rgba(255,255,255,0.55)', lineHeight: 1, marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>
                    {val}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: TEXT_SEC, fontFamily: 'Inter, sans-serif' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ╔══ DEMO BRIDGE ═════════════════════════════════════════════╗ */}
        <section style={{ padding: '8rem 0' }}>
          <div style={{ ...maxW, textAlign: 'center' }}>
            <div className="section-divider" style={{ marginBottom: '5rem' }} />

            <span style={{ fontSize: '0.675rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: TEXT_SEC, fontFamily: 'Inter, monospace' }}>
              See the System
            </span>
            <h2 className="font-serif-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 400, letterSpacing: '-2px', color: TEXT_PRI, margin: '1.5rem 0 2rem', lineHeight: 1 }}>
              See a GLOF risk alert happen<br />in real time.
            </h2>
            <p style={{ fontSize: '1rem', color: TEXT_SEC, maxWidth: '36rem', margin: '0 auto 3.5rem', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
              The Map Analysis pulls live satellite anomaly data, runs the multi-agent pipeline, and outputs a risk score with a Nepali audio alert — within 36 hours of the triggering event.
            </p>

            {/* Big CTA — Fitts's Law */}
            <button
              onClick={onEnterDashboard}
              style={{
                padding: '1.25rem 4rem', fontSize: '1rem', fontWeight: 500,
                background: '#FFFFFF', color: '#050505',
                border: 'none', borderRadius: '9999px',
                cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                minHeight: '58px', fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.transform = 'scale(1.04)'; b.style.boxShadow = '0 12px 50px rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.transform = 'scale(1)'; b.style.boxShadow = 'none'; }}
            >
              Enter Live Map
            </button>

            <div style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, sans-serif' }}>
              21 PDGLs monitored · DeerHack 2026
            </div>
          </div>
        </section>

        {/* ╔══ FOOTER ══════════════════════════════════════════════════╗ */}
        <footer style={{ padding: '2.5rem 0', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ ...maxW, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="font-serif-display" style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.2)' }}>VajraWatch</span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.15)', fontFamily: 'Inter, sans-serif' }}>DeerHack 2026 · Built for the Himalayas</span>
            <button
              onClick={onEnterDashboard}
              style={{ fontSize: '0.75rem', color: TEXT_SEC, background: 'none', border: `1px solid ${BORDER}`, borderRadius: '0.375rem', padding: '0.4rem 0.875rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = TEXT_PRI; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_SEC; }}
            >
              Map Analysis →
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
