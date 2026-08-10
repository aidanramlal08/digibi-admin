import React, { useState, useRef, useEffect } from "react";
import { C } from "../tokens.js";
import { askAssistant, getBrief } from "../api.js";
import { Eyebrow, PageTitle, PageDek, SectionTitle, Button, Notice } from "../ui.jsx";
import { readFileAsAttachment, validateAttachmentSet, isImage, ACCEPT_ATTR } from "../attachments.js";
import { loadJSON, saveJSON, stripAttachmentBytes, MAX_PERSISTED_MESSAGES } from "../persist.js";

const CHAT_STORAGE_KEY = "digibi_assistant_chat";

// Minimal markdown → HTML for the assistant's replies: bold, bullets, line
// breaks. Escapes first so model output can't inject markup.
function renderMarkdown(text) {
  const esc = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const lines = esc.split("\n");
  const out = [];
  let inList = false;
  for (const line of lines) {
    const bulleted = /^\s*[-*]\s+/.test(line);
    if (bulleted) {
      if (!inList) {
        out.push("<ul style='margin:6px 0;padding-left:18px'>");
        inList = true;
      }
      out.push("<li>" + line.replace(/^\s*[-*]\s+/, "") + "</li>");
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(line.trim() ? "<p style='margin:6px 0'>" + line + "</p>" : "");
    }
  }
  if (inList) out.push("</ul>");
  return out.join("").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function Bubble({ role, children }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
      <div
        style={{
          maxWidth: "80%",
          padding: "10px 14px",
          borderRadius: 12,
          fontSize: 14,
          lineHeight: 1.5,
          background: isUser ? C.accent : C.paper,
          color: isUser ? C.onAccent : C.ink,
          border: isUser ? "none" : `1px solid ${C.line}`,
          borderTopRightRadius: isUser ? 4 : 12,
          borderTopLeftRadius: isUser ? 12 : 4,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function PaperclipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M11 4.5 5.5 10a2 2 0 1 0 2.83 2.83L14 7.17a3.5 3.5 0 1 0-4.95-4.95L3.5 7.76a5 5 0 1 0 7.07 7.07" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Small chips showing attached files — used both in the pending-send tray
// and inline inside a sent user bubble.
function AttachmentChips({ attachments, onRemove, tone }) {
  if (!attachments || attachments.length === 0) return null;
  const light = tone === "onAccent";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: onRemove ? 0 : 8 }}>
      {attachments.map((a, i) => (
        <span
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11.5,
            padding: "3px 8px",
            borderRadius: 999,
            background: light ? "rgba(26,18,5,0.14)" : C.sunken,
            color: light ? C.onAccent : C.inkDim,
            border: light ? "1px solid rgba(26,18,5,0.28)" : `1px solid ${C.line}`,
            maxWidth: 160,
          }}
          title={a.name}
        >
          {isImage(a.mimeType) ? "🖼" : "📄"}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(i)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, fontSize: 13, lineHeight: 1, opacity: 0.7 }}
              aria-label={`Remove ${a.name}`}
            >
              ×
            </button>
          ) : null}
        </span>
      ))}
    </div>
  );
}

const SUGGESTIONS = [
  "Which accounts are unprofitable, and why?",
  "What's driving churn this month?",
  "Summarise this week's pipeline.",
  "Which clients are going quiet?",
];

export default function AssistantPage({ data }) {
  const [messages, setMessages] = useState(() => loadJSON(CHAT_STORAGE_KEY, []));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState(null);
  const [briefBusy, setBriefBusy] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const threadRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    saveJSON(CHAT_STORAGE_KEY, stripAttachmentBytes(messages).slice(-MAX_PERSISTED_MESSAGES));
  }, [messages]);

  const onFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const results = [];
    for (const f of files) {
      try {
        results.push(await readFileAsAttachment(f));
      } catch (msg) {
        setError(msg);
      }
    }
    const merged = [...pendingAttachments, ...results];
    const invalid = validateAttachmentSet(merged);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPendingAttachments(merged);
  };

  const removeAttachment = (i) => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i));

  const send = async (text) => {
    const content = (text ?? input).trim();
    if ((!content && pendingAttachments.length === 0) || busy) return;
    setError("");
    setInput("");
    const attachments = pendingAttachments;
    setPendingAttachments([]);
    const userMsg = { role: "user", content: content || "(see attached file)" };
    if (attachments.length) userMsg.attachments = attachments;
    const next = [...messages, userMsg];
    setMessages(next);
    setBusy(true);
    const { ok, data: res } = await askAssistant(next, data);
    setBusy(false);
    if (ok && res.ok) {
      setMessages([...next, { role: "assistant", content: res.answer }]);
    } else {
      setError((res && res.error) || "The assistant is unavailable. Check that it's configured.");
    }
  };

  const loadBrief = async () => {
    setBriefBusy(true);
    setError("");
    const { ok, data: res } = await getBrief();
    setBriefBusy(false);
    if (ok && res.ok) setBrief(res.brief);
    else setError((res && res.error) || "Couldn't generate the brief.");
  };

  return (
    <div>
      <Eyebrow>Assistant</Eyebrow>
      <PageTitle>Ask about your business</PageTitle>
      <PageDek>Plain-English questions answered from your live data — margins, churn, pipeline, calls and more.</PageDek>

      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: brief ? 12 : 0 }}>
          <SectionTitle style={{ margin: 0 }}>Daily brief</SectionTitle>
          <Button variant="subtle" onClick={loadBrief} disabled={briefBusy} style={{ width: "auto" }}>
            {briefBusy ? "Generating…" : brief ? "Refresh" : "Generate"}
          </Button>
        </div>
        {brief ? (
          <div style={{ fontSize: 14, color: C.ink }} dangerouslySetInnerHTML={{ __html: renderMarkdown(brief) }} />
        ) : (
          <div style={{ fontSize: 13, color: C.inkFaint, marginTop: 6 }}>
            A morning summary of what needs attention. Also runs automatically each day.
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionTitle style={{ margin: 0 }}>Chat</SectionTitle>
        {messages.length > 0 ? (
          <button
            onClick={() => setMessages([])}
            title="Clear this conversation"
            style={{ background: "none", border: "none", cursor: "pointer", color: C.inkFaint, fontSize: 12.5, fontFamily: C.body, padding: 0 }}
          >
            Clear chat
          </button>
        ) : null}
      </div>
      <Notice kind="error">{error}</Notice>

      <div
        ref={threadRef}
        style={{
          background: C.bg,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: 16,
          minHeight: 280,
          maxHeight: 460,
          overflowY: "auto",
          marginBottom: 12,
        }}
      >
        {messages.length === 0 ? (
          <div>
            <div style={{ fontSize: 13, color: C.inkFaint, marginBottom: 12 }}>Ask anything about the business, or start with:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: C.accentDeep,
                    background: C.accentWash,
                    border: `1px solid ${C.line}`,
                    borderRadius: 20,
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontFamily: C.body,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) =>
            m.role === "assistant" ? (
              <Bubble key={i} role="assistant">
                <span dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
              </Bubble>
            ) : (
              <Bubble key={i} role="user">
                <AttachmentChips attachments={m.attachments} tone="onAccent" />
                {m.content}
              </Bubble>
            ),
          )
        )}
        {busy ? <div style={{ fontSize: 13, color: C.inkFaint, padding: "4px 2px" }}>Thinking…</div> : null}
      </div>

      {pendingAttachments.length > 0 ? (
        <div style={{ marginBottom: 8 }}>
          <AttachmentChips attachments={pendingAttachments} onRemove={removeAttachment} />
        </div>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        style={{ display: "flex", gap: 10 }}
      >
        <input ref={fileInputRef} type="file" multiple accept={ACCEPT_ATTR} onChange={onFilesSelected} style={{ display: "none" }} />
        <button
          type="button"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          title="Attach images or PDFs"
          style={{
            flexShrink: 0,
            width: 42,
            borderRadius: 10,
            border: `1px solid ${C.lineStrong}`,
            background: C.paper,
            color: C.inkDim,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <PaperclipIcon />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about margins, churn, pipeline…"
          style={{
            flex: 1,
            padding: "11px 14px",
            borderRadius: 10,
            fontSize: 14,
            background: C.paper,
            border: `1px solid ${C.lineStrong}`,
            color: C.ink,
            outline: "none",
            fontFamily: C.body,
          }}
        />
        <Button type="submit" disabled={busy || (!input.trim() && pendingAttachments.length === 0)} style={{ width: "auto" }}>
          Send
        </Button>
      </form>
    </div>
  );
}
