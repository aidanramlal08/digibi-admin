// Shared admin-session verification for the assistant endpoints. Mirrors the
// JWT + httpOnly-cookie scheme in api/admin.js so the agent routes require the
// same login. Underscore prefix keeps Vercel from turning this into a route.
import crypto from "node:crypto";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "";
const COOKIE_NAME = "digibi_admin";

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(/; */)) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1));
  }
  return "";
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

// True when the request carries a valid, unexpired admin session cookie.
export function isAuthed(req) {
  if (!JWT_SECRET) return false;
  const session = verifyJwt(readCookie(req, COOKIE_NAME));
  return !!(session && session.admin);
}
