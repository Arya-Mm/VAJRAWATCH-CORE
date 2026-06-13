import { useState, useEffect } from 'react';
import { Map as MapIcon, Box } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import { MOCK_LAKES } from '../data/mockData';
import { fetchRiskData } from '../services/api';
import { getMockSpatialData } from '../utils/mockSpatialData';
import Map2D from './Map2D';
import DigitalTwin3D from './DigitalTwin3D';

// ─── FALLBACK SCREENS ───────────────────────────────────────────────────────
function MapFallback() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#F3F4F6', gap: '1rem' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid #E5E7EB', borderTopColor: '#000000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6F6F6F' }}>Loading Map…</p>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function MapContainer({ activeLakeId, setActiveLakeId, onGoBack }) {
  const [viewMode, setViewMode] = useState('2D');
  const [isCritical, setIsCritical] = useState(false);
  const [spatialData, setSpatialData] = useState(null);

  const activeLake = MOCK_LAKES[activeLakeId] || MOCK_LAKES["PDGL_THULAGI_01"];

  // ─── MUTATION OBSERVER: STATE DECOUPLING HACK ─────────────────────────────
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const criticalElement = document.querySelector('.border-red-500, .border-orange-500');
      const isNowCritical = !!criticalElement || document.body.innerText.includes('⚠ GLOF RISK RED') || document.body.innerText.includes('⚠ GLOF RISK AMBER') || document.body.innerText.includes('RE-RUN ANALYSIS');
      if (isNowCritical !== isCritical) setIsCritical(isNowCritical);
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [isCritical]);

  // ─── LISTEN FOR DATA UPDATES ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.data && e.detail.data.spatial_data) {
        // setSpatialData(e.detail.data.spatial_data); // Bypassing backend data
      }
    };
    window.addEventListener('vajrawatch-data-update', handler);
    
    // Force mock data unconditionally to bypass any corrupted backend payloads
    setSpatialData(getMockSpatialData());

    return () => window.removeEventListener('vajrawatch-data-update', handler);
  }, [activeLakeId]);

  // ─── MAP CLICK HANDLER ────────────────────────────────────────────────────
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
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#050505', overflow: 'hidden', borderRight: '1px solid #E5E7EB' }}>
      
      {/* ── View Toggle & Toolbar ─────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', right: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
        
        {/* Back button */}
        {onGoBack && (
          <button
            onClick={onGoBack}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB',
              background: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem', fontWeight: 600, color: '#000000',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}
          >
            ← Back
          </button>
        )}

        {/* Segmented control */}
        <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.625rem', padding: '3px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', gap: '2px' }}>
          {[
            { label: '2D Map', icon: MapIcon, value: '2D' },
            { label: '3D Digital Twin', icon: Box, value: '3D' },
          ].map(({ label, icon: Icon, value }) => (
            <button
              key={label}
              onClick={() => setViewMode(value)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: 'none',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
                fontWeight: 700, letterSpacing: '0.05em',
                background: viewMode === value ? '#000000' : 'transparent',
                color: viewMode === value ? '#FFFFFF' : '#6F6F6F',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAP RENDERER ───────────────────────────────────────────── */}
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
          />
        )}
      </ErrorBoundary>

      {/* ── HUD Overlay ─────────────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', pointerEvents: 'none', zIndex: 20 }}>
        {viewMode === '3D' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '0.5rem 1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Box size={13} color={isCritical ? (activeLake.risk_tier === 'RED' ? "#ef4444" : "#eab308") : "#3b82f6"} />
            <span style={{ fontSize: '0.72rem', color: '#6F6F6F', fontWeight: 500 }}>
              Three.js 3D Physics Digital Twin
            </span>
          </div>
        )}
        <div style={{ fontSize: '0.6rem', color: viewMode === '3D' ? '#FFFFFF' : '#6F6F6F', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
          {activeLake.coordinates.lat.toFixed(4)}°N · {activeLake.coordinates.lng.toFixed(4)}°E · Drag to orbit · Scroll to zoom
        </div>
      </div>
    </div>
  );
}
