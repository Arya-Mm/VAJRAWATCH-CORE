import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * RiskGauge — Animated circular SVG gauge for risk score 0–100
 * Score: 84 → RED CRITICAL
 *
 * Design: Single saturated accent color in muted environment (color singularity).
 * The isolation principle: whitespace around the gauge gives it maximum visual weight.
 */

const RADIUS = 80;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Arc spans 270° (three-quarters) — leaves 90° gap at bottom
const ARC_LENGTH = CIRCUMFERENCE * 0.75;

function getRiskColor(score) {
  if (score >= 75) return { color: '#ef4444', glow: 'rgba(239,68,68,0.4)', label: 'CRITICAL' };
  if (score >= 50) return { color: '#f97316', glow: 'rgba(249,115,22,0.4)', label: 'HIGH' };
  if (score >= 25) return { color: '#eab308', glow: 'rgba(234,179,8,0.4)', label: 'MODERATE' };
  return { color: '#22c55e', glow: 'rgba(34,197,94,0.4)', label: 'LOW' };
}

export default function RiskGauge({ score = 84, animated = true }) {
  const { color, glow, label } = getRiskColor(score);

  // Compute dash offset: full arc = score 100, empty = score 0
  const fillLength = (score / 100) * ARC_LENGTH;
  const dashOffset = ARC_LENGTH - fillLength;

  // Rotate so gap is at bottom-center
  const rotation = 135; // degrees — positions arc gap at bottom

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 120 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
        padding: '0.5rem 0',
      }}
      aria-label={`Risk gauge: ${score} out of 100 — ${label}`}
      role="img"
    >
      {/* Gauge SVG */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          width={RADIUS * 2 + STROKE_WIDTH * 2 + 8}
          height={RADIUS * 2 + STROKE_WIDTH * 2 + 8}
          viewBox={`0 0 ${RADIUS * 2 + STROKE_WIDTH * 2 + 8} ${RADIUS * 2 + STROKE_WIDTH * 2 + 8}`}
          style={{ overflow: 'visible' }}
        >
          <g transform={`translate(${RADIUS + STROKE_WIDTH / 2 + 4}, ${RADIUS + STROKE_WIDTH / 2 + 4})`}>
            {/* Track — background arc */}
            <circle
              r={RADIUS}
              fill="none"
              stroke="var(--bg-elevated)"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              transform={`rotate(${rotation})`}
              style={{ opacity: 0.6 }}
            />

            {/* Tick marks */}
            {Array.from({ length: 11 }).map((_, i) => {
              const angle = (rotation + (i / 10) * 270) * (Math.PI / 180);
              const innerR = RADIUS - STROKE_WIDTH / 2 - 6;
              const outerR = RADIUS - STROKE_WIDTH / 2 - 2;
              return (
                <line
                  key={i}
                  x1={innerR * Math.cos(angle)}
                  y1={innerR * Math.sin(angle)}
                  x2={outerR * Math.cos(angle)}
                  y2={outerR * Math.sin(angle)}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Glow layer — underneath fill */}
            <circle
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={STROKE_WIDTH + 6}
              strokeDasharray={`${fillLength} ${CIRCUMFERENCE}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              transform={`rotate(${rotation})`}
              style={{ opacity: 0.15, filter: `blur(4px)` }}
            />

            {/* Fill arc — animated */}
            <motion.circle
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              strokeDashoffset={ARC_LENGTH} // start empty
              strokeLinecap="round"
              transform={`rotate(${rotation})`}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{
                duration: animated ? 1.4 : 0,
                ease: [0.34, 1.56, 0.64, 1], // spring-like overshoot
                delay: animated ? 0.5 : 0,
              }}
              style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
            />

            {/* Needle dot at current position */}
            <motion.circle
              r={5}
              fill={color}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.3 }}
              style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
              transform={(() => {
                const angle = (rotation + (score / 100) * 270) * (Math.PI / 180);
                const x = RADIUS * Math.cos(angle);
                const y = RADIUS * Math.sin(angle);
                return `translate(${x}, ${y})`;
              })()}
            />
          </g>
        </svg>

        {/* Center readout */}
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            pointerEvents: 'none',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.4, type: 'spring' }}
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              color: color,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              textShadow: `0 0 20px ${glow}`,
            }}
          >
            {score}
          </motion.div>
          <div
            style={{
              fontSize: '0.6rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Risk Score
          </div>
        </div>
      </div>

      {/* CRITICAL badge */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.4 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginTop: '0.25rem',
        }}
      >
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${glow}`,
          }}
        />
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: color,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${glow}`,
          }}
        />
      </motion.div>

      {/* Scale labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '160px',
          marginTop: '0.25rem',
        }}
      >
        {['0', '25', '50', '75', '100'].map((n) => (
          <span
            key={n}
            style={{
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}
          >
            {n}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
