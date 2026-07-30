// Supabase-backed store for agent approvals + event log.
// Uses the REST API directly (no SDK dep) with the service role key. All
// helpers no-op cleanly when Supabase isn't configured, so the app still
// works with the "Not configured" empty state.

const URL = process.env.SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_KEY || "";

export function storeConfigured() {
  return !!(URL && KEY);
}

async function sb(path, opts = {}) {
  if (!storeConfigured()) return { ok: false, status: 503, error: "Supabase not configured" };
  try {
    const res = await fetch(`${URL}/rest/v1${path}`, {
      ...opts,
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: opts.method === "POST" ? "return=representation" : "",
        ...opts.headers,
      },
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) return { ok: false, status: res.status, error: data?.message || `Supabase ${res.status}`, detail: data };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, status: 502, error: "Supabase unreachable" };
  }
}

// --- Approvals ---------------------------------------------------------------

export async function listPendingApprovals({ limit = 50 } = {}) {
  return sb(`/agent_approvals?status=eq.pending&order=created_at.desc&limit=${limit}`, { method: "GET" });
}

export async function listRecentApprovals({ limit = 100 } = {}) {
  return sb(`/agent_approvals?order=created_at.desc&limit=${limit}`, { method: "GET" });
}

export async function createApproval(row) {
  return sb(`/agent_approvals`, { method: "POST", body: JSON.stringify(row) });
}

export async function getApproval(id) {
  const r = await sb(`/agent_approvals?id=eq.${encodeURIComponent(id)}&limit=1`, { method: "GET" });
  if (!r.ok) return r;
  return { ok: true, data: (r.data || [])[0] || null };
}

export async function updateApproval(id, patch) {
  return sb(`/agent_approvals?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });
}

// --- Events ------------------------------------------------------------------

export async function logEvent({ agent_id, msg, level = "info", agent_run_id = null, detail = null }) {
  return sb(`/agent_events`, {
    method: "POST",
    body: JSON.stringify({ agent_id, msg, level, agent_run_id, detail }),
  });
}

export async function listEvents({ limit = 50, agent_id } = {}) {
  const q = agent_id
    ? `/agent_events?agent_id=eq.${encodeURIComponent(agent_id)}&order=ts.desc&limit=${limit}`
    : `/agent_events?order=ts.desc&limit=${limit}`;
  return sb(q, { method: "GET" });
}
