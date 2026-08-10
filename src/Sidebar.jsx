import React from "react";
import { C } from "./tokens.js";
import { Button } from "./ui.jsx";

export const NAV_GROUPS = [
  { group: null, items: [{ path: "/overview", label: "Overview" }, { path: "/agents", label: "Agent Console" }, { path: "/assistant", label: "Assistant" }] },
  {
    group: "Revenue",
    items: [
      { path: "/payments", label: "Payments" },
      { path: "/forecast", label: "Forecast" },
      { path: "/profitability", label: "Profitability" },
      { path: "/costs", label: "Costs" },
    ],
  },
  {
    group: "Growth",
    items: [
      { path: "/pipeline", label: "Pipeline" },
      { path: "/leads", label: "Lead Sources" },
      { path: "/calls", label: "Call Activity" },
    ],
  },
  {
    group: "Retention",
    items: [
      { path: "/accounts", label: "Accounts" },
      { path: "/churn", label: "Churn" },
      { path: "/emails", label: "Emails" },
    ],
  },
  {
    group: "Operations",
    items: [
      { path: "/system", label: "System Health", badge: (data) => data.systemHealth?.issues?.filter((i) => i.severity === "high").length || null },
      { path: "/tasks", label: "Tasks", badge: (data) => data.tasks?.overdueCount },
    ],
  },
];

export const PAGES = NAV_GROUPS.flatMap((g) => g.items);

export default function Sidebar({ path, go, refreshing, onRefresh, onSignOut, data }) {
  return (
    <div
      className="app-sidebar"
      style={{
        width: 228,
        flexShrink: 0,
        padding: "28px 16px 40px",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        borderRight: `1px solid ${C.line}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ fontFamily: C.display, fontSize: 19, fontWeight: 800, padding: "0 8px", marginBottom: 6, letterSpacing: "-0.01em" }}>
        Digi<span style={{ color: C.accent }}>Bi</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px", marginBottom: 26 }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: C.ok, flexShrink: 0 }} />
        <span style={{ fontFamily: C.mono, fontSize: 10, color: C.inkFaint, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          Command Deck
        </span>
      </div>

      {NAV_GROUPS.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 20 }}>
          {g.group ? (
            <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: C.inkFaint, fontWeight: 700, padding: "0 8px", marginBottom: 6 }}>
              {g.group}
            </div>
          ) : null}
          {g.items.map((p) => {
            const active = path === p.path;
            const badge = p.badge ? p.badge(data || {}) : null;
            return (
              <a
                key={p.path}
                href={import.meta.env.BASE_URL.replace(/\/$/, "") + p.path}
                onClick={(e) => {
                  e.preventDefault();
                  go(p.path);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "8px 8px",
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 600,
                  textDecoration: "none",
                  color: active ? C.accentDeep : C.inkDim,
                  background: active ? C.accentWash : "transparent",
                }}
              >
                <span>{p.label}</span>
                {badge ? (
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: C.danger, background: C.dangerWash, borderRadius: 20, padding: "1px 7px" }}>{badge}</span>
                ) : null}
              </a>
            );
          })}
        </div>
      ))}

      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px" }}>
        <Button variant="subtle" onClick={onRefresh} disabled={refreshing} style={{ width: "100%" }}>
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
        <Button variant="ghost" onClick={onSignOut} style={{ width: "100%" }}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
