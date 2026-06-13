import React, { useRef, useEffect, Suspense } from 'react';
import MapGL from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// ─── FALLBACK SCREENS ───────────────────────────────────────────────────────
function MapFallback() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#F3F4F6', gap: '1rem' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid #E5E7EB', borderTopColor: '#000000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6F6F6F' }}>Loading Map…</p>
    </div>
  );
}

export default function Map2D({ activeLake, spatialData, isCritical, onMapClick, onError }) {
  const mapRef = useRef(null);

  // ─── IMPERATIVE MAP LAYER INJECTION ───────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !spatialData) return;
    const map = mapRef.current.getMap();
    if (!map || !map.getLayer) return;

    const addLayers = () => {
        if (map.getSource('glof-data')) {
            map.getSource('glof-data').setData(spatialData);
            return;
        }

        map.addSource('glof-data', {
            type: 'geojson',
            data: spatialData
        });

        // Add Lake Layer - High fidelity icy/cyan blue polygon
        map.addLayer({
            id: 'lake-layer',
            type: 'fill',
            source: 'glof-data',
            filter: ['==', 'layer_type', 'lake'],
            paint: { 
                'fill-color': '#06b6d4', 
                'fill-opacity': 0.6,
                'fill-outline-color': '#ffffff'
            }
        });

        // Add River Layer - Downstream river paths
        map.addLayer({
            id: 'river-layer',
            type: 'line',
            source: 'glof-data',
            filter: ['==', 'layer_type', 'river'],
            paint: { 
                'line-color': ['case', ['==', ['get', 'status'], 'critical'], '#38bdf8', '#0ea5e9'], 
                'line-width': 4,
                'line-dasharray': [2, 2]
            }
        });

        // Add Impact Boundary Layer - Danger red fill
        map.addLayer({
            id: 'impact-layer',
            type: 'fill',
            source: 'glof-data',
            filter: ['==', 'layer_type', 'impact_boundary'],
            paint: { 
                'fill-color': '#ef4444', 
                'fill-opacity': 0.15,
            }
        });

        // Add Impact Boundary Dashed Line - Danger red outline
        map.addLayer({
            id: 'impact-boundary-line',
            type: 'line',
            source: 'glof-data',
            filter: ['==', 'layer_type', 'impact_boundary'],
            paint: {
                'line-color': '#b91c1c',
                'line-width': 2,
                'line-dasharray': [4, 4]
            }
        });

        // Initialize visibility
        if (map.getLayer('impact-layer')) {
            map.setLayoutProperty('impact-layer', 'visibility', isCritical ? 'visible' : 'none');
            map.setLayoutProperty('impact-boundary-line', 'visibility', isCritical ? 'visible' : 'none');
        }
    };

    if (map.isStyleLoaded()) {
        addLayers();
    } else {
        map.on('style.load', addLayers);
    }
  }, [spatialData]);

  // ─── IMPACT BOUNDARY VISIBILITY ───────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map || !map.getLayer) return;
    if (map.getLayer('impact-layer')) {
        map.setLayoutProperty('impact-layer', 'visibility', isCritical ? 'visible' : 'none');
        map.setLayoutProperty('impact-boundary-line', 'visibility', isCritical ? 'visible' : 'none');
    }
  }, [isCritical]);

  // ─── RIVER ANIMATION LOOP ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    let animationId;
    let step = 0;
    let active = true;
    
    function animate() {
      if (!active) return;
      try {
        const map = mapRef.current?.getMap?.();
        if (map && map.isStyleLoaded() && map.getLayer('river-layer')) {
          step = (step + 1) % 10;
          map.setPaintProperty('river-layer', 'line-dasharray', [step, 4, 3]);
        }
      } catch (_) { /* map unmounted */ }
      animationId = requestAnimationFrame(animate);
    }
    
    animate();
    return () => { active = false; cancelAnimationFrame(animationId); };
  }, []);

  // ─── CAMERA ANIMATION ─────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) {
      try {
        const map = mapRef.current?.getMap?.();
        if (!map) return;
        
        map.flyTo({
          center: [activeLake.coordinates.lng, activeLake.coordinates.lat],
          pitch: 0,
          bearing: 0,
          zoom: 11,
          duration: 2000,
          essential: true,
        });
      } catch (e) {
        // Map unmounted
      }
    }
  }, [activeLake.coordinates.lng, activeLake.coordinates.lat]);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
      <Suspense fallback={<MapFallback />}>
        <MapGL
          ref={mapRef}
          initialViewState={{
            longitude: activeLake.coordinates.lng,
            latitude: activeLake.coordinates.lat,
            pitch: 0,
            bearing: 0,
            zoom: 11,
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          interactive
          onClick={onMapClick}
          interactiveLayerIds={['lake-layer']}
          cursor="crosshair"
          onError={(e) => {
            console.error(e);
            if (onError) onError();
          }}
        />
      </Suspense>
    </div>
  );
}
