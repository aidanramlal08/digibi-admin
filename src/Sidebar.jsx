import React from "react";
import { C } from "./tokens.js";
import { Button } from "./ui.jsx";

export const PAGES = [
  { path: "/payments", label: "Payments" },
  { path: "/pipeline", label: "Pipeline & Leads" },
  { path: "/calls", label: "Call Activity" },
  { path: "/health", label: "Business Health" },
  { path: "/leads", label: "Lead Sources" },
  { path: "/costs", label: "Costs" },
  { path: "/emails", label: "Emails" },
];

export default function Sidebar({ path, go, refreshing, onRefresh, onSignOut }) {
  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        borderRight: `1px solid ${C.line}`,
        display: "flex",
        flexDirection: "column",
        padding: "24px 14px",
        gap: 4,
      }}
    >
      <div style={{ fontFamily: C.display, fontSize: 19, fontWeight: 800, padding: "0 10px", marginBottom: 22 }}>
        Digi<span style={{ color: C.blueLight }}>Bi</span>
      </div>
      {PAGES.map((p) => {
        const active = path === p.path;
        return (
          <a
            key={p.path}
            href={p.path}
            onClick={(e) => {
              e.preventDefault();
              go(p.path);
            }}
            style={{
              display: "block",
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              color: active ? "#fff" : C.textDim,
              background: active ? `linear-gradient(180deg, ${C.blue}, ${C.blueDeep})` : "transparent",
            }}
          >
            {p.label}
          </a>
        );
      })}
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 2px" }}>
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
