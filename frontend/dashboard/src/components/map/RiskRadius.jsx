import { useContext, useEffect } from 'react';
import { MapContext, createGeoJSONCircle } from './mapUtils';

const THULAGI_COORDS = [84.4231, 28.5143];
const RISK_RADIUS_KM = 1.0;

export default function RiskRadius() {
  const { map } = useContext(MapContext);

  useEffect(() => {
    if (!map) return;

    const sourceId = 'risk-radius-src';
    const fillLayerId = 'risk-radius-fill';
    const lineLayerId = 'risk-radius-line';

    const circleGeoJSON = createGeoJSONCircle(THULAGI_COORDS, RISK_RADIUS_KM);

    map.addSource(sourceId, {
      type: 'geojson',
      data: circleGeoJSON
    });

    // High warning-red fill layer with opacity
    map.addLayer({
      id: fillLayerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#ef4444',
        'fill-opacity': 0.25
      }
    });

    // Thin dashed line showing radius boundary
    map.addLayer({
      id: lineLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#f87171',
        'line-width': 1.5,
        'line-dasharray': [3, 3]
      }
    });

    return () => {
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map]);

  return null;
}
