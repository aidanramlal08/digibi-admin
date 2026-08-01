// Owner Assistant agent core, shared by the chat and daily-brief endpoints.
// Runs Google Gemini (REST API, no SDK) with a live HubSpot CRM function tool,
// grounded on the dashboard snapshot the caller passes in. Underscore prefix
// keeps Vercel from routing this file.

// Model is configurable via env so you can switch tiers without a code change.
const MODEL = process.env.ASSISTANT_MODEL || "gemini-3.1-flash-lite";
const MAX_TOOL_ROUNDS = 6;

// Live CRM lookup so the agent can drill past the aggregated dashboard snapshot
// into specific deals, contacts, or companies. Uses a HubSpot private-app token.
const HUBSPOT_FUNCTION = {
  name: "hubspot_crm_search",
  description:
    "Search the live HubSpot CRM for deals, contacts, or companies. Use this when the question needs current, record-level detail that isn't in the dashboard snapshot — e.g. a specific customer's deals, a contact's recent activity, or an exact stage/amount. Returns the matching records and their properties.",
  parameters: {
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

// Map our [{role:"user"|"assistant", content}] history to Gemini's contents.
function toContents(messages) {
  return (messages || [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content : String(m.content ?? "") }],
    }))
    .slice(-20);
}

async function callGemini(apiKey, body) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

// Runs the function-calling loop to completion and returns { ok, answer }.
export async function runAgent({ messages, dashboardData, brief }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return { ok: false, error: "Assistant not configured (missing GEMINI_API_KEY)." };

  const hubspotToken = process.env.HUBSPOT_TOKEN || "";
  const systemInstruction = { parts: [{ text: buildSystem(dashboardData, brief) }] };
  const tools = hubspotToken ? [{ functionDeclarations: [HUBSPOT_FUNCTION] }] : [];

  const contents = brief ? [{ role: "user", parts: [{ text: "Write today's owner brief." }] }] : toContents(messages);
  if (contents.length === 0) return { ok: false, error: "No message to answer." };

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const data = await callGemini(apiKey, { systemInstruction, contents, tools, generationConfig: { temperature: 0.3 } });
      const candidate = (data.candidates || [])[0];
      if (!candidate || !candidate.content) {
        // Blocked by a safety filter or empty response.
        return { ok: true, answer: "I can't help with that one — try rephrasing." };
      }
      const parts = candidate.content.parts || [];
      const calls = parts.filter((p) => p.functionCall);

      if (calls.length > 0) {
        contents.push(candidate.content); // model turn carrying the function call(s)
        const responseParts = [];
        for (const p of calls) {
          const { name, args } = p.functionCall;
          const out = name === "hubspot_crm_search" && hubspotToken ? await hubspotSearch(args || {}, hubspotToken) : { error: "Tool unavailable." };
          responseParts.push({ functionResponse: { name, response: out } });
        }
        contents.push({ role: "user", parts: responseParts });
        continue;
      }

      const answer = parts
        .filter((p) => typeof p.text === "string")
        .map((p) => p.text)
        .join("")
        .trim();
      return { ok: true, answer: answer || "(No answer generated.)" };
    }
    return { ok: true, answer: "That took more steps than expected — try narrowing the question." };
  } catch (err) {
    const detail = String((err && err.message) || err || "").slice(0, 300);
    return { ok: false, error: detail ? `Assistant error: ${detail}` : "The assistant hit an error reaching the model or CRM." };
  }
}
