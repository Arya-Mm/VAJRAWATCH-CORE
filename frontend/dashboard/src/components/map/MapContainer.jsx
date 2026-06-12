import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import boundaryData from '../../data/geojson/thulagiBoundary.json';
import { MapContext } from './mapUtils';
import useLakeStore from '../../store/useLakeStore';

const MAP_SOURCES = {
  'street': {
    type: 'raster',
    tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'],
    tileSize: 256,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  },
  'terrain': {
    type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256,
    attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, USGS, NOAA'
  },
  'satellite': {
    type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
  }
};

const MAP_STYLE = {
  version: 8,
  sources: {
    'street-source': MAP_SOURCES['street'],
    'terrain-source': MAP_SOURCES['terrain'],
    'satellite-source': MAP_SOURCES['satellite']
  },
  layers: [
    {
      id: 'street-layer',
      type: 'raster',
      source: 'street-source',
      layout: { visibility: 'none' },
      minzoom: 0,
      maxzoom: 19
    },
    {
      id: 'terrain-layer',
      type: 'raster',
      source: 'terrain-source',
      layout: { visibility: 'visible' }, // Default
      minzoom: 0,
      maxzoom: 19
    },
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite-source',
      layout: { visibility: 'none' },
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

// Center of Thulagi Lake
const THULAGI_COORDS = [84.4231, 28.5143];

// Helper to generate dynamic boundary GeoJSON for each lake
function getLakeBoundaryGeoJSON(lakeId, centerLng, centerLat) {
  if (lakeId === 'PDGL_THULAGI_01') {
    return boundaryData;
  }
  
  const makeOctagon = (lng, lat, radius) => {
    const coords = [];
    for (let i = 0; i <= 8; i++) {
      const angle = (i * Math.PI) / 4;
      coords.push([
        lng + Math.cos(angle) * radius * 1.25,
        lat + Math.sin(angle) * radius
      ]);
    }
    return [coords];
  };

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "lake-boundary",
        properties: {
          name: "Lake Shoreline",
          type: "lake"
        },
        geometry: {
          type: "Polygon",
          coordinates: makeOctagon(centerLng, centerLat, 0.004)
        }
      },
      {
        type: "Feature",
        id: "monitoring-boundary",
        properties: {
          name: "Surveillance & Monitoring Zone",
          type: "monitoring"
        },
        geometry: {
          type: "Polygon",
          coordinates: makeOctagon(centerLng, centerLat, 0.012)
        }
      }
    ]
  };
}

export default function MapContainer({ children }) {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [mapMode, setMapMode] = useState('2d'); // '2d' | '3d'
  const selectedLake = useLakeStore((s) => s.selectedLake);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: THULAGI_COORDS,
      zoom: 12.2,
      pitch: 20, // Tilt slightly on load to showcase 3D topography depth
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

      // Add raster-dem source for Mapzen Terrarium elevation tiles
      mapInstance.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256
      });

      // Enable terrain 3D exaggeration
      mapInstance.setTerrain({
        source: 'terrain-dem',
        exaggeration: 1.1
      });

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

  // React to selected lake coordinate change (flyTo + reposition boundary layers)
  useEffect(() => {
    if (!map || !selectedLake) return;

    const lng = parseFloat(selectedLake.coordinates.lng);
    const lat = parseFloat(selectedLake.coordinates.lat);

    map.flyTo({
      center: [lng, lat],
      zoom: 12.2,
      speed: 1.2,
      curve: 1.4,
      essential: true
    });

    const geoData = getLakeBoundaryGeoJSON(selectedLake.lakeId, lng, lat);
    const lakeFeature = geoData.features.find((f) => f.properties.type === 'lake');
    const monitoringFeature = geoData.features.find((f) => f.properties.type === 'monitoring');

    const lakeSource = map.getSource('lake-boundary-src');
    if (lakeSource && lakeFeature) {
      lakeSource.setData(lakeFeature);
    }

    const monitoringSource = map.getSource('monitoring-boundary-src');
    if (monitoringSource && monitoringFeature) {
      monitoringSource.setData(monitoringFeature);
    }
  }, [map, selectedLake]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="map-canvas-container" />
      <MapContext.Provider value={{ map, mapMode, setMapMode }}>
        {map && children}
      </MapContext.Provider>
    </div>
  );
}
