// Owner dashboard backend. Single-admin auth: the password lives only in an
// env var and is never stored anywhere else. Session is an HS256 JWT signed
// here, carried in an httpOnly cookie — page JS never sees it. The "overview"
// action requires a verified session and proxies to n8n's Owner Dashboard API,
// which does the real aggregation (HubSpot + Paystack + call data).
import crypto from "node:crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "";
const PROXY_SECRET = process.env.ADMIN_PROXY_SECRET || "";
const N8N_ADMIN_WEBHOOK_URL = process.env.N8N_ADMIN_WEBHOOK_URL || "";

const COOKIE_NAME = "digibi_admin";
const SESSION_HOURS = 12;

function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // still run a compare of equal length to avoid a length-based timing signal
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function signJwt(payload) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600 };
  const h = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const p = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${sig}`;
}

function verifyJwt(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest("base64url");
  const a = Buffer.from(parts[2]);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(/; */)) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1));
  }
  return "";
}

function setSessionCookie(res, token) {
  const maxAge = SESSION_HOURS * 3600;
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { action } = req.body || {};

  if (action === "logout") {
    clearSessionCookie(res);
    res.status(200).json({ ok: true });
    return;
  }

  if (action === "login") {
    if (!ADMIN_PASSWORD || !JWT_SECRET) {
      res.status(503).json({ error: "Admin backend not configured" });
      return;
    }
    const password = String((req.body && req.body.password) || "");
    if (!password || !timingSafeEqualStr(password, ADMIN_PASSWORD)) {
      res.status(200).json({ ok: false, error: "Incorrect password." });
      return;
    }
    setSessionCookie(res, signJwt({ admin: true }));
    res.status(200).json({ ok: true });
    return;
  }

  if (action === "overview") {
    if (!JWT_SECRET || !PROXY_SECRET || !N8N_ADMIN_WEBHOOK_URL) {
      res.status(503).json({ error: "Admin backend not configured" });
      return;
    }
    const session = verifyJwt(readCookie(req, COOKIE_NAME));
    if (!session || !session.admin) {
      res.status(401).json({ ok: false, error: "Not signed in." });
      return;
    }
    try {
      const upstream = await fetch(N8N_ADMIN_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-proxy-secret": PROXY_SECRET },
        body: JSON.stringify({ action: "overview" }),
      });
      if (!upstream.ok) {
        res.status(502).json({ ok: false, error: "Upstream error." });
        return;
      }
      const payload = await upstream.json();
      res.status(200).json({ ok: true, data: payload });
    } catch {
      res.status(502).json({ ok: false, error: "Upstream unreachable." });
    }
    return;
  }

  if (action === "add-expense") {
    if (!JWT_SECRET || !PROXY_SECRET || !N8N_ADMIN_WEBHOOK_URL) {
      res.status(503).json({ error: "Admin backend not configured" });
      return;
    }
    const session = verifyJwt(readCookie(req, COOKIE_NAME));
    if (!session || !session.admin) {
      res.status(401).json({ ok: false, error: "Not signed in." });
      return;
    }
    try {
      const upstream = await fetch(N8N_ADMIN_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-proxy-secret": PROXY_SECRET },
        body: JSON.stringify({
          action: "add-expense",
          date: (req.body && req.body.date) || "",
          category: (req.body && req.body.category) || "",
          description: (req.body && req.body.description) || "",
          amount_cents: (req.body && req.body.amount_cents) || 0,
        }),
      });
      const payload = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        res.status(200).json({ ok: false, error: payload.error || "Upstream error." });
        return;
      }
      res.status(200).json({ ok: true });
    } catch {
      res.status(502).json({ ok: false, error: "Upstream unreachable." });
    }
    return;
  }

  res.status(400).json({ error: "Unknown action" });
}
