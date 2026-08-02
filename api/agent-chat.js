// Interactive chat with any of the six Structure OS agents. Same Gemini agent
// runtime as the cron endpoints, same tools, same approval-gating — but driven
// by a live conversation instead of a cron kickoff. Read tools execute inline;
// any write the agent proposes still goes through queue_for_approval.
import { isAuthed } from "./_auth.js";
import { AGENT_PROMPTS, CONTACT_GUARDRAIL } from "./_lib/prompts.js";
import { toolDeclarationsFor, runExecutor, handleQueueForApproval } from "./_lib/tools.js";
import { logEvent } from "./_lib/store.js";
import crypto from "node:crypto";

const MODEL = process.env.ASSISTANT_MODEL || "gemini-3.1-flash-lite";
const MAX_ROUNDS = 6;

async function callGemini(apiKey, body) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

function toContents(messages) {
  return (messages || [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content : String(m.content ?? "") }],
    }))
    .slice(-20);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!isAuthed(req)) return res.status(401).json({ ok: false, error: "Not signed in." });

  const { agentId, messages, data } = req.body || {};
  const persona = AGENT_PROMPTS[agentId];
  if (!persona) return res.status(400).json({ ok: false, error: "Unknown agent." });
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ ok: false, error: "No message." });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(503).json({ ok: false, error: "Assistant not configured (missing GEMINI_API_KEY)." });

  const snapshotBlock = data
    ? `\n\nCurrent dashboard snapshot (the same numbers the owner is looking at right now — use these before calling any tool):\n\`\`\`json\n${JSON.stringify(data).slice(0, 40000)}\n\`\`\``
    : "\n\nNo dashboard snapshot was passed in this turn. Use hubspot_search when a question needs live data.";

  const chatModifier = `\n\n---
CHAT MODE — you are an employee giving the DigiBi owner (Aidan) a live status update. Not a chatbot.

Voice & format:
- Speak in the first person as the head of your department. "Right now I'm…", "This week I've…", "I've got 3 things stuck on your approval."
- LEAD WITH NUMBERS. Every reply opens with concrete figures from the dashboard snapshot or a hubspot_search call. Not "Sure, happy to help!" — instead: "MRR sits at R48,300. 3 leads in flight, 1 gone quiet. Here's what I'm on today:"
- Prefer tight bullet lists over prose when there's more than one thing to report.
- Format ZAR as R1,234. Ranges: "R2,400–R3,100". Never invent a number — if you don't see it in the snapshot, say "not tracked yet" or call hubspot_search.
- If the owner asks something outside your department, name the agent who owns it ("Ask Client Success — they QA the calls") and stop.
- Do NOT ask "how can I help you today" or offer generic assistance. Assume they're checking in on YOUR work, so open with what you're currently doing / what needs their eye.

Actions:
- Read tools (hubspot_search) run silently — call them freely to back up your numbers.
- Only queue_for_approval when the owner explicitly says "do it" / "queue that" / "send it". Never queue on your own during a chat.
- When you do queue something, confirm one line: "Queued. It's in the approvals panel."
${CONTACT_GUARDRAIL}
${snapshotBlock}`;

  const contents = toContents(messages);
  const systemInstruction = { parts: [{ text: persona.systemPrompt + chatModifier }] };
  const tools = [{ functionDeclarations: toolDeclarationsFor(agentId) }];
  const run_id = crypto.randomUUID();

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const data = await callGemini(apiKey, { systemInstruction, contents, tools, generationConfig: { temperature: 0.3 } });
      const candidate = (data.candidates || [])[0];
      if (!candidate || !candidate.content) {
        return res.status(200).json({ ok: true, answer: "I can't help with that one — try rephrasing." });
      }
      const parts = candidate.content.parts || [];
      const calls = parts.filter((p) => p.functionCall);

      if (calls.length === 0) {
        const answer = parts.filter((p) => typeof p.text === "string").map((p) => p.text).join("").trim();
        return res.status(200).json({ ok: true, answer: answer || "(no answer)" });
      }

      contents.push(candidate.content);
      const responseParts = [];
      for (const p of calls) {
        const { name, args } = p.functionCall;
        let out;
        if (name === "queue_for_approval") {
          out = await handleQueueForApproval({ agentId, deptLabel: persona.deptLabel, args: args || {}, agent_run_id: run_id });
          await logEvent({ agent_id: agentId, msg: `Chat queued approval · ${(args && args.ctx) || ""}`.slice(0, 200), agent_run_id: run_id });
        } else {
          out = await runExecutor(name, args || {});
        }
        responseParts.push({ functionResponse: { name, response: out } });
      }
      contents.push({ role: "user", parts: responseParts });
    }
    return res.status(200).json({ ok: true, answer: "That took more steps than expected — try narrowing the question." });
  } catch (err) {
    const detail = String((err && err.message) || err || "").slice(0, 300);
    return res.status(503).json({ ok: false, error: detail ? `Agent error: ${detail}` : "Agent chat failed." });
  }
}
