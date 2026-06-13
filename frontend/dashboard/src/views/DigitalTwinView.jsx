// React import unnecessary with new JSX transform
import { T, ui, display, mono, flex, col } from "../utils/theme.js";
import DigitalTwinHero from "../components/DigitalTwinHero.jsx";
import { ErrorBoundary } from "../components/ErrorBoundary.jsx";

export default function DigitalTwinView({ lake, state, dispatch }) {
  return (
    <div
      style={{
        padding: "20px 28px 28px",
        display: "grid",
        gridTemplateColumns: "1fr 280px",
        gap: 18,
      }}
    >
      <div style={{ height: 560 }}>
        <ErrorBoundary>
          <DigitalTwinHero
            lake={lake}
            layers={state.digitalTwinLayers}
            dispatch={dispatch}
          />
        </ErrorBoundary>
      </div>
      <div style={{ ...col({ gap: 18 }) }}>
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: 18,
            ...col({ gap: 12 }),
          }}
        >
          <span
            style={{ ...display, fontSize: 15, fontWeight: 600, color: T.text }}
          >
            Scene info
          </span>
          <div style={{ ...ui, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
            Procedural DEM based on {lake.name} elevation profile (
            {lake.elev.toLocaleString()} m). Real terrain: GET /api/v1/twin/
            {"{lakeId}"}/dem.
          </div>
          <div style={{ ...col({ gap: 8 }) }}>
            {[
              [
                "Lake body",
                `~${Math.round(lake.pop / 100)} km² surface`,
                "#3B7DD8",
              ],
              ["Risk zone", `${lake.reach} km downstream reach`, "#E5484D"],
              [
                "Flood path",
                `Wave speed ${lake.propagation?.speed ?? 0} m/s`,
                "#F0A500",
              ],
              ["Infrastructure", `${lake.infra} assets mapped`, "#6366F1"],
            ].map(([label, desc, color]) => (
              <div
                key={label}
                style={{ ...flex({ gap: 8, alignItems: "flex-start" }) }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: color,
                    display: "inline-block",
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      ...ui,
                      fontSize: 12,
                      fontWeight: 600,
                      color: T.text,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ ...ui, fontSize: 11, color: T.dim }}>
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            background: T.panel,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div style={{ ...mono, fontSize: 10, color: T.dim, marginBottom: 6 }}>
            API CONTRACT
          </div>
          {[
            "GET /api/v1/twin/:id/dem",
            "GET /api/v1/twin/:id/layers",
            "GET /api/v1/twin/:id/timeline",
          ].map((r) => (
            <div
              key={r}
              style={{
                ...mono,
                fontSize: 11,
                color: T.accent,
                marginBottom: 4,
              }}
            >
              {r}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
