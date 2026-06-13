import { T, ui, display, mono, flex, col } from "../utils/theme.js";
import { DriversCard, TrendCard } from "../components/Cards.jsx";

export default function RiskDriversView({ lake }) {
  const c = T.risk[lake.risk];
  return (
    <div
      style={{
        padding: "20px 28px 28px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 18,
        alignItems: "start",
      }}
    >
      <div style={{ ...col({ gap: 18 }) }}>
        <DriversCard lake={lake} />
      </div>
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: 20,
          ...col({ gap: 16 }),
        }}
      >
        <span
          style={{ ...display, fontSize: 15, fontWeight: 600, color: T.text }}
        >
          Why score {lake.score}?
        </span>
        {[
          { label: "Lake expansion", wt: 35, note: "GLOF main trigger factor" },
          { label: "Rainfall anomaly", wt: 25, note: "Hydrology contribution" },
          { label: "Glacial melt", wt: 20, note: "DEM-derived melt index" },
          {
            label: "Moraine stability",
            wt: 10,
            note: "Structural integrity score",
          },
          { label: "Population", wt: 10, note: "Exposed settlement density" },
        ].map((r) => {
          const contribution = Math.round((lake.score * r.wt) / 100);
          return (
            <div key={r.label}>
              <div
                style={{
                  ...flex({ justifyContent: "space-between" }),
                  marginBottom: 5,
                }}
              >
                <div style={{ ...col({ gap: 2 }) }}>
                  <span
                    style={{
                      ...ui,
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.text,
                    }}
                  >
                    {r.label}
                  </span>
                  <span style={{ ...ui, fontSize: 11, color: T.dim }}>
                    {r.note}
                  </span>
                </div>
                <div style={{ ...col({ alignItems: "flex-end", gap: 2 }) }}>
                  <span
                    style={{
                      ...mono,
                      fontSize: 14,
                      fontWeight: 700,
                      color: c.fg,
                    }}
                  >
                    +{contribution}
                  </span>
                  <span style={{ ...ui, fontSize: 10, color: T.dim }}>
                    {r.wt}% weight
                  </span>
                </div>
              </div>
              <div
                style={{
                  height: 6,
                  background: T.panel,
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${r.wt}%`,
                    background: c.fg,
                    opacity: 0.7,
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          );
        })}
        <div
          style={{
            borderTop: `1px solid ${T.border}`,
            paddingTop: 12,
            ...flex({ justifyContent: "space-between" }),
          }}
        >
          <span style={{ ...ui, fontSize: 13, color: T.muted }}>
            Composite risk score
          </span>
          <span
            style={{ ...display, fontSize: 20, fontWeight: 700, color: c.fg }}
          >
            {lake.score}
          </span>
        </div>
      </div>
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: 20,
          ...col({ gap: 14 }),
        }}
      >
        <span
          style={{ ...display, fontSize: 15, fontWeight: 600, color: T.text }}
        >
          7-day trend
        </span>
        <TrendCard lake={lake} />
        <div
          style={{
            background: T.panel,
            borderRadius: 12,
            padding: "12px 14px",
            ...col({ gap: 6 }),
          }}
        >
          <div
            style={{
              ...ui,
              fontSize: 11,
              fontWeight: 700,
              color: T.muted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Model info
          </div>
          <div style={{ ...ui, fontSize: 12, color: T.text }}>
            Remote sensing v3.2 · NDWI + DEM fusion · 3-day reanalysis window
          </div>
          <div style={{ ...ui, fontSize: 12, color: T.text }}>
            Confidence: <strong>{lake.conf}%</strong> · Data: Sentinel-2, ERA5,
            SRTM30
          </div>
        </div>
      </div>
    </div>
  );
}
