// React import not required with new JSX transform
import { col } from "../utils/theme.js";
import {
  LakeStatCard,
  DriversCard,
  TrendCard,
  WarningCard,
  SystemHealthCard,
  IncidentTimeline,
  ExecutiveSummary,
} from "../components/Cards.jsx";
import DigitalTwinHero from "../components/DigitalTwinHero.jsx";
import { ErrorBoundary } from "../components/ErrorBoundary.jsx";

export default function OverviewView({ lake, lakes, state, dispatch }) {
  return (
    <div
      style={{
        padding: "20px 28px 28px",
        display: "grid",
        gridTemplateColumns: "320px 1fr 340px",
        gap: 18,
        alignItems: "start",
      }}
    >
      {/* LEFT */}
      <div style={{ ...col({ gap: 18 }) }}>
        <LakeStatCard
          lake={lake}
          lakes={lakes}
          state={state}
          dispatch={dispatch}
        />
        <DriversCard lake={lake} />
      </div>
      {/* CENTER */}
      <div style={{ height: 600 }}>
        <ErrorBoundary>
          <DigitalTwinHero
            lake={lake}
            layers={state.digitalTwinLayers}
            dispatch={dispatch}
          />
        </ErrorBoundary>
      </div>
      {/* RIGHT */}
      <div style={{ ...col({ gap: 18 }) }}>
        <ExecutiveSummary lake={lake} />
        <SystemHealthCard lakes={lakes} />
        <IncidentTimeline />
        <TrendCard lake={lake} />
        <WarningCard lake={lake} lakes={lakes} dispatch={dispatch} />
      </div>
    </div>
  );
}
