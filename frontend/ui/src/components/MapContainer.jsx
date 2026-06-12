import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Box, Layers, Navigation2, Maximize2 } from 'lucide-react';

/**
 * MapContainer — Left panel (60% width)
 * Contains 2D/3D view toggle and dark canvas placeholder
 * Ready for Three.js / MapLibre integration in Phase 3
 */
export default function MapContainer() {
  const [viewMode, setViewMode] = useState('2D');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        width: '60%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'var(--bg-base)',
        borderRight: '1px solid var(--border-subtle)',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: '1.25rem',
          left: '1.25rem',
          right: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 5,
        }}
      >
        {/* 2D / 3D Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid var(--border)',
            borderRadius: '0.625rem',
            padding: '3px',
            backdropFilter: 'blur(12px)',
            gap: '2px',
          }}
        >
          {['2D', '3D'].map((mode) => (
            <motion.button
              key={mode}
              onClick={() => setViewMode(mode)}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.4rem 0.875rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                transition: 'all 0.2s ease',
                background: viewMode === mode
                  ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                  : 'transparent',
                color: viewMode === mode ? 'white' : 'var(--text-muted)',
                boxShadow: viewMode === mode
                  ? '0 2px 8px rgba(59, 130, 246, 0.35)'
                  : 'none',
              }}
            >
              {mode === '2D' ? <Map size={13} /> : <Box size={13} />}
              {mode === '2D' ? '2D Map' : '3D Digital Twin'}
            </motion.button>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { icon: Layers, label: 'Layers' },
            { icon: Navigation2, label: 'Recenter' },
            { icon: Maximize2, label: 'Fullscreen' },
          ].map(({ icon: Icon, label }) => (
            <motion.button
              key={label}
              title={label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(17, 24, 39, 0.9)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={15} />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Canvas Area — dark placeholder for Three.js / MapLibre */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: 'radial-gradient(ellipse at 40% 60%, #0d1829 0%, #0a0f1e 70%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
        id="map-canvas-root"
        aria-label="Map visualization canvas — Three.js / MapLibre will render here"
      >
        {/* Grid overlay for visual depth */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.04,
            pointerEvents: 'none',
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Subtle topographic rings — decorative depth hint */}
        {[280, 220, 160, 100].map((size, i) => (
          <motion.div
            key={size}
            animate={{
              scale: [1, 1.015, 1],
              opacity: [0.04, 0.08, 0.04],
            }}
            transition={{
              duration: 4 + i * 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
            style={{
              position: 'absolute',
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              border: `1px solid rgba(59, 130, 246, 0.3)`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Lake location marker */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5, type: 'spring' }}
          style={{ position: 'relative', zIndex: 2 }}
        >
          {/* Pulse ring */}
          <motion.div
            animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '50%',
              border: '2px solid rgba(239, 68, 68, 0.6)',
            }}
          />

          {/* Center dot */}
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: 'var(--accent-red)',
              boxShadow: '0 0 20px var(--accent-red-glow), 0 0 40px rgba(239,68,68,0.2)',
              border: '2px solid white',
            }}
          />
        </motion.div>

        {/* Canvas placeholder label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(17, 24, 39, 0.85)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                backdropFilter: 'blur(8px)',
              }}
            >
              {viewMode === '2D' ? <Map size={14} color="var(--accent-blue)" /> : <Box size={14} color="var(--accent-blue)" />}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {viewMode === '2D'
                  ? 'MapLibre GL canvas — Phase 3'
                  : 'Three.js 3D Digital Twin — Phase 3'}
              </span>
            </div>

            {/* Lake coordinate tag */}
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
              }}
            >
              28.5333°N · 84.3833°E · THULAGI
            </div>
          </motion.div>
        </AnimatePresence>

        {/* View mode badge top-center */}
        <div
          style={{
            position: 'absolute',
            top: '4.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(59, 130, 246, 0.4)',
            pointerEvents: 'none',
          }}
        >
          {viewMode === '2D' ? '— Sentinel-2 L2A Mosaic —' : '— SRTM 30m Elevation Model —'}
        </div>
      </div>
    </motion.div>
  );
}
