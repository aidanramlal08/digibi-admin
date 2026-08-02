// Tool implementations for agents. Each tool has:
//   - a name (referenced by Gemini in function-calls)
//   - a description (what the agent uses to decide to call it)
//   - parameters schema (Gemini function-declaration format)
//   - handler(args) -> object (what the agent sees back)
//
// Tools split into two kinds:
//   - Read tools run immediately in the agent loop (no approval needed).
//   - Write tools with `needsApproval: true` return a "queued for approval"
//     result to the agent AND create an approval record; the actual side
//     effect only fires when the owner approves via /api/approvals.
//
// Integrations that need extra credentials (Retell, Paystack, Meta, WhatsApp,
// Higgsfield, Slack) return { error: "Tool not configured" } cleanly when
// their env var isn't set — nothing crashes, the agent adapts.

import { createApproval } from "./store.js";
import { sendMail } from "./mailer.js";

// -------- HubSpot (live if HUBSPOT_TOKEN is set) -----------------------------

const HS_TOKEN = process.env.HUBSPOT_TOKEN || "";

async function hubspotSearch({ object_type, query, limit }) {
  if (!HS_TOKEN) return { error: "HubSpot not configured (missing HUBSPOT_TOKEN)." };
  try {
    const res = await fetch(`https://api.hubapi.com/crm/v3/objects/${object_type}/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${HS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: (query || "").trim(), limit: Math.min(Math.max(Number(limit) || 10, 1), 25) }),
    });
    if (!res.ok) return { error: `HubSpot ${res.status}`, detail: (await res.text()).slice(0, 200) };
    const data = await res.json();
    return { count: (data.results || []).length, results: (data.results || []).map((r) => ({ id: r.id, properties: r.properties })) };
  } catch { return { error: "HubSpot request failed." }; }
}

async function hubspotUpdateContact({ id, properties }) {
  if (!HS_TOKEN) return { error: "HubSpot not configured." };
  try {
    const res = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${HS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ properties }),
    });
    if (!res.ok) return { error: `HubSpot ${res.status}`, detail: (await res.text()).slice(0, 200) };
    return await res.json();
  } catch { return { error: "HubSpot request failed." }; }
}

// -------- Email (live if SMTP_HOST/SMTP_USER/SMTP_PASS are set) -------------

async function sendEmailTool({ to, subject, body }) {
  const html = String(body || "").replace(/\n/g, "<br>");
  return sendMail({ to, subject: subject || "Message from DigiBi", html, text: body });
}

// -------- Stubs that require credentials the agent doesn't yet have ----------
// These EXECUTE placeholders — real integrations plug in here later. For now
// they return a shape that logs what would have happened, so approved actions
// don't silently vanish.

function notConfigured(name, envVar) {
  return async (params) => ({
    error: `${name} not configured`,
    hint: `Set ${envVar} on Vercel to enable this tool.`,
    would_have_called: { name, params },
  });
}

const executors = {
  hubspot_search:              hubspotSearch,
  hubspot_update_contact:      hubspotUpdateContact,

  // Comms
  send_email:                  sendEmailTool,
  whatsapp_send:               notConfigured("WhatsApp",        "WHATSAPP_TOKEN"),
  slack_post_owner:            notConfigured("Slack",           "SLACK_WEBHOOK_URL"),

  // Retell (voice)
  retell_dispatch_call:        notConfigured("Retell",          "RETELL_API_KEY"),
  retell_create_agent:         notConfigured("Retell",          "RETELL_API_KEY"),

  // Paystack (billing)
  paystack_charge:             notConfigured("Paystack",        "PAYSTACK_SECRET_KEY"),
  paystack_subscription:       notConfigured("Paystack",        "PAYSTACK_SECRET_KEY"),

  // Meta (ads)
  meta_insights:               notConfigured("Meta Graph",      "META_ACCESS_TOKEN"),
  meta_update_adset:           notConfigured("Meta Graph",      "META_ACCESS_TOKEN"),
  meta_custom_audience:        notConfigured("Meta Graph",      "META_ACCESS_TOKEN"),

  // Content
  higgsfield_generate_video:   notConfigured("Higgsfield",      "HIGGSFIELD_API_KEY"),
  fb_graph_post_reel:          notConfigured("Facebook Graph",  "FB_PAGE_TOKEN"),
  ig_graph_post_reel:          notConfigured("Instagram Graph", "IG_ACCESS_TOKEN"),
  youtube_upload_short:        notConfigured("YouTube",         "YOUTUBE_TOKEN"),
  tiktok_publish:              notConfigured("TikTok",          "TIKTOK_TOKEN"),
};

// Function declarations Gemini gets. Each entry MUST have a matching executor.
const declarations = [
  {
    name: "hubspot_search",
    description: "Search HubSpot CRM for deals, contacts, or companies. Read-only.",
    parameters: {
      type: "object",
      properties: {
        object_type: { type: "string", enum: ["deals", "contacts", "companies"] },
        query: { type: "string", description: "Free-text search." },
        limit: { type: "integer" },
      },
      required: ["object_type"],
    },
  },
  {
    name: "queue_for_approval",
    description:
      "Queue an action that requires the owner's approval before it runs. Use this for any write action: sending an email, moving budget, dispatching a call, updating a HubSpot contact, charging a client. Provide clear ctx (context) and rec (one-line recommendation). Returns immediately; the action executes only when the owner approves.",
    parameters: {
      type: "object",
      properties: {
        risk: { type: "string", enum: ["low", "med", "high"] },
        ctx: { type: "string", description: "One-line context of who/what this is about." },
        rec: { type: "string", description: "One-line recommendation of what you propose to do." },
        action: {
          type: "object",
          description: "The tool call to execute on approval.",
          properties: {
            name: { type: "string", description: "Executor name: e.g. send_email, meta_update_adset, hubspot_update_contact." },
            params: { type: "object", description: "Params to pass to the executor." },
          },
          required: ["name"],
        },
      },
      required: ["risk", "ctx", "rec", "action"],
    },
  },
];

// A single toolset for now; per-agent filtering happens by the prompt (each
// agent's system message tells it which of these it's allowed to use).
export function toolDeclarationsFor(_agentId) {
  return declarations;
}

// Runs an executor by name — used both by the agent loop for read tools and
// by the approvals endpoint when a queued action is approved.
export async function runExecutor(name, params) {
  const fn = executors[name];
  if (!fn) return { error: `Unknown executor: ${name}` };
  return fn(params || {});
}

// Handles the agent's `queue_for_approval` function call: creates a pending
// approval and returns a stub result to the agent so its turn can end.
export async function handleQueueForApproval({ agentId, deptLabel, args, agent_run_id }) {
  const row = {
    agent_id: agentId,
    dept_label: deptLabel,
    risk: args.risk || "med",
    ctx: String(args.ctx || "").slice(0, 500),
    rec: String(args.rec || "").slice(0, 800),
    action: args.action || null,
    agent_run_id: agent_run_id || null,
  };
  const r = await createApproval(row);
  if (!r.ok) return { error: r.error };
  const created = (r.data || [])[0] || null;
  return { queued: true, approval_id: created?.id || null };
}
