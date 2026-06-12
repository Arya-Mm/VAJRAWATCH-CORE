import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Radio, Satellite, Server } from 'lucide-react';
import { fetchHealth } from '../services/api';
import { SYSTEM_STATS } from '../data/mockData';

/**
 * Header — F-Pattern top-left branding anchor
 * VajraWatch brand + live system status badge
 * Brutalist Light Mode Update
 */
export default function Header() {
  const [isLive, setIsLive] = useState(false);
  const [healthOk, setHealthOk] = useState(false);

  useEffect(() => {
    fetchHealth().then(res => setHealthOk(res.status === 'ok'));
    
    const handler = (e) => setIsLive(!e.detail.isMock);
    window.addEventListener('vajrawatch-data-mode', handler);
    return () => window.removeEventListener('vajrawatch-data-mode', handler);
  }, []);

  return (
    <header
      style={{
        height: '64px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
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
            borderRadius: '4px',
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
              fontFamily: 'var(--font-serif)',
              fontWeight: 400,
              fontSize: '1.4rem',
              color: '#000000',
              lineHeight: 1,
              marginTop: '4px',
            }}
          >
            VajraWatch
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
        <div style={{ width: '40px', height: '1px', background: '#E5E7EB' }} />
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: '#6F6F6F',
            textTransform: 'uppercase',
          }}
        >
          AI Early Warning
        </span>
        <div style={{ width: '40px', height: '1px', background: '#E5E7EB' }} />
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
            color: '#6F6F6F',
            fontSize: '0.75rem',
          }}
        >
          <Satellite size={13} color="#000000" />
          <span style={{ fontWeight: 600 }}>{SYSTEM_STATS.satellites_active} SAT</span>
        </div>

        {/* Last scan */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#6F6F6F',
            fontSize: '0.75rem',
          }}
        >
          <Activity size={13} color="#000000" />
          <span style={{ fontWeight: 600 }}>{SYSTEM_STATS.last_scan}</span>
        </div>

        {/* Lakes Monitored */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '999px',
            padding: '0.3rem 0.75rem',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#000000',
            }}
          />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#000000',
              letterSpacing: '0.04em',
            }}
          >
            {SYSTEM_STATS.lakes_monitored} Lakes Monitored
          </span>
        </div>

        {/* Backend Health Check */}
        <div
          title={healthOk ? "Backend Connected" : "Backend Offline"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#6F6F6F',
            fontSize: '0.75rem',
            marginLeft: '0.5rem',
          }}
        >
          <Server size={13} color={healthOk ? "#22c55e" : "#ef4444"} />
        </div>

        {/* Live/Demo Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: isLive ? 'rgba(34, 197, 94, 0.1)' : '#F9FAFB',
            border: `1px solid ${isLive ? 'rgba(34, 197, 94, 0.3)' : '#E5E7EB'}`,
            borderRadius: '4px',
            padding: '0.2rem 0.5rem',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isLive ? '#22c55e' : '#9CA3AF',
            }}
          />
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              color: isLive ? '#16a34a' : '#6F6F6F',
              letterSpacing: '0.1em',
            }}
          >
            {isLive ? 'LIVE' : 'DEMO'}
          </span>
        </div>
      </motion.div>
    </header>
  );
}
