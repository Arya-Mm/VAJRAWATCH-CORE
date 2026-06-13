import { useState, useEffect, useRef, useCallback } from "react";
import Header from "./components/Header";
import StatusStrip from "./components/StatusStrip";
import DrawerTabs from "./components/DrawerTabs";
import MapZone from "./components/MapZone";
import Sidebar from "./components/Sidebar";
import { LAKES } from "./data/lakes";

export default function App() {
  const [selectedLake, setSelectedLake] = useState(null);
  const [analysis, setAnalysis] = useState({});
  const [loading, setLoading] = useState(false);
  const [mapMode, setMapMode] = useState("2d");
  const [drawer, setDrawer] = useState(null);
  const [autoCycle, setAutoCycle] = useState(false);
  const autoCycleRef = useRef(null);
  const lakeIndexRef = useRef(0);

  // Auto cycle: rotates lake selection only — no analysis, no fake data
  useEffect(() => {
    if (autoCycle) {
      autoCycleRef.current = setInterval(() => {
        lakeIndexRef.current = (lakeIndexRef.current + 1) % LAKES.length;
        setSelectedLake(LAKES[lakeIndexRef.current]);
      }, 2800);
    } else {
      clearInterval(autoCycleRef.current);
    }
    return () => clearInterval(autoCycleRef.current);
  }, [autoCycle]);

  // Backend integration point — replace URL with real endpoint
  const runAnalysis = useCallback(async () => {
    if (!selectedLake || loading) return;
    setLoading(true);
    try {
      // INTEGRATION: uncomment and replace with real endpoint
      // const res = await fetch(`/api/analyze/${selectedLake.id}`, { method: 'POST' })
      // if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // const data = await res.json()
      // setAnalysis(prev => ({ ...prev, [selectedLake.id]: data }))

      // Simulates network call — shows OFFLINE state (no fake data)
      await new Promise((r) => setTimeout(r, 1200));
      setAnalysis((prev) => ({ ...prev, [selectedLake.id]: "OFFLINE" }));
    } catch {
      setAnalysis((prev) => ({ ...prev, [selectedLake.id]: "OFFLINE" }));
    } finally {
      setLoading(false);
    }
  }, [selectedLake, loading]);

  const toggleDrawer = (name) => setDrawer((d) => (d === name ? null : name));

  const result = selectedLake ? analysis[selectedLake.id] : null;

  return (
    <div className="vw-root">
      <Header autoCycle={autoCycle} setAutoCycle={setAutoCycle} />
      <StatusStrip />
      <DrawerTabs drawer={drawer} toggleDrawer={toggleDrawer} />
      <div className="vw-body">
        <MapZone
          lakes={LAKES}
          selectedLake={selectedLake}
          onSelectLake={(lake) => {
            setSelectedLake(lake);
            setDrawer(null);
          }}
          mapMode={mapMode}
          setMapMode={setMapMode}
          drawer={drawer}
          toggleDrawer={toggleDrawer}
          analysis={analysis}
          result={result}
        />
        <Sidebar
          selectedLake={selectedLake}
          setSelectedLake={setSelectedLake}
          result={result}
          loading={loading}
          runAnalysis={runAnalysis}
        />
      </div>
    </div>
  );
}
