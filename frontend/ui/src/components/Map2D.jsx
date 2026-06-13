import React, { useRef, useEffect, useState } from 'react';
import MapGL, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function Map2D({ activeLake, isCritical, onMapClick, onError }) {
  const mapRef = useRef(null);
  const [geoData, setGeoData] = useState(null);

  // 1. Fetch the REAL geospatial GeoJSON data directly from the backend API
  useEffect(() => {
    let active = true;
    const fetchGeoData = async () => {
      try {
        const res = await fetch(`http://localhost:8000/risk/${activeLake.id}`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        
        if (active && data.spatial_data) {
          setGeoData(data.spatial_data);
          
          // 3. Dynamically fly to the bounding box of the fetched real data
          const map = mapRef.current?.getMap();
          if (map && data.spatial_data.features) {
            let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
            let hasData = false;
            data.spatial_data.features.forEach(f => {
              if (f.geometry.type === 'Polygon') {
                f.geometry.coordinates[0].forEach(coord => {
                  if (coord[0] < minLng) minLng = coord[0];
                  if (coord[1] < minLat) minLat = coord[1];
                  if (coord[0] > maxLng) maxLng = coord[0];
                  if (coord[1] > maxLat) maxLat = coord[1];
                  hasData = true;
                });
              }
            });
            if (hasData) {
              map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 100, duration: 2500 });
            }
          }
        }
      } catch (err) {
        console.error('[Map2D] Failed to fetch real geo data:', err);
      }
    };
    fetchGeoData();
    return () => { active = false; };
  }, [activeLake]);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
      <MapGL
        ref={mapRef}
        initialViewState={{
          longitude: 84.48,
          latitude: 28.54,
          zoom: 12,
        }}
        mapStyle={DARK_STYLE}
        interactive
        onClick={onMapClick}
        cursor="crosshair"
        onError={(e) => {
          console.error('[Map2D]', e);
          if (onError) onError();
        }}
      >
        {geoData && (
          <Source id="backend-data" type="geojson" data={geoData}>
            {/* Lake Polygon */}
            <Layer
              id="lake-fill"
              type="fill"
              filter={['==', ['get', 'layer_type'], 'lake']}
              paint={{
                'fill-color': '#06B6D4',
                'fill-opacity': 0.8,
              }}
            />
            {/* Lake Outline */}
            <Layer
              id="lake-outline"
              type="line"
              filter={['==', ['get', 'layer_type'], 'lake']}
              paint={{
                'line-color': '#FFFFFF',
                'line-width': 1.5,
              }}
            />
            {/* 2. Symbol Layer for Lake Name */}
            <Layer
              id="lake-label"
              type="symbol"
              filter={['==', ['get', 'layer_type'], 'lake']}
              layout={{
                'text-field': ['get', 'name'],
                'text-size': 14,
                'text-anchor': 'bottom',
                'text-offset': [0, -1]
              }}
              paint={{
                'text-color': '#FFFFFF',
                'text-halo-color': '#000000',
                'text-halo-width': 1.5
              }}
            />
            {/* Hazard Zone Polygon */}
            <Layer
              id="hazard-fill"
              type="fill"
              filter={['==', ['get', 'layer_type'], 'impact_boundary']}
              paint={{
                'fill-color': '#EF4444',
                'fill-opacity': 0.2,
              }}
            />
          </Source>
        )}
      </MapGL>
    </div>
  );
}
