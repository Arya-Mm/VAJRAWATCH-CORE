import { useContext, useState } from 'react';
import useLakeStore from '../../store/useLakeStore';
import { MapContext } from './mapUtils';

const DEFAULT_CENTER = [84.4231, 28.5143];
const DEFAULT_ZOOM = 12.2;

export default function MapControls() {
  const { map } = useContext(MapContext);
  const viewMode = useLakeStore((s) => s.viewMode);
  const setViewMode = useLakeStore((s) => s.setViewMode);

  const [activeLayer, setActiveLayer] = useState('terrain'); // 'street' | 'terrain' | 'satellite'

  const zoomIn = () => {
    if (!map) return;
    map.zoomIn();
  };

  const zoomOut = () => {
    if (!map) return;
    map.zoomOut();
  };

  const resetView = () => {
    if (!map) return;
    map.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 35, // Reset to tilted perspective
      bearing: 0,
      essential: true
    });
  };

  const switchLayer = (layerId) => {
    if (!map) return;
    setActiveLayer(layerId);
    const layers = ['street-layer', 'terrain-layer', 'satellite-layer'];
    layers.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', id === `${layerId}-layer` ? 'visible' : 'none');
      }
    });
  };

  return (
    <>
      {/* 1. Map Modes Toggle (Top-Left) */}
      <div className="map-modes-toggle" role="group" aria-label="Map Mode">
        <button
          type="button"
          className={`mode-btn ${viewMode === '2d' ? 'active' : ''}`}
          onClick={() => setViewMode('2d')}
        >
          2D MAP
        </button>
        <button
          type="button"
          className={`mode-btn ${viewMode === '3d' ? 'active' : ''}`}
          onClick={() => setViewMode('3d')}
        >
          3D DIGITAL TWIN
        </button>
        <button
          type="button"
          className={`mode-btn ${viewMode === 'simulation' ? 'active' : ''}`}
          onClick={() => setViewMode('simulation')}
          aria-label="Flood Simulation"
        >
          FLOOD SIMULATION
        </button>
      </div>

      {/* 2. Map Control Panel (Top-Right) */}
      <div className="map-controls-panel">
        <button
          type="button"
          className="control-btn"
          onClick={zoomIn}
          title="Zoom In"
          aria-label="Zoom In"
        >
          ＋
        </button>
        <button
          type="button"
          className="control-btn"
          onClick={zoomOut}
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          －
        </button>
        <button
          type="button"
          className="control-btn control-btn--reset"
          onClick={resetView}
          title="Reset View"
          aria-label="Reset View"
        >
          ⟲ <span className="control-btn-label">RESET</span>
        </button>
      </div>

      {/* 3. Layer Switcher (Bottom-Right) */}
      <div className="map-layers-panel" role="group" aria-label="Map Layer Switching">
        <button
          type="button"
          className={`layer-btn ${activeLayer === 'street' ? 'active' : ''}`}
          onClick={() => switchLayer('street')}
        >
          Street
        </button>
        <button
          type="button"
          className={`layer-btn ${activeLayer === 'terrain' ? 'active' : ''}`}
          onClick={() => switchLayer('terrain')}
        >
          Terrain
        </button>
        <button
          type="button"
          className={`layer-btn ${activeLayer === 'satellite' ? 'active' : ''}`}
          onClick={() => switchLayer('satellite')}
        >
          Satellite
        </button>
      </div>
    </>
  );
}
