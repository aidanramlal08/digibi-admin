// Single entry point to the admin backend (Vercel function → n8n). The session
// JWT lives in an httpOnly cookie the browser sends automatically; page JS never
// sees it.
export async function callAdmin(action, body) {
  const res = await fetch(`${import.meta.env.BASE_URL}api/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...(body || {}) }),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON error body */
  }
  return { ok: res.ok, status: res.status, data };
}

// Owner Assistant chat. `messages` is the running [{role, content}] history;
// `data` is the current dashboard snapshot the agent answers from.
export async function askAssistant(messages, data) {
  const res = await fetch(`${import.meta.env.BASE_URL}api/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, data }),
  });
  let out = {};
  try {
    out = await res.json();
  } catch {
    /* non-JSON error body */
  }
  return { ok: res.ok, status: res.status, data: out };
}

// On-demand daily brief (the same endpoint Vercel Cron calls each morning).
export async function getBrief() {
  const res = await fetch(`${import.meta.env.BASE_URL}api/brief`, { method: "GET" });
  let out = {};
  try {
    out = await res.json();
  } catch {
    /* non-JSON error body */
  }
  return { ok: res.ok, status: res.status, data: out };
}

// Agent Console: pending approvals + master activity stream.
export async function fetchApprovals() {
  const res = await fetch(`${import.meta.env.BASE_URL}api/approvals`, { method: "GET" });
  let out = {};
  try { out = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data: out };
}

export async function actOnApproval(id, action) {
  const res = await fetch(`${import.meta.env.BASE_URL}api/approvals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, action }),
  });
  let out = {};
  try { out = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data: out };
}

export async function fetchAgentEvents({ limit = 50 } = {}) {
  const res = await fetch(`${import.meta.env.BASE_URL}api/agent-events?limit=${limit}`, { method: "GET" });
  let out = {};
  try { out = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data: out };
}
