/* ─────────────────────────────────────────────────────
 * RiskGauge
 * Pure SVG arc gauge — no external charting library.
 * 270° sweep, tier-coloured, glow effect.
 * ───────────────────────────────────────────────────── */

const TIER_COLORS = {
  RED:    '#f43f5e',
  ORANGE: '#fb923c',
  YELLOW: '#fbbf24',
  GREEN:  '#34d399',
};

const TIER_LABELS = {
  RED:    'CRITICAL RISK',
  ORANGE: 'HIGH RISK',
  YELLOW: 'MODERATE RISK',
  GREEN:  'LOW RISK',
};

// Gauge geometry
const CX = 130;          // arc centre x
const CY = 120;          // arc centre y (shifted up so arc ends land at ~y=191)
const R  = 100;          // arc radius
const SW = 16;           // stroke width
const START_ANG = 225;   // clockwise from 12-o'clock, start of gauge
const SWEEP_ANG = 270;   // total degrees of gauge

/** Convert clockwise-from-top angle (deg) to SVG {x, y} */
const toXY = (r, deg) => {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)];
};

/** Build an SVG arc path going clockwise from a1° to a2° */
const buildArc = (r, a1, a2) => {
  const sweep = ((a2 - a1) % 360 + 360) % 360;
  if (sweep === 0) return '';
  const [sx, sy] = toXY(r, a1);
  const [ex, ey] = toXY(r, a2);
  const large = sweep > 180 ? 1 : 0;
  return `M${sx.toFixed(2)},${sy.toFixed(2)} A${r},${r} 0 ${large},1 ${ex.toFixed(2)},${ey.toFixed(2)}`;
};

const SCALE_SEGS = [
  { cls: 'green',  maxScore: 25 },
  { cls: 'yellow', maxScore: 50 },
  { cls: 'orange', maxScore: 75 },
  { cls: 'red',    maxScore: 100 },
];

const TIER_ORDER = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3 };

function RiskGauge({ score, tier }) {
  const color     = TIER_COLORS[tier]  ?? '#38bdf8';
  const tierLabel = TIER_LABELS[tier]  ?? 'UNKNOWN';
  const tierIdx   = TIER_ORDER[tier]   ?? 3;

  const bgPath    = buildArc(R, START_ANG, START_ANG + SWEEP_ANG);
  const scoreEnd  = START_ANG + (Math.min(score, 100) / 100) * SWEEP_ANG;
  const scorePath = score > 0 ? buildArc(R, START_ANG, scoreEnd) : '';

  // Tick marks at 0 / 25 / 50 / 75 / 100 %
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => {
    const ang       = START_ANG + t * SWEEP_ANG;
    const [ox, oy]  = toXY(R + SW / 2 + 3, ang);
    const [ix, iy]  = toXY(R - SW / 2 - 3, ang);
    return { ox, oy, ix, iy };
  });

  return (
    <div className="risk-gauge">
      <div className="panel-label">GLOF RISK INDEX</div>

      {/* SVG gauge — container clips the bottom opening */}
      <div className="risk-gauge__wrap">
        <svg className="risk-gauge__svg" viewBox="0 0 260 260" aria-label={`Risk score ${score} out of 100`}>
          {/* Background track */}
          <path
            d={bgPath}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={SW}
            strokeLinecap="round"
          />

          {/* Score arc — outer glow layer */}
          {scorePath && (
            <path
              d={scorePath}
              fill="none"
              stroke={color}
              strokeWidth={SW + 10}
              strokeLinecap="round"
              opacity="0.13"
            />
          )}

          {/* Score arc — main */}
          {scorePath && (
            <path
              d={scorePath}
              fill="none"
              stroke={color}
              strokeWidth={SW}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          )}

          {/* Tick marks */}
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.ix.toFixed(2)} y1={t.iy.toFixed(2)}
              x2={t.ox.toFixed(2)} y2={t.oy.toFixed(2)}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* Score number overlaid in centre */}
        <div className="risk-gauge__center">
          <span className="risk-gauge__score">{score}</span>
          <span className="risk-gauge__unit">/ 100</span>
        </div>
      </div>

      {/* Tier badge */}
      <div className={`risk-tier-badge risk-tier-badge--${tier.toLowerCase()}`}>
        <span className="risk-tier-dot" />
        {tierLabel}
      </div>

      {/* Description */}
      <p className="risk-gauge__desc">
        Elevated probability of glacial lake outburst flood event.
        72-hour forecast window currently active.
      </p>

      {/* Four-segment risk scale */}
      <div className="risk-scale" aria-label="Risk scale">
        {SCALE_SEGS.map((seg, i) => (
          <div
            key={seg.cls}
            className={`risk-scale__seg risk-scale__seg--${seg.cls}${i <= tierIdx ? ' is-active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

export default RiskGauge;
