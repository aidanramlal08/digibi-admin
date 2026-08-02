// Shared SMTP sender — Hostinger (or any standard SMTP mailbox), used by
// both the daily brief (api/_mail.js) and the Sales/Marketing agents' send_email
// tool. Replaces the earlier Resend integration; no third-party email API.
import nodemailer from "nodemailer";

let cachedTransport = null;

function getTransport() {
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  if (!host || !user || !pass) return null;
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // SSL on 465, STARTTLS on 587
      auth: { user, pass },
    });
  }
  return cachedTransport;
}

// Sends one email. Returns { sent: true, to, accepted, rejected, response } |
// { skipped, reason } | { error }. Never throws — callers (agent tools,
// brief) can inline the result. Includes the SMTP server's own accept/reject
// verdict per recipient and its final response line, since a successful
// nodemailer send only means the SMTP transaction completed — not that the
// message wasn't silently rejected or spam-filtered downstream.
export async function sendMail({ to, subject, html, text }) {
  const transport = getTransport();
  if (!transport) return { skipped: true, reason: "email not configured (need SMTP_HOST, SMTP_USER, SMTP_PASS)" };
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const recipients = Array.isArray(to) ? to : String(to || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (recipients.length === 0) return { skipped: true, reason: "no recipient" };
  try {
    const info = await transport.sendMail({ from, to: recipients, subject, html, text });
    return {
      sent: true,
      to: recipients,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
      response: info.response || "",
    };
  } catch (err) {
    return { error: `SMTP send failed: ${String((err && err.message) || err).slice(0, 300)}` };
  }
}
