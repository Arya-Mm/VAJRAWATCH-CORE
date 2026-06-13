import { useMemo, useEffect, useState } from "react";
import { T, ui, display, mono, flex, col } from "../utils/theme.js";
import { TABS, SENSORS_ONLINE } from "../utils/constants.js";
import { MOCK_LAKES } from "../data/mockData.js";
import { RiskBadge, Tooltip } from "./UI.jsx";

function AlertPanel({ alerts, dispatch, state }) {
  const { alertFilter } = state;
  const filters = ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"];
  const visible = useMemo(
    () => alerts.filter((a) => a.status === alertFilter),
    [alerts, alertFilter],
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const relTime = (isoTs) => {
    const diff = Math.floor((now - new Date(isoTs).getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return `${Math.floor(diff / 1440)} d ago`;
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 44,
        right: 0,
        width: 380,
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        boxShadow: "0 8px 24px rgba(27,40,56,0.12)",
        zIndex: 200,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px 10px",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            ...display,
            fontSize: 14,
            fontWeight: 700,
            color: T.text,
            marginBottom: 10,
          }}
        >
          Alert Center
        </div>
        <div style={{ ...flex({ gap: 4 }) }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => dispatch({ type: "SET_ALERT_FILTER", filter: f })}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: alertFilter === f ? T.accent : T.panel,
                color: alertFilter === f ? "#fff" : T.muted,
                fontSize: 11,
                ...ui,
                fontWeight: 600,
                transition: "all .15s",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {visible.length === 0 ? (
          <div
            style={{
              ...col({ alignItems: "center", gap: 8 }),
              padding: 24,
              color: T.dim,
            }}
          >
            <i className="ti ti-checks" style={{ fontSize: 24 }} />
            <span style={{ ...ui, fontSize: 13 }}>
              No {alertFilter.toLowerCase()} alerts
            </span>
          </div>
        ) : (
          visible.map((a) => {
            const c = T.risk[a.type] || T.risk.WATCH;
            return (
              <div
                key={a.id}
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${T.border}`,
                  ...flex({ gap: 10, alignItems: "flex-start" }),
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: c.fg,
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      ...ui,
                      fontSize: 12,
                      fontWeight: 700,
                      color: T.text,
                    }}
                  >
                    {a.lake}
                  </div>
                  <div
                    style={{
                      ...ui,
                      fontSize: 12,
                      color: T.muted,
                      marginTop: 2,
                      lineHeight: 1.5,
                    }}
                  >
                    {a.msg}
                  </div>
                  <div
                    style={{
                      ...flex({ gap: 8, alignItems: "center" }),
                      marginTop: 6,
                    }}
                  >
                    <span style={{ ...mono, fontSize: 10, color: T.dim }}>
                      {relTime(a.ts)}
                    </span>
                    <span
                      style={{
                        ...ui,
                        fontSize: 10,
                        color: c.fg,
                        fontWeight: 600,
                      }}
                    >
                      {a.action}
                    </span>
                  </div>
                </div>
                <RiskBadge risk={a.type} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Header({ state, dispatch, lakes, alerts }) {
  const { activeTab, showSearch, showNotifications, searchQuery } = state;
  const activeAlertCount = useMemo(
    () => (alerts || []).filter((a) => a.status === "ACTIVE").length,
    [alerts],
  );
  const filteredLakes = useMemo(
    () =>
      searchQuery.length > 0
        ? lakes.filter(
            (l) =>
              l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.region.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : [],
    [searchQuery, lakes],
  );

  return (
    <header
      style={{
        ...flex({ alignItems: "center", gap: 24 }),
        padding: "14px 28px",
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
        position: "relative",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{ ...flex({ alignItems: "center", gap: 10 }), flexShrink: 0 }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M13 1L4 14h6l-1.5 9L20 10h-6l1-9z" fill="#2F6FE0" />
        </svg>
        <span
          style={{
            ...display,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: T.text,
          }}
        >
          VajraWatch
        </span>
      </div>

      {/* Tab nav */}
      <nav
        style={{
          ...flex({ gap: 6 }),
          background: T.panel,
          borderRadius: 999,
          padding: 4,
        }}
        aria-label="Primary navigation"
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => dispatch({ type: "SET_TAB", tab: t })}
            aria-current={activeTab === t ? "page" : undefined}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: activeTab === t ? T.surface : "transparent",
              color: activeTab === t ? T.text : T.muted,
              fontSize: 13,
              ...ui,
              fontWeight: activeTab === t ? 600 : 500,
              boxShadow:
                activeTab === t ? "0 1px 3px rgba(27,40,56,0.10)" : "none",
              transition: "all .15s",
            }}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* Actions */}
      <div
        style={{
          marginLeft: "auto",
          ...flex({ alignItems: "center", gap: 12 }),
          position: "relative",
        }}
      >
        {/* MOCK DATA badge */}
        <div
          style={{
            ...flex({ alignItems: "center", gap: 6 }),
            padding: "5px 10px",
            borderRadius: 8,
            background: "#FBF6E0",
            border: `1px solid ${T.risk.MODERATE.fg}44`,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: T.risk.MODERATE.fg,
              display: "inline-block",
            }}
          />
          <span
            style={{
              ...mono,
              fontSize: 10,
              fontWeight: 700,
              color: T.risk.MODERATE.fg,
            }}
          >
            MOCK DATA
          </span>
        </div>

        {/* Sensor health chip */}
        <div
          style={{
            ...flex({ alignItems: "center", gap: 5 }),
            padding: "5px 10px",
            borderRadius: 8,
            background: T.panel,
            border: `1px solid ${T.border}`,
          }}
        >
          <i className="ti ti-wifi" style={{ fontSize: 13, color: T.green }} />
          <span
            style={{ ...mono, fontSize: 10, fontWeight: 700, color: T.green }}
          >
            {SENSORS_ONLINE}/{MOCK_LAKES.length} sensors
          </span>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <Tooltip text="Search lakes">
            <button
              aria-label="Search lakes"
              onClick={() => dispatch({ type: "TOGGLE_SEARCH" })}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `1px solid ${showSearch ? T.accent : T.border}`,
                background: showSearch ? "#EEF4FF" : T.surface,
                cursor: "pointer",
                ...flex({ alignItems: "center", justifyContent: "center" }),
                color: showSearch ? T.accent : T.muted,
                transition: "all .15s",
              }}
            >
              <i className="ti ti-search" style={{ fontSize: 16 }} />
            </button>
          </Tooltip>
          {showSearch && (
            <div
              style={{
                position: "absolute",
                top: 44,
                right: 0,
                width: 300,
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(27,40,56,0.12)",
                overflow: "hidden",
                zIndex: 200,
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                <input
                  autoFocus
                  placeholder="Search lake name or region…"
                  value={searchQuery}
                  onChange={(e) =>
                    dispatch({ type: "SET_SEARCH", q: e.target.value })
                  }
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    ...ui,
                    fontSize: 13,
                    color: T.text,
                    background: "transparent",
                  }}
                  aria-label="Search lakes"
                />
              </div>
              {filteredLakes.length > 0 ? (
                <ul
                  style={{
                    margin: 0,
                    padding: "6px 0",
                    listStyle: "none",
                    maxHeight: 220,
                    overflowY: "auto",
                  }}
                >
                  {filteredLakes.map((l) => (
                    <li key={l.id}>
                      <button
                        onClick={() => {
                          dispatch({ type: "SELECT_LAKE", id: l.id });
                          dispatch({ type: "SET_TAB", tab: "Overview" });
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "9px 14px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          ...flex({ gap: 10, alignItems: "center" }),
                          transition: "background .1s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = T.panel)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <RiskBadge risk={l.risk} />
                        <span style={{ ...ui, fontSize: 13, color: T.text }}>
                          {l.name}
                        </span>
                        <span
                          style={{
                            ...ui,
                            fontSize: 11,
                            color: T.dim,
                            marginLeft: "auto",
                          }}
                        >
                          {l.region}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : searchQuery.length > 0 ? (
                <div
                  style={{ padding: "14px", ...ui, fontSize: 13, color: T.dim }}
                >
                  No lakes match "{searchQuery}"
                </div>
              ) : (
                <div
                  style={{ padding: "14px", ...ui, fontSize: 13, color: T.dim }}
                >
                  Type to search {MOCK_LAKES.length} monitored lakes
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <Tooltip text="Alerts">
            <button
              aria-label={`Alerts — ${activeAlertCount} active`}
              onClick={() => dispatch({ type: "TOGGLE_NOTIFICATIONS" })}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `1px solid ${showNotifications ? T.accent : T.border}`,
                background: showNotifications ? "#EEF4FF" : T.surface,
                cursor: "pointer",
                ...flex({ alignItems: "center", justifyContent: "center" }),
                color: showNotifications ? T.accent : T.muted,
                position: "relative",
                transition: "all .15s",
              }}
            >
              <i className="ti ti-bell" style={{ fontSize: 16 }} />
              {activeAlertCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 9,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: T.risk.CRITICAL.fg,
                    border: `1.5px solid ${T.surface}`,
                  }}
                />
              )}
            </button>
          </Tooltip>
          {showNotifications && (
            <AlertPanel
              alerts={alerts || []}
              dispatch={dispatch}
              state={state}
            />
          )}
        </div>

        {/* Operator */}
        <div
          style={{
            ...flex({ alignItems: "center", gap: 8 }),
            paddingLeft: 8,
            borderLeft: `1px solid ${T.border}`,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#E6F1FB",
              ...flex({ alignItems: "center", justifyContent: "center" }),
              color: "#185FA5",
              fontWeight: 700,
              ...display,
              fontSize: 13,
            }}
          >
            OC
          </div>
          <div style={{ ...col() }}>
            <span
              style={{ fontSize: 13, fontWeight: 600, ...ui, color: T.text }}
            >
              Operations Center
            </span>
            <span style={{ fontSize: 11, ...ui, color: T.dim }}>
              Duty watch — active
            </span>
          </div>
        </div>
      </div>

      {(showSearch || showNotifications) && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => dispatch({ type: "CLOSE_PANELS" })}
        />
      )}
    </header>
  );
}
