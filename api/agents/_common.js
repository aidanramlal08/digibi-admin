// Common handler wrapper for every agent endpoint. Accepts cron requests
// (Bearer CRON_SECRET, same convention as the daily brief) or admin-session
// manual triggers. Runs the agent and returns the run summary.
import { isAuthed } from "../_auth.js";
import { runAgent } from "../_lib/runtime.js";

export function makeAgentHandler({ agentId, deptLabel, systemPrompt, kickoff }) {
  return async function handler(req, res) {
    if (req.method !== "GET" && req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    const cronSecret = process.env.CRON_SECRET || "";
    const cronOk = !!cronSecret && (req.headers.authorization || "") === `Bearer ${cronSecret}`;
    if (!cronOk && !isAuthed(req)) {
      res.status(401).json({ ok: false, error: "Not authorized." });
      return;
    }
    const result = await runAgent({ agentId, deptLabel, systemPrompt, kickoff });
    res.status(result.ok ? 200 : 503).json(result);
  };
}
