import { useState } from "react";
import { T, ui, display, flex, col } from "../utils/theme.js";

export function RiskBadge({ risk, size = "sm" }) {
  const c = T.risk[risk];
  return (
    <span
      style={{
        ...ui,
        fontSize: size === "lg" ? 12 : 10,
        fontWeight: 700,
        padding: size === "lg" ? "5px 14px" : "3px 9px",
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
      }}
    >
      {risk}
    </span>
  );
}

export function LoadingSpinner({ label = "Loading…" }) {
  return (
    <div
      style={{
        ...flex({ alignItems: "center", justifyContent: "center", gap: 10 }),
        padding: 32,
        color: T.dim,
        ...ui,
        fontSize: 13,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: `2px solid ${T.border}`,
          borderTopColor: T.accent,
          animation: "spin 0.8s linear infinite",
        }}
      />
      {label}
    </div>
  );
}

export function SkeletonBlock({
  width = "100%",
  height = 18,
  radius = 6,
  style = {},
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: T.border,
        animation: "pulse 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div
      style={{
        ...col({ alignItems: "center", gap: 10 }),
        padding: 32,
        textAlign: "center",
      }}
    >
      <i
        className="ti ti-alert-circle"
        style={{ fontSize: 28, color: T.risk.CRITICAL.fg }}
      />
      <div style={{ ...ui, fontSize: 13, color: T.muted }}>{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "7px 18px",
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.text,
            ...ui,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon = "ti-database-off",
  label = "No data available",
}) {
  return (
    <div
      style={{
        ...col({ alignItems: "center", gap: 8 }),
        padding: 24,
        color: T.dim,
      }}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 24 }} />
      <span style={{ ...ui, fontSize: 13 }}>{label}</span>
    </div>
  );
}

export function Stat({ icon, value, label }) {
  return (
    <div style={{ ...col({ gap: 4 }) }}>
      <span
        style={{
          ...display,
          fontSize: 17,
          fontWeight: 700,
          color: T.text,
          ...flex({ alignItems: "center", gap: 6 }),
        }}
      >
        <i className={`ti ${icon}`} style={{ fontSize: 15, color: T.dim }} />
        {value}
      </span>
      <span style={{ ...ui, fontSize: 11, color: T.dim }}>{label}</span>
    </div>
  );
}

export function Tooltip({ children, text }) {
  const [vis, setVis] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setVis(true)}
      onMouseLeave={() => setVis(false)}
    >
      {children}
      {vis && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: T.text,
            color: "#fff",
            borderRadius: 6,
            padding: "5px 10px",
            fontSize: 11,
            ...ui,
            whiteSpace: "nowrap",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
