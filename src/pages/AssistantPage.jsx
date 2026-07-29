import React, { useState, useRef, useEffect } from "react";
import { C } from "../tokens.js";
import { askAssistant, getBrief } from "../api.js";
import { Eyebrow, PageTitle, PageDek, SectionTitle, Button, Notice } from "../ui.jsx";

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
          color: isUser ? "#fff" : C.ink,
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

const SUGGESTIONS = [
  "Which accounts are unprofitable, and why?",
  "What's driving churn this month?",
  "Summarise this week's pipeline.",
  "Which clients are going quiet?",
];

export default function AssistantPage({ data }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState(null);
  const [briefBusy, setBriefBusy] = useState(false);
  const threadRef = useRef(null);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setError("");
    setInput("");
    const next = [...messages, { role: "user", content }];
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

      <SectionTitle>Chat</SectionTitle>
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
                {m.content}
              </Bubble>
            ),
          )
        )}
        {busy ? <div style={{ fontSize: 13, color: C.inkFaint, padding: "4px 2px" }}>Thinking…</div> : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        style={{ display: "flex", gap: 10 }}
      >
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
        <Button type="submit" disabled={busy || !input.trim()} style={{ width: "auto" }}>
          Send
        </Button>
      </form>
    </div>
  );
}
