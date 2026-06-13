import { useState, useEffect } from 'react';
import { Map as MapIcon, Box } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import { MOCK_LAKES } from '../data/mockData';
import { getMockSpatialData } from '../utils/mockSpatialData';
import Map2D from './Map2D';
import DigitalTwin3D from './DigitalTwin3D';

const BORDER = 'rgba(255,255,255,0.06)';
const GLASS  = 'rgba(0,0,0,0.7)';
const RED    = '#EF4444';

function MapFallback() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#050505', gap: '1rem' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: RED, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6F6F6F', fontFamily: 'Inter, monospace' }}>Loading Terrain…</p>
    </div>
  );
}

export default function MapContainer({ activeLakeId, setActiveLakeId, onGoBack }) {
  const [viewMode, setViewMode]   = useState('2D');
  const [isCritical, setIsCritical] = useState(false);
  const [spatialData, setSpatialData] = useState(null);
  const [currentData, setCurrentData] = useState({ riskScore: 50 });

  const activeLake = MOCK_LAKES[activeLakeId] || MOCK_LAKES['PDGL_THULAGI_01'];

  // ─── CLEAN EVENT BUS — replaces the MutationObserver hack ─────────────────
  // Sidebar fires 'vajrawatch-risk-state' with { isCritical: true/false }
  useEffect(() => {
    const handler = (e) => {
      if (typeof e.detail?.isCritical === 'boolean') {
        setIsCritical(e.detail.isCritical);
      }
    };
    window.addEventListener('vajrawatch-risk-state', handler);
    return () => window.removeEventListener('vajrawatch-risk-state', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.data) {
        setCurrentData(e.detail.data);
      }
    };
    window.addEventListener('vajrawatch-data-update', handler);
    return () => window.removeEventListener('vajrawatch-data-update', handler);
  }, []);

  // Reset critical state when lake changes
  useEffect(() => {
    setIsCritical(false);
    setCurrentData({ riskScore: 50 });
    setSpatialData(getMockSpatialData());
  }, [activeLakeId]);

  const onMapClick = (event) => {
    const features = event?.features;
    if (features && features.length > 0) {
      const clickedLakeId = features[0].properties.id;
      if (clickedLakeId && clickedLakeId !== activeLakeId) {
        setActiveLakeId(clickedLakeId);
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#050505', overflow: 'hidden', borderRight: `1px solid ${BORDER}` }}>

      {/* ── View Toggle Toolbar ──────────────────────────────────── */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>

        {/* Back button — glassmorphic */}
        {onGoBack && (
          <button
            onClick={onGoBack}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.4rem 0.875rem', borderRadius: '0.5rem',
              border: `1px solid ${BORDER}`,
              background: GLASS, backdropFilter: 'blur(16px)',
              cursor: 'pointer', fontFamily: 'Inter, monospace',
              fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.05em',
              transition: 'color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = BORDER; }}
          >
            ← Back
          </button>
        )}

        {/* Segmented control — dark glassmorphic */}
        <div style={{
          display: 'flex',
          background: GLASS, backdropFilter: 'blur(16px)',
          border: `1px solid ${BORDER}`,
          borderRadius: '0.625rem',
          padding: '3px',
          gap: '2px',
        }}>
          {[
            { label: '2D Map',         icon: MapIcon, value: '2D' },
            { label: '3D Digital Twin', icon: Box,     value: '3D' },
          ].map(({ label, icon: Icon, value }) => (
            <button
              key={label}
              onClick={() => setViewMode(value)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: 'none',
                cursor: 'pointer', fontFamily: 'Inter, monospace', fontSize: '0.72rem',
                fontWeight: 700, letterSpacing: '0.06em',
                background: viewMode === value ? (isCritical ? RED : '#FFFFFF') : 'transparent',
                color:      viewMode === value ? (isCritical ? '#fff' : '#000')  : 'rgba(255,255,255,0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAP RENDERER ─────────────────────────────────────────── */}
      <ErrorBoundary fallback={<MapFallback />} onError={() => setViewMode('2D')}>
        {viewMode === '2D' ? (
          <Map2D
            activeLake={activeLake}
            spatialData={spatialData}
            isCritical={isCritical}
            onMapClick={onMapClick}
            onError={() => setViewMode('2D')}
          />
        ) : (
          <DigitalTwin3D
            spatialData={spatialData}
            activeLake={activeLake}
            isCritical={isCritical}
            onMapClick={onMapClick}
            onError={() => setViewMode('2D')}
          />
        )}
      </ErrorBoundary>

      {/* ── Bottom HUD ─────────────────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', pointerEvents: 'none', zIndex: 20 }}>
        {viewMode === '3D' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: GLASS, backdropFilter: 'blur(16px)', border: `1px solid ${BORDER}`, borderRadius: '0.5rem', padding: '0.5rem 1rem' }}>
            <Box size={12} color={isCritical ? RED : 'rgba(255,255,255,0.4)'} />
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.06em', fontFamily: 'Inter, monospace' }}>
              Cinematic 3D Terrain Digital Twin
            </span>
          </div>
        )}
        <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, monospace', letterSpacing: '0.08em' }}>
          {activeLake.coordinates.lat.toFixed(4)}°N · {activeLake.coordinates.lng.toFixed(4)}°E · Drag to orbit · Scroll to zoom
        </div>
      </div>
    </div>
  );
}
