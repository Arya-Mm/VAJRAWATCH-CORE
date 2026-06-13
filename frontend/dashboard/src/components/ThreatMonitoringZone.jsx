import { lazy, Suspense, useEffect, useState } from 'react';
import useLakeStore, { getSelectedLake } from '../store/useLakeStore';

const MapContainer = lazy(() => import('./map/MapContainer'));
const DigitalTwin = lazy(() => import('./digitalTwin/DigitalTwin'));

const VIEW_MODES = [
  { id: '2d', label: 'Map' },
  { id: '3d', label: 'Digital Twin' },
  { id: 'simulation', label: 'Simulation' },
];

function ViewModeSelector() {
  const viewMode = useLakeStore((s) => s.viewMode);
  const setViewMode = useLakeStore((s) => s.setViewMode);

  return (
    <div className="view-mode-selector" role="group" aria-label="View mode">
      {VIEW_MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          className={viewMode === mode.id ? 'is-active' : ''}
          onClick={() => setViewMode(mode.id)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

export default function ThreatMonitoringZone() {
  const selectedLake = useLakeStore(getSelectedLake);
  const viewMode = useLakeStore((s) => s.viewMode);
  const analysisState = useLakeStore((s) => s.analysisState);
  const [hasLoadedTwin, setHasLoadedTwin] = useState(false);

  useEffect(() => {
    if (viewMode !== '2d') setHasLoadedTwin(true);
  }, [viewMode]);

  return (
    <section className="threat-zone" aria-label={`Map viewport for ${selectedLake.name}`}>
      <div className="threat-zone__hud">
        <div>
          <span className="threat-zone__eyebrow">Primary Threat Map</span>
          <h1>{selectedLake.name}</h1>
        </div>
        <ViewModeSelector />
      </div>

      <div className="threat-zone__status">
        <span>{selectedLake.region}</span>
        <span>{selectedLake.coordinates.lat} / {selectedLake.coordinates.lng}</span>
        <span>{analysisState === 'loading' ? 'Analyzing' : analysisState === 'offline' ? 'Backend Offline' : analysisState === 'complete' ? 'Analysis Complete' : 'Awaiting Analysis'}</span>
      </div>

      <div className="threat-zone__viewport">
        <div className={viewMode === '2d' ? 'viewport-layer' : 'viewport-layer is-hidden'}>
          <Suspense fallback={<div className="viewport-loading">Loading Map</div>}>
            <MapContainer />
          </Suspense>
        </div>

        {hasLoadedTwin && (
          <div className={viewMode !== '2d' ? 'viewport-layer' : 'viewport-layer is-hidden'}>
            <Suspense fallback={<div className="viewport-loading">Loading Digital Twin</div>}>
              <DigitalTwin />
            </Suspense>
          </div>
        )}
      </div>
    </section>
  );
}
