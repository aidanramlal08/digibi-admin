// Shared agent runtime. Each of the six agents is a thin wrapper that supplies
// a system prompt + agent id and calls runAgent(). This does the work:
//   1. Sets up Gemini function calling with the shared toolset.
//   2. Loops: model turn → executes read tools inline / queues writes for
//      approval → feeds results back → until the model stops calling tools.
//   3. Logs every meaningful step to agent_events for the master stream.

import { toolDeclarationsFor, runExecutor, handleQueueForApproval } from "./tools.js";
import { logEvent } from "./store.js";
import crypto from "node:crypto";

const MODEL = process.env.ASSISTANT_MODEL || "gemini-2.0-flash";
const MAX_ROUNDS = 8;

async function callGemini(apiKey, body) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// Runs one agent turn. Returns { ok, run_id, summary, error }.
export async function runAgent({ agentId, deptLabel, systemPrompt, kickoff }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY not set" };

  const run_id = crypto.randomUUID();
  await logEvent({ agent_id: agentId, msg: `Run started · ${kickoff}`, agent_run_id: run_id });

  const contents = [{ role: "user", parts: [{ text: kickoff }] }];
  const tools = [{ functionDeclarations: toolDeclarationsFor(agentId) }];
  const systemInstruction = { parts: [{ text: systemPrompt }] };

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const data = await callGemini(apiKey, { systemInstruction, contents, tools, generationConfig: { temperature: 0.3 } });
      const candidate = (data.candidates || [])[0];
      if (!candidate || !candidate.content) {
        await logEvent({ agent_id: agentId, msg: "Blocked by safety filter or empty response", level: "warn", agent_run_id: run_id });
        return { ok: true, run_id, summary: "Blocked by safety filter." };
      }
      const parts = candidate.content.parts || [];
      const calls = parts.filter((p) => p.functionCall);

      if (calls.length === 0) {
        const answer = parts.filter((p) => typeof p.text === "string").map((p) => p.text).join("").trim();
        if (answer) await logEvent({ agent_id: agentId, msg: answer.slice(0, 200), agent_run_id: run_id });
        await logEvent({ agent_id: agentId, msg: `Run complete`, agent_run_id: run_id });
        return { ok: true, run_id, summary: answer || "(no summary)" };
      }

      contents.push(candidate.content);
      const responseParts = [];
      for (const p of calls) {
        const { name, args } = p.functionCall;
        let out;
        if (name === "queue_for_approval") {
          out = await handleQueueForApproval({ agentId, deptLabel, args: args || {}, agent_run_id: run_id });
          const ctx = (args && args.ctx) || "";
          await logEvent({ agent_id: agentId, msg: `Queued for approval · ${ctx}`.slice(0, 200), agent_run_id: run_id });
        } else {
          out = await runExecutor(name, args || {});
          await logEvent({ agent_id: agentId, msg: `Tool: ${name}${out?.error ? ` · error: ${out.error}` : ""}`, level: out?.error ? "warn" : "info", agent_run_id: run_id });
        }
        responseParts.push({ functionResponse: { name, response: out } });
      }
      contents.push({ role: "user", parts: responseParts });
    }
    await logEvent({ agent_id: agentId, msg: "Run exceeded max rounds", level: "warn", agent_run_id: run_id });
    return { ok: true, run_id, summary: "(max rounds reached)" };
  } catch (e) {
    await logEvent({ agent_id: agentId, msg: `Run failed · ${e.message}`.slice(0, 200), level: "error", agent_run_id: run_id });
    return { ok: false, run_id, error: e.message };
  }
}
