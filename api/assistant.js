// Owner Assistant chat endpoint. Requires the admin session; runs the agent
// over the posted conversation, grounded on the dashboard snapshot the client
// sends with each turn.
import { isAuthed } from "./_auth.js";
import { runAgent } from "./_agent.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!isAuthed(req)) {
    res.status(401).json({ ok: false, error: "Not signed in." });
    return;
  }
  const { messages, data } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ ok: false, error: "No message." });
    return;
  }
  const attachmentBytes = messages.reduce((s, m) => s + (m.attachments || []).reduce((t, a) => t + ((a.data || "").length), 0), 0);
  if (attachmentBytes > 20 * 1024 * 1024) {
    res.status(400).json({ ok: false, error: "Attachments too large." });
    return;
  }
  const result = await runAgent({ messages, dashboardData: data || null });
  res.status(result.ok ? 200 : 503).json(result);
}
