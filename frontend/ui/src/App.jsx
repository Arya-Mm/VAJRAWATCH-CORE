import Header from './components/Header';
import MapContainer from './components/MapContainer';
import Sidebar from './components/Sidebar';

/**
 * VAJRAWATCH — Root Application Shell
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │ Header (64px) — F-Pattern brand anchor        │
 *   ├──────────────────────────────┬───────────────┤
 *   │ MapContainer (60%)           │ Sidebar (40%) │
 *   │ 2D/3D canvas + location pin  │ Risk data +   │
 *   │                              │ RUN ANALYSIS  │
 *   └──────────────────────────────┴───────────────┘
 */
export default function App() {
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
      {/* Topmost fixed header — 64px */}
      <Header />

      {/* Main split-screen content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          minHeight: 0, // critical for flex children to shrink correctly
        }}
      >
        {/* Left 60% — visual map canvas */}
        <MapContainer />

        {/* Right 40% — data sidebar & action panel */}
        <Sidebar />
      </main>
    </div>
  );
}
