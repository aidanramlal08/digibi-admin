// Minimal owner-email sender for the daily brief, via Resend's HTTP API (no
// SDK dependency). Self-contained in the Vercel app — no n8n. Cleanly no-ops
// when unconfigured so the brief still generates. Underscore prefix keeps
// Vercel from routing this file.

// Tiny, safe markdown → HTML for the brief body: escapes first, then supports
// bold, bullets, and paragraphs — the same subset the dashboard renders.
function briefToHtml(text) {
  const esc = String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const lines = esc.split("\n");
  const out = [];
  let inList = false;
  for (const line of lines) {
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push("<li>" + line.replace(/^\s*[-*]\s+/, "") + "</li>");
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      if (line.trim()) out.push("<p>" + line + "</p>");
    }
  }
  if (inList) out.push("</ul>");
  const body = out.join("").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#11131D;max-width:560px">
    <div style="font-weight:800;font-size:18px;margin-bottom:4px">DigiBi — Daily Brief</div>
    <div style="font-size:12px;color:#8891A6;margin-bottom:16px">${new Date().toLocaleDateString("en-ZA", { weekday: "long", month: "long", day: "numeric" })}</div>
    ${body}
  </div>`;
}

// Sends the brief to the owner. Returns { sent } on success, { skipped } when
// unconfigured, or { error } on failure — never throws.
export async function sendBriefEmail(brief) {
  const apiKey = process.env.RESEND_API_KEY || "";
  const to = process.env.OWNER_EMAIL || "";
  const from = process.env.BRIEF_FROM || "DigiBi <onboarding@resend.dev>";
  if (!apiKey || !to) return { skipped: true, reason: "email not configured (need RESEND_API_KEY and OWNER_EMAIL)" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `DigiBi daily brief — ${new Date().toLocaleDateString("en-ZA")}`,
        html: briefToHtml(brief),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { error: `Resend ${res.status}`, detail: detail.slice(0, 300) };
    }
    return { sent: true };
  } catch {
    return { error: "Email request failed." };
  }
}
