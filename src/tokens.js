// Shared design tokens — light editorial palette: paper ground, hairline
// rules, DigiBi's brand type pairing carried over from the marketing site.
export const C = {
  bg: "#F5F6FB",
  paper: "#FFFFFF",
  sunken: "#EEF1F9",
  line: "#E3E7F1",
  lineStrong: "#CDD4E8",
  ink: "#11131D",
  inkDim: "#5B6478",
  inkFaint: "#8891A6",
  accent: "#2451D6",
  accentDeep: "#17368C",
  accentLight: "#3D68E8",
  accentWash: "rgba(36,81,214,0.07)",
  ok: "#1E8E5A",
  okWash: "rgba(30,142,90,0.10)",
  warn: "#B4790F",
  warnWash: "rgba(180,121,15,0.10)",
  danger: "#C43D3D",
  dangerWash: "rgba(196,61,61,0.10)",
  display: "'Bricolage Grotesque',sans-serif",
  body: "'Hanken Grotesk',sans-serif",
};

export function zar(rands) {
  const n = Number(rands) || 0;
  return "R" + n.toLocaleString("en-ZA", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}
