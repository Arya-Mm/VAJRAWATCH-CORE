import { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map as MapIcon, Box, Layers, Navigation2, Maximize2 } from 'lucide-react';
import MapGL, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import ErrorBoundary from './ErrorBoundary';
import { MOCK_LAKES } from '../data/mockData';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const MAP_VIEWS = {
  '2D': {
    pitch: 0,
    bearing: 0,
    zoom: 11,
  },
  '3D': {
    pitch: 75,
    bearing: 120,
    zoom: 12.5,
  }
};

// ─── FALLBACK SCREENS ───────────────────────────────────────────────────────
function MapFallback() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#0a0f1e', gap: '1rem' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid #334155', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#475569' }}>Loading Map…</p>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function MapContainer({ activeLakeId, setActiveLakeId }) {
  const [viewMode, setViewMode] = useState('2D');
  const [isCritical, setIsCritical] = useState(false);
  const mapRef = useRef(null);

  const activeLake = MOCK_LAKES[activeLakeId] || MOCK_LAKES["PDGL_THULAGI_01"];

  // ─── MUTATION OBSERVER: STATE DECOUPLING HACK ─────────────────────────────
  // Listens to the DOM for changes indicating the system hit "CRITICAL" state
  // This allows MapContainer to update the marker colour without modifying <Sidebar> internally
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Look for the critical red styling or exact text used in Sidebar Phase 4/5
      const criticalElement = document.querySelector('.bg-red-500\\/15.text-red-500, .bg-orange-500\\/15.text-orange-500');
      const isNowCritical = !!criticalElement || document.body.innerText.includes('⚠ GLOF RISK RED') || document.body.innerText.includes('⚠ GLOF RISK AMBER') || document.body.innerText.includes('RE-RUN ANALYSIS');
      
      if (isNowCritical !== isCritical) {
        setIsCritical(isNowCritical);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [isCritical]);

  // ─── GEOJSON GENERATION ───────────────────────────────────────────────────
  const lakesGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: Object.values(MOCK_LAKES).map(lake => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lake.coordinates.lng, lake.coordinates.lat]
      },
      properties: {
        id: lake.lake_id,
        name: lake.name,
      }
    }))
  }), []);

  // ─── ACTIVE LAKE GEOMETRY (Polygon & Flow) ────────────────────────────────
  const polygonGeoJson = useMemo(() => {
    if (!activeLake?.polygon) return { type: 'FeatureCollection', features: [] };
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: activeLake.polygon }
      }]
    };
  }, [activeLake]);

  const flowGeoJson = useMemo(() => {
    if (!activeLake?.flow_path) return { type: 'FeatureCollection', features: [] };
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: activeLake.flow_path }
      }]
    };
  }, [activeLake]);

  // ─── CAMERA ANIMATION (View Mode & Active Lake changes) ───────────────────
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const targetView = MAP_VIEWS[viewMode];
      
      map.flyTo({
        center: [activeLake.coordinates.lng, activeLake.coordinates.lat],
        pitch: targetView.pitch,
        bearing: targetView.bearing,
        zoom: targetView.zoom,
        duration: 2000, // Smooth 2s camera swing as requested
        essential: true,
      });
    }
  }, [viewMode, activeLake.coordinates.lng, activeLake.coordinates.lat]);

  // ─── MAP CLICK HANDLER ────────────────────────────────────────────────────
  const onMapClick = (event) => {
    const features = event.features;
    if (features && features.length > 0) {
      const clickedLakeId = features[0].properties.id;
      if (clickedLakeId && clickedLakeId !== activeLakeId) {
        setActiveLakeId(clickedLakeId);
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0f1e', overflow: 'hidden', borderRight: '1px solid #1e293b' }}>
      
      {/* ── View Toggle ─────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', right: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
        
        {/* Segmented control */}
        <div style={{ display: 'flex', background: 'rgba(17,24,39,0.9)', border: '1px solid #334155', borderRadius: '0.625rem', padding: '3px', backdropFilter: 'blur(12px)', gap: '2px' }}>
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
                background: viewMode === value ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : 'transparent',
                color: viewMode === value ? 'white' : '#64748b',
                boxShadow: viewMode === value ? '0 2px 8px rgba(59,130,246,0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Icon toolbar */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[Layers, Navigation2, Maximize2].map((Icon, i) => (
            <button
              key={i}
              style={{
                width: '36px', height: '36px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'rgba(17,24,39,0.9)',
                border: '1px solid #334155', borderRadius: '0.5rem', cursor: 'pointer',
                color: '#64748b', backdropFilter: 'blur(12px)',
              }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* ── MAPLIBRE BASE ───────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        <ErrorBoundary fallback={<MapFallback />} onError={() => setViewMode('2D')}>
          <Suspense fallback={<MapFallback />}>
            <MapGL
              ref={mapRef}
              initialViewState={{
                longitude: activeLake.coordinates.lng,
                latitude: activeLake.coordinates.lat,
                ...MAP_VIEWS[viewMode]
              }}
              mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
              interactive
              terrain={viewMode === '3D' ? { source: 'terrain-source', exaggeration: 1.5 } : undefined}
              onClick={onMapClick}
              interactiveLayerIds={['unselected-lakes']}
              cursor="crosshair"
            >
              {/* ── 3D TERRAIN SOURCES ── */}
              {viewMode === '3D' && (
                <>
                  <Source
                    id="satellite"
                    type="raster"
                    tiles={['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']}
                    tileSize={256}
                  />
                  <Source
                    id="terrain-source"
                    type="raster-dem"
                    tiles={['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']}
                    encoding="terrarium"
                    tileSize={256}
                  />
                  <Layer
                    id="satellite-layer"
                    type="raster"
                    source="satellite"
                    beforeId="watername_ocean" 
                  />
                </>
              )}

              {/* ── PDGL GEOJSON LAYERS ── */}
              <Source id="pdgl-points" type="geojson" data={lakesGeoJSON}>
                
                {/* Layer for Unselected Lakes: Muted to preserve Color Singularity */}
                <Layer
                  id="unselected-lakes"
                  type="circle"
                  filter={['!=', ['get', 'id'], activeLakeId]}
                  paint={{
                    'circle-radius': 4,
                    'circle-color': '#334155', // UI Border color
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#1e293b'
                  }}
                />

                {/* Layer for Selected Lake: Dominates visual attention */}
                <Layer
                  id="selected-lake-core"
                  type="circle"
                  filter={['==', ['get', 'id'], activeLakeId]}
                  paint={{
                    'circle-radius': 8,
                    'circle-color': isCritical ? (activeLake.risk_tier === 'RED' ? '#ef4444' : '#f59e0b') : '#3b82f6',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
                  }}
                />
                
                {/* Layer for Labels (All Lakes) */}
                <Layer
                  id="pdgl-labels"
                  type="symbol"
                  layout={{
                    'text-field': ['get', 'name'],
                    'text-font': ['Open Sans Regular'],
                    'text-size': 12,
                    'text-offset': [0, 1.5],
                    'text-anchor': 'top'
                  }}
                  paint={{
                    'text-color': '#94a3b8',
                    'text-halo-color': '#0a0f1e',
                    'text-halo-width': 2
                  }}
                />
              </Source>

              {/* ── ACTIVE LAKE POLYGON ── */}
              <Source id="active-lake-polygon" type="geojson" data={polygonGeoJson}>
                <Layer
                  id="lake-fill"
                  type="fill"
                  paint={{ 'fill-color': '#3b82f6', 'fill-opacity': 0.4 }}
                />
              </Source>

              {/* ── ACTIVE RIVER FLOW ── */}
              <Source id="active-river-flow" type="geojson" data={flowGeoJson}>
                <Layer
                  id="river-line"
                  type="line"
                  paint={{
                    'line-color': '#ef4444',
                    'line-width': 3,
                    'line-opacity': 0.8,
                    'line-dasharray': [2, 2]
                  }}
                />
              </Source>

            </MapGL>
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* ── HUD Overlay ─────────────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', pointerEvents: 'none', zIndex: 20 }}>
        {viewMode === '3D' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(17,24,39,0.85)', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem 1rem', backdropFilter: 'blur(8px)' }}>
            <Box size={13} color={isCritical ? (activeLake.risk_tier === 'RED' ? "#ef4444" : "#f59e0b") : "#3b82f6"} />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
              MapLibre 3D Terrain · Satellite Base
            </span>
          </div>
        )}
        <div style={{ fontSize: '0.6rem', color: '#334155', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
          {activeLake.coordinates.lat.toFixed(4)}°N · {activeLake.coordinates.lng.toFixed(4)}°E · Drag to orbit · Scroll to zoom
        </div>
      </div>
    </div>
  );
}