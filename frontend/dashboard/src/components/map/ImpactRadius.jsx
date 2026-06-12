import { useContext, useEffect } from 'react';
import useLakeStore from '../../store/useLakeStore';
import { MapContext, createGeoJSONCircle } from './mapUtils';

const IMPACT_RADIUS_KM = 5.0;
const MONITOR_RADIUS_KM = 12.0;

export default function ImpactRadius() {
  const { map } = useContext(MapContext);
  const selectedLake = useLakeStore((s) => s.selectedLake);

  // 1. Initialize once when map loads
  useEffect(() => {
    if (!map) return;

    const impactSrc = 'impact-radius-src';
    const impactFill = 'impact-radius-fill';
    const impactLine = 'impact-radius-line';

    const monitorSrc = 'monitor-radius-src';
    const monitorFill = 'monitor-radius-fill';
    const monitorLine = 'monitor-radius-line';

    const initialGeoJSON = { type: 'FeatureCollection', features: [] };

    if (!map.getSource(impactSrc)) {
      map.addSource(impactSrc, {
        type: 'geojson',
        data: initialGeoJSON
      });

      map.addLayer({
        id: impactFill,
        type: 'fill',
        source: impactSrc,
        paint: {
          'fill-color': '#f97316',
          'fill-opacity': 0.15
        }
      });

      map.addLayer({
        id: impactLine,
        type: 'line',
        source: impactSrc,
        paint: {
          'line-color': '#fb923c',
          'line-width': 1.5,
          'line-dasharray': [4, 4]
        }
      });
    }

    if (!map.getSource(monitorSrc)) {
      map.addSource(monitorSrc, {
        type: 'geojson',
        data: initialGeoJSON
      });

      map.addLayer({
        id: monitorFill,
        type: 'fill',
        source: monitorSrc,
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.05
        }
      });

      map.addLayer({
        id: monitorLine,
        type: 'line',
        source: monitorSrc,
        paint: {
          'line-color': '#34d399',
          'line-width': 1.2,
          'line-dasharray': [5, 5]
        }
      });
    }

    return () => {
      // Cleanup Impact
      if (map.getLayer(impactFill)) map.removeLayer(impactFill);
      if (map.getLayer(impactLine)) map.removeLayer(impactLine);
      if (map.getSource(impactSrc)) map.removeSource(impactSrc);

      // Cleanup Monitor
      if (map.getLayer(monitorFill)) map.removeLayer(monitorFill);
      if (map.getLayer(monitorLine)) map.removeLayer(monitorLine);
      if (map.getSource(monitorSrc)) map.removeSource(monitorSrc);
    };
  }, [map]);

  // 2. Update when selected lake changes
  useEffect(() => {
    if (!map || !selectedLake) return;

    const impactSrc = 'impact-radius-src';
    const monitorSrc = 'monitor-radius-src';

    const lng = parseFloat(selectedLake.coordinates.lng);
    const lat = parseFloat(selectedLake.coordinates.lat);
    const coords = [lng, lat];

    const impactGeoJSON = createGeoJSONCircle(coords, IMPACT_RADIUS_KM);
    const impactSource = map.getSource(impactSrc);
    if (impactSource) {
      impactSource.setData(impactGeoJSON);
    }

    const monitorGeoJSON = createGeoJSONCircle(coords, MONITOR_RADIUS_KM);
    const monitorSource = map.getSource(monitorSrc);
    if (monitorSource) {
      monitorSource.setData(monitorGeoJSON);
    }
  }, [map, selectedLake]);

  return null;
}
