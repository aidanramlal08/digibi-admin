import React, { useState } from "react";
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

export function StatRow({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 18 }}>
      {children}
    </div>
  );
}

export function PageTitle({ children }) {
  return <h1 style={{ fontFamily: C.display, fontSize: 24, fontWeight: 800, margin: "0 0 20px" }}>{children}</h1>;
}

// Dependency-free SVG trend line: single series, hairline baseline, area wash,
// crosshair + tooltip on hover. See dataviz skill: line for trend-over-time,
// text always in ink tokens (never the series color), direct label at the end.
export function TrendLine({ points, height = 160, formatValue = (v) => v, color = C.blueLight }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const width = 640;
  const padding = { top: 16, right: 12, bottom: 24, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  if (!points || points.length === 0) {
    return <div style={{ fontSize: 13, color: C.textFaint, padding: "18px 4px" }}>No data yet.</div>;
  }

  const values = points.map((p) => p.value);
  const maxV = Math.max(...values, 0);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;

  const x = (i) => padding.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => padding.top + innerH - ((v - minV) / range) * innerH;
  const baselineY = y(0);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const areaPath = `${linePath} L ${x(points.length - 1)} ${baselineY} L ${x(0)} ${baselineY} Z`;

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const rel = (px - padding.left) / innerW;
    const idx = Math.round(rel * (points.length - 1));
    setHoverIdx(Math.max(0, Math.min(points.length - 1, idx)));
  };

  const last = points[points.length - 1];
  const hovered = hoverIdx != null ? points[hoverIdx] : null;

  return (
    <div style={{ position: "relative", marginBottom: 18 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height, display: "block" }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <line x1={padding.left} y1={baselineY} x2={width - padding.right} y2={baselineY} stroke={C.line} strokeWidth={1} />
        <path d={areaPath} fill={color} opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(points.length - 1)} cy={y(last.value)} r={4} fill={color} stroke={C.bgDeep} strokeWidth={2} />
        {hovered ? (
          <>
            <line x1={x(hoverIdx)} y1={padding.top} x2={x(hoverIdx)} y2={padding.top + innerH} stroke={C.lineStrong} strokeWidth={1} />
            <circle cx={x(hoverIdx)} cy={y(hovered.value)} r={4} fill={color} stroke={C.bgDeep} strokeWidth={2} />
          </>
        ) : null}
        <text x={x(points.length - 1)} y={y(last.value) - 10} textAnchor="end" fontSize={11} fontWeight={700} fill={C.text}>
          {formatValue(last.value)}
        </text>
      </svg>
      {hovered ? (
        <div
          style={{
            position: "absolute",
            left: `${(x(hoverIdx) / width) * 100}%`,
            top: 0,
            transform: hoverIdx > points.length / 2 ? "translate(-100%, 0)" : "translate(0, 0)",
            background: C.surfaceHi,
            border: `1px solid ${C.lineStrong}`,
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 12,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          <div style={{ color: C.text, fontWeight: 700 }}>{formatValue(hovered.value)}</div>
          <div style={{ color: C.textFaint, fontSize: 11 }}>{hovered.label}</div>
        </div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textFaint, marginTop: 4 }}>
        <span>{points[0].label}</span>
        <span>{last.label}</span>
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
