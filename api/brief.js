// Daily owner-brief endpoint. Invoked two ways:
//  - Vercel Cron (daily) — authenticated by the Bearer CRON_SECRET Vercel adds.
//  - On demand from the dashboard — authenticated by the admin session.
// Generates the brief by having the agent gather current figures from HubSpot.
import { isAuthed } from "./_auth.js";
import { runAgent } from "./_agent.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const cronSecret = process.env.CRON_SECRET || "";
  const cronOk = !!cronSecret && (req.headers.authorization || "") === `Bearer ${cronSecret}`;
  if (!cronOk && !isAuthed(req)) {
    res.status(401).json({ ok: false, error: "Not authorized." });
    return;
  }
  const result = await runAgent({ brief: true });
  res.status(result.ok ? 200 : 503).json({
    ok: result.ok,
    brief: result.answer,
    error: result.error,
    generatedAt: new Date().toISOString(),
  });
}
