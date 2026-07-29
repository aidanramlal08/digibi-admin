// Owner Assistant agent core, shared by the chat and daily-brief endpoints.
// Runs Claude with a live HubSpot CRM tool, grounded on the dashboard snapshot
// the caller passes in. Underscore prefix keeps Vercel from routing this file.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5";
const MAX_TOOL_ROUNDS = 6;

// Live CRM lookup so the agent can drill past the aggregated dashboard snapshot
// into specific deals, contacts, or companies. Uses a HubSpot private-app token.
const HUBSPOT_TOOL = {
  name: "hubspot_crm_search",
  description:
    "Search the live HubSpot CRM for deals, contacts, or companies. Use this when the question needs current, record-level detail that isn't in the dashboard snapshot — e.g. a specific customer's deals, a contact's recent activity, or an exact stage/amount. Returns the matching records and their properties.",
  input_schema: {
    type: "object",
    properties: {
      object_type: { type: "string", enum: ["deals", "contacts", "companies"], description: "Which CRM object to search." },
      query: { type: "string", description: "Free-text search across the object's default searchable properties (name, email, etc.). Omit to list recent records." },
      limit: { type: "integer", description: "Max records to return (default 10, cap 25)." },
    },
    required: ["object_type"],
  },
};

async function hubspotSearch({ object_type, query, limit }, token) {
  try {
    const res = await fetch(`https://api.hubapi.com/crm/v3/objects/${object_type}/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: (query || "").trim(), limit: Math.min(Math.max(Number(limit) || 10, 1), 25) }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { error: `HubSpot ${res.status}`, detail: body.slice(0, 300) };
    }
    const data = await res.json();
    return { count: (data.results || []).length, results: (data.results || []).map((r) => ({ id: r.id, properties: r.properties })) };
  } catch {
    return { error: "HubSpot request failed." };
  }
}

function buildSystem(dashboardData, brief) {
  const lines = [
    "You are the Owner Assistant for DigiBi, a South African company that sells AI voice-agent and automation products (DigiBi Core, DigiBi Voice) to small businesses.",
    "You help the owner understand their business. Money is in South African Rand (ZAR); format as R1,234.",
    "Answer in plain, direct language. Be concise — lead with the answer, then the supporting numbers. Use short markdown (bold, bullets) when it helps, not headers for a one-line answer.",
    "Ground every claim in the data you have. If a number isn't in the dashboard snapshot or a tool result, say you don't have it rather than guessing.",
  ];
  if (dashboardData) {
    lines.push(
      "Here is the current dashboard snapshot (the same data the owner sees). Prefer it for aggregate questions; use the hubspot_crm_search tool only for record-level detail beyond it:",
      "```json",
      JSON.stringify(dashboardData).slice(0, 60000),
      "```",
    );
  } else {
    lines.push("No dashboard snapshot was provided. Use the hubspot_crm_search tool to gather what you need before answering.");
  }
  if (brief) {
    lines.push(
      "Write today's owner brief: a short, scannable summary of what matters right now — revenue/pipeline health, anything at risk (overdue payments, unprofitable or going-quiet accounts, failed operations), and the 1–3 things worth the owner's attention today. Pull current figures from the tools where the snapshot is missing. Keep it under ~200 words.",
    );
  }
  return lines.join("\n");
}

function coerceMessages(messages) {
  return (messages || [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({ role: m.role, content: typeof m.content === "string" ? m.content : String(m.content ?? "") }))
    .slice(-20);
}

// Runs the tool loop to completion and returns { ok, answer }.
export async function runAgent({ messages, dashboardData, brief }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "Assistant not configured (missing ANTHROPIC_API_KEY)." };

  const hubspotToken = process.env.HUBSPOT_TOKEN || "";
  const client = new Anthropic({ apiKey });
  const tools = hubspotToken ? [HUBSPOT_TOOL] : [];
  const system = buildSystem(dashboardData, brief);

  const convo = brief ? [{ role: "user", content: "Write today's owner brief." }] : coerceMessages(messages);
  if (convo.length === 0) return { ok: false, error: "No message to answer." };

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: 16000,
        system,
        tools,
        output_config: { effort: "medium" },
        messages: convo,
      });

      if (resp.stop_reason === "tool_use") {
        convo.push({ role: "assistant", content: resp.content });
        const results = [];
        for (const block of resp.content) {
          if (block.type === "tool_use" && block.name === "hubspot_crm_search") {
            const out = hubspotToken ? await hubspotSearch(block.input, hubspotToken) : { error: "HubSpot not connected." };
            results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(out) });
          }
        }
        convo.push({ role: "user", content: results });
        continue;
      }

      if (resp.stop_reason === "refusal") {
        return { ok: true, answer: "I can't help with that one — try rephrasing." };
      }

      const answer = resp.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { ok: true, answer: answer || "(No answer generated.)" };
    }
    return { ok: true, answer: "That took more steps than expected — try narrowing the question." };
  } catch {
    return { ok: false, error: "The assistant hit an error reaching the model or CRM." };
  }
}
