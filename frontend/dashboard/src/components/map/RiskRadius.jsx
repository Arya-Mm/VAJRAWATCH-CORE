import { useContext, useEffect } from 'react';
import useLakeStore from '../../store/useLakeStore';
import { MapContext, createGeoJSONCircle } from './mapUtils';

const RISK_RADIUS_KM = 1.0;

export default function RiskRadius() {
  const { map } = useContext(MapContext);
  const selectedLake = useLakeStore((s) => s.selectedLake);

  // 1. Initialize source and layers once when map loads
  useEffect(() => {
    if (!map) return;

    const sourceId = 'risk-radius-src';
    const fillLayerId = 'risk-radius-fill';
    const lineLayerId = 'risk-radius-line';
    const initialGeoJSON = { type: 'FeatureCollection', features: [] };

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: initialGeoJSON
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
    }

    return () => {
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map]);

  // 2. Update source data when coordinates change
  useEffect(() => {
    if (!map || !selectedLake) return;

    const sourceId = 'risk-radius-src';
    const lng = parseFloat(selectedLake.coordinates.lng);
    const lat = parseFloat(selectedLake.coordinates.lat);
    const circleGeoJSON = createGeoJSONCircle([lng, lat], RISK_RADIUS_KM);

    const source = map.getSource(sourceId);
    if (source) {
      source.setData(circleGeoJSON);
    }
  }, [map, selectedLake]);

  return null;
}
