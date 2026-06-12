import { useContext, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import useLakeStore from '../../store/useLakeStore';
import { MapContext } from './mapUtils';

export default function LakeMarker() {
  const { map } = useContext(MapContext);
  const selectedLakeId = useLakeStore((s) => s.selectedLakeId);
  const lakesList = useLakeStore((s) => s.lakesList);
  const selectLake = useLakeStore((s) => s.selectLake);
  const analysisState = useLakeStore((s) => s.analysisState);

  const markersRef = useRef([]);

  const isScanning = analysisState === 'loading';

  useEffect(() => {
    if (!map) return;

    // Clean up any existing markers
    markersRef.current.forEach(({ marker }) => {
      const popup = marker.getPopup();
      if (popup) popup.remove();
      marker.remove();
    });
    markersRef.current = [];

    const newMarkers = [];

    lakesList.forEach((lake) => {
      const isSelected = lake.lakeId === selectedLakeId;
      const lng = parseFloat(lake.coordinates.lng);
      const lat = parseFloat(lake.coordinates.lat);

      // Create marker container element
      const el = document.createElement('div');
      el.className = `map-lake-marker marker-tier-${lake.riskTier.toLowerCase()} ${isSelected ? 'is-selected' : ''}`;
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div class="marker-pulse-ring"></div>
        <div class="marker-core"></div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectLake(lake.lakeId);
      });

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
        anchor: 'bottom'
      });

      // Update popup content
      const statusText = (isSelected && isScanning) ? 'SCANNING' : 'ACTIVE';
      const statusClass = (isSelected && isScanning) ? 'status-scanning' : 'status-active';
      popup.setHTML(`
        <div class="map-popup-card">
          <h3 class="popup-lake-name">${lake.name}</h3>
          <div class="popup-grid">
            <div class="popup-row">
              <span class="popup-label">Risk Level</span>
              <span class="popup-val tier-badge tier-${lake.riskTier.toLowerCase()}">${lake.riskTier}</span>
            </div>
            <div class="popup-row">
              <span class="popup-label">Coordinates</span>
              <span class="popup-val">${lake.coordinates.lat} · ${lake.coordinates.lng}</span>
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

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      if (isSelected) {
        marker.togglePopup();
      }

      newMarkers.push({ marker, lakeId: lake.lakeId });
    });

    markersRef.current = newMarkers;

    return () => {
      newMarkers.forEach(({ marker }) => {
        const popup = marker.getPopup();
        if (popup) popup.remove();
        marker.remove();
      });
    };
  }, [map, lakesList, selectedLakeId, isScanning, selectLake]);

  return null;
}
