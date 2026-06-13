import { T, ui, display, mono, flex } from "../utils/theme.js";
import { LoadingSpinner, ErrorState, EmptyState } from "../components/UI.jsx";

export default function ReportsView({ reports, loading, error }) {
  const riskColor = (type) =>
    ({
      Emergency: T.risk.CRITICAL,
      Elevated: T.risk.HIGH,
      Standard: T.risk.MODERATE,
    })[type] || T.risk.WATCH;

  if (loading) return <LoadingSpinner label="Loading reports…" />;
  if (error) return <ErrorState message={error} />;

  const thSt = (w, align = "left") => ({
    width: w,
    textAlign: align,
    fontSize: 11,
    ...ui,
    fontWeight: 600,
    color: T.dim,
    padding: "8px 12px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: `1px solid ${T.border}`,
    background: T.panel,
  });
  const tdSt = (align = "left") => ({
    textAlign: align,
    fontSize: 13,
    ...ui,
    color: T.text,
    padding: "10px 12px",
  });

  return (
    <div style={{ padding: "20px 28px 28px" }}>
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px 12px",
            borderBottom: `1px solid ${T.border}`,
            ...flex({ justifyContent: "space-between", alignItems: "center" }),
          }}
        >
          <span
            style={{ ...display, fontSize: 15, fontWeight: 600, color: T.text }}
          >
            Assessment reports
          </span>
          <span style={{ ...ui, fontSize: 12, color: T.dim }}>
            {reports.length} reports
          </span>
        </div>
        {reports.length === 0 ? (
          <EmptyState label="No reports found" />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thSt("120px")}>Report ID</th>
                <th style={thSt()}>Lake</th>
                <th style={thSt("100px")}>Date</th>
                <th style={thSt("100px")}>Type</th>
                <th style={thSt("60px", "right")}>Score</th>
                <th style={thSt("110px", "right")}>Status</th>
                <th style={thSt("140px")}>Issued by</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const rc = riskColor(r.type);
                return (
                  <tr
                    key={r.id}
                    style={{ borderTop: `1px solid ${T.border}` }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.panel)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={tdSt()}>
                      <span style={{ ...mono, fontSize: 12 }}>{r.id}</span>
                    </td>
                    <td style={tdSt()}>{r.lake}</td>
                    <td style={tdSt()}>
                      <span style={{ ...mono, fontSize: 12, color: T.muted }}>
                        {r.date}
                      </span>
                    </td>
                    <td style={tdSt()}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: rc.bg,
                          color: rc.fg,
                        }}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td
                      style={{
                        ...tdSt("right"),
                        ...mono,
                        fontWeight: 700,
                        color: rc.fg,
                      }}
                    >
                      {r.score}
                    </td>
                    <td style={tdSt("right")}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background:
                            r.status === "Published" ? "#E1F5EE" : T.panel,
                          color: r.status === "Published" ? "#1FAE7A" : T.muted,
                          fontWeight: 600,
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={tdSt()}>{r.analyst}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
