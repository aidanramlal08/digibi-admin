import React, { useState } from "react";
import { C } from "../tokens.js";
import { Eyebrow, PageTitle, PageDek, SectionTitle } from "../ui.jsx";
import { AGENTS, AGENT_ACCENT, SEED_APPROVALS, SEED_STREAM } from "../agents.js";

const DEPT_COLOR = {
  sales: C.accent,
  success: C.ok,
  finance: C.warn,
  marketing: "#F472B6",
  content: "#A78BFA",
  orchestrator: "#FB923C",
};

function AgentRail({ selectedId, onSelect }) {
  return (
    <nav
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: 8,
        height: "fit-content",
        position: "sticky",
        top: 20,
      }}
      aria-label="Agents"
    >
      <div style={{ fontSize: 10, fontWeight: 600, color: C.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase", padding: "10px 12px 6px" }}>
        Agents
      </div>
      {AGENTS.map((a) => {
        const active = a.id === selectedId;
        const dotColor = a.status === "running" ? C.ok : a.status === "pending" ? C.warn : C.inkFaint;
        return (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 8,
              cursor: "pointer",
              background: active ? C.accentWash : "transparent",
              border: `1px solid ${active ? C.line : "transparent"}`,
              width: "100%",
              textAlign: "left",
              fontFamily: C.body,
              fontSize: 13,
              color: active ? C.accentDeep : C.inkDim,
              fontWeight: active ? 700 : 600,
              marginBottom: 2,
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: active ? AGENT_ACCENT[a.id] : C.sunken,
                color: active ? "#fff" : C.inkDim,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                fontFamily: C.display,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {a.name.charAt(0)}
            </span>
            <span style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
              <strong style={{ fontSize: 13, color: active ? C.accentDeep : C.ink }}>{a.name}</strong>
              <span style={{ fontSize: 11, color: C.inkFaint, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{a.role}</span>
            </span>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
          </button>
        );
      })}
    </nav>
  );
}

function AgentDetail({ agent }) {
  const accent = AGENT_ACCENT[agent.id];
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, paddingBottom: 18, borderBottom: `1px dashed ${C.line}`, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              width: 36,
              height: 36,
              borderRadius: 9,
              background: `${accent}22`,
              color: accent,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
              fontFamily: C.display,
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {agent.name.charAt(0)}
          </div>
          <h2 style={{ fontFamily: C.display, fontSize: 22, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.01em" }}>{agent.name}</h2>
          <div style={{ fontSize: 13, color: C.inkDim, margin: "0 0 10px" }}>{agent.role}</div>
          <div style={{ fontFamily: C.display, fontSize: 14.5, color: C.ink, maxWidth: "46ch", lineHeight: 1.45 }}>{agent.tagline}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
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
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, fontWeight: 600, marginBottom: 4 }}>{agent.metricLabel}</div>
            <div style={{ fontFamily: C.display, fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{agent.metricValue}</div>
          </div>
        </div>
      </div>

      <SectionTitle style={{ marginTop: 8 }}>Pipeline</SectionTitle>
      <div style={{ display: "flex", overflowX: "auto", paddingBottom: 8, gap: 0 }}>
        {agent.pipeline.map((s, i) => (
          <div
            key={i}
            style={{
              flex: "0 0 200px",
              marginLeft: i === 0 ? 0 : 24,
              padding: "12px 14px 14px",
              background: s.gate ? `linear-gradient(180deg, ${accent}18, ${accent}05)` : C.bg,
              border: `1px solid ${s.gate ? accent + "50" : C.line}`,
              borderRadius: 10,
              position: "relative",
            }}
          >
            <div style={{ fontFamily: C.display, fontSize: 10.5, fontWeight: 700, color: s.gate ? accent : C.inkFaint, letterSpacing: "0.05em", marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>
              STEP {String(i + 1).padStart(2, "0")}
            </div>
            {s.gate ? (
              <span style={{ display: "inline-block", background: accent, color: "#0A0A0F", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, marginBottom: 6 }}>
                Human gate
              </span>
            ) : null}
            <div style={{ fontFamily: C.display, fontSize: 13.5, fontWeight: 700, color: C.ink, marginBottom: 6, letterSpacing: "-0.01em" }}>{s.name}</div>
            <div style={{ fontSize: 12, color: C.inkDim, lineHeight: 1.45 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 20 }} className="grid-2-fallback">
        <div>
          <SectionTitle>Absorbs (as reasoning)</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {agent.absorbs.map((w, i) => (
              <div key={i} style={{ padding: "10px 12px", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 13 }}>
                <div style={{ fontFamily: C.display, fontWeight: 600, color: C.ink }}>{w.name}</div>
                <div style={{ fontSize: 11.5, color: C.inkDim, marginTop: 3 }}>{w.why}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle>Tools it calls</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {agent.tools.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 12px",
                  background: C.bg,
                  border: `1px solid ${C.line}`,
                  borderRadius: 8,
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
      </div>
    </div>
  );
}

function ActivityStream({ items }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "18px 18px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <SectionTitle style={{ margin: 0 }}>Master activity stream</SectionTitle>
        <span style={{ fontSize: 11, color: C.ok, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.ok }} />
          Live
        </span>
      </div>
      <div
        style={{
          fontFamily: "'SF Mono', 'Monaco', 'Cascadia Mono', 'Menlo', monospace",
          fontSize: 12,
          lineHeight: 1.6,
          maxHeight: 260,
          overflowY: "auto",
          background: C.bg,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          padding: 12,
        }}
      >
        {items.map((it, i) => (
          <div key={i} style={{ padding: "3px 0", color: C.inkDim, display: "flex", gap: 10 }}>
            <span style={{ color: C.inkFaint, flexShrink: 0 }}>{it.ts}</span>
            <span style={{ fontWeight: 600, flexShrink: 0, minWidth: 78, color: DEPT_COLOR[it.dept] || C.inkDim }}>{it.dept}</span>
            <span style={{ color: C.ink }}>{it.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApprovalsPanel({ items }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <SectionTitle style={{ margin: 0 }}>Approvals awaiting</SectionTitle>
        <div style={{ fontFamily: C.display, fontSize: 24, fontWeight: 700, color: C.warn, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {items.length}
        </div>
      </div>
      <div style={{ fontSize: 12, color: C.inkDim, margin: "0 0 12px" }}>
        One-click approve, or click through for full context.
      </div>
      {items.map((a, i) => {
        const riskColor = a.risk === "high" ? C.danger : a.risk === "med" ? C.warn : C.inkDim;
        const riskBg = a.risk === "high" ? C.dangerWash : a.risk === "med" ? C.warnWash : C.sunken;
        return (
          <div key={i} style={{ padding: 12, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontFamily: C.display,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: (DEPT_COLOR[a.dept] || C.accent) + "22",
                  color: DEPT_COLOR[a.dept] || C.accent,
                }}
              >
                {a.deptLabel}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, letterSpacing: "0.05em", textTransform: "uppercase", background: riskBg, color: riskColor }}>
                {a.risk}
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.inkDim, marginBottom: 4 }}>{a.ctx}</div>
            <div style={{ fontSize: 13, color: C.ink, marginBottom: 10, lineHeight: 1.4 }}>{a.rec}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  border: "1px solid transparent",
                  background: C.accent,
                  color: "#fff",
                  fontFamily: C.body,
                }}
              >
                Approve
              </button>
              <button style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, cursor: "pointer", border: `1px solid ${C.lineStrong}`, background: C.paper, color: C.inkDim, fontFamily: C.body }}>
                Reject
              </button>
              <button style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, cursor: "pointer", border: `1px solid ${C.lineStrong}`, background: C.paper, color: C.inkDim, fontFamily: C.body }}>
                Open
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AgentConsolePage() {
  const [selectedId, setSelectedId] = useState("sales");
  const agent = AGENTS.find((a) => a.id === selectedId) || AGENTS[0];

  return (
    <div>
      <Eyebrow>Structure OS</Eyebrow>
      <PageTitle>
        <span style={{ color: C.accent }}>6 agents.</span> 22 workflows. One console.
      </PageTitle>
      <PageDek>
        Every DigiBi operation — outbound, ads, calls, billing, content — routed through Claude/Gemini agents that stop for you at every decision that matters. Existing n8n webhooks stay in place as the plumbing agents call; you keep working code, agents add the judgment.
      </PageDek>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: "Agents live", value: "6", hint: "All departments online", accent: C.ok },
          { label: "Pending approvals", value: String(SEED_APPROVALS.length), hint: "Your remaining job", accent: C.warn },
          { label: "Workflows absorbed", value: "22", hint: "Of 22 DigiBi n8n flows" },
          { label: "Actions today", value: "147", hint: "Autonomous · 3 escalated" },
        ].map((k, i) => (
          <div key={i} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, fontWeight: 600, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: C.display, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1, color: k.accent || C.ink }}>
              {k.value}
            </div>
            {k.hint ? <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 6 }}>{k.hint}</div> : null}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, marginBottom: 24 }} className="grid-2-fallback">
        <AgentRail selectedId={selectedId} onSelect={setSelectedId} />
        <AgentDetail agent={agent} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "5fr 4fr", gap: 20 }} className="grid-2-fallback">
        <ActivityStream items={SEED_STREAM} />
        <ApprovalsPanel items={SEED_APPROVALS} />
      </div>
    </div>
  );
}
