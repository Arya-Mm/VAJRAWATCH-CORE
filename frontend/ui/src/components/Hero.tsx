/**
 * VAJRAWATCH V4 — LANDING PAGE (Hero.tsx)
 * Cinematic dark-mode landing. Sections:
 *   1. Hero      — Full-screen with animated terrain radar + data HUD
 *   2. Incident  — Three GLOF events as stat cards (Von Restorff)
 *   3. Science   — 4-step pipeline with animated connectors
 *   4. Metrics   — Three "why buy" numbers
 *   5. Demo CTA  — Final push into the dashboard
 *   6. Footer
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/fonts.css';
import '../styles/theme.css';
import '../styles/landing.css';

// ─── Constants ───────────────────────────────────────────────
const BG        = '#030303';
const TEXT_PRI  = '#FFFFFF';
const TEXT_SEC  = '#6F6F6F';
const BORDER    = 'rgba(255,255,255,0.06)';
const RED       = '#EF4444';

interface HeroProps {
  onEnterDashboard: () => void;
}

// ─── Spotlight Reveal Layer ──────────────────────────────
function SpotlightLayer({ children }: { children: React.ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const target = useRef({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 });
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    
    const handleMouseMove = (e: MouseEvent) => { 
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        target.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      } else {
        target.current = { x: e.clientX, y: e.clientY }; 
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    const update = () => {
      setPos(p => ({
        x: p.x + (target.current.x - p.x) * 0.15,
        y: p.y + (target.current.y - p.y) * 0.15
      }));
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-10 animate-hero-reveal pointer-events-none"
      style={{
        WebkitMaskImage: `radial-gradient(circle 450px at ${pos.x}px ${pos.y}px, black 30%, transparent 80%)`,
        maskImage: `radial-gradient(circle 450px at ${pos.x}px ${pos.y}px, black 30%, transparent 80%)`
      }}
    >
      {children}
    </div>
  );
}

// ─── Radar / Terrain Visualizer ──────────────────────────────
function RadarViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;
    const W = 480, H = 480;
    canvas.width  = W;
    canvas.height = H;

    // Lake anchor point (Thulagi position on canvas)
    const lx = 240, ly = 200;

    // Static topographic contour rings
    const rings: { cx: number; cy: number; r: number; a: number }[] = Array.from({ length: 10 }, (_, i) => ({
      cx: lx + (Math.random() - 0.5) * 20,
      cy: ly + (Math.random() - 0.5) * 20,
      r: 20 + i * 22,
      a: 0.03 + i * 0.003,
    }));

    // Particles flowing downstream
    const particles: { x: number; y: number; speed: number; life: number; max: number }[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: lx + (Math.random() - 0.5) * 20,
        y: ly + Math.random() * 10,
        speed: 0.3 + Math.random() * 0.6,
        life: Math.random() * 200,
        max: 120 + Math.random() * 80,
      });
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Background subtle gradient
      const bg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 260);
      bg.addColorStop(0, 'rgba(239,68,68,0.04)');
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Topo contour lines
      rings.forEach(({ cx, cy, r, a }) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Radar sweep
      const sweepAngle = (t * 0.012) % (Math.PI * 2);
      const sweepGrad = ctx.createConicalGradient
        ? ctx.createConicalGradient(lx, ly, sweepAngle)
        : null;

      // Draw sweep manually
      ctx.save();
      ctx.translate(lx, ly);
      const sweepFan = ctx.createLinearGradient(0, 0, 130 * Math.cos(sweepAngle), 130 * Math.sin(sweepAngle));
      sweepFan.addColorStop(0, 'rgba(239,68,68,0.18)');
      sweepFan.addColorStop(1, 'rgba(239,68,68,0)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 130, sweepAngle - 0.7, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = sweepFan;
      ctx.fill();
      ctx.restore();

      // Radar range rings
      [50, 100, 130].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(lx, ly, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239,68,68,${0.07 - i * 0.02})`;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Cross-hairs
      ctx.beginPath();
      ctx.moveTo(lx - 150, ly); ctx.lineTo(lx + 150, ly);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lx, ly - 150); ctx.lineTo(lx, ly + 150);
      ctx.stroke();

      // Flow path (downstream channel)
      const flowPath = [[lx, ly + 20], [lx + 8, ly + 60], [lx + 4, ly + 100], [lx + 12, ly + 140], [lx + 6, ly + 180], [lx + 14, ly + 230]];
      ctx.beginPath();
      ctx.moveTo(flowPath[0][0], flowPath[0][1]);
      flowPath.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.strokeStyle = `rgba(239,68,68,${0.25 + 0.1 * Math.sin(t * 0.02)})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Downstream impact zone
      ctx.beginPath();
      ctx.moveTo(lx - 30, ly + 185);
      ctx.quadraticCurveTo(lx, ly + 230, lx + 30, ly + 185);
      ctx.lineTo(lx + 50, ly + 260);
      ctx.quadraticCurveTo(lx, ly + 300, lx - 50, ly + 260);
      ctx.closePath();
      ctx.fillStyle = 'rgba(239,68,68,0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239,68,68,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Infrastructure dots in danger zone
      [[lx + 5, ly + 220], [lx - 12, ly + 240], [lx + 18, ly + 255]].forEach(([x, y], i) => {
        const pulse = Math.abs(Math.sin(t * 0.03 + i));
        ctx.beginPath();
        ctx.arc(x, y, 2.5 + pulse * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249,115,22,${0.5 + pulse * 0.4})`;
        ctx.fill();
      });

      // Particles flowing downstream
      particles.forEach((p) => {
        p.life += p.speed;
        if (p.life > p.max) {
          p.life = 0;
          p.x = lx + (Math.random() - 0.5) * 16;
          p.y = ly + 20;
        }
        const progress = p.life / p.max;
        const px = p.x + 12 * progress;
        const py = p.y + p.life;
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239,68,68,${(1 - progress) * 0.55})`;
        ctx.fill();
      });

      // Lake polygon
      const lakePoints = [[lx - 12, ly - 6], [lx, ly - 12], [lx + 14, ly - 8], [lx + 18, ly + 2], [lx + 8, ly + 10], [lx - 6, ly + 8], [lx - 14, ly + 2]];
      ctx.beginPath();
      ctx.moveTo(lakePoints[0][0], lakePoints[0][1]);
      lakePoints.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.closePath();
      const lakeFill = ctx.createRadialGradient(lx, ly, 0, lx, ly, 18);
      lakeFill.addColorStop(0, `rgba(239,68,68,${0.35 + 0.1 * Math.sin(t * 0.025)})`);
      lakeFill.addColorStop(1, 'rgba(239,68,68,0.12)');
      ctx.fillStyle = lakeFill;
      ctx.fill();
      ctx.strokeStyle = RED;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pulsing alert ring around lake
      const ringAlpha = 0.5 - ((t * 0.015) % 1) * 0.5;
      const ringR = 18 + ((t * 0.015) % 1) * 40;
      ctx.beginPath();
      ctx.arc(lx, ly, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239,68,68,${ringAlpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      const ringAlpha2 = 0.5 - (((t * 0.015) + 0.5) % 1) * 0.5;
      const ringR2 = 18 + (((t * 0.015) + 0.5) % 1) * 40;
      ctx.beginPath();
      ctx.arc(lx, ly, ringR2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239,68,68,${ringAlpha2})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Lake center dot
      ctx.beginPath();
      ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = RED;
      ctx.fill();

      t++;
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', maxWidth: '480px', margin: '0 auto' }}>
      {/* Outer glow */}
      <div style={{
        position: 'absolute', inset: '-20px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Canvas */}
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '1/1',
        background: '#0a0a0a',
        border: `1px solid ${BORDER}`,
        borderRadius: '1rem',
        overflow: 'hidden',
      }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {/* HUD Overlays */}
        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div className="vw-hud-tag">PDGL_THULAGI_01 · 28.538°N 84.393°E</div>
          <div className="vw-hud-tag">SENTINEL-2 · SAR COMPOSITE · S1A</div>
        </div>

        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', textAlign: 'right' }}>
          <div style={{ fontSize: '0.55rem', color: TEXT_SEC, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Inter, monospace', marginBottom: '0.1rem' }}>RISK INDEX</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: RED, letterSpacing: '-0.05em', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>84</div>
          <div className="vw-hud-tag-red" style={{ display: 'inline-block', marginTop: '0.25rem' }}>● CRITICAL</div>
        </div>

        {/* Data stream (right side) */}
        <div style={{ position: 'absolute', bottom: '3.5rem', right: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-end' }}>
          {[
            'NDWI Δ +18.5%',
            'SAR −3.2 dB',
            'Precip 210mm/7d',
            'Seismic M3.1',
          ].map((line, i) => (
            <div key={i} className="vw-stream-line" style={{
              fontSize: '0.55rem', color: `rgba(239,68,68,${0.4 + i * 0.1})`,
              fontFamily: 'Inter, monospace', letterSpacing: '0.08em',
              animationDelay: `${i * 0.8}s`,
            }}>{line}</div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.8)', borderTop: `1px solid ${BORDER}`,
          padding: '0.4rem 0.75rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, monospace' }}>
            VajraWatch · Gandaki Province
          </span>
          <span style={{ fontSize: '0.6rem', color: RED, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'Inter, monospace' }}>
            124,800 AT RISK · 186 MW
          </span>
        </div>
      </div>

      {/* Caption */}
      <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.18)', marginTop: '0.75rem', textAlign: 'center', fontFamily: 'Inter, monospace', letterSpacing: '0.06em' }}>
        Thulagi Lake · Gandaki, Nepal · Real-time GLOF Risk Monitor
      </p>
    </div>
  );
}

// ─── Satellite Orbiter (Science Section) ─────────────────────
function SatelliteOrbit() {
  return (
    <div style={{ position: 'relative', width: '200px', height: '200px', flexShrink: 0 }}>
      {/* Earth/Lake center */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '36px', height: '36px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 40%, rgba(239,68,68,0.6), rgba(239,68,68,0.15))',
        border: '1px solid rgba(239,68,68,0.4)',
      }} />

      {/* Orbit rings */}
      {[60, 90, 72].map((r, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: r * 2, height: r * 2,
          marginLeft: -r, marginTop: -r,
          borderRadius: '50%',
          border: `1px solid rgba(255,255,255,${0.04 + i * 0.02})`,
        }} />
      ))}

      {/* Satellites */}
      {[
        { animation: 'vw-satellite-orbit 8s linear infinite', color: '#60A5FA' },
        { animation: 'vw-satellite-orbit-2 12s linear infinite', color: '#34D399' },
        { animation: 'vw-satellite-orbit-3 10s linear infinite', color: '#FBBF24' },
      ].map(({ animation, color }, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          marginTop: -3, marginLeft: -3,
          width: 6, height: 6,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
          animation,
        }} />
      ))}
    </div>
  );
}

// ─── Ticker / Alert Bar ──────────────────────────────────────
function AlertTicker() {
  const items = [
    '● GLOF ALERT — Thulagi Lake · Risk Score 84/100',
    '● SENTINEL-2 PASS — 12 Jun 2026 14:00 UTC',
    '● NDWI Delta +18.5% — Lake expansion confirmed',
    '● XGBoost Engine — 87% precision · 10ms inference',
    '● Downstream impact — 124,800 residents at risk',
    '● Bhote Koshi 2025 — $200M damage · 4 plants destroyed',
    '● ETA flood front — ~4 hours from trigger',
    '● Nepali audio broadcast — Active',
  ];
  const text = items.join('          ');

  return (
    <div style={{
      borderTop: `1px solid ${BORDER}`,
      borderBottom: `1px solid ${BORDER}`,
      background: 'rgba(239,68,68,0.04)',
      overflow: 'hidden',
      padding: '0.6rem 0',
    }}>
      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div className="vw-ticker-track">
          {[text, text].map((t, i) => (
            <span key={i} style={{
              fontSize: '0.625rem', fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(239,68,68,0.65)', fontFamily: 'Inter, monospace',
              paddingRight: '4rem',
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline Step ───────────────────────────────────────────
function PipelineStep({ num, title, desc, isAlert, isLast }: {
  num: string; title: string; desc: string; isAlert?: boolean; isLast?: boolean;
}) {
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      {/* Top border accent */}
      <div style={{
        height: '2px',
        background: isAlert
          ? `linear-gradient(to right, ${RED}, transparent)`
          : 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)',
        marginBottom: '1.5rem',
      }} />

      {/* Step number */}
      <div style={{
        width: '28px', height: '28px',
        borderRadius: '4px',
        background: isAlert ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isAlert ? 'rgba(239,68,68,0.3)' : BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1rem',
      }}>
        <span style={{
          fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em',
          color: isAlert ? RED : 'rgba(255,255,255,0.35)',
          fontFamily: 'Inter, monospace',
        }}>{num}</span>
      </div>

      <div style={{
        fontSize: '0.9375rem', fontWeight: 600, color: TEXT_PRI,
        letterSpacing: '-0.015em', marginBottom: '0.6rem',
        fontFamily: 'Inter, sans-serif',
      }}>{title}</div>

      <div style={{
        fontSize: '0.78rem', color: TEXT_SEC, lineHeight: 1.65,
        fontFamily: 'Inter, sans-serif',
      }}>{desc}</div>

      {/* Connector arrow (not on last) */}
      {!isLast && (
        <div style={{
          position: 'absolute', right: '-1.25rem', top: '2.5rem',
          color: isAlert ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)',
          fontSize: '1rem', fontFamily: 'monospace',
          zIndex: 2,
        }}>→</div>
      )}
    </div>
  );
}

// ─── Incident Card ───────────────────────────────────────────
function IncidentCard({ stat, unit, event, year, sub, dominant, delay }: {
  stat: string; unit: string; event: string; year: string; sub: string;
  dominant?: boolean; delay: number;
}) {
  return (
    <div
      className="vw-lift vw-fade-up"
      style={{
        background: dominant ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${dominant ? 'rgba(239,68,68,0.25)' : BORDER}`,
        borderRadius: '1rem',
        padding: '2.5rem 2rem',
        animationDelay: `${delay}s`,
        cursor: 'default',
      }}
    >
      <div style={{
        fontSize: dominant ? '4.5rem' : '3rem',
        fontWeight: 900, letterSpacing: '-0.05em',
        color: RED, lineHeight: 1, marginBottom: '0.4rem',
        fontFamily: 'Inter, sans-serif',
      }}>{stat}</div>

      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
        {unit}
      </div>

      <div style={{ height: '1px', background: dominant ? 'rgba(239,68,68,0.2)' : BORDER, marginBottom: '1.25rem' }} />

      <div style={{ fontSize: '0.875rem', color: TEXT_PRI, fontWeight: 600, marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif' }}>
        {event}
      </div>
      <div style={{ fontSize: '0.65rem', color: TEXT_SEC, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Inter, monospace', marginBottom: '0.75rem' }}>
        {year}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
        {sub}
      </div>
    </div>
  );
}

// ─── Agent Flow Diagram ──────────────────────────────────────
function AgentFlowDiagram() {
  const [activeNode, setActiveNode] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode(n => (n + 1) % 5);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const agents = [
    { name: 'Sentinel', sub: 'Optical / SAR', color: '#60A5FA' },
    { name: 'Environ.', sub: 'Weather / Seismic', color: '#34D399' },
    { name: 'Risk Eng.', sub: 'XGBoost Math', color: RED },
    { name: 'Skeptic', sub: 'False Positive Guard', color: '#FBBF24' },
    { name: 'Broadcast', sub: 'Nepali Alert', color: '#F97316' },
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0',
      padding: '2rem',
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${BORDER}`,
      borderRadius: '1rem',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {agents.map((agent, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {/* Node */}
          <div style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.3s ease',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: activeNode === i ? `${agent.color}22` : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${activeNode === i ? agent.color : 'rgba(255,255,255,0.06)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
              boxShadow: activeNode === i ? `0 0 20px ${agent.color}40` : 'none',
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: activeNode === i ? agent.color : 'rgba(255,255,255,0.15)',
                transition: 'all 0.4s ease',
              }} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '0.6875rem', fontWeight: 700,
                color: activeNode === i ? TEXT_PRI : 'rgba(255,255,255,0.35)',
                letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif',
                transition: 'color 0.3s ease',
              }}>{agent.name}</div>
              <div style={{
                fontSize: '0.525rem', color: 'rgba(255,255,255,0.2)',
                fontFamily: 'Inter, monospace', letterSpacing: '0.05em',
                marginTop: '0.15rem',
              }}>{agent.sub}</div>
            </div>
          </div>

          {/* Connector */}
          {i < agents.length - 1 && (
            <div style={{ width: '24px', flexShrink: 0, position: 'relative', height: '1px' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                background: activeNode > i
                  ? `linear-gradient(to right, ${agents[i].color}60, ${agents[i + 1].color}60)`
                  : 'rgba(255,255,255,0.06)',
                transition: 'background 0.4s ease',
              }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Feature Bar ─────────────────────────────────────────────
function FeatureBar({ label, value, pct, color, delay }: {
  label: string; value: string; pct: number; color: string; delay: number;
}) {
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilled(pct);
    }, delay * 1000 + 400);
    return () => clearTimeout(timeout);
  }, [pct, delay]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: TEXT_SEC, fontFamily: 'Inter, sans-serif' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: TEXT_PRI, fontFamily: 'Inter, monospace' }}>{value}</span>
      </div>
      <div style={{
        height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${filled}%`,
          background: color,
          borderRadius: '2px',
          transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
        }} />
      </div>
    </div>
  );
}

// ─── Video Background ─────────────────────────────────────────
const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4';

// ─── MAIN HERO ───────────────────────────────────────────────
export default function Hero({ onEnterDashboard }: HeroProps) {

  const maxW: React.CSSProperties = {
    maxWidth: '78rem', margin: '0 auto', padding: '0 2.5rem', width: '100%', boxSizing: 'border-box',
  };

  const handleNavClick = useCallback((href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="vw-landing" style={{ background: BG, color: TEXT_PRI }}>

      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* ── NAVIGATION ─────────────────────────────────────── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(3,3,3,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{ ...maxW, padding: '1.125rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '6px',
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4.09 12.96A1 1 0 005 14.5h6.5L10 22l8.91-10.96A1 1 0 0018 10h-6.5L13 2z"
                    fill={RED} />
                </svg>
              </div>
              <span className="font-serif-display" style={{ fontSize: '1.4rem', color: TEXT_PRI, letterSpacing: '-0.02em' }}>
                VajraWatch
              </span>
            </div>

            {/* Nav links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              {[
                { label: 'The Threat', href: '#threat' },
                { label: 'The Science', href: '#science' },
                { label: 'Architecture', href: '#architecture' },
              ].map(({ label, href }) => (
                <button
                  key={label}
                  onClick={() => handleNavClick(href)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.8125rem', color: TEXT_SEC,
                    fontFamily: 'Inter, sans-serif', letterSpacing: '0',
                    transition: 'color 0.2s', padding: 0,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = TEXT_PRI; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_SEC; }}
                >
                  {label}
                </button>
              ))}

              <button
                onClick={onEnterDashboard}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: TEXT_PRI, color: BG,
                  border: 'none', borderRadius: '9999px',
                  fontSize: '0.8125rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'opacity 0.2s, transform 0.2s',
                  fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.transform = 'scale(1.04)'; b.style.opacity = '0.9'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.transform = 'scale(1)'; b.style.opacity = '1'; }}
              >
                Live Map →
              </button>
            </div>
          </div>
        </nav>

        {/* ── ALERT TICKER ──────────────────────────────────── */}
        <AlertTicker />

        {/* ── NEW SPOTLIGHT HERO SECTION ── */}
        <section className="relative w-full overflow-hidden" style={{ height: '94vh', background: 'transparent' }}>
          
          {/* Base Video */}
          <div className="absolute inset-0 z-0 animate-hero-zoom pointer-events-none">
            <video
              src={VIDEO_URL}
              autoPlay loop muted playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, filter: 'grayscale(100%)' }}
            />
            {/* Noise grain */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
              opacity: 0.4,
            }} />
          </div>

          {/* Reveal Video */}
          <SpotlightLayer>
            <video
              src={VIDEO_URL}
              autoPlay loop muted playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'color-dodge', filter: 'brightness(1.5) saturate(1.5)' }}
            />
          </SpotlightLayer>

          {/* Headline */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center pointer-events-none">
            <div className="animate-hero-fade-up">
              <h1 style={{ fontSize: 'clamp(4rem, 10vw, 9rem)', lineHeight: 0.95, letterSpacing: '-0.02em', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 0 }}>
                <span className="font-playfair text-white" style={{ fontStyle: 'italic', opacity: 0.9 }}>Glaciers hold</span>
                <span className="font-sans font-semibold text-white uppercase tracking-tighter">threats in silence</span>
              </h1>
            </div>
          </div>

          {/* Bottom Left Copy */}
          <div className="absolute bottom-12 left-12 z-20 animate-hero-fade-up pointer-events-none" style={{ animationDelay: '0.4s', width: '22rem' }}>
            <p className="font-sans text-sm font-light leading-relaxed text-white" style={{ opacity: 0.6 }}>
              Every glacial lake holds a chapter of our planet's changing climate, silently swelling behind fragile moraine dams in the high Himalayas.
            </p>
          </div>

          {/* Bottom Right CTA */}
          <div className="absolute bottom-12 right-12 z-20 flex flex-col items-end animate-hero-fade-up" style={{ animationDelay: '0.6s' }}>
            <p className="font-sans text-sm font-light leading-relaxed text-white text-right mb-6" style={{ opacity: 0.6, width: '22rem' }}>
              Our AI-powered command center monitors 21 high-risk lakes in real-time, predicting Glacial Lake Outburst Floods before they strike.
            </p>
            <button 
              onClick={onEnterDashboard}
              style={{
                position: 'relative', overflow: 'hidden', padding: '1rem 2.5rem',
                background: '#FFFFFF', color: '#000000', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em', pointerEvents: 'auto'
              }}
              onMouseEnter={e => {
                const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement;
                const text = e.currentTarget.querySelector('.btn-text') as HTMLElement;
                if (overlay) overlay.style.transform = 'translateY(0)';
                if (text) text.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement;
                const text = e.currentTarget.querySelector('.btn-text') as HTMLElement;
                if (overlay) overlay.style.transform = 'translateY(100%)';
                if (text) text.style.color = '#000000';
              }}
            >
              <span className="btn-text" style={{ position: 'relative', zIndex: 10, transition: 'color 0.3s' }}>Enter Command Center</span>
              <div 
                className="hover-overlay"
                style={{
                  position: 'absolute', inset: 0, background: '#000000',
                  transform: 'translateY(100%)', transition: 'transform 0.3s ease-in-out'
                }} 
              />
            </button>
          </div>
        </section>

        {/* ── GLOF INCIDENTS ──────────────────────────────── */}
        <section id="threat" style={{ padding: '7rem 0' }}>
          <div style={maxW}>
            <div className="vw-section-rule" style={{ marginBottom: '5rem' }} />

            <div className="vw-fade-up" style={{ marginBottom: '4rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: TEXT_SEC, fontFamily: 'Inter, monospace' }}>
                The Cost of No Warning
              </span>
              <h2 className="font-serif-display" style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', fontWeight: 400, letterSpacing: '-1.5px', color: TEXT_PRI, margin: '1rem 0 0', lineHeight: 1.05 }}>
                Three events. Billions lost.
                <br />Zero advance notice.
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              <IncidentCard stat="$200M+" unit="economic loss" event="Bhote Koshi GLOF" year="July 2025" sub="4 hydropower plants · 8% of Nepal's grid eliminated in hours" dominant delay={0} />
              <IncidentCard stat="55" unit="lives lost" event="South Lonak, Sikkim" year="October 2023" sub="$120M infrastructure damage · Teesta dam breach" delay={0.1} />
              <IncidentCard stat="1" unit="village destroyed" event="Thame, Khumbu" year="August 2024" sub="Entire community displaced · No early warning issued" delay={0.2} />
            </div>

            <p className="vw-fade-up" style={{ marginTop: '2.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.18)', textAlign: 'center', fontFamily: 'Inter, sans-serif', animationDelay: '0.3s' }}>
              Aligned with the{' '}
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>$36.1M UNDP Green Climate Fund grant</span>
              {' '}for Nepal's Department of Hydrology and Meteorology.
            </p>
          </div>
        </section>

        {/* ── THE SCIENCE ────────────────────────────────── */}
        <section id="science" style={{ padding: '7rem 0' }}>
          <div style={maxW}>
            <div className="vw-section-rule" style={{ marginBottom: '5rem' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center', marginBottom: '5rem' }}>
              <div className="vw-fade-up">
                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: TEXT_SEC, fontFamily: 'Inter, monospace' }}>
                  Technical Architecture
                </span>
                <h2 className="font-serif-display" style={{ fontSize: 'clamp(2.25rem, 4vw, 3.25rem)', fontWeight: 400, letterSpacing: '-1.5px', color: TEXT_PRI, margin: '1rem 0 1.5rem', lineHeight: 1.05 }}>
                  Satellite to alert.
                  <br />Under 10 minutes.
                </h2>
                <p style={{ fontSize: '0.875rem', color: TEXT_SEC, lineHeight: 1.75, fontFamily: 'Inter, sans-serif', marginBottom: '2rem' }}>
                  VajraWatch is a hybrid deterministic + agentic system. The math engine is the backbone. The agents make it legible to humans.
                </p>

                {/* 8 Feature bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_SEC, fontFamily: 'Inter, monospace', marginBottom: '0.25rem' }}>
                    8-Feature Risk Matrix
                  </div>
                  {[
                    { label: 'NDWI Delta (Lake Expansion)', value: '+18.5%', pct: 85, color: RED, delay: 0 },
                    { label: 'Precip 7-Day Anomaly', value: '210mm', pct: 75, color: '#F97316', delay: 0.05 },
                    { label: 'SAR Backscatter Change', value: '−3.2 dB', pct: 68, color: '#FBBF24', delay: 0.1 },
                    { label: 'Seismic Count (M3.0+)', value: '5 events', pct: 52, color: '#34D399', delay: 0.15 },
                    { label: 'Temp Anomaly vs Baseline', value: '+2.1°C', pct: 60, color: '#60A5FA', delay: 0.2 },
                  ].map(props => (
                    <FeatureBar key={props.label} {...props} />
                  ))}
                </div>
              </div>

              <div className="vw-fade-in-d1" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Satellite orbit */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <SatelliteOrbit />
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { val: '87%', label: 'XGBoost Precision', color: RED },
                    { val: '<10ms', label: 'Inference Latency', color: '#34D399' },
                    { val: '50yr', label: 'Neo4j Knowledge Graph', color: '#60A5FA' },
                    { val: '$150M', label: 'Loss Prevented/Alert', color: '#FBBF24' },
                  ].map(({ val, label, color }) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${BORDER}`,
                      borderRadius: '0.75rem',
                      padding: '1.25rem',
                    }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '0.3rem', fontFamily: 'Inter, sans-serif' }}>{val}</div>
                      <div style={{ fontSize: '0.6875rem', color: TEXT_SEC, fontFamily: 'Inter, sans-serif' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4-step pipeline */}
            <div className="vw-fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '2.5rem' }}>
              <PipelineStep num="01" title="Sentinel Analysis" desc="Optical + SAR satellite data detects lake expansion and ice movement anomalies via NDWI delta." />
              <PipelineStep num="02" title="Env. Cross-Check" desc="7-day precipitation, seismic events, and temperature anomalies validate the satellite signal." />
              <PipelineStep num="03" title="XGBoost Engine" desc="8-feature deterministic model outputs a 0–100 risk index in under 10ms with 87% precision." isAlert />
              <PipelineStep num="04" title="Nepali Broadcast" desc="gTTS generates a local-language audio alert for downstream communities within the 36-hour window." isAlert isLast />
            </div>
          </div>
        </section>

        {/* ── AGENT ARCHITECTURE ─────────────────────────── */}
        <section id="architecture" style={{ padding: '7rem 0' }}>
          <div style={maxW}>
            <div className="vw-section-rule" style={{ marginBottom: '5rem' }} />

            <div style={{ marginBottom: '3rem' }}>
              <span className="vw-fade-up" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: TEXT_SEC, fontFamily: 'Inter, monospace' }}>
                LangGraph Agent Pipeline
              </span>
              <h2 className="vw-fade-up-d1 font-serif-display" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', fontWeight: 400, letterSpacing: '-1.5px', color: TEXT_PRI, margin: '1rem 0 0', lineHeight: 1.05 }}>
                Five agents. One decision.
              </h2>
            </div>

            <div className="vw-fade-up-d2">
              <AgentFlowDiagram />
            </div>

            {/* Moat description */}
            <div className="vw-fade-up-d3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginTop: '3rem' }}>
              {[
                { icon: '🛡', title: 'Skeptic Agent', desc: 'An independent anomaly checker prevents false alarms — the judge\'s toughest question, answered in the architecture.' },
                { icon: '🗃', title: '50-Year Neo4j Graph', desc: 'The moat is not the code. It\'s the knowledge graph. Every GLOF, every lake, every infrastructure node — wired.' },
                { icon: '📡', title: 'Offline-First Design', desc: 'Hackathon internet will fail. Ollama runs local. Data is cached. The system demo\'s even when the router dies.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="vw-lift" style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: '0.875rem',
                  padding: '1.5rem',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{icon}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: TEXT_PRI, marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>{title}</div>
                  <div style={{ fontSize: '0.75rem', color: TEXT_SEC, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEMO CTA ───────────────────────────────────── */}
        <section style={{ padding: '8rem 0' }}>
          <div style={{ ...maxW, textAlign: 'center' }}>
            <div className="vw-section-rule" style={{ marginBottom: '5rem' }} />

            <div className="vw-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
              <div className="vw-live-dot-green" />
              <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#22c55e', fontFamily: 'Inter, monospace' }}>
                System Online · Demo Ready
              </span>
            </div>

            <h2 className="vw-fade-up-d1 font-serif-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 400, letterSpacing: '-2.5px', color: TEXT_PRI, margin: '0 0 1.5rem', lineHeight: 0.95 }}>
              See a GLOF risk alert
              <br />happen in real time.
            </h2>

            <p className="vw-fade-up-d2" style={{ fontSize: '1rem', color: TEXT_SEC, maxWidth: '34rem', margin: '0 auto 3.5rem', lineHeight: 1.75, fontFamily: 'Inter, sans-serif' }}>
              The Map Analysis pulls live satellite anomaly data, runs the multi-agent pipeline, and outputs a risk score with a Nepali audio alert — within 36 hours of the triggering event.
            </p>

            <div className="vw-fade-up-d3" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <button
                onClick={onEnterDashboard}
                style={{
                  padding: '1.25rem 4rem',
                  fontSize: '1rem', fontWeight: 600,
                  background: TEXT_PRI, color: BG,
                  border: 'none', borderRadius: '9999px',
                  cursor: 'pointer', transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease',
                  fontFamily: 'Inter, sans-serif', letterSpacing: '-0.015em',
                  boxShadow: '0 0 0 0 rgba(255,255,255,0)',
                }}
                onMouseEnter={e => {
                  const b = e.currentTarget;
                  b.style.transform = 'scale(1.06)';
                  b.style.boxShadow = '0 12px 60px rgba(255,255,255,0.15)';
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget;
                  b.style.transform = 'scale(1)';
                  b.style.boxShadow = '0 0 0 0 rgba(255,255,255,0)';
                }}
              >
                Enter Live Map →
              </button>

              <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.18)', fontFamily: 'Inter, sans-serif' }}>
                21 PDGLs monitored · Thulagi Lake pre-loaded · No backend required
              </span>
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────── */}
        <footer style={{ padding: '2.5rem 0', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ ...maxW, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '4px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4.09 12.96A1 1 0 005 14.5h6.5L10 22l8.91-10.96A1 1 0 0018 10h-6.5L13 2z" fill={RED} />
                </svg>
              </div>
              <span className="font-serif-display" style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.2)' }}>VajraWatch</span>
            </div>

            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.12)', fontFamily: 'Inter, sans-serif' }}>
              DeerHack 2026 · Built for the Himalayas · MIT License
            </span>

            <button
              onClick={onEnterDashboard}
              style={{
                fontSize: '0.75rem', color: TEXT_SEC,
                background: 'none', border: `1px solid ${BORDER}`,
                borderRadius: '0.375rem', padding: '0.4rem 0.875rem',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.color = TEXT_PRI; b.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.color = TEXT_SEC; b.style.borderColor = BORDER; }}
            >
              Map Analysis →
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
