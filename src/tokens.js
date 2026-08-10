// Shared design tokens. Values point at the CSS custom properties defined in
// theme.css, so every page that reads C.xxx gets light/dark for free with no
// per-page changes — the "Command OS" gold-accent identity, dark by default
// on a dark system, warm paper by default on a light one.
export const C = {
  bg: "var(--bg)",
  paper: "var(--paper)",
  paper2: "var(--paper-2)",
  sunken: "var(--sunken)",
  line: "var(--line)",
  lineStrong: "var(--line-strong)",
  ink: "var(--ink)",
  inkDim: "var(--ink-dim)",
  inkFaint: "var(--ink-faint)",
  accent: "var(--accent)",
  accentDeep: "var(--accent-deep)",
  accentLight: "var(--accent-light)",
  accentWash: "var(--accent-wash)",
  ok: "var(--ok)",
  okWash: "var(--ok-wash)",
  warn: "var(--warn)",
  warnWash: "var(--warn-wash)",
  danger: "var(--danger)",
  dangerWash: "var(--danger-wash)",
  // Money-series colors — colorblind-validated pair, always paired together.
  income: "var(--c-income)",
  expense: "var(--c-expense)",
  // Sequential ramp (light → dark gold) for ranked/ordered single-hue charts.
  seq: ["var(--seq-0)", "var(--seq-1)", "var(--seq-2)", "var(--seq-3)", "var(--seq-4)"],
  // Text sitting directly on a solid C.accent fill — never "#fff", the gold
  // accent is a mid-tone in both themes so dark ink is what stays legible.
  onAccent: "var(--on-accent)",
  // Fixed dark chip + light text for floating tooltips — deliberately NOT
  // tied to C.ink (which inverts between themes), so a tooltip never goes
  // "white text on white" when the page is in dark mode.
  tooltipBg: "var(--tooltip-bg)",
  tooltipFg: "var(--tooltip-fg)",
  tooltipFgDim: "var(--tooltip-fg-dim)",
  display: "'Bricolage Grotesque',sans-serif",
  body: "'Hanken Grotesk',sans-serif",
  mono: "ui-monospace,'SF Mono','JetBrains Mono','Cascadia Code',Menlo,Consolas,monospace",
};

export function zar(rands) {
  const n = Number(rands) || 0;
  return "R" + n.toLocaleString("en-ZA", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

// Compact form for tight spaces (KPI tiles, sparkline labels): R1.2M / R84k.
export function zarCompact(rands) {
  const n = Number(rands) || 0;
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1e6) return sign + "R" + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + "M";
  if (a >= 1e3) return sign + "R" + Math.round(a / 1e3) + "k";
  return zar(n);
}
