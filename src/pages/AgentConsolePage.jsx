import React, { useState, useEffect, useCallback, useRef } from "react";
import { C } from "../tokens.js";
import { Eyebrow, PageTitle, PageDek, SectionTitle } from "../ui.jsx";
import { AGENTS, AGENT_ACCENT } from "../agents.js";
import { fetchApprovals, actOnApproval, fetchAgentEvents, askAgent } from "../api.js";

const DEPT_COLOR = {
  sales: C.accent,
  success: C.ok,
  finance: C.warn,
  marketing: "#F472B6",
  content: "#A78BFA",
  orchestrator: "#FB923C",
};

// Compact card for one agent — click opens the chat drawer.
function AgentCard({ agent, onOpen }) {
  const accent = AGENT_ACCENT[agent.id];
  const status = agent.status;
  const dotColor = status === "running" ? C.ok : status === "pending" ? C.warn : C.inkFaint;
  return (
    <button
      onClick={() => onOpen(agent.id)}
      style={{
        textAlign: "left",
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: 14,
        cursor: "pointer",
        fontFamily: C.body,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "border-color 120ms, box-shadow 120ms",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}18`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}22`, color: accent, display: "grid", placeItems: "center", fontFamily: C.display, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          {agent.name.charAt(0)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C.display, fontSize: 14, fontWeight: 700, color: C.ink, lineHeight: 1.15 }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.role}</div>
        </div>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} title={agent.statusLabel} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, fontWeight: 600 }}>{agent.metricLabel}</div>
          <div style={{ fontFamily: C.display, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", color: C.ink, lineHeight: 1.1 }}>{agent.metricValue}</div>
        </div>
        <span style={{ fontSize: 11, color: accent, fontWeight: 700, whiteSpace: "nowrap" }}>Chat →</span>
      </div>
    </button>
  );
}

// Slide-in chat panel for the selected agent. Sits fixed on the right,
// scrollable messages, sticky composer at the bottom.
function ChatDrawer({ agent, onClose, history, onSend, busy, error }) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const accent = AGENT_ACCENT[agent.id];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, busy]);

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    onSend(draft.trim());
    setDraft("");
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(11,11,15,0.35)", zIndex: 40 }} />
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(440px, 100vw)",
          background: C.paper,
          borderLeft: `1px solid ${C.line}`,
          boxShadow: "-16px 0 40px rgba(11,11,15,0.15)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header style={{ padding: "16px 18px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}22`, color: accent, display: "grid", placeItems: "center", fontFamily: C.display, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {agent.name.charAt(0)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: C.display, fontSize: 15, fontWeight: 700, color: C.ink }}>{agent.name}</div>
            <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 1 }}>{agent.role}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close chat"
            style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontFamily: C.body, fontSize: 13, color: C.inkDim }}
          >
            Close
          </button>
        </header>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {history.length === 0 ? (
            <div style={{ fontSize: 13, color: C.inkFaint, fontStyle: "italic", padding: "8px 0" }}>
              {agent.tagline}
            </div>
          ) : null}
          {history.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: m.role === "user" ? C.accent : C.bg,
                color: m.role === "user" ? "#fff" : C.ink,
                border: m.role === "user" ? "none" : `1px solid ${C.line}`,
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13.5,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          ))}
          {busy ? (
            <div style={{ alignSelf: "flex-start", fontSize: 12, color: C.inkFaint, fontStyle: "italic", padding: "6px 4px" }}>
              {agent.name} is thinking…
            </div>
          ) : null}
          {error ? (
            <div style={{ alignSelf: "stretch", background: C.dangerWash, border: `1px solid ${C.danger}44`, borderRadius: 8, padding: "8px 10px", color: C.danger, fontSize: 12.5 }}>
              {error}
            </div>
          ) : null}
        </div>

        <form onSubmit={submit} style={{ padding: 14, borderTop: `1px solid ${C.line}`, display: "flex", gap: 8, background: C.paper }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Ask ${agent.name}…`}
            disabled={busy}
            style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.lineStrong}`, fontFamily: C.body, fontSize: 13.5, color: C.ink, background: C.paper, outline: "none" }}
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: busy || !draft.trim() ? C.lineStrong : C.accent, color: "#fff", fontFamily: C.body, fontWeight: 700, fontSize: 13, cursor: busy || !draft.trim() ? "default" : "pointer" }}
          >
            Send
          </button>
        </form>
      </aside>
    </>
  );
}

function fmtEventTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleString("en-ZA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ActivityStream({ items, notConfigured }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 16px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <SectionTitle style={{ margin: 0 }}>Activity stream</SectionTitle>
        <span style={{ fontSize: 11, color: notConfigured ? C.inkFaint : C.ok, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: notConfigured ? C.inkFaint : C.ok }} />
          {notConfigured ? "Idle" : "Live"}
        </span>
      </div>
      <div style={{ fontFamily: "'SF Mono', 'Monaco', 'Cascadia Mono', 'Menlo', monospace", fontSize: 12, lineHeight: 1.6, maxHeight: 200, overflowY: "auto", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: 10 }}>
        {items.length === 0 ? (
          <div style={{ color: C.inkFaint, fontFamily: C.body, fontSize: 13, padding: "6px 4px" }}>
            {notConfigured ? "Waiting on backend configuration." : "No agent events yet."}
          </div>
        ) : (
          items.map((it) => (
            <div key={it.id} style={{ padding: "3px 0", color: C.inkDim, display: "flex", gap: 10 }}>
              <span style={{ color: C.inkFaint, flexShrink: 0 }}>{fmtEventTime(it.ts)}</span>
              <span style={{ fontWeight: 600, flexShrink: 0, minWidth: 84, color: DEPT_COLOR[it.agent_id] || C.inkDim }}>{it.agent_id}</span>
              <span style={{ color: it.level === "error" ? C.danger : it.level === "warn" ? C.warn : C.ink }}>{it.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ApprovalsPanel({ items, notConfigured, onAct, busyId }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <SectionTitle style={{ margin: 0 }}>Approvals</SectionTitle>
        <div style={{ fontFamily: C.display, fontSize: 22, fontWeight: 700, color: items.length ? C.warn : C.inkFaint, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {items.length}
        </div>
      </div>
      <div style={{ fontSize: 12, color: C.inkDim, margin: "0 0 10px" }}>
        {notConfigured ? "Backend not configured yet." : items.length ? "Approve or reject to close each item." : "Nothing waiting."}
      </div>
      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {items.map((a) => {
          const risk = a.risk || "med";
          const dept = a.agent_id;
          const deptLabel = a.dept_label || dept;
          const riskColor = risk === "high" ? C.danger : risk === "med" ? C.warn : C.inkDim;
          const riskBg = risk === "high" ? C.dangerWash : risk === "med" ? C.warnWash : C.sunken;
          const busy = busyId === a.id;
          return (
            <div key={a.id} style={{ padding: 10, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, marginBottom: 8, opacity: busy ? 0.6 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: C.display, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: (DEPT_COLOR[dept] || C.accent) + "22", color: DEPT_COLOR[dept] || C.accent }}>
                  {deptLabel}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, letterSpacing: "0.05em", textTransform: "uppercase", background: riskBg, color: riskColor }}>
                  {risk}
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.inkDim, marginBottom: 3 }}>{a.ctx}</div>
              <div style={{ fontSize: 13, color: C.ink, marginBottom: 8, lineHeight: 1.4 }}>{a.rec}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button disabled={busy} onClick={() => onAct(a.id, "approve")} style={{ fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 6, cursor: busy ? "default" : "pointer", border: "1px solid transparent", background: C.accent, color: "#fff", fontFamily: C.body }}>
                  {busy ? "…" : "Approve"}
                </button>
                <button disabled={busy} onClick={() => onAct(a.id, "reject")} style={{ fontSize: 12, padding: "5px 11px", borderRadius: 6, cursor: busy ? "default" : "pointer", border: `1px solid ${C.lineStrong}`, background: C.paper, color: C.inkDim, fontFamily: C.body }}>
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AgentConsolePage() {
  const [openAgentId, setOpenAgentId] = useState(null);
  const [chatHistories, setChatHistories] = useState({}); // { [agentId]: [{role, content}] }
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState("");

  const [approvals, setApprovals] = useState([]);
  const [events, setEvents] = useState([]);
  const [storeReady, setStoreReady] = useState(true);
  const [actionsToday, setActionsToday] = useState(0);
  const [busyId, setBusyId] = useState(null);

  const openAgent = openAgentId ? AGENTS.find((a) => a.id === openAgentId) : null;

  const refresh = useCallback(async () => {
    const [apRes, evRes] = await Promise.all([fetchApprovals(), fetchAgentEvents({ limit: 60 })]);
    if (apRes.ok && apRes.data) {
      setApprovals(apRes.data.items || []);
      setStoreReady(apRes.data.storeConfigured !== false);
    }
    if (evRes.ok && evRes.data) {
      const items = evRes.data.items || [];
      setEvents(items);
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      setActionsToday(items.filter((e) => new Date(e.ts) >= startOfDay && /^(Tool|Executed):/i.test(e.msg)).length);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  const onAct = useCallback(async (id, action) => {
    setBusyId(id);
    await actOnApproval(id, action);
    setBusyId(null);
    refresh();
  }, [refresh]);

  const openChat = useCallback((agentId) => {
    setOpenAgentId(agentId);
    setChatError("");
  }, []);

  const closeChat = useCallback(() => {
    setOpenAgentId(null);
    setChatError("");
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!openAgentId) return;
    setChatError("");
    const nextHistory = [...(chatHistories[openAgentId] || []), { role: "user", content: text }];
    setChatHistories((prev) => ({ ...prev, [openAgentId]: nextHistory }));
    setChatBusy(true);
    const { ok, data } = await askAgent(openAgentId, nextHistory);
    setChatBusy(false);
    if (ok && data.ok && data.answer) {
      setChatHistories((prev) => ({
        ...prev,
        [openAgentId]: [...nextHistory, { role: "assistant", content: data.answer }],
      }));
      refresh(); // in case the chat queued an approval
    } else {
      setChatError((data && data.error) || "Couldn't reach the agent.");
    }
  }, [openAgentId, chatHistories, refresh]);

  // Close on Escape
  useEffect(() => {
    if (!openAgentId) return;
    const onKey = (e) => { if (e.key === "Escape") closeChat(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openAgentId, closeChat]);

  return (
    <div>
      <Eyebrow>Structure OS</Eyebrow>
      <PageTitle>
        <span style={{ color: C.accent }}>6 agents.</span> 22 workflows. One console.
      </PageTitle>
      <PageDek>
        Click any agent to open a chat. They can search your CRM live, explain what they see, and queue actions for your approval — all without leaving the page.
      </PageDek>

      {!storeReady ? (
        <div style={{ background: C.warnWash, border: `1px solid ${C.warn}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.ink }}>
          <strong style={{ color: C.warn }}>Backend not connected.</strong> Set <code style={{ background: C.sunken, padding: "1px 5px", borderRadius: 4 }}>SUPABASE_URL</code> and <code style={{ background: C.sunken, padding: "1px 5px", borderRadius: 4 }}>SUPABASE_SERVICE_KEY</code> on Vercel and run <code style={{ background: C.sunken, padding: "1px 5px", borderRadius: 4 }}>db/schema.sql</code> in your Supabase to activate approvals + event history.
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Agents live", value: "6", hint: "All departments online", accent: C.ok },
          { label: "Pending approvals", value: String(approvals.length), hint: approvals.length ? "Your remaining job" : "Nothing waiting", accent: approvals.length ? C.warn : undefined },
          { label: "Workflows absorbed", value: "22", hint: "Of 22 DigiBi n8n flows" },
          { label: "Actions today", value: String(actionsToday), hint: "Tool calls + executed approvals" },
        ].map((k, i) => (
          <div key={i} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, fontWeight: 600, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: C.display, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1, color: k.accent || C.ink }}>
              {k.value}
            </div>
            {k.hint ? <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 5 }}>{k.hint}</div> : null}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }} className="agent-grid">
        {AGENTS.map((a) => <AgentCard key={a.id} agent={a} onOpen={openChat} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "5fr 4fr", gap: 16 }} className="grid-2-fallback">
        <ActivityStream items={events} notConfigured={!storeReady} />
        <ApprovalsPanel items={approvals} notConfigured={!storeReady} onAct={onAct} busyId={busyId} />
      </div>

      {openAgent ? (
        <ChatDrawer
          agent={openAgent}
          onClose={closeChat}
          history={chatHistories[openAgent.id] || []}
          onSend={sendMessage}
          busy={chatBusy}
          error={chatError}
        />
      ) : null}

      <style>{`
        @media (max-width: 900px) {
          .agent-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .agent-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
