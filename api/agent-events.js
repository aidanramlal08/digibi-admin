// GET /api/agent-events?limit=50[&agent_id=sales]
// Returns the master activity stream (or filtered to one agent). Newest first.
// Admin-session gated.
import { isAuthed } from "./_auth.js";
import { listEvents, storeConfigured } from "./_lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }
  if (!isAuthed(req)) { res.status(401).json({ ok: false, error: "Not signed in." }); return; }

  if (!storeConfigured()) {
    res.status(200).json({ ok: true, storeConfigured: false, items: [] });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const agent_id = url.searchParams.get("agent_id") || undefined;

  const r = await listEvents({ limit, agent_id });
  if (!r.ok) { res.status(200).json({ ok: false, storeConfigured: true, error: r.error, items: [] }); return; }
  res.status(200).json({ ok: true, storeConfigured: true, items: r.data || [] });
}
