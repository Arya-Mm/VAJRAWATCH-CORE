import { useContext, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import useLakeStore from '../../store/useLakeStore';
import { MapContext } from './mapUtils';

export default function LakeMarker() {
  const { map } = useContext(MapContext);
  const selectedLake = useLakeStore((s) => s.selectedLake);
  const riskTier = useLakeStore((s) => s.riskTier);
  const analysisState = useLakeStore((s) => s.analysisState);

  const markerRef = useRef(null);
  const popupRef = useRef(null);

  const isScanning = analysisState === 'loading';
  const tierLower = riskTier.toLowerCase();

  // Coordinates from mock
  const { lat, lng } = selectedLake.coordinates ?? {
    lat: '28.5143°N',
    lng: '84.4231°E'
  };

  // 1. Initialize Marker and Popup
  useEffect(() => {
    if (!map) return;

    // Create marker container element
    const el = document.createElement('div');
    el.className = 'map-lake-marker';
    el.innerHTML = `
      <div class="marker-pulse-ring"></div>
      <div class="marker-core"></div>
    `;

    // Create Popup
    const popup = new maplibregl.Popup({
      offset: 25,
      closeButton: false,
      closeOnClick: false,
      anchor: 'bottom'
    });

    popupRef.current = popup;

    // Add Marker to map
    const marker = new maplibregl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([84.4231, 28.5143])
      .setPopup(popup)
      .addTo(map);

    markerRef.current = marker;

    // Open popup by default so the judge immediately sees the data card
    marker.togglePopup();

    return () => {
      marker.remove();
      popup.remove();
      markerRef.current = null;
      popupRef.current = null;
    };
  }, [map]);

  // 2. Reactively update popup HTML when status/tier changes
  useEffect(() => {
    if (!popupRef.current) return;

    const statusText = isScanning ? 'SCANNING' : 'ACTIVE';
    const statusClass = isScanning ? 'status-scanning' : 'status-active';

    popupRef.current.setHTML(`
      <div class="map-popup-card">
        <h3 class="popup-lake-name">${selectedLake.name}</h3>
        <div class="popup-grid">
          <div class="popup-row">
            <span class="popup-label">Risk Level</span>
            <span class="popup-val tier-badge tier-${tierLower}">${riskTier}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Coordinates</span>
            <span class="popup-val">${lat} · ${lng}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Status</span>
            <span class="popup-val ${statusClass}">
              <span class="status-dot-pulse"></span>
              ${statusText}
            </span>
          </div>
        </div>
      </div>
    `);
  }, [selectedLake, riskTier, isScanning, tierLower, lat, lng]);

  return null;
}
