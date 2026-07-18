import React from "react";
import { C } from "./tokens.js";

export function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bgDeep, color: C.text, fontFamily: C.body, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(60% 45% at 50% 0%, ${C.blueGlow}, transparent 70%)`,
          opacity: 0.45,
        }}
      />
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        padding: 24,
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 11,
  fontSize: 15,
  background: C.bgDeep,
  border: `1px solid ${C.lineStrong}`,
  color: C.text,
  fontFamily: C.body,
  outline: "none",
};

export function Field({ label, type = "text", value, onChange, autoComplete, placeholder }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ display: "block", fontSize: 12.5, color: C.textDim, marginBottom: 7, fontWeight: 600 }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  );
}

export function Button({ children, disabled, variant = "primary", onClick, type = "button", style }) {
  const variants = {
    primary: { background: disabled ? "rgba(46,107,255,0.4)" : `linear-gradient(180deg, ${C.blue}, ${C.blueDeep})`, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.text, border: `1px solid ${C.lineStrong}` },
    subtle: { background: C.surfaceHi, color: C.text, border: `1px solid ${C.line}` },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "11px 18px",
        borderRadius: 11,
        fontSize: 14.5,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        fontFamily: C.body,
        opacity: disabled ? 0.7 : 1,
        transition: "opacity .15s, transform .05s",
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Notice({ kind, children }) {
  if (!children) return null;
  const color = kind === "error" ? C.danger : kind === "ok" ? C.ok : kind === "warn" ? C.warn : C.ice;
  const bg =
    kind === "error"
      ? "rgba(255,107,107,0.1)"
      : kind === "ok"
        ? "rgba(74,222,128,0.1)"
        : kind === "warn"
          ? "rgba(251,191,36,0.1)"
          : C.iceGlow;
  return (
    <div style={{ fontSize: 13.5, color, background: bg, border: `1px solid ${color}33`, borderRadius: 10, padding: "10px 13px", marginBottom: 16, lineHeight: 1.45 }}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, accent }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: C.display, fontSize: 28, fontWeight: 800, lineHeight: 1, color: accent || C.text }}>{value}</div>
      {hint ? <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 6 }}>{hint}</div> : null}
    </div>
  );
}

export function Pill({ children, tone }) {
  const map = {
    ok: { c: C.ok, b: "rgba(74,222,128,0.12)" },
    miss: { c: C.danger, b: "rgba(255,107,107,0.12)" },
    warn: { c: C.warn, b: "rgba(251,191,36,0.12)" },
    neutral: { c: C.textDim, b: "rgba(120,160,255,0.10)" },
  };
  const s = map[tone] || map.neutral;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, color: s.c, background: s.b, borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export function Spinner({ label }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.textFaint, fontSize: 14, minHeight: 200 }}>
      {label || "Loading…"}
    </div>
  );
}

export function CenteredCard({ children }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontFamily: C.display, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Digi<span style={{ color: C.blueLight }}>Bi</span>
          </div>
          <div style={{ fontSize: 12, color: C.textFaint, marginTop: 4, letterSpacing: "0.02em" }}>Owner Dashboard</div>
        </div>
        <Card>{children}</Card>
      </div>
    </div>
  );
}

export function Table({ columns, rows, empty }) {
  if (!rows || rows.length === 0) {
    return <div style={{ fontSize: 13, color: C.textFaint, padding: "18px 4px" }}>{empty || "Nothing here yet."}</div>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ textAlign: "left", padding: "8px 10px", color: C.textDim, fontWeight: 600, fontSize: 11.5, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "9px 10px", borderBottom: `1px solid ${C.line}`, color: C.text, whiteSpace: "nowrap" }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
