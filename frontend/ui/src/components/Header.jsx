import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Satellite, Server } from 'lucide-react';
import { fetchHealth } from '../services/api';
import { SYSTEM_STATS } from '../data/mockData';

const BG     = '#0a0a0a';
const BORDER = 'rgba(255,255,255,0.06)';
const RED    = '#EF4444';

/**
 * Header — Dark command-center aesthetic matching the landing page.
 * VajraWatch brand + live system status badge.
 */
export default function Header() {
  const [isLive, setIsLive] = useState(false);
  const [healthOk, setHealthOk] = useState(false);

  useEffect(() => {
    fetchHealth().then(res => setHealthOk(res.status === 'ok')).catch(() => {});

    const handler = (e) => setIsLive(!e.detail.isMock);
    window.addEventListener('vajrawatch-data-mode', handler);
    return () => window.removeEventListener('vajrawatch-data-mode', handler);
  }, []);

  return (
    <header
      style={{
        height: '56px',
        background: BG,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* LEFT — Brand */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
      >
        {/* Logo mark — red accent matching landing nav */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 2L4.09 12.96A1 1 0 005 14.5h6.5L10 22l8.91-10.96A1 1 0 0018 10h-6.5L13 2z"
              fill={RED}
            />
          </svg>
        </div>

        {/* Brand text */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 400,
              fontSize: '1.35rem',
              color: '#FFFFFF',
              lineHeight: 1,
              marginTop: '3px',
              letterSpacing: '-0.02em',
            }}
          >
            VajraWatch
          </div>
        </div>
      </motion.div>

      {/* CENTER — Classification bar */}
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
        <div style={{ width: '40px', height: '1px', background: BORDER }} />
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase',
            fontFamily: 'Inter, monospace',
          }}
        >
          AI Early Warning Command Center
        </span>
        <div style={{ width: '40px', height: '1px', background: BORDER }} />
      </div>

      {/* RIGHT — System status indicators */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
      >
        {/* Satellites */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontFamily: 'Inter, monospace' }}>
          <Satellite size={12} color="rgba(255,255,255,0.4)" />
          <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>{SYSTEM_STATS.satellites_active} SAT</span>
        </div>

        {/* Last scan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontFamily: 'Inter, monospace' }}>
          <Activity size={12} color="rgba(255,255,255,0.4)" />
          <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>{SYSTEM_STATS.last_scan}</span>
        </div>

        {/* Lakes Monitored */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${BORDER}`,
            borderRadius: '999px',
            padding: '0.25rem 0.75rem',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: RED,
              boxShadow: `0 0 6px ${RED}`,
            }}
          />
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              fontFamily: 'Inter, monospace',
            }}
          >
            {SYSTEM_STATS.lakes_monitored} Lakes Monitored
          </span>
        </div>

        {/* Backend Health */}
        <div
          title={healthOk ? 'Backend Connected' : 'Backend Offline — Demo Mode'}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}
        >
          <Server size={12} color={healthOk ? '#22c55e' : 'rgba(255,255,255,0.2)'} />
        </div>

        {/* Live/Demo badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: isLive ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isLive ? 'rgba(34,197,94,0.25)' : BORDER}`,
            borderRadius: '4px',
            padding: '0.2rem 0.6rem',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: isLive ? '#22c55e' : 'rgba(255,255,255,0.2)',
            }}
          />
          <span
            style={{
              fontSize: '0.6rem',
              fontWeight: 800,
              color: isLive ? '#22c55e' : 'rgba(255,255,255,0.25)',
              letterSpacing: '0.12em',
              fontFamily: 'Inter, monospace',
            }}
          >
            {isLive ? 'LIVE' : 'DEMO'}
          </span>
        </div>
      </motion.div>
    </header>
  );
}
