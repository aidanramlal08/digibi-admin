// GET  /api/approvals              → list pending approvals
// POST /api/approvals              → { id, action: "approve" | "reject" }
//   approve → runs the queued executor, logs the result, marks done/failed
//   reject  → marks rejected, does nothing else
// Requires admin session.
import { isAuthed } from "./_auth.js";
import { listPendingApprovals, getApproval, updateApproval, storeConfigured } from "./_lib/store.js";
import { runExecutor } from "./_lib/tools.js";
import { logEvent } from "./_lib/store.js";

export default async function handler(req, res) {
  if (!isAuthed(req)) { res.status(401).json({ ok: false, error: "Not signed in." }); return; }

  if (!storeConfigured()) {
    res.status(200).json({ ok: true, storeConfigured: false, items: [] });
    return;
  }

  if (req.method === "GET") {
    const r = await listPendingApprovals();
    if (!r.ok) { res.status(200).json({ ok: false, storeConfigured: true, error: r.error, items: [] }); return; }
    res.status(200).json({ ok: true, storeConfigured: true, items: r.data || [] });
    return;
  }

  if (req.method === "POST") {
    const { id, action } = req.body || {};
    if (!id || !["approve", "reject"].includes(action)) {
      res.status(400).json({ ok: false, error: "Bad request (need id + action)." });
      return;
    }
    const found = await getApproval(id);
    if (!found.ok || !found.data) { res.status(404).json({ ok: false, error: "Approval not found." }); return; }
    const row = found.data;
    if (row.status !== "pending") { res.status(409).json({ ok: false, error: `Already ${row.status}.` }); return; }

    if (action === "reject") {
      await updateApproval(id, { status: "rejected", acted_at: new Date().toISOString() });
      await logEvent({ agent_id: row.agent_id, msg: `Approval rejected · ${row.ctx}`.slice(0, 200), agent_run_id: row.agent_run_id });
      res.status(200).json({ ok: true, id, status: "rejected" });
      return;
    }

    // approve: run the executor, capture the result
    await updateApproval(id, { status: "approved", acted_at: new Date().toISOString() });
    await logEvent({ agent_id: row.agent_id, msg: `Approved · ${row.ctx}`.slice(0, 200), agent_run_id: row.agent_run_id });
    const act = row.action || {};
    const result = await runExecutor(act.name, act.params || {});
    const failed = !!(result && result.error);
    await updateApproval(id, {
      status: failed ? "failed" : "done",
      executed_at: new Date().toISOString(),
      result,
    });
    await logEvent({
      agent_id: row.agent_id,
      msg: failed ? `Execution failed · ${act.name} · ${result.error}`.slice(0, 200) : `Executed · ${act.name}`.slice(0, 200),
      level: failed ? "error" : "info",
      agent_run_id: row.agent_run_id,
    });
    res.status(200).json({ ok: true, id, status: failed ? "failed" : "done", result });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
