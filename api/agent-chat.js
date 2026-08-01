// Interactive chat with any of the six Structure OS agents. Same Gemini agent
// runtime as the cron endpoints, same tools, same approval-gating — but driven
// by a live conversation instead of a cron kickoff. Read tools execute inline;
// any write the agent proposes still goes through queue_for_approval.
import { isAuthed } from "./_auth.js";
import { AGENT_PROMPTS } from "./_lib/prompts.js";
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

  const { agentId, messages } = req.body || {};
  const persona = AGENT_PROMPTS[agentId];
  if (!persona) return res.status(400).json({ ok: false, error: "Unknown agent." });
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ ok: false, error: "No message." });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(503).json({ ok: false, error: "Assistant not configured (missing GEMINI_API_KEY)." });

  const chatModifier = `\n\n---\nYou are now in an interactive chat with the DigiBi owner (not your scheduled run). Rules for chat mode:
- Answer questions directly and concisely. Use hubspot_search freely to look things up.
- Do NOT queue approvals unless the owner explicitly asks you to in this chat.
- If the owner asks you to take an action, queue it via queue_for_approval and confirm in the reply.
- No headers on short answers. Format ZAR as R1,234.`;

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
