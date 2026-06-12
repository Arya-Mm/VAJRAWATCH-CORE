import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import boundaryData from '../../data/geojson/thulagiBoundary.json';
import { MapContext } from './mapUtils';

const MAP_STYLE = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster',
      source: 'osm-raster',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

// Center of Thulagi Lake
const THULAGI_COORDS = [84.4231, 28.5143];

export default function MapContainer({ children }) {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [mapMode, setMapMode] = useState('2d'); // '2d' | '3d'

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: THULAGI_COORDS,
      zoom: 12.2,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      maxZoom: 18,
      minZoom: 8
    });

    mapInstance.on('load', () => {
      // Add Boundary features from geojson
      const lakeFeature = boundaryData.features.find(
        (f) => f.properties.type === 'lake'
      );
      const monitoringFeature = boundaryData.features.find(
        (f) => f.properties.type === 'monitoring'
      );

      // Add Lake Boundary Source and Layer
      if (lakeFeature) {
        mapInstance.addSource('lake-boundary-src', {
          type: 'geojson',
          data: lakeFeature
        });

        // Semi-transparent cyan fill
        mapInstance.addLayer({
          id: 'lake-boundary-fill',
          type: 'fill',
          source: 'lake-boundary-src',
          paint: {
            'fill-color': '#06b6d4',
            'fill-opacity': 0.35
          }
        });

        // Glowing outline
        mapInstance.addLayer({
          id: 'lake-boundary-line',
          type: 'line',
          source: 'lake-boundary-src',
          paint: {
            'line-color': '#22d3ee',
            'line-width': 2
          }
        });
      }

      // Add Monitoring Boundary Source and Layer
      if (monitoringFeature) {
        mapInstance.addSource('monitoring-boundary-src', {
          type: 'geojson',
          data: monitoringFeature
        });

        // Dashed stroke representing sensor perimeter
        mapInstance.addLayer({
          id: 'monitoring-boundary-line',
          type: 'line',
          source: 'monitoring-boundary-src',
          paint: {
            'line-color': '#10b981',
            'line-width': 1.5,
            'line-dasharray': [4, 4]
          }
        });
      }

      setMap(mapInstance);
    });

    // Resize map when container changes sizes
    const resizeObserver = new ResizeObserver(() => {
      mapInstance.resize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      mapInstance.remove();
    };
  }, []);

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="map-canvas-container" />
      <MapContext.Provider value={{ map, mapMode, setMapMode }}>
        {map && children}
      </MapContext.Provider>
    </div>
  );
}
