import React, { useState, useMemo } from "react";
import { C } from "./tokens.js";

export function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: C.body, display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 22, ...style }}>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: 8,
  fontSize: 14,
  background: C.paper,
  border: `1px solid ${C.lineStrong}`,
  color: C.ink,
  fontFamily: C.body,
  outline: "none",
};

export function Field({ label, type = "text", value, onChange, autoComplete, placeholder }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, marginBottom: 6, fontWeight: 700 }}>{label}</span>
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
    primary: { background: disabled ? "#8FA5E8" : C.accent, color: "#fff", border: "1px solid transparent" },
    ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.lineStrong}` },
    subtle: { background: C.paper, color: C.ink, border: `1px solid ${C.lineStrong}` },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "9px 14px",
        borderRadius: 8,
        fontSize: 13,
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
  const color = kind === "error" ? C.danger : kind === "ok" ? C.ok : kind === "warn" ? C.warn : C.accent;
  const bg = kind === "error" ? C.dangerWash : kind === "ok" ? C.okWash : kind === "warn" ? C.warnWash : C.accentWash;
  return (
    <div style={{ fontSize: 13, color, background: bg, border: `1px solid ${color}33`, borderRadius: 8, padding: "10px 13px", marginBottom: 16, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, accent }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: "16px 18px" }}>
      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: C.inkFaint, fontWeight: 700, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: C.display, fontSize: 26, fontWeight: 800, lineHeight: 1, color: accent || C.ink, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {hint ? <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 7 }}>{hint}</div> : null}
    </div>
  );
}

export function StatRow({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", borderTop: `1px solid ${C.line}`, borderLeft: `1px solid ${C.line}`, marginBottom: 28 }}>
      {children}
    </div>
  );
}

export function Pill({ children, tone }) {
  const map = {
    ok: { c: C.ok, b: C.okWash },
    miss: { c: C.danger, b: C.dangerWash },
    warn: { c: C.warn, b: C.warnWash },
    neutral: { c: C.inkDim, b: C.sunken },
  };
  const s = map[tone] || map.neutral;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: s.c, background: s.b, borderRadius: 6, padding: "4px 9px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export function PillRow({ children }) {
  return <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 22 }}>{children}</div>;
}

export function Spinner({ label }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.inkFaint, fontSize: 14, minHeight: 200 }}>
      {label || "Loading…"}
    </div>
  );
}

export function CenteredCard({ children }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: C.bg }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontFamily: C.display, fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>
            Digi<span style={{ color: C.accent }}>Bi</span>
          </div>
          <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Owner Dashboard</div>
        </div>
        <Card>{children}</Card>
      </div>
    </div>
  );
}

export function Eyebrow({ children }) {
  return <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.09em", color: C.inkFaint, fontWeight: 700, marginBottom: 6 }}>{children}</div>;
}

export function PageTitle({ children }) {
  return <h1 style={{ fontFamily: C.display, fontSize: 30, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.01em", textWrap: "balance" }}>{children}</h1>;
}

export function PageDek({ children }) {
  return <p style={{ fontSize: 13.5, color: C.inkDim, margin: "0 0 24px", maxWidth: "60ch" }}>{children}</p>;
}

export function SectionTitle({ children, style }) {
  return <h2 style={{ fontFamily: C.display, fontSize: 16, fontWeight: 800, margin: "0 0 12px", ...style }}>{children}</h2>;
}

export function Rule() {
  return <hr style={{ border: "none", borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />;
}

export function Grid2({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="grid-2-fallback">
      {children}
    </div>
  );
}

export function Toolbar({ left, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

export function RangeControl({ value, onChange, options = [7, 30, 90] }) {
  return (
    <div style={{ display: "inline-flex", border: `1px solid ${C.lineStrong}`, borderRadius: 8, overflow: "hidden" }}>
      {options.map((n, i) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            padding: "7px 12px",
            fontSize: 12.5,
            fontWeight: 700,
            background: n === value ? C.accent : C.paper,
            color: n === value ? "#fff" : C.inkDim,
            border: "none",
            borderRight: i < options.length - 1 ? `1px solid ${C.lineStrong}` : "none",
            cursor: "pointer",
            fontFamily: C.body,
          }}
        >
          {n}d
        </button>
      ))}
    </div>
  );
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename, columns, rows) {
  const head = columns.map((c) => csvEscape(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => csvEscape(c.csv ? c.csv(r) : r[c.key])).join(",")).join("\n");
  const blob = new Blob([head + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Table({ columns, rows, empty }) {
  if (!rows || rows.length === 0) {
    return <div style={{ fontSize: 13, color: C.inkFaint, padding: "20px 4px" }}>{empty || "Nothing here yet."}</div>;
  }
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 10 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.num ? "right" : "left",
                  padding: "9px 12px",
                  color: C.inkFaint,
                  fontWeight: 700,
                  fontSize: 10.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  background: C.sunken,
                  borderBottom: `1px solid ${C.line}`,
                  whiteSpace: "nowrap",
                }}
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
                <td
                  key={col.key}
                  style={{
                    textAlign: col.num ? "right" : "left",
                    padding: "10px 12px",
                    borderBottom: i < rows.length - 1 ? `1px solid ${C.line}` : "none",
                    color: C.ink,
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
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

// Table + search box + CSV export, filtering client-side over searchKeys.
export function DataTable({ columns, rows, empty, searchKeys, exportName }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchKeys) return rows || [];
    return (rows || []).filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)));
  }, [rows, query, searchKeys]);

  return (
    <div>
      <Toolbar
        left={
          searchKeys ? (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13, border: `1px solid ${C.lineStrong}`, background: C.paper, color: C.ink, minWidth: 220, outline: "none", fontFamily: C.body }}
            />
          ) : null
        }
        right={
          exportName ? (
            <Button variant="ghost" style={{ padding: "6px 10px", fontSize: 12, borderRadius: 7 }} onClick={() => downloadCsv(exportName + ".csv", columns, filtered)}>
              Export CSV
            </Button>
          ) : null
        }
      />
      <Table columns={columns} rows={filtered} empty={empty} />
    </div>
  );
}

// Cross-cutting "what needs a look" feed for the Overview page — combines
// signals from every section into one prioritized list.
export function AttentionList({ items }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px", fontSize: 13, color: C.inkFaint }}>
        Nothing needs attention right now.
      </div>
    );
  }
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 12,
            padding: "12px 14px",
            borderBottom: i < items.length - 1 ? `1px solid ${C.line}` : "none",
            background: C.paper,
            fontSize: 13,
          }}
        >
          <span style={{ width: 3, borderRadius: 2, flexShrink: 0, background: it.tone === "high" ? C.danger : C.warn }} />
          <div>
            <div style={{ fontWeight: 700, color: C.ink }}>{it.title}</div>
            <div style={{ color: C.inkFaint, fontSize: 12 }}>{it.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Dependency-free SVG trend line: single series, hairline baseline, area wash,
// crosshair + tooltip on hover.
export function TrendLine({ points, height = 170, formatValue = (v) => v }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const width = 720;
  const padding = { top: 16, right: 12, bottom: 24, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  if (!points || points.length === 0) {
    return <div style={{ fontSize: 13, color: C.inkFaint, padding: "18px 4px" }}>No data yet.</div>;
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
    <div style={{ position: "relative", marginBottom: 24 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height, display: "block" }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <line x1={padding.left} y1={baselineY} x2={width - padding.right} y2={baselineY} stroke={C.line} strokeWidth={1} />
        <path d={areaPath} fill={C.accent} opacity={0.08} stroke="none" />
        <path d={linePath} fill="none" stroke={C.accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(points.length - 1)} cy={y(last.value)} r={4} fill={C.accent} stroke={C.paper} strokeWidth={2} />
        {hovered ? (
          <>
            <line x1={x(hoverIdx)} y1={padding.top} x2={x(hoverIdx)} y2={padding.top + innerH} stroke={C.lineStrong} strokeWidth={1} />
            <circle cx={x(hoverIdx)} cy={y(hovered.value)} r={4} fill={C.accent} stroke={C.paper} strokeWidth={2} />
          </>
        ) : null}
        <text x={x(points.length - 1)} y={y(last.value) - 10} textAnchor="end" fontSize={11} fontWeight={700} fill={C.ink}>
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
            background: C.ink,
            color: "#fff",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 12,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 700 }}>{formatValue(hovered.value)}</div>
          <div style={{ color: "#C7CCE0", fontSize: 11 }}>{hovered.label}</div>
        </div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.inkFaint, marginTop: 6 }}>
        <span>{points[0].label}</span>
        <span>{last.label}</span>
      </div>
    </div>
  );
}
