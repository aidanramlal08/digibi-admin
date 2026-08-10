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
    primary: { background: disabled ? C.lineStrong : C.accent, color: C.onAccent, border: "1px solid transparent" },
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
            color: n === value ? C.onAccent : C.inkDim,
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

export function Table({ columns, rows, empty, topRow }) {
  const hasRows = rows && rows.length > 0;
  const hasTopRow = topRow != null;
  if (!hasRows && !hasTopRow) {
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
          {topRow}
          {hasRows ? (
            rows.map((row, i) => (
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
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} style={{ padding: "20px 12px", color: C.inkFaint, fontStyle: "italic", textAlign: "center" }}>
                {empty || "Nothing here yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Table + search box + CSV export, filtering client-side over searchKeys.
// `topRow` is a <tr> rendered as the first tbody row — use it for inline
// forms that need to line up with the table's columns.
export function DataTable({ columns, rows, empty, searchKeys, exportName, topRow }) {
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
      <Table columns={columns} rows={filtered} empty={empty} topRow={topRow} />
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

// Horizontal distribution bars for a small set of labelled counts (e.g. QA
// score 1–5, or spend by category). Bar length is share of the max; the
// value sits at the end — pass formatValue to render it as currency etc.
export function DistributionBars({ items, colorFor, formatValue, labelWidth = 64 }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  const fmt = formatValue || ((v) => v);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: labelWidth, fontSize: 12, color: C.inkDim, fontWeight: 600, flexShrink: 0 }}>{it.label}</div>
          <div style={{ flex: 1, background: C.sunken, borderRadius: 6, height: 22, position: "relative", overflow: "hidden" }}>
            <div style={{ width: `${(it.count / max) * 100}%`, height: "100%", background: colorFor ? colorFor(it) : C.accent, borderRadius: 6, minWidth: it.count > 0 ? 2 : 0 }} />
          </div>
          <div style={{ minWidth: 40, textAlign: "right", fontSize: 12.5, color: C.ink, fontWeight: 700, fontFamily: C.mono, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{fmt(it.count)}</div>
        </div>
      ))}
    </div>
  );
}

// Tiny inline trend line for a KPI tile — no axes, just shape + an
// emphasized endpoint, per the dataviz guidance for sparklines.
export function Sparkline({ values, color, width = 72, height = 24 }) {
  if (!values || values.length < 2) return <svg width={width} height={height} aria-hidden="true" />;
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const span = mx - mn || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    height - 2 - ((v - mn) / span) * (height - 4),
  ]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      <path d={d} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="2.2" fill={color} />
    </svg>
  );
}

// A single KPI tile: label, big tabular-num value, an up/down/flat delta
// chip, and an optional sparkline. `deltaPct` omitted or null renders a flat
// "—" instead of a fabricated comparison — never invent a trend.
export function MetricTile({ label, value, deltaPct, goodDirection = "up", sparkValues, sparkColor, accent }) {
  const hasDelta = deltaPct != null && Number.isFinite(deltaPct);
  const hasSpark = sparkValues && sparkValues.length > 1;
  const flat = hasDelta && Math.abs(deltaPct) < 0.05;
  const up = hasDelta && deltaPct > 0;
  const isGood = hasDelta && !flat && (goodDirection === "up" ? up : !up);
  const deltaColor = flat ? C.inkFaint : isGood ? C.ok : C.danger;
  const arrow = flat ? "■" : up ? "▲" : "▼";
  return (
    <div
      style={{
        background: accent ? `linear-gradient(160deg, ${C.accentWash}, transparent 70%)` : C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontFamily: C.mono, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: C.inkFaint, fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: C.mono, fontVariantNumeric: "tabular-nums", fontWeight: 650, fontSize: 24, letterSpacing: "-0.01em", marginTop: 7, lineHeight: 1, color: C.ink }}>{value}</div>
      {hasDelta || hasSpark ? (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, marginTop: 8, minHeight: 24 }}>
          {hasDelta ? (
            <span style={{ fontFamily: C.mono, fontSize: 11.5, fontWeight: 650, color: deltaColor, display: "inline-flex", alignItems: "center", gap: 3 }}>
              {arrow} {Math.abs(deltaPct).toFixed(1)}%
            </span>
          ) : <span />}
          {hasSpark ? <Sparkline values={sparkValues} color={sparkColor || C.accent} /> : null}
        </div>
      ) : null}
    </div>
  );
}

// Grouped monthly bars for two paired series (income/expense-shaped data).
// `data` = [{ label, a, b }]. Colors default to the validated income/expense
// pair. Hover shows both values + the net for that month.
export function MonthlyBarChart({ data, colorA = C.income, colorB = C.expense, nameA = "A", nameB = "B", formatValue = (v) => v, height = 200 }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!data || data.length === 0) {
    return <div style={{ fontSize: 13, color: C.inkFaint, padding: "18px 4px" }}>No data yet.</div>;
  }
  const width = 480;
  const padding = { top: 14, right: 8, bottom: 22, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxV = Math.max(...data.flatMap((d) => [d.a, d.b]), 1) * 1.12;
  const groupW = innerW / data.length;
  const barW = Math.max(6, groupW * 0.32);
  const y = (v) => padding.top + innerH - (v / maxV) * innerH;
  const hovered = hoverIdx != null ? data[hoverIdx] : null;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 8, fontSize: 11.5, color: C.inkDim }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><i style={{ width: 9, height: 9, borderRadius: 2, background: colorA, display: "inline-block" }} />{nameA}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><i style={{ width: 9, height: 9, borderRadius: 2, background: colorB, display: "inline-block" }} />{nameB}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height, display: "block", overflow: "visible" }}>
        <line x1={padding.left} y1={padding.top + innerH} x2={width - padding.right} y2={padding.top + innerH} stroke={C.line} strokeWidth="1" />
        {data.map((d, i) => {
          const gx = padding.left + i * groupW;
          const ha = (d.a / maxV) * innerH;
          const hb = (d.b / maxV) * innerH;
          const isHovered = hoverIdx === i;
          return (
            <g key={i}>
              <rect
                x={gx + groupW / 2 - barW - 1}
                y={y(d.a)}
                width={barW}
                height={Math.max(1, ha)}
                rx="3"
                fill={colorA}
                opacity={hoverIdx == null || isHovered ? 1 : 0.45}
              />
              <rect
                x={gx + groupW / 2 + 1}
                y={y(d.b)}
                width={barW}
                height={Math.max(1, hb)}
                rx="3"
                fill={colorB}
                opacity={hoverIdx == null || isHovered ? 1 : 0.45}
              />
              <text x={gx + groupW / 2} y={height - 6} textAnchor="middle" fontSize="10" fontFamily={C.mono} fill={C.inkFaint}>
                {d.label}
              </text>
              <rect
                x={gx}
                y={padding.top}
                width={groupW}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: "crosshair" }}
              />
            </g>
          );
        })}
      </svg>
      {hovered ? (
        <div
          style={{
            position: "absolute",
            left: `${((hoverIdx + 0.5) / data.length) * 100}%`,
            top: 4,
            transform: hoverIdx > data.length / 2 ? "translate(-100%, 0)" : "translate(0, 0)",
            background: C.tooltipBg,
            color: C.tooltipFg,
            borderRadius: 8,
            padding: "8px 11px",
            fontSize: 12,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <div style={{ fontFamily: C.mono, color: C.tooltipFgDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{hovered.label}</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>{nameA}</span>
            <span style={{ fontFamily: C.mono, fontWeight: 700 }}>{formatValue(hovered.a)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>{nameB}</span>
            <span style={{ fontFamily: C.mono, fontWeight: 700 }}>{formatValue(hovered.b)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Small donut for a categorical mix (≤6 slices) using the sequential gold
// ramp — each item gets one hue step, so category ranking reads by depth.
export function Donut({ data, formatValue = (v) => v, centerLabel, size = 168 }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!data || data.length === 0 || total <= 0) {
    return <div style={{ fontSize: 13, color: C.inkFaint, padding: "18px 4px" }}>No data yet.</div>;
  }
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.42;
  const r = size * 0.25;
  let angle = -Math.PI / 2;
  const seq = C.seq;
  const arcs = data.map((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const a0 = angle;
    const a1 = angle + sweep;
    angle = a1;
    const large = sweep > Math.PI ? 1 : 0;
    const p = (rad, ang) => [cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad];
    const [lx, ly] = p(R, a0);
    const [ex, ey] = p(R, a1);
    const [lxi, lyi] = p(r, a1);
    const [exi, eyi] = p(r, a0);
    const color = seq[i % seq.length];
    const path = `M ${lx.toFixed(1)} ${ly.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)} L ${lxi.toFixed(1)} ${lyi.toFixed(1)} A ${r} ${r} 0 ${large} 0 ${exi.toFixed(1)} ${eyi.toFixed(1)} Z`;
    return { ...d, path, color, i };
  });
  const hovered = hoverIdx != null ? arcs[hoverIdx] : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((a) => (
            <path
              key={a.i}
              d={a.path}
              fill={a.color}
              stroke={C.paper}
              strokeWidth="2"
              opacity={hoverIdx == null || hoverIdx === a.i ? 1 : 0.45}
              onMouseEnter={() => setHoverIdx(a.i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: "pointer" }}
            />
          ))}
          <text x={cx} y={cy - 3} textAnchor="middle" fontFamily={C.mono} fontWeight="700" fontSize="15" fill={C.ink}>
            {hovered ? formatValue(hovered.value) : centerLabel || formatValue(total)}
          </text>
          <text x={cx} y={cy + 13} textAnchor="middle" fontFamily={C.mono} fontSize="9.5" fill={C.inkFaint} style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {hovered ? hovered.label : "total"}
          </text>
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
        {arcs.map((a) => (
          <div
            key={a.i}
            onMouseEnter={() => setHoverIdx(a.i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12, cursor: "pointer", opacity: hoverIdx == null || hoverIdx === a.i ? 1 : 0.55 }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.inkDim, minWidth: 0 }}>
              <i style={{ width: 9, height: 9, borderRadius: 2, background: a.color, flexShrink: 0, display: "inline-block" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.label}</span>
            </span>
            <span style={{ fontFamily: C.mono, fontWeight: 650, color: C.ink, flexShrink: 0 }}>{Math.round((a.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
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
        <text x={x(points.length - 1)} y={y(last.value) - 10} textAnchor="end" fontSize={11} fontWeight={700} fill={C.ink} fontFamily={C.mono}>
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
            background: C.tooltipBg,
            color: C.tooltipFg,
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 12,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 700, fontFamily: C.mono, fontVariantNumeric: "tabular-nums" }}>{formatValue(hovered.value)}</div>
          <div style={{ color: C.tooltipFgDim, fontSize: 11 }}>{hovered.label}</div>
        </div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.inkFaint, marginTop: 6 }}>
        <span>{points[0].label}</span>
        <span>{last.label}</span>
      </div>
    </div>
  );
}
