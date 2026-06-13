import React from "react";
import { T, ui, col } from "../utils/theme.js";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[VajraWatch ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: T.risk.CRITICAL.bg,
            border: `1px solid ${T.risk.CRITICAL.fg}44`,
            borderRadius: 16,
            padding: 24,
            ...col({ alignItems: "center", gap: 10 }),
            margin: 20,
          }}
        >
          <i
            className="ti ti-alert-triangle"
            style={{ fontSize: 28, color: T.risk.CRITICAL.fg }}
          />
          <div style={{ ...ui, fontSize: 14, fontWeight: 700, color: T.text }}>
            Component crashed
          </div>
          <div
            style={{ ...ui, fontSize: 12, color: T.muted, textAlign: "center" }}
          >
            {this.state.error?.message || "Unknown error"}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
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
        </div>
      );
    }
    return this.props.children;
  }
}
