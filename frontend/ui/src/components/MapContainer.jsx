import { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map as MapIcon, Box, Layers, Navigation2, Maximize2 } from 'lucide-react';
import MapGL, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import ErrorBoundary from './ErrorBoundary';
import { MOCK_LAKES } from '../data/mockData';
import { fetchRiskData } from '../services/api'; // Import api to get initial mock data if needed

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#F3F4F6', gap: '1rem' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid #E5E7EB', borderTopColor: '#000000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6F6F6F' }}>Loading Map…</p>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function MapContainer({ activeLakeId, setActiveLakeId }) {
  const [viewMode, setViewMode] = useState('2D');
  const [isCritical, setIsCritical] = useState(false);
  const [spatialData, setSpatialData] = useState(null);
  
  const mapRef = useRef(null);

  const activeLake = MOCK_LAKES[activeLakeId] || MOCK_LAKES["PDGL_THULAGI_01"];

  // ─── MUTATION OBSERVER: STATE DECOUPLING HACK ─────────────────────────────
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Look for the critical styling/text
      const criticalElement = document.querySelector('.border-red-500, .border-orange-500');
      const isNowCritical = !!criticalElement || document.body.innerText.includes('⚠ GLOF RISK RED') || document.body.innerText.includes('⚠ GLOF RISK AMBER') || document.body.innerText.includes('RE-RUN ANALYSIS');
      
      if (isNowCritical !== isCritical) {
        setIsCritical(isNowCritical);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [isCritical]);

  // ─── LISTEN FOR DATA UPDATES (State Decoupling Hack #2) ───────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.data && e.detail.data.spatial_data) {
        setSpatialData(e.detail.data.spatial_data);
      }
    };
    window.addEventListener('vajrawatch-data-update', handler);
    
    // Also trigger an initial fetch so the map isn't empty on load
    fetchRiskData(activeLakeId).then(data => {
      if (data && data.spatial_data) setSpatialData(data.spatial_data);
    });

    return () => window.removeEventListener('vajrawatch-data-update', handler);
  }, [activeLakeId]);

  // ─── IMPERATIVE MAP LAYER INJECTION ───────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !spatialData) return;
    const map = mapRef.current.getMap();

    const addLayers = () => {
        if (map.getSource('glof-data')) {
            map.getSource('glof-data').setData(spatialData);
            return;
        }

        map.addSource('glof-data', {
            type: 'geojson',
            data: spatialData
        });

        // Add Lake Layer
        map.addLayer({
            id: 'lake-layer',
            type: 'fill',
            source: 'glof-data',
            filter: ['==', 'layer_type', 'lake'],
            paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.6 }
        });

        // Add River Layer
        map.addLayer({
            id: 'river-layer',
            type: 'line',
            source: 'glof-data',
            filter: ['==', 'layer_type', 'river'],
            paint: { 
                'line-color': ['case', ['==', ['get', 'status'], 'critical'], '#ef4444', '#0ea5e9'], 
                'line-width': 4,
                'line-dasharray': [2, 2]
            }
        });

        // Add Impact Boundary Layer
        map.addLayer({
            id: 'impact-layer',
            type: 'fill',
            source: 'glof-data',
            filter: ['==', 'layer_type', 'impact_boundary'],
            paint: { 
                'fill-color': '#ef4444', 
                'fill-opacity': 0.15,
                'fill-outline-color': '#ef4444'
            }
        });

        // Initialize visibility correctly based on current state
        if (map.getLayer('impact-layer')) {
            map.setLayoutProperty('impact-layer', 'visibility', isCritical ? 'visible' : 'none');
        }
    };

    if (map.isStyleLoaded()) {
        addLayers();
    } else {
        map.on('style.load', addLayers);
    }
  }, [spatialData]); // Re-run if spatialData updates

  // ─── IMPACT BOUNDARY VISIBILITY ───────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (map.getLayer('impact-layer')) {
        map.setLayoutProperty('impact-layer', 'visibility', isCritical ? 'visible' : 'none');
    }
  }, [isCritical]);

  // ─── RIVER ANIMATION LOOP ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    
    let animationId;
    let step = 0;
    
    function animate() {
      if (map.isStyleLoaded() && map.getLayer('river-layer')) {
        step = (step + 1) % 10;
        map.setPaintProperty('river-layer', 'line-dasharray', [step, 4, 3]);
      }
      animationId = requestAnimationFrame(animate);
    }
    
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);



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
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#F9FAFB', overflow: 'hidden', borderRight: '1px solid #E5E7EB' }}>
      
      {/* ── View Toggle ─────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', right: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
        
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

        {/* Icon toolbar */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[Layers, Navigation2, Maximize2].map((Icon, i) => (
            <button
              key={i}
              style={{
                width: '36px', height: '36px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: '#FFFFFF',
                border: '1px solid #E5E7EB', borderRadius: '0.5rem', cursor: 'pointer',
                color: '#6F6F6F', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
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
              mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
              interactive
              terrain={viewMode === '3D' ? { source: 'terrain-source', exaggeration: 1.5 } : undefined}
              onClick={onMapClick}
              interactiveLayerIds={['lake-layer']}
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



            </MapGL>
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* ── HUD Overlay ─────────────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', pointerEvents: 'none', zIndex: 20 }}>
        {viewMode === '3D' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '0.5rem 1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Box size={13} color={isCritical ? (activeLake.risk_tier === 'RED' ? "#ef4444" : "#eab308") : "#3b82f6"} />
            <span style={{ fontSize: '0.72rem', color: '#6F6F6F', fontWeight: 500 }}>
              MapLibre 3D Terrain · Satellite Base
            </span>
          </div>
        )}
        <div style={{ fontSize: '0.6rem', color: '#6F6F6F', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
          {activeLake.coordinates.lat.toFixed(4)}°N · {activeLake.coordinates.lng.toFixed(4)}°E · Drag to orbit · Scroll to zoom
        </div>
      </div>
    </div>
  );
}
