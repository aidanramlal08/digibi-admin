// Shared design tokens — mirrors the DigiBi marketing site palette.
export const C = {
  bg: "#030510",
  bgDeep: "#01020A",
  surface: "#0A1226",
  surfaceHi: "#101B38",
  line: "rgba(120,160,255,0.10)",
  lineStrong: "rgba(120,160,255,0.22)",
  text: "#F2F6FF",
  textDim: "#93A5CC",
  textFaint: "#8593BB",
  blue: "#2E6BFF",
  blueDeep: "#1E4FD6",
  blueLight: "#6EA0FF",
  blueGlow: "rgba(46,107,255,0.35)",
  ice: "#9FC2FF",
  iceGlow: "rgba(159,194,255,0.22)",
  danger: "#FF6B6B",
  warn: "#FBBF24",
  ok: "#4ADE80",
  display: "'Bricolage Grotesque',sans-serif",
  body: "'Hanken Grotesk',sans-serif",
};

export function zar(rands) {
  const n = Number(rands) || 0;
  return "R" + n.toLocaleString("en-ZA", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}
