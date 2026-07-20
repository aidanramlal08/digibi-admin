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
