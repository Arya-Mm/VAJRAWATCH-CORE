import { T, ui, display, mono, flex, col } from "../utils/theme.js";
import { EmptyState } from "../components/UI.jsx";

export default function PropagationView({ lake }) {
  const prop = lake.propagation;
  if (!prop) return <EmptyState label="No propagation data for this lake" />;
  const c = T.risk[lake.risk];
  const timeline = [
    { time: "T + 5 min", color: c.fg, event: prop.t5, icon: "ti-clock" },
    {
      time: "T + 30 min",
      color: T.risk.HIGH.fg,
      event: prop.t30,
      icon: "ti-clock-hour-3",
    },
    {
      time: "T + 2 hr",
      color: T.risk.MODERATE.fg,
      event: prop.t120,
      icon: "ti-clock-hour-6",
    },
  ];
  const arrivals = prop.arrivals || [];

  return (
    <div
      style={{
        padding: "20px 28px 28px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 18,
        alignItems: "start",
      }}
    >
      {/* LEFT */}
      <div style={{ ...col({ gap: 18 }) }}>
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
            Flood wavefront model
          </span>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {[
              ["Wave speed", `${prop.speed} m/s`, "ti-wind"],
              ["Downstream reach", `${prop.wavefront} km`, "ti-route"],
              ["Population", lake.pop.toLocaleString(), "ti-users"],
              ["Settlements", lake.settle, "ti-building"],
            ].map(([label, val, icon]) => (
              <div
                key={label}
                style={{
                  background: T.panel,
                  borderRadius: 12,
                  padding: "14px 16px",
                  ...col({ gap: 6 }),
                }}
              >
                <i
                  className={`ti ${icon}`}
                  style={{ fontSize: 18, color: T.accent }}
                />
                <div
                  style={{
                    ...display,
                    fontSize: 22,
                    fontWeight: 700,
                    color: T.text,
                  }}
                >
                  {val}
                </div>
                <div style={{ ...ui, fontSize: 11, color: T.dim }}>{label}</div>
              </div>
            ))}
          </div>
          {prop.affectedZones.length > 0 && (
            <div>
              <div
                style={{
                  ...ui,
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.muted,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Affected zones
              </div>
              {prop.affectedZones.map((z, i) => (
                <div
                  key={i}
                  style={{
                    ...flex({ gap: 8, alignItems: "center" }),
                    padding: "8px 12px",
                    background: i === 0 ? c.bg : T.panel,
                    border: `1px solid ${i === 0 ? c.fg + "33" : T.border}`,
                    borderRadius: 10,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: i === 0 ? c.fg : T.dim,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ ...ui, fontSize: 13, color: T.text }}>
                    {z}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flood arrival table */}
        {arrivals.length > 0 && (
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              padding: 20,
              ...col({ gap: 12 }),
            }}
          >
            <span
              style={{
                ...display,
                fontSize: 15,
                fontWeight: 600,
                color: T.text,
              }}
            >
              Flood arrival estimates
            </span>
            <div style={{ ...ui, fontSize: 11, color: T.dim }}>
              Approximate — based on wave speed {prop.speed} m/s from breach
              point
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      fontSize: 10,
                      ...ui,
                      fontWeight: 700,
                      color: T.dim,
                      padding: "4px 0",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: `1px solid ${T.border}`,
                    }}
                  >
                    Settlement
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      fontSize: 10,
                      ...ui,
                      fontWeight: 700,
                      color: T.dim,
                      padding: "4px 0",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: `1px solid ${T.border}`,
                    }}
                  >
                    Est. arrival
                  </th>
                </tr>
              </thead>
              <tbody>
                {arrivals.map((a, i) => {
                  const urg =
                    a.min <= 10
                      ? c.fg
                      : a.min <= 45
                        ? T.risk.HIGH.fg
                        : T.risk.WATCH.fg;
                  const label =
                    a.min < 60
                      ? `${a.min} min`
                      : `${Math.floor(a.min / 60)} h ${a.min % 60 > 0 ? (a.min % 60) + " min" : ""}`;
                  return (
                    <tr
                      key={i}
                      style={{ borderBottom: `1px solid ${T.border}` }}
                    >
                      <td
                        style={{
                          ...ui,
                          fontSize: 13,
                          color: T.text,
                          padding: "9px 0",
                        }}
                      >
                        {a.name}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          ...mono,
                          fontSize: 13,
                          fontWeight: 700,
                          color: urg,
                          padding: "9px 0",
                        }}
                      >
                        {label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RIGHT — Flood timeline */}
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
          Flood timeline
        </span>
        <div style={{ ...col({ gap: 0 }) }}>
          {timeline.map((evt, i) => (
            <div key={i} style={{ ...flex({ gap: 14 }), position: "relative" }}>
              <div style={{ ...col({ alignItems: "center" }) }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: evt.color + "22",
                    border: `2px solid ${evt.color}`,
                    ...flex({ alignItems: "center", justifyContent: "center" }),
                    flexShrink: 0,
                  }}
                >
                  <i
                    className={`ti ${evt.icon}`}
                    style={{ fontSize: 16, color: evt.color }}
                  />
                </div>
                {i < timeline.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      background: T.border,
                      minHeight: 32,
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  paddingBottom: i < timeline.length - 1 ? 20 : 0,
                  paddingTop: 6,
                }}
              >
                <div
                  style={{
                    ...mono,
                    fontSize: 11,
                    fontWeight: 700,
                    color: evt.color,
                  }}
                >
                  {evt.time}
                </div>
                <div
                  style={{
                    ...ui,
                    fontSize: 13,
                    color: T.text,
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {evt.event}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            background: T.panel,
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              ...ui,
              fontSize: 11,
              fontWeight: 700,
              color: T.muted,
              marginBottom: 4,
            }}
          >
            Recommended action
          </div>
          <div style={{ ...ui, fontSize: 13, color: T.text, fontWeight: 600 }}>
            {lake.risk === "CRITICAL"
              ? "Immediate evacuation — Zone A"
              : lake.risk === "HIGH"
                ? "Prepare evacuation — issue advisory"
                : "Heightened monitoring — no immediate action"}
          </div>
        </div>
      </div>
    </div>
  );
}
