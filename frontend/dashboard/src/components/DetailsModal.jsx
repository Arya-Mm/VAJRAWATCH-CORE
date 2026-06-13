import { useEffect } from "react";
import { T, ui, display, mono, flex } from "../utils/theme.js";

export default function DetailsModal({ lake, onClose }) {
  // ESC key closes modal
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(27,40,56,0.5)",
        zIndex: 500,
        ...flex({ alignItems: "center", justifyContent: "center" }),
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Lake details"
    >
      <div
        style={{
          background: T.surface,
          borderRadius: 20,
          padding: 28,
          width: 520,
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(27,40,56,0.22)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            ...flex({
              justifyContent: "space-between",
              alignItems: "flex-start",
            }),
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                ...display,
                fontSize: 20,
                fontWeight: 700,
                color: T.text,
                margin: 0,
              }}
            >
              {lake.name}
            </h2>
            <div style={{ ...ui, fontSize: 13, color: T.muted, marginTop: 4 }}>
              {lake.region}, {lake.country} · {lake.elev.toLocaleString()} m
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: T.dim,
              fontSize: 20,
            }}
          >
            <i className="ti ti-x" />
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            ["Risk Score", lake.score, "/100"],
            ["Confidence", `${lake.conf}%`, "AI confidence"],
            ["Population", lake.pop.toLocaleString(), "at risk"],
            ["Settlements", lake.settle, "downstream"],
            ["Reach", `${lake.reach} km`, "flood radius"],
            ["Infrastructure", lake.infra, "assets at risk"],
          ].map(([label, val, sub]) => (
            <div
              key={label}
              style={{
                background: T.panel,
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
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
              <div style={{ ...ui, fontSize: 11, color: T.dim, marginTop: 2 }}>
                {label}
              </div>
              <div
                style={{ ...ui, fontSize: 10, color: T.ghost, marginTop: 1 }}
              >
                {sub}
              </div>
            </div>
          ))}
        </div>
        {lake.mw > 0 && (
          <div
            style={{
              background: T.risk.HIGH.bg,
              border: `1px solid ${T.risk.HIGH.fg}33`,
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                ...ui,
                fontSize: 12,
                fontWeight: 700,
                color: T.risk.HIGH.fg,
              }}
            >
              ⚡ Hydropower asset at risk
            </div>
            <div style={{ ...ui, fontSize: 12, color: T.text, marginTop: 4 }}>
              {lake.mw} MW capacity potentially impacted by GLOF event
            </div>
          </div>
        )}
        <div style={{ ...flex({ gap: 8 }) }}>
          <span style={{ ...mono, fontSize: 11, color: T.dim }}>
            {lake.lat.toFixed(3)}° N, {lake.lng.toFixed(3)}° E
          </span>
        </div>
      </div>
    </div>
  );
}
