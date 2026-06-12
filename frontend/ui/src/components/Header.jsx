import { motion } from 'framer-motion';
import { Activity, Radio, Satellite } from 'lucide-react';
import { SYSTEM_STATS } from '../data/mockData';

/**
 * Header — F-Pattern top-left branding anchor
 * VajraWatch brand + live system status badge
 */
export default function Header() {
  return (
    <header
      style={{
        height: '64px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* LEFT — Brand (F-Pattern: first eye anchor) */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59, 130, 246, 0.35)',
            flexShrink: 0,
          }}
        >
          {/* Lightning bolt SVG mark */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 2L4.09 12.96A1 1 0 005 14.5h6.5L10 22l8.91-10.96A1 1 0 0018 10h-6.5L13 2z"
              fill="white"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Brand text */}
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            VajraWatch
          </div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            GLOF Command Center
          </div>
        </div>
      </motion.div>

      {/* CENTER — Scan line decoration */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <div style={{ width: '40px', height: '1px', background: 'var(--border)' }} />
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.15em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          AI Early Warning
        </span>
        <div style={{ width: '40px', height: '1px', background: 'var(--border)' }} />
      </div>

      {/* RIGHT — System status indicators */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
      >
        {/* Satellites active */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
          }}
        >
          <Satellite size={13} color="var(--accent-blue)" />
          <span style={{ fontWeight: 500 }}>{SYSTEM_STATS.satellites_active} SAT</span>
        </div>

        {/* Last scan */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
          }}
        >
          <Activity size={13} color="var(--accent-green)" />
          <span>{SYSTEM_STATS.last_scan}</span>
        </div>

        {/* 47 Lakes Monitored — status badge (isolation principle) */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: '999px',
            padding: '0.3rem 0.75rem',
          }}
        >
          <span className="status-dot" />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#22c55e',
              letterSpacing: '0.04em',
            }}
          >
            {SYSTEM_STATS.lakes_monitored} Lakes Monitored
          </span>
          <Radio size={11} color="#22c55e" style={{ opacity: 0.8 }} />
        </motion.div>
      </motion.div>
    </header>
  );
}
