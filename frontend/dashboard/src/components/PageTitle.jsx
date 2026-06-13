import { useMemo } from "react";
import { T, ui, display, mono, flex } from "../utils/theme.js";
import { relTime } from "../utils/helpers.js";

export default function PageTitle({ lake, totalLakes }) {
  const dateStr = useMemo(() => {
    const d = new Date(lake.lastAnalysis);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [lake.lastAnalysis]);

  return (
    <div
      style={{
        ...flex({ justifyContent: "space-between", alignItems: "flex-start" }),
        padding: "20px 28px 0",
      }}
    >
      <div>
        <h1
          style={{
            ...display,
            fontSize: 26,
            fontWeight: 700,
            color: T.text,
            letterSpacing: "-0.01em",
          }}
        >
          Glacial lake risk monitor
        </h1>
        <div
          style={{ ...flex({ gap: 14, alignItems: "center" }), marginTop: 6 }}
        >
          <span
            style={{
              ...ui,
              fontSize: 13,
              color: T.muted,
              ...flex({ alignItems: "center", gap: 5 }),
            }}
          >
            <i className="ti ti-map-pin" style={{ fontSize: 14 }} />
            {lake.region}, {lake.country}
          </span>
          <span
            style={{
              ...ui,
              fontSize: 13,
              color: T.muted,
              ...flex({ alignItems: "center", gap: 5 }),
            }}
          >
            <i className="ti ti-calendar" style={{ fontSize: 14 }} />
            {dateStr}
          </span>
          <span
            style={{
              ...ui,
              fontSize: 13,
              color: T.muted,
              ...flex({ alignItems: "center", gap: 5 }),
            }}
          >
            <i className="ti ti-database" style={{ fontSize: 14 }} />
            {totalLakes} lakes monitored
          </span>
          <span
            style={{
              ...ui,
              fontSize: 13,
              color: T.muted,
              ...flex({ alignItems: "center", gap: 5 }),
            }}
          >
            <i className="ti ti-clock" style={{ fontSize: 14 }} />
            Updated {relTime(lake.lastAnalysis)}
          </span>
        </div>
      </div>
      <div style={{ ...mono, fontSize: 12, color: T.dim, textAlign: "right" }}>
        {lake.lat.toFixed(3)}° N<br />
        {lake.lng.toFixed(3)}° E<br />
        <span style={{ fontSize: 10, marginTop: 2, display: "block" }}>
          {lake.elev.toLocaleString()} m elev.
        </span>
      </div>
    </div>
  );
}
