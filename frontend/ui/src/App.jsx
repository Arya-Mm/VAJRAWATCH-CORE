import { useState, useEffect } from 'react';
import Header from './components/Header';
import MapContainer from './components/MapContainer';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import AlertBanner from './components/AlertBanner';
import { monitorService } from './services/monitor';

/**
 * VAJRAWATCH — Root Application Shell
 *
 * Views:
 *   'landing'   — Cinematic hero / landing page (scrollable)
 *   'dashboard' — Full command centre / Live Map (the real consumer map)
 *
 * Dashboard Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │ Header (64px) — F-Pattern brand anchor        │
 *   ├──────────────────────────────┬───────────────┤
 *   │ MapContainer (60%)           │ Sidebar (40%) │
 *   │ 2D/3D canvas + GeoJSON       │ Risk data +   │
 *   │                              │ RUN ANALYSIS  │
 *   └──────────────────────────────┴───────────────┘
 */
export default function App() {
  const [view, setView] = useState('landing');
  const [activeLakeId, setActiveLakeId] = useState('PDGL_THULAGI_01');

  useEffect(() => {
    monitorService.start();
    return () => monitorService.stop();
  }, []);

  if (view === 'landing') {
    return (
      <Hero onEnterDashboard={() => setView('dashboard')} />
    );
  }

  // 'dashboard' — the actual live map view
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)',
        overflow: 'hidden',
      }}
    >
      <AlertBanner />
      {/* Topmost fixed header — 64px */}
      <Header />

      {/* Main split-screen content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Left 60% — visual map canvas */}
        <MapContainer
          activeLakeId={activeLakeId}
          setActiveLakeId={setActiveLakeId}
          onGoBack={() => setView('landing')}
        />

        {/* Right 40% — data sidebar & action panel */}
        <Sidebar activeLakeId={activeLakeId} setActiveLakeId={setActiveLakeId} />
      </main>
    </div>
  );
}
