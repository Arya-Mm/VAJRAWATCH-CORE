import { useContext, useEffect } from 'react';
import { MapContext, createGeoJSONCircle } from './mapUtils';

const THULAGI_COORDS = [84.4231, 28.5143];
const IMPACT_RADIUS_KM = 5.0;
const MONITOR_RADIUS_KM = 12.0;

export default function ImpactRadius() {
  const { map } = useContext(MapContext);

  useEffect(() => {
    if (!map) return;

    const impactSrc = 'impact-radius-src';
    const impactFill = 'impact-radius-fill';
    const impactLine = 'impact-radius-line';

    const monitorSrc = 'monitor-radius-src';
    const monitorFill = 'monitor-radius-fill';
    const monitorLine = 'monitor-radius-line';

    // 1. Add Impact Radius (5km, Orange)
    const impactGeoJSON = createGeoJSONCircle(THULAGI_COORDS, IMPACT_RADIUS_KM);
    map.addSource(impactSrc, {
      type: 'geojson',
      data: impactGeoJSON
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

    // 2. Add Monitoring Radius (12km, Teal/Green)
    const monitorGeoJSON = createGeoJSONCircle(THULAGI_COORDS, MONITOR_RADIUS_KM);
    map.addSource(monitorSrc, {
      type: 'geojson',
      data: monitorGeoJSON
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

  return null;
}
