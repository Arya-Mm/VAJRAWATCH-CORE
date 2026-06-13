/**
 * VAJRAWATCH V4 — DigitalTwin3D.jsx
 *
 * Photorealistic 3D Geospatial Terrain Map
 *
 * Stack:
 *   - react-map-gl/maplibre  (MapLibre GL JS React wrapper)
 *   - Esri World Imagery     (satellite raster basemap, key-free)
 *   - AWS Terrarium DEM      (raster-dem elevation, terrarium encoding)
 *   - MapLibre terrain       (3D extrusion via map.setTerrain / map.setFog)
 *   - All existing GeoJSON layers preserved (lake, river, impact)
 *   - Animated river dasharray loop preserved
 *   - isCritical impact layer visibility preserved
 */
import React, { useRef, useEffect, Suspense } from 'react';
import MapGL from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import * as THREE from 'three';
import 'maplibre-gl/dist/maplibre-gl.css';

// ─── Initial viewport: cinematic 3D angle over Thulagi ───────
const INITIAL_PITCH   = 75;
const INITIAL_BEARING = 120;
const TERRAIN_EXAGGERATION = 1.5;

// ─── FALLBACK ─────────────────────────────────────────────────
function MapFallback() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', width: '100%', height: '100%',
      background: '#050505', gap: '1rem',
    }}>
      <div style={{
        width: '32px', height: '32px',
        border: '2px solid rgba(255,255,255,0.08)',
        borderTopColor: '#EF4444',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6F6F6F', fontFamily: 'Inter, monospace' }}>
        Loading Terrain…
      </p>
    </div>
  );
}

// ─── Satellite + Terrain style (key-free) ─────────────────────
// We build a minimal MapLibre style JSON that:
//   1. Sets Esri World Imagery as the ONLY visual raster base
//   2. Declares sky layer for atmospheric realism
// GeoJSON data layers and terrain are injected imperatively on
// style.load to preserve all existing logic.
const SATELLITE_STYLE = {
  version: 8,
  name: 'VajraWatch Satellite Terrain',
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
    'aws-terrain': {
      type: 'raster-dem',
      tiles: [
        'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
      ],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 14,
    },
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
  terrain: {
    source: 'aws-terrain',
    exaggeration: TERRAIN_EXAGGERATION,
  },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function DigitalTwin3D({ activeLake, spatialData, isCritical, onMapClick, onError }) {
  const mapRef = useRef(null);

  const criticalRef = useRef(isCritical);
  useEffect(() => { criticalRef.current = isCritical; }, [isCritical]);

  // ─── THREE.JS CUSTOM LAYER ───────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    const addThreeJSLayer = () => {
      if (map.getLayer('3d-particle-layer')) return;

      const customLayer = {
        id: '3d-particle-layer',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, gl) {
          this.camera = new THREE.Camera();
          this.scene = new THREE.Scene();

          this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
          });
          this.renderer.autoClear = false;

          const originLngLat = [activeLake.coordinates.lng, activeLake.coordinates.lat];
          const origin = maplibregl.MercatorCoordinate.fromLngLat(originLngLat, 0);

          this.group = new THREE.Group();
          const scale = origin.meterInMercatorCoordinateUnits();
          
          this.group.position.set(origin.x, origin.y, origin.z);
          this.group.scale.set(scale, -scale, scale);

          // Halo Ring
          this.ringRef = new THREE.Mesh(
            new THREE.RingGeometry(300, 400, 32),
            new THREE.MeshBasicMaterial({ color: 0x10B981, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })
          );
          this.group.add(this.ringRef);

          // Particles
          this.particleCount = 2000;
          this.positions = new Float32Array(this.particleCount * 3);
          this.speeds = new Float32Array(this.particleCount);
          
          for (let i = 0; i < this.particleCount; i++) {
             this.positions[i * 3] = (Math.random() - 0.5) * 400;
             this.positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
             this.positions[i * 3 + 2] = 50 + (Math.random() - 0.5) * 50;
             this.speeds[i] = Math.random() * 0.5 + 0.2;
          }
          
          this.particleGeo = new THREE.BufferGeometry();
          this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
          
          this.particles = new THREE.Points(
            this.particleGeo,
            new THREE.PointsMaterial({
              color: 0x06B6D4,
              size: 25,
              transparent: true,
              opacity: 0.8,
              blending: THREE.AdditiveBlending,
              depthWrite: false
            })
          );
          this.group.add(this.particles);

          this.scene.add(this.group);
        },
        render: function (gl, matrix) {
          const m = new THREE.Matrix4().fromArray(matrix);
          this.camera.projectionMatrix = m;

          const time = performance.now() / 1000;
          
          // Halo Pulse
          const scale = 1 + Math.sin(time * 3) * 0.2;
          this.ringRef.scale.set(scale, scale, scale);
          this.ringRef.material.opacity = 1 - (scale - 1) * 3;
          
          const isCrit = criticalRef.current;
          this.ringRef.material.color.setHex(isCrit ? 0xEF4444 : 0x10B981);
          
          if (isCrit) {
            this.particles.visible = true;
            const positions = this.particleGeo.attributes.position.array;
            for (let i = 0; i < this.particleCount; i++) {
              // Flow downstream: Thulagi flows roughly South-West
              positions[i * 3] -= 15 * this.speeds[i];     // West
              positions[i * 3 + 1] -= 20 * this.speeds[i]; // South
              positions[i * 3 + 2] -= 2 * this.speeds[i];  // Down

              const dx = positions[i * 3];
              const dy = positions[i * 3 + 1];
              if (dx * dx + dy * dy > 4000 * 4000) {
                positions[i * 3] = (Math.random() - 0.5) * 400;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
                positions[i * 3 + 2] = 50 + (Math.random() - 0.5) * 50;
              }
            }
            this.particleGeo.attributes.position.needsUpdate = true;
          } else {
            this.particles.visible = false;
          }

          this.renderer.resetState();
          this.renderer.render(this.scene, this.camera);
          
          map.triggerRepaint();
        }
      };

      map.addLayer(customLayer);
    };

    if (map.isStyleLoaded()) {
      addThreeJSLayer();
    } else {
      map.once('style.load', addThreeJSLayer);
    }
  }, [activeLake]);

  // ─── INJECT GeoJSON LAYERS AFTER STYLE LOADS ──────────────────
  // We must wait for the satellite style to finish loading before
  // injecting our GeoJSON sources/layers on top of it.
  useEffect(() => {
    if (!mapRef.current || !spatialData) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    const addLayers = () => {
      // Guard: skip if already added
      if (map.getSource('glof-data')) {
        map.getSource('glof-data').setData(spatialData);
        return;
      }

      // ── GeoJSON Source ──
      map.addSource('glof-data', {
        type: 'geojson',
        data: spatialData,
      });

      // ── Lake fill — icy cyan blue ──
      map.addLayer({
        id: 'lake-layer',
        type: 'fill',
        source: 'glof-data',
        filter: ['==', 'layer_type', 'lake'],
        paint: {
          'fill-color': '#06b6d4',
          'fill-opacity': 0.65,
          'fill-outline-color': '#ffffff',
        },
      });

      // ── Lake outline (crisp border on 3D terrain) ──
      map.addLayer({
        id: 'lake-outline',
        type: 'line',
        source: 'glof-data',
        filter: ['==', 'layer_type', 'lake'],
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.5,
          'line-opacity': 0.7,
        },
      });

      // ── River / flow path — animated dasharray ──
      map.addLayer({
        id: 'river-layer',
        type: 'line',
        source: 'glof-data',
        filter: ['==', 'layer_type', 'river'],
        paint: {
          'line-color': ['case', ['==', ['get', 'status'], 'critical'], '#38bdf8', '#0ea5e9'],
          'line-width': 4,
          'line-dasharray': [2, 2],
        },
      });

      // ── Impact zone fill ──
      map.addLayer({
        id: 'impact-layer',
        type: 'fill',
        source: 'glof-data',
        filter: ['==', 'layer_type', 'impact_boundary'],
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.18,
        },
        layout: {
          visibility: isCritical ? 'visible' : 'none',
        },
      });

      // ── Impact zone dashed outline ──
      map.addLayer({
        id: 'impact-boundary-line',
        type: 'line',
        source: 'glof-data',
        filter: ['==', 'layer_type', 'impact_boundary'],
        paint: {
          'line-color': '#b91c1c',
          'line-width': 2,
          'line-dasharray': [4, 4],
        },
        layout: {
          visibility: isCritical ? 'visible' : 'none',
        },
      });
    };

    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      map.once('style.load', addLayers);
    }
  }, [spatialData]);

  // ─── IMPACT LAYER VISIBILITY ──────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map || !map.getLayer) return;
    const vis = isCritical ? 'visible' : 'none';
    if (map.getLayer('impact-layer'))         map.setLayoutProperty('impact-layer', 'visibility', vis);
    if (map.getLayer('impact-boundary-line')) map.setLayoutProperty('impact-boundary-line', 'visibility', vis);
  }, [isCritical]);

  // ─── ANIMATED RIVER DASHARRAY ─────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    let animId;
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
      animId = requestAnimationFrame(animate);
    }

    animate();
    return () => { active = false; cancelAnimationFrame(animId); };
  }, []);

  // ─── CAMERA: FLY TO ACTIVE LAKE ──────────────────────────────
  useEffect(() => {
    try {
      const map = mapRef.current?.getMap?.();
      if (!map) return;
      map.flyTo({
        center:   [activeLake.coordinates.lng, activeLake.coordinates.lat],
        pitch:    INITIAL_PITCH,
        bearing:  INITIAL_BEARING,
        zoom:     12,
        duration: 2200,
        essential: true,
      });
    } catch (_) { /* map not ready */ }
  }, [activeLake.coordinates.lng, activeLake.coordinates.lat]);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
      <Suspense fallback={<MapFallback />}>
        <MapGL
          ref={mapRef}
          initialViewState={{
            longitude: activeLake.coordinates.lng,
            latitude:  activeLake.coordinates.lat,
            zoom:      12,
            pitch:     INITIAL_PITCH,
            bearing:   INITIAL_BEARING,
          }}
          mapStyle={SATELLITE_STYLE}
          interactive
          onClick={onMapClick}
          interactiveLayerIds={['lake-layer']}
          cursor="crosshair"
          onError={(e) => {
            console.error('[DigitalTwin3D]', e);
            if (onError) onError();
          }}
        />
      </Suspense>
    </div>
  );
}
