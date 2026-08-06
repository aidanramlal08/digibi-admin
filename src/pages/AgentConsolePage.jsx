import React, { useState, useEffect, useCallback, useRef } from "react";
import { C } from "../tokens.js";
import { Eyebrow, PageTitle, PageDek, SectionTitle } from "../ui.jsx";
import { AGENTS, AGENT_ACCENT } from "../agents.js";
import { fetchApprovals, actOnApproval, fetchAgentEvents, askAgent } from "../api.js";
import { readFileAsAttachment, validateAttachmentSet, isImage, ACCEPT_ATTR } from "../attachments.js";
import { loadJSON, saveJSON, stripAttachmentBytes, MAX_PERSISTED_MESSAGES } from "../persist.js";

const CHAT_STORAGE_KEY = "digibi_agent_chats";

const DEPT_COLOR = {
  sales: C.accent,
  success: C.ok,
  finance: C.warn,
  marketing: "#F472B6",
  content: "#A78BFA",
  orchestrator: "#FB923C",
};

// Compact card for the 3x2 grid. Click opens the full detail modal.
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
        transition: "border-color 120ms, box-shadow 120ms, transform 120ms",
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
        <span style={{ fontSize: 11, color: accent, fontWeight: 700, whiteSpace: "nowrap" }}>Open →</span>
      </div>
    </button>
  );
}

// Full agent detail — pipeline, absorbs, tools. Rendered inside the modal.
function AgentDetail({ agent }) {
  const accent = AGENT_ACCENT[agent.id];
  return (
    <div>
      <div style={{ fontFamily: C.display, fontSize: 14, color: C.ink, lineHeight: 1.5, marginBottom: 20 }}>{agent.tagline}</div>

      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, fontWeight: 700, marginBottom: 10 }}>Pipeline</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
        {agent.pipeline.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              padding: "10px 12px",
              background: s.gate ? `linear-gradient(90deg, ${accent}14, ${accent}04)` : C.bg,
              border: `1px solid ${s.gate ? accent + "44" : C.line}`,
              borderRadius: 8,
            }}
          >
            <div style={{ fontFamily: C.display, fontSize: 10.5, fontWeight: 700, color: s.gate ? accent : C.inkFaint, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums", flexShrink: 0, minWidth: 44 }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <div style={{ fontFamily: C.display, fontSize: 13, fontWeight: 700, color: C.ink }}>{s.name}</div>
                {s.gate ? (
                  <span style={{ background: accent, color: "#0A0A0F", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 4 }}>
                    Human gate
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: 12, color: C.inkDim, lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, fontWeight: 700, marginBottom: 10 }}>Absorbs (as reasoning)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 22 }}>
        {agent.absorbs.map((w, i) => (
          <div key={i} style={{ padding: "9px 12px", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8 }}>
            <div style={{ fontFamily: C.display, fontWeight: 600, color: C.ink, fontSize: 13 }}>{w.name}</div>
            <div style={{ fontSize: 11.5, color: C.inkDim, marginTop: 2 }}>{w.why}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, fontWeight: 700, marginBottom: 10 }}>Tools it calls</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {agent.tools.map((t, i) => (
          <div
            key={i}
            style={{
              padding: "8px 10px",
              background: C.bg,
              border: `1px solid ${C.line}`,
              borderRadius: 6,
              fontFamily: "'SF Mono', 'Monaco', 'Cascadia Mono', 'Menlo', monospace",
              fontSize: 12,
              color: C.ink,
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

// Chat panel for the currently-open agent. Manages its own draft input.
function AttachmentChips({ attachments, onRemove, onAccent }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {attachments.map((a, i) => (
        <span
          key={i}
          title={a.name}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 999,
            background: onAccent ? "rgba(255,255,255,0.18)" : C.sunken,
            color: onAccent ? "#fff" : C.inkDim,
            border: onAccent ? "1px solid rgba(255,255,255,0.3)" : `1px solid ${C.line}`,
            maxWidth: 150,
          }}
        >
          {isImage(a.mimeType) ? "🖼" : "📄"}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
          {onRemove ? (
            <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${a.name}`} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, fontSize: 13, lineHeight: 1, opacity: 0.7 }}>
              ×
            </button>
          ) : null}
        </span>
      ))}
    </div>
  );
}

function AgentChat({ agent, history, onSend, busy, error }) {
  const [draft, setDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [attachError, setAttachError] = useState("");
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, busy]);

  const onFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setAttachError("");
    const results = [];
    for (const f of files) {
      try {
        results.push(await readFileAsAttachment(f));
      } catch (msg) {
        setAttachError(msg);
      }
    }
    const merged = [...pendingAttachments, ...results];
    const invalid = validateAttachmentSet(merged);
    if (invalid) {
      setAttachError(invalid);
      return;
    }
    setPendingAttachments(merged);
  };

  const removeAttachment = (i) => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i));

  const submit = (e) => {
    e.preventDefault();
    if ((!draft.trim() && pendingAttachments.length === 0) || busy) return;
    onSend(draft.trim() || "(see attached file)", pendingAttachments);
    setDraft("");
    setPendingAttachments([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 12 }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.line}`, fontFamily: C.display, fontSize: 12, fontWeight: 700, color: C.inkDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Chat with {agent.name}
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, minHeight: 200 }}>
        {history.length === 0 ? (
          <div style={{ fontSize: 12.5, color: C.inkFaint, fontStyle: "italic", padding: "6px 0" }}>
            Ask about their work, what they're seeing in the CRM, or tell them what to do. Any action they take still needs your approval.
          </div>
        ) : null}
        {history.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "88%",
              background: m.role === "user" ? C.accent : C.paper,
              color: m.role === "user" ? "#fff" : C.ink,
              border: m.role === "user" ? "none" : `1px solid ${C.line}`,
              borderRadius: 10,
              padding: "9px 12px",
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.attachments && m.attachments.length ? (
              <div style={{ marginBottom: 6 }}>
                <AttachmentChips attachments={m.attachments} onAccent={m.role === "user"} />
              </div>
            ) : null}
            {m.content}
          </div>
        ))}
        {busy ? (
          <div style={{ alignSelf: "flex-start", fontSize: 12, color: C.inkFaint, fontStyle: "italic", padding: "4px 4px" }}>
            {agent.name} is thinking…
          </div>
        ) : null}
        {error ? (
          <div style={{ alignSelf: "stretch", background: C.dangerWash, border: `1px solid ${C.danger}44`, borderRadius: 8, padding: "8px 10px", color: C.danger, fontSize: 12 }}>
            {error}
          </div>
        ) : null}
      </div>
      {attachError ? (
        <div style={{ margin: "0 12px 8px", fontSize: 11.5, color: C.danger }}>{attachError}</div>
      ) : null}
      {pendingAttachments.length > 0 ? (
        <div style={{ margin: "0 12px 8px" }}>
          <AttachmentChips attachments={pendingAttachments} onRemove={removeAttachment} />
        </div>
      ) : null}
      <form onSubmit={submit} style={{ padding: 12, borderTop: `1px solid ${C.line}`, display: "flex", gap: 6, background: C.paper, borderRadius: "0 0 12px 12px" }}>
        <input ref={fileInputRef} type="file" multiple accept={ACCEPT_ATTR} onChange={onFilesSelected} style={{ display: "none" }} />
        <button
          type="button"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          title="Attach images or PDFs"
          style={{ flexShrink: 0, width: 36, borderRadius: 7, border: `1px solid ${C.lineStrong}`, background: C.paper, color: C.inkDim, cursor: "pointer", display: "grid", placeItems: "center" }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M11 4.5 5.5 10a2 2 0 1 0 2.83 2.83L14 7.17a3.5 3.5 0 1 0-4.95-4.95L3.5 7.76a5 5 0 1 0 7.07 7.07" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Ask ${agent.name}…`}
          disabled={busy}
          style={{ flex: 1, padding: "9px 11px", borderRadius: 7, border: `1px solid ${C.lineStrong}`, fontFamily: C.body, fontSize: 13, color: C.ink, background: C.paper, outline: "none" }}
        />
        <button
          type="submit"
          disabled={busy || (!draft.trim() && pendingAttachments.length === 0)}
          style={{ padding: "9px 14px", borderRadius: 7, border: "none", background: busy || (!draft.trim() && pendingAttachments.length === 0) ? C.lineStrong : C.accent, color: "#fff", fontFamily: C.body, fontWeight: 700, fontSize: 12, cursor: busy ? "default" : "pointer" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

// Full-screen modal — details on the left, chat on the right.
function AgentDetailModal({ agent, onClose, onClearChat, history, onSend, busy, error }) {
  const accent = AGENT_ACCENT[agent.id];
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(11,11,15,0.5)", zIndex: 40, backdropFilter: "blur(2px)" }} />
      <div
        role="dialog"
        aria-label={`${agent.name} details`}
        style={{
          position: "fixed",
          inset: "3vh 3vw",
          maxWidth: 1200,
          margin: "0 auto",
          background: C.paper,
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          boxShadow: "0 24px 80px rgba(11,11,15,0.25)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header style={{ padding: "18px 22px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 14, background: `linear-gradient(180deg, ${accent}0A, transparent)` }}>
          <span style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}22`, color: accent, display: "grid", placeItems: "center", fontFamily: C.display, fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
            {agent.name.charAt(0)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: C.display, fontSize: 20, fontWeight: 700, color: C.ink, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{agent.name}</div>
            <div style={{ fontSize: 12.5, color: C.inkDim, marginTop: 2 }}>{agent.role}</div>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              background: agent.status === "running" ? C.okWash : agent.status === "pending" ? C.warnWash : C.sunken,
              color: agent.status === "running" ? C.ok : agent.status === "pending" ? C.warn : C.inkDim,
              border: `1px solid ${agent.status === "running" ? "#10B98133" : agent.status === "pending" ? "#F59E0B33" : C.line}`,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
            {agent.statusLabel}
          </span>
          <div style={{ textAlign: "right", paddingLeft: 6 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, fontWeight: 600 }}>{agent.metricLabel}</div>
            <div style={{ fontFamily: C.display, fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: C.ink }}>{agent.metricValue}</div>
          </div>
          {history.length > 0 ? (
            <button
              onClick={() => onClearChat(agent.id)}
              title="Clear this conversation"
              style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontFamily: C.body, fontSize: 13, color: C.inkFaint, marginLeft: 4 }}
            >
              Clear chat
            </button>
          ) : null}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontFamily: C.body, fontSize: 13, color: C.inkDim, marginLeft: 4 }}
          >
            Close
          </button>
        </header>

        <div className="agent-modal-body" style={{ flex: 1, display: "grid", gridTemplateColumns: "3fr 2fr", gap: 0, overflow: "hidden" }}>
          <div style={{ overflowY: "auto", padding: 22, borderRight: `1px solid ${C.line}` }}>
            <AgentDetail agent={agent} />
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <AgentChat agent={agent} history={history} onSend={onSend} busy={busy} error={error} />
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .agent-modal-body { grid-template-columns: 1fr !important; }
            .agent-modal-body > div:first-child { border-right: none !important; border-bottom: 1px solid ${C.line}; max-height: 40vh; }
          }
        `}</style>
      </div>
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

// Labelled key/value rows for whatever's inside action.params — every
// executor takes different params, so this renders generically off
// whatever keys are present rather than hardcoding a shape per tool.
const FIELD_LABELS = {
  to: "To", subject: "Subject", body: "Message", properties: "Fields",
  id: "Contact ID", adset_id: "Ad set", daily_budget: "New daily budget",
  status: "Status", client_key: "Client", script: "Script", when_iso: "When",
  brief: "Brief", aspect: "Aspect ratio", branded: "Branded",
};

function ActionDetail({ action }) {
  if (!action || !action.params || Object.keys(action.params).length === 0) {
    return <div style={{ fontSize: 12, color: C.inkFaint, fontStyle: "italic" }}>No further detail attached to this action.</div>;
  }
  const { params } = action;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Object.entries(params).map(([key, value]) => {
        const label = FIELD_LABELS[key] || key;
        const isLong = typeof value === "string" && value.length > 60;
        const display =
          value && typeof value === "object"
            ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join("\n")
            : String(value ?? "");
        return (
          <div key={key}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, marginBottom: 3 }}>{label}</div>
            <div
              style={{
                fontSize: 12.5,
                color: C.ink,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                background: C.paper,
                border: `1px solid ${C.line}`,
                borderRadius: 6,
                padding: isLong || display.includes("\n") ? "8px 10px" : "5px 9px",
              }}
            >
              {display || "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ApprovalsPanel({ items, notConfigured, onAct, busyId }) {
  const [expandedId, setExpandedId] = useState(null);
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
      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {items.map((a) => {
          const risk = a.risk || "med";
          const dept = a.agent_id;
          const deptLabel = a.dept_label || dept;
          const riskColor = risk === "high" ? C.danger : risk === "med" ? C.warn : C.inkDim;
          const riskBg = risk === "high" ? C.dangerWash : risk === "med" ? C.warnWash : C.sunken;
          const busy = busyId === a.id;
          const expanded = expandedId === a.id;
          const hasDetail = a.action && a.action.params && Object.keys(a.action.params).length > 0;
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
              {hasDetail ? (
                <button
                  onClick={() => setExpandedId(expanded ? null : a.id)}
                  style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: C.accent, fontSize: 11.5, fontWeight: 700, fontFamily: C.body, padding: 0, marginBottom: 8 }}
                >
                  <span style={{ display: "inline-block", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 100ms" }}>›</span>
                  {expanded ? "Hide" : "Review"} what {a.action.name === "send_email" ? "will be sent" : "this does"}
                </button>
              ) : null}
              {expanded ? (
                <div style={{ marginBottom: 10 }}>
                  <ActionDetail action={a.action} />
                </div>
              ) : null}
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

export default function AgentConsolePage({ data }) {
  const [openAgentId, setOpenAgentId] = useState(null);
  const [chatHistories, setChatHistories] = useState(() => loadJSON(CHAT_STORAGE_KEY, {}));
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    const toSave = {};
    for (const [agentId, history] of Object.entries(chatHistories)) {
      toSave[agentId] = stripAttachmentBytes(history).slice(-MAX_PERSISTED_MESSAGES);
    }
    saveJSON(CHAT_STORAGE_KEY, toSave);
  }, [chatHistories]);

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

  const openAgentDetail = useCallback((agentId) => {
    setOpenAgentId(agentId);
    setChatError("");
  }, []);

  const closeAgentDetail = useCallback(() => {
    setOpenAgentId(null);
    setChatError("");
  }, []);

  const sendMessage = useCallback(async (text, attachments) => {
    if (!openAgentId) return;
    setChatError("");
    const userMsg = { role: "user", content: text };
    if (attachments && attachments.length) userMsg.attachments = attachments;
    const nextHistory = [...(chatHistories[openAgentId] || []), userMsg];
    setChatHistories((prev) => ({ ...prev, [openAgentId]: nextHistory }));
    setChatBusy(true);
    const res = await askAgent(openAgentId, nextHistory, data);
    setChatBusy(false);
    if (res.ok && res.data.ok && res.data.answer) {
      setChatHistories((prev) => ({ ...prev, [openAgentId]: [...nextHistory, { role: "assistant", content: res.data.answer }] }));
      refresh();
    } else {
      setChatError((res.data && res.data.error) || "Couldn't reach the agent.");
    }
  }, [openAgentId, chatHistories, data, refresh]);

  useEffect(() => {
    if (!openAgentId) return;
    const onKey = (e) => { if (e.key === "Escape") closeAgentDetail(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openAgentId, closeAgentDetail]);

  return (
    <div>
      <Eyebrow>Structure OS</Eyebrow>
      <PageTitle>
        <span style={{ color: C.accent }}>6 agents.</span> 22 workflows. One console.
      </PageTitle>
      <PageDek>
        Click any agent to see how they work and chat with them live. They can search your CRM, explain what they see, and queue actions for your approval — all without leaving this page.
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
        {AGENTS.map((a) => <AgentCard key={a.id} agent={a} onOpen={openAgentDetail} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "5fr 4fr", gap: 16 }} className="grid-2-fallback">
        <ActivityStream items={events} notConfigured={!storeReady} />
        <ApprovalsPanel items={approvals} notConfigured={!storeReady} onAct={onAct} busyId={busyId} />
      </div>

      {openAgent ? (
        <AgentDetailModal
          agent={openAgent}
          onClose={closeAgentDetail}
          onClearChat={(agentId) => setChatHistories((prev) => ({ ...prev, [agentId]: [] }))}
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
