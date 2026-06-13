import { useState, useMemo } from "react";
import { T, ui, display, mono, flex, col } from "../utils/theme.js";
import {
  TREND_LABELS,
  FORECAST_HRS,
  SENSORS_ONLINE,
  SYSTEM_FEEDS,
  MOCK_INCIDENTS,
} from "../utils/constants.js";
import { relTime } from "../utils/helpers.js";
import { RiskBadge, Stat, Tooltip } from "./UI.jsx";

// ── Lake Stat Card ──────────────────────────────────────────────────────────
export function LakeStatCard({ lake, lakes, dispatch }) {
  const isUp = lake.trend[6] >= lake.trend[0];
  const delta = lake.trend[6] - lake.trend[5];
  const deltaStr = (delta >= 0 ? "▲ +" : "▼ ") + Math.abs(delta);
  const deltaColor = delta > 0 ? T.risk.CRITICAL.fg : T.risk.LOW.fg;

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 18,
        ...col({ gap: 14 }),
      }}
    >
      <div
        style={{
          ...flex({ justifyContent: "space-between", alignItems: "center" }),
        }}
      >
        <span
          style={{ ...display, fontSize: 15, fontWeight: 600, color: T.text }}
        >
          {lake.name}
        </span>
        <span
          style={{
            ...flex({ alignItems: "center", gap: 5 }),
            fontSize: 11,
            ...ui,
            color: T.green,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: T.green,
              display: "inline-block",
            }}
          />
          Live feed
        </span>
      </div>

      <div style={{ ...flex({ alignItems: "baseline", gap: 8 }) }}>
        <span
          style={{ ...display, fontSize: 36, fontWeight: 700, color: T.text }}
        >
          {lake.score}
        </span>
        <span style={{ ...ui, fontSize: 13, color: T.dim }}>
          / 100 risk score
        </span>
        <RiskBadge risk={lake.risk} size="lg" />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
      >
        <div
          style={{ background: T.panel, borderRadius: 10, padding: "8px 10px" }}
        >
          <div style={{ ...ui, fontSize: 10, color: T.muted, marginBottom: 2 }}>
            Confidence
          </div>
          <div
            style={{
              ...display,
              fontSize: 15,
              fontWeight: 700,
              color: T.accent,
            }}
          >
            {lake.conf}%
          </div>
        </div>
        <div
          style={{ background: T.panel, borderRadius: 10, padding: "8px 10px" }}
        >
          <div style={{ ...ui, fontSize: 10, color: T.muted, marginBottom: 2 }}>
            24 h delta
          </div>
          <div
            style={{
              ...display,
              fontSize: 15,
              fontWeight: 700,
              color: deltaColor,
            }}
          >
            {deltaStr}
          </div>
        </div>
        <div
          style={{ background: T.panel, borderRadius: 10, padding: "8px 10px" }}
        >
          <div style={{ ...ui, fontSize: 10, color: T.muted, marginBottom: 2 }}>
            Forecast
          </div>
          <div
            style={{ ...display, fontSize: 15, fontWeight: 700, color: T.text }}
          >
            {FORECAST_HRS} h
          </div>
        </div>
      </div>

      <div
        style={{
          ...flex({ alignItems: "center", gap: 6 }),
          ...ui,
          fontSize: 11,
          color: T.muted,
        }}
      >
        <i className="ti ti-clock" style={{ fontSize: 13 }} />
        Last analysis:{" "}
        <span style={{ color: T.text, fontWeight: 600 }}>
          {relTime(lake.lastAnalysis)}
        </span>
        <span
          style={{
            marginLeft: "auto",
            color: isUp ? T.risk.CRITICAL.fg : T.risk.LOW.fg,
            fontWeight: 600,
          }}
        >
          <i
            className={`ti ${isUp ? "ti-trending-up" : "ti-trending-down"}`}
            style={{ fontSize: 13 }}
          />{" "}
          {isUp ? "Rising" : "Falling"}
        </span>
      </div>

      <div style={{ ...flex({ gap: 10 }) }}>
        <select
          aria-label="Select lake"
          value={lake.id}
          onChange={(e) =>
            dispatch({ type: "SELECT_LAKE", id: Number(e.target.value) })
          }
          style={{
            flex: 1,
            padding: "9px 12px",
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.panel,
            color: T.text,
            ...ui,
            fontSize: 13,
            cursor: "pointer",
            appearance: "none",
          }}
        >
          {lakes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} — {l.risk}
            </option>
          ))}
        </select>
        <button
          onClick={() => dispatch({ type: "TOGGLE_DETAILS" })}
          style={{
            padding: "9px 16px",
            borderRadius: 10,
            border: "none",
            background: T.accent,
            color: "#fff",
            ...ui,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Details
        </button>
      </div>

      <div
        style={{
          borderTop: `1px solid ${T.border}`,
          paddingTop: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <Stat
          icon="ti-mountain"
          value={`${lake.elev.toLocaleString()} m`}
          label="Elevation"
        />
        <Stat
          icon="ti-users"
          value={lake.pop.toLocaleString()}
          label="Population at risk"
        />
        <Stat icon="ti-building" value={lake.settle} label="Settlements" />
        <Stat
          icon="ti-route"
          value={`${lake.reach} km`}
          label="Downstream reach"
        />
      </div>
    </div>
  );
}

// ── Drivers Card ────────────────────────────────────────────────────────────
export function DriversCard({ lake }) {
  const drivers = lake.drivers || [];
  const weights = [
    { label: "Lake expansion", pct: 35 },
    { label: "Rainfall anomaly", pct: 25 },
    { label: "Glacial melt index", pct: 20 },
    { label: "Moraine stability", pct: 10 },
    { label: "Population exposure", pct: 10 },
  ];

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 18,
        ...col({ gap: 14 }),
      }}
    >
      <div
        style={{
          ...flex({ justifyContent: "space-between", alignItems: "center" }),
        }}
      >
        <span
          style={{ ...display, fontSize: 15, fontWeight: 600, color: T.text }}
        >
          Risk drivers
        </span>
        <Tooltip text="Score weights: remote-sensing model v3.2 · Sentinel-2 + ERA5 + SRTM30">
          <span
            style={{ ...ui, fontSize: 11, color: T.dim, cursor: "default" }}
          >
            <i className="ti ti-info-circle" style={{ fontSize: 14 }} />
          </span>
        </Tooltip>
      </div>
      {drivers.length === 0 ? (
        <div
          style={{
            ...col({ alignItems: "center", gap: 8 }),
            padding: 24,
            color: T.dim,
          }}
        >
          <i className="ti ti-database-off" style={{ fontSize: 24 }} />
          <span style={{ ...ui, fontSize: 13 }}>No driver data</span>
        </div>
      ) : (
        drivers.map((d) => {
          const cFg = T.risk[d.sev].fg;
          return (
            <div key={d.label}>
              <div
                style={{
                  ...flex({ justifyContent: "space-between" }),
                  marginBottom: 5,
                }}
              >
                <span style={{ ...ui, fontSize: 13, color: T.text }}>
                  {d.label}
                </span>
                <span
                  style={{ ...mono, fontSize: 12, fontWeight: 600, color: cFg }}
                >
                  {d.val}
                </span>
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
                    width: `${d.pct}%`,
                    background: cFg,
                    borderRadius: 999,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <div style={{ ...ui, fontSize: 10, color: T.dim, marginTop: 3 }}>
                Severity: <strong style={{ color: cFg }}>{d.sev}</strong>
              </div>
            </div>
          );
        })
      )}
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
        <div
          style={{
            ...ui,
            fontSize: 11,
            fontWeight: 700,
            color: T.muted,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Score composition — Risk {lake.score}/100
        </div>
        {weights.map((w) => (
          <div
            key={w.label}
            style={{
              ...flex({ gap: 8, alignItems: "center" }),
              marginBottom: 6,
            }}
          >
            <div
              style={{
                ...ui,
                fontSize: 11,
                color: T.muted,
                width: 130,
                flexShrink: 0,
              }}
            >
              {w.label}
            </div>
            <div
              style={{
                flex: 1,
                height: 4,
                background: T.panel,
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${w.pct}%`,
                  background: T.accent,
                  borderRadius: 999,
                }}
              />
            </div>
            <div
              style={{
                ...mono,
                fontSize: 10,
                color: T.dim,
                width: 30,
                textAlign: "right",
              }}
            >
              {w.pct}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trend Card ──────────────────────────────────────────────────────────────
export function TrendCard({ lake }) {
  const [hovered, setHovered] = useState(null);
  const W = 320,
    H = 140,
    PAD = 18;
  const data = lake.trend;
  const MAX = 100,
    MIN = 0;
  const pts = data.map((v, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((v - MIN) / (MAX - MIN)) * (H - PAD * 2),
    v,
    label: TREND_LABELS[i],
  }));
  const path = pts
    .map(
      (p, i) => (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1),
    )
    .join(" ");
  const c = T.risk[lake.risk].fg;
  const avgTrend = [40, 42, 45, 48, 50, 53, 55];
  const aPts = avgTrend.map((v, i) => ({
    x: PAD + (i / (avgTrend.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((v - MIN) / (MAX - MIN)) * (H - PAD * 2),
  }));
  const aPath = aPts
    .map(
      (p, i) => (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1),
    )
    .join(" ");

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 18,
        ...col({ gap: 10 }),
      }}
    >
      <div
        style={{
          ...flex({ justifyContent: "space-between", alignItems: "center" }),
        }}
      >
        <span
          style={{ ...display, fontSize: 15, fontWeight: 600, color: T.text }}
        >
          Risk score — 7 days
        </span>
        <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: c }}>
          {lake.trend[6]}{" "}
          <span style={{ color: T.dim, fontWeight: 400 }}>/ 100</span>
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          onMouseLeave={() => setHovered(null)}
          role="img"
          aria-label={`Risk trend for ${lake.name}`}
        >
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={PAD}
              x2={W - PAD}
              y1={PAD + f * (H - PAD * 2)}
              y2={PAD + f * (H - PAD * 2)}
              stroke={T.border}
              strokeWidth="1"
            />
          ))}
          <path
            d={aPath}
            fill="none"
            stroke={T.ghost}
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path d={path} fill="none" stroke={c} strokeWidth="2.5" />
          {pts.map((p, i) => (
            <rect
              key={i}
              x={p.x - 18}
              y={PAD}
              width={36}
              height={H - PAD}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
            />
          ))}
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 5 : i === pts.length - 1 ? 4 : 0}
              fill={c}
              style={{ transition: "r .1s" }}
            />
          ))}
        </svg>
        {hovered !== null && (
          <div
            style={{
              position: "absolute",
              left: pts[hovered].x,
              top: pts[hovered].y - 36,
              transform: "translateX(-50%)",
              background: T.text,
              color: "#fff",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 11,
              ...ui,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 10,
            }}
          >
            {pts[hovered].label}: <strong>{pts[hovered].v}</strong>
          </div>
        )}
      </div>
      <div style={{ ...flex({ gap: 16 }), fontSize: 11, ...ui, color: T.dim }}>
        <span style={{ ...flex({ alignItems: "center", gap: 5 }) }}>
          <span
            style={{
              width: 14,
              height: 2,
              background: c,
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          {lake.name}
        </span>
        <span style={{ ...flex({ alignItems: "center", gap: 5 }) }}>
          <span
            style={{
              width: 14,
              height: 2,
              background: T.ghost,
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          Regional avg
        </span>
      </div>
    </div>
  );
}

// ── Warning / Ranking Card ───────────────────────────────────────────────────
export function WarningCard({ lake, lakes, dispatch }) {
  const ranked = useMemo(
    () => [...lakes].sort((a, b) => b.score - a.score).slice(0, 8),
    [lakes],
  );
  const thSt = (w, align = "left") => ({
    width: w,
    textAlign: align,
    fontSize: 11,
    ...ui,
    fontWeight: 600,
    color: T.dim,
    padding: "4px 6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  });
  const tdSt = (align = "left") => ({
    textAlign: align,
    fontSize: 13,
    ...ui,
    color: T.text,
    padding: "8px 6px",
  });

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 18,
        ...col({ gap: 14 }),
      }}
    >
      <div
        style={{
          ...flex({ justifyContent: "space-between", alignItems: "center" }),
        }}
      >
        <span
          style={{ ...display, fontSize: 15, fontWeight: 600, color: T.text }}
        >
          Risk ranking
        </span>
        <span style={{ ...ui, fontSize: 11, color: T.dim }}>
          Click row to switch
        </span>
      </div>
      <div
        style={{
          background: T.risk[lake.risk].bg,
          border: `1px solid ${T.risk[lake.risk].fg}33`,
          borderRadius: 12,
          padding: "12px 14px",
          ...flex({ gap: 10, alignItems: "flex-start" }),
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: T.risk[lake.risk].fg,
            ...flex({ alignItems: "center", justifyContent: "center" }),
            flexShrink: 0,
          }}
        >
          <i className="ti ti-bell" style={{ fontSize: 14, color: "#fff" }} />
        </div>
        <div>
          <div
            style={{
              ...ui,
              fontSize: 13,
              fontWeight: 700,
              color: T.risk[lake.risk].fg,
            }}
          >
            {lake.risk} — Score {lake.score}
          </div>
          <div
            style={{
              ...ui,
              fontSize: 12,
              color: T.text,
              marginTop: 2,
              lineHeight: 1.5,
            }}
          >
            {lake.name} · {lake.pop.toLocaleString()} people at risk ·{" "}
            {lake.reach} km reach
          </div>
        </div>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            <th style={thSt("36px")}>#</th>
            <th style={thSt()}>Lake</th>
            <th style={thSt("56px", "right")}>Score</th>
            <th style={thSt("64px", "right")}>Level</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((l, i) => (
            <tr
              key={l.id}
              onClick={() => dispatch({ type: "SELECT_LAKE", id: l.id })}
              role="button"
              aria-label={`Select ${l.name}`}
              style={{
                borderTop: `1px solid ${T.border}`,
                background: l.id === lake.id ? T.panel : "transparent",
                cursor: "pointer",
                transition: "background .1s",
              }}
              onMouseEnter={(e) => {
                if (l.id !== lake.id)
                  e.currentTarget.style.background = T.panel;
              }}
              onMouseLeave={(e) => {
                if (l.id !== lake.id)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <td style={tdSt()}>
                <span style={{ ...mono, fontSize: 11, color: T.dim }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </td>
              <td style={tdSt()}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: l.id === lake.id ? 700 : 400,
                    color: T.text,
                  }}
                >
                  {l.name}
                </span>
              </td>
              <td
                style={{
                  ...tdSt("right"),
                  ...mono,
                  fontWeight: 700,
                  color: T.risk[l.risk].fg,
                }}
              >
                {l.score}
              </td>
              <td style={tdSt("right")}>
                <RiskBadge risk={l.risk} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── System Health Card ───────────────────────────────────────────────────────
export function SystemHealthCard({ lakes }) {
  const criticalCount = lakes.filter((l) => l.risk === "CRITICAL").length;
  const highCount = lakes.filter((l) => l.risk === "HIGH").length;
  const nominalsDown = SYSTEM_FEEDS.filter((f) => !f.nominal).length;

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 18,
        ...col({ gap: 14 }),
      }}
    >
      <div
        style={{
          ...flex({ justifyContent: "space-between", alignItems: "center" }),
        }}
      >
        <span
          style={{ ...display, fontSize: 15, fontWeight: 600, color: T.text }}
        >
          System health
        </span>
        <span
          style={{
            ...mono,
            fontSize: 10,
            fontWeight: 700,
            color: nominalsDown > 0 ? T.risk.MODERATE.fg : T.green,
          }}
        >
          {nominalsDown === 0 ? "ALL NOMINAL" : "DEGRADED"}
        </span>
      </div>
      <div style={{ ...col({ gap: 6 }) }}>
        {SYSTEM_FEEDS.map((f) => (
          <div
            key={f.id}
            style={{
              ...flex({
                justifyContent: "space-between",
                alignItems: "center",
              }),
              padding: "7px 10px",
              borderRadius: 9,
              background: T.panel,
            }}
          >
            <div style={{ ...flex({ gap: 8, alignItems: "center" }) }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: f.nominal ? T.green : T.risk.MODERATE.fg,
                  display: "inline-block",
                }}
              />
              <span style={{ ...ui, fontSize: 12, color: T.text }}>
                {f.label}
              </span>
              <span style={{ ...mono, fontSize: 10, color: T.dim }}>
                {f.source}
              </span>
            </div>
            <span
              style={{
                ...mono,
                fontSize: 10,
                fontWeight: 700,
                color: f.nominal ? T.green : T.risk.MODERATE.fg,
              }}
            >
              {f.nominal ? "ONLINE" : "DEGRADED"}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
      >
        {[
          ["Critical", criticalCount, T.risk.CRITICAL.fg, T.risk.CRITICAL.bg],
          ["High", highCount, T.risk.HIGH.fg, T.risk.HIGH.bg],
          ["Sensors", `${SENSORS_ONLINE}/${lakes.length}`, T.green, "#E1F5EE"],
        ].map(([label, val, fg, bg]) => (
          <div
            key={label}
            style={{
              background: bg,
              borderRadius: 10,
              padding: "8px 10px",
              textAlign: "center",
            }}
          >
            <div
              style={{ ...display, fontSize: 16, fontWeight: 700, color: fg }}
            >
              {val}
            </div>
            <div style={{ ...ui, fontSize: 10, color: T.muted, marginTop: 2 }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Incident Timeline ───────────────────────────────────────────────────────
export function IncidentTimeline() {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 18,
        ...col({ gap: 12 }),
      }}
    >
      <div
        style={{
          ...flex({ justifyContent: "space-between", alignItems: "center" }),
        }}
      >
        <span
          style={{ ...display, fontSize: 15, fontWeight: 600, color: T.text }}
        >
          Incident log
        </span>
        <span style={{ ...mono, fontSize: 10, color: T.dim }}>UTC today</span>
      </div>
      <div style={{ ...col({ gap: 0 }) }}>
        {MOCK_INCIDENTS.map((inc, i) => (
          <div key={i} style={{ ...flex({ gap: 10 }), position: "relative" }}>
            <div style={{ ...col({ alignItems: "center" }) }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: inc.color + "18",
                  border: `1.5px solid ${inc.color}44`,
                  ...flex({ alignItems: "center", justifyContent: "center" }),
                  flexShrink: 0,
                }}
              >
                <i
                  className={`ti ${inc.icon}`}
                  style={{ fontSize: 12, color: inc.color }}
                />
              </div>
              {i < MOCK_INCIDENTS.length - 1 && (
                <div
                  style={{
                    width: 1.5,
                    flex: 1,
                    background: T.border,
                    minHeight: 20,
                  }}
                />
              )}
            </div>
            <div
              style={{
                paddingBottom: i < MOCK_INCIDENTS.length - 1 ? 12 : 0,
                paddingTop: 4,
              }}
            >
              <span
                style={{
                  ...mono,
                  fontSize: 10,
                  fontWeight: 700,
                  color: inc.color,
                }}
              >
                {inc.time}
              </span>
              <div
                style={{
                  ...ui,
                  fontSize: 11,
                  color: T.muted,
                  marginTop: 2,
                  lineHeight: 1.4,
                }}
              >
                {inc.event}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Executive Summary ───────────────────────────────────────────────────────
export function ExecutiveSummary({ lake }) {
  const c = T.risk[lake.risk];
  return (
    <div
      style={{
        background: c.bg,
        border: `1.5px solid ${c.fg}44`,
        borderRadius: 16,
        padding: "16px 20px",
        ...col({ gap: 10 }),
      }}
    >
      <div style={{ ...flex({ alignItems: "center", gap: 8 }) }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: c.fg,
            display: "inline-block",
          }}
        />
        <span
          style={{
            ...mono,
            fontSize: 10,
            fontWeight: 700,
            color: c.fg,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Top threat
        </span>
      </div>
      <div
        style={{
          ...display,
          fontSize: 20,
          fontWeight: 700,
          color: T.text,
          letterSpacing: "-0.01em",
        }}
      >
        {lake.name}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          ["Risk Score", `${lake.score}/100`],
          ["Population", lake.pop.toLocaleString()],
          ["Confidence", `${lake.conf}%`],
          [
            "Action",
            lake.risk === "CRITICAL" ? "Evacuate Zone A" : "Issue advisory",
          ],
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              background: "rgba(255,255,255,0.6)",
              borderRadius: 10,
              padding: "8px 10px",
            }}
          >
            <div
              style={{ ...ui, fontSize: 10, color: T.muted, marginBottom: 2 }}
            >
              {k}
            </div>
            <div
              style={{
                ...display,
                fontSize: 13,
                fontWeight: 700,
                color: T.text,
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
