import React, { useState, useEffect, useMemo } from "react";
import { C, zar, zarCompact } from "../tokens.js";
import {
  Eyebrow,
  PageTitle,
  PageDek,
  Rule,
  SectionTitle,
  Grid2,
  Toolbar,
  RangeControl,
  TrendLine,
  AttentionList,
  MetricTile,
  MonthlyBarChart,
  Donut,
  DistributionBars,
  Button,
  CeoCard,
  DeptCard,
} from "../ui.jsx";
import { fetchApprovals, fetchAgentEvents } from "../api.js";
import { AGENTS, AGENT_ACCENT, SUB_AGENTS } from "../agents.js";
import { loadJSON, saveJSON } from "../persist.js";

const GOAL_KEY = "digibi_north_star";
const DEFAULT_GOAL = { label: "Reach R100,000 MRR", target: 100000 };

function withinDays(iso, n) {
  const cutoff = Date.now() - n * 24 * 3600 * 1000;
  return new Date(iso).getTime() >= cutoff;
}

function monthKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function monthLabel(iso) {
  return new Date(iso).toLocaleDateString("en-ZA", { month: "short" });
}

// Builds the trailing N calendar months (oldest → newest) and sums real
// income (successful Paystack transactions) and expenses (logged rows)
// into each. Months with genuinely nothing in either series still show as
// zero — that's accurate, not a bug, until income sources are connected.
function buildMonthlySeries(transactions, expenses, months = 6) {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-ZA", { month: "short" }), a: 0, b: 0 });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
  for (const t of transactions || []) {
    if (t.status !== "success") continue;
    const k = monthKey(t.paidAt);
    if (k && byKey[k]) byKey[k].a += Number(t.amountZAR) || 0;
  }
  for (const e of expenses || []) {
    const k = monthKey(e.date);
    if (k && byKey[k]) byKey[k].b += Number(e.amountZAR) || 0;
  }
  return buckets;
}

// A goal the owner sets and revises themselves — target is never invented,
// "current" defaults to the best real proxy available (MRR) but stays
// editable since MRR tracking isn't wired up yet.
function NorthStar({ mrrZAR, goal, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(goal.label);
  const [draftTarget, setDraftTarget] = useState(String(goal.target));
  const [draftCurrent, setDraftCurrent] = useState(goal.current != null ? String(goal.current) : "");

  const current = goal.current != null ? goal.current : mrrZAR;
  const pct = goal.target > 0 ? Math.min(100, Math.max(0, (current / goal.target) * 100)) : 0;

  const save = () => {
    const next = {
      label: draftLabel.trim() || DEFAULT_GOAL.label,
      target: parseFloat(draftTarget.replace(/[^\d.]/g, "")) || goal.target,
      current: draftCurrent.trim() === "" ? undefined : parseFloat(draftCurrent.replace(/[^\d.]/g, "")),
    };
    onSave(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, marginBottom: 4, fontWeight: 700 }}>Goal</span>
            <input value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.lineStrong}`, background: C.bg, color: C.ink, fontFamily: C.body, fontSize: 13.5 }} />
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <label style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, marginBottom: 4, fontWeight: 700 }}>Target (ZAR)</span>
              <input value={draftTarget} onChange={(e) => setDraftTarget(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.lineStrong}`, background: C.bg, color: C.ink, fontFamily: C.mono, fontSize: 13.5 }} />
            </label>
            <label style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, marginBottom: 4, fontWeight: 700 }}>Current (blank = use MRR)</span>
              <input value={draftCurrent} onChange={(e) => setDraftCurrent(e.target.value)} placeholder={String(mrrZAR)} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.lineStrong}`, background: C.bg, color: C.ink, fontFamily: C.mono, fontSize: 13.5 }} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setEditing(false)} style={{ width: "auto" }}>Cancel</Button>
            <Button onClick={save} style={{ width: "auto" }}>Save</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => {
        setDraftLabel(goal.label);
        setDraftTarget(String(goal.target));
        setDraftCurrent(goal.current != null ? String(goal.current) : "");
        setEditing(true);
      }}
      style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}
      title="Click to edit your goal"
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: C.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: C.accent, fontWeight: 700 }}>North Star</span>
          <span style={{ fontSize: 13.5, fontWeight: 650, color: C.ink }}>{goal.label}</span>
        </div>
        <span style={{ fontFamily: C.mono, fontSize: 12.5, color: C.inkDim }}>
          <b style={{ color: C.accent, fontWeight: 700 }}>{zarCompact(current)}</b> / {zarCompact(goal.target)} · {pct.toFixed(0)}%
        </span>
      </div>
      <div style={{ height: 7, background: C.sunken, borderRadius: 99, marginTop: 8, overflow: "hidden", border: `1px solid ${C.line}` }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${C.accentLight}, ${C.accent})`, borderRadius: 99, transition: "width .5s cubic-bezier(.2,.8,.2,1)" }} />
      </div>
    </div>
  );
}

// Full org section — a Chief of Staff summary card (real agent/task/goal
// counts, nothing invented) above a grid of every department, each showing
// its lead, focus, sub-agent chips and goal contribution. Click-through
// lands on the full Agent Console for chat + approvals.
function OrgSection({ go, tasksOpen, pendingApprovals, goalPct }) {
  const depts = AGENTS.filter((a) => a.id !== "orchestrator");
  const orchestrator = AGENTS.find((a) => a.id === "orchestrator");
  return (
    <div>
      <CeoCard
        name={orchestrator.name}
        role={orchestrator.role}
        directive={`Coordinating ${depts.length} live department agents against the North Star. ${pendingApprovals == null ? "…" : pendingApprovals} approval${pendingApprovals === 1 ? "" : "s"} waiting on you.`}
        stats={[
          { label: "Agents live", value: String(depts.length) },
          { label: "Tasks in flight", value: String(tasksOpen) },
          { label: "Goal alignment", value: `${goalPct.toFixed(0)}%` },
        ]}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {depts.map((a) => (
          <DeptCard
            key={a.id}
            name={a.name}
            accent={AGENT_ACCENT[a.id]}
            status={a.status}
            statusLabel={a.statusLabel}
            lead={a.lead}
            focus={a.tagline}
            subAgents={SUB_AGENTS[a.id]}
            contribution={a.contribution}
            metricLabel={a.metricLabel}
            metricValue={a.metricValue}
            onClick={() => go("/agents")}
          />
        ))}
      </div>
    </div>
  );
}

// Real activity preview (Supabase agent_events) — full history + chat lives
// on Agent Console; this is just the last few lines so the owner sees the
// org is doing something without leaving Overview.
function ActivityPreview({ go }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchAgentEvents({ limit: 5 }).then(({ ok, data }) => {
      if (alive && ok && data.ok) setItems(data.items || []);
      else if (alive) setItems([]);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (items === null) return <div style={{ fontSize: 12.5, color: C.inkFaint, padding: "10px 2px" }}>Loading…</div>;
  if (items.length === 0) {
    return <div style={{ fontSize: 12.5, color: C.inkFaint, padding: "10px 2px" }}>No agent activity yet.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((it, i) => (
        <div key={it.id || i} style={{ display: "flex", gap: 10, padding: "8px 2px", borderBottom: i < items.length - 1 ? `1px solid ${C.line}` : "none", fontSize: 12.5 }}>
          <span style={{ fontFamily: C.mono, fontSize: 10.5, color: C.inkFaint, flexShrink: 0, paddingTop: 1 }}>
            {it.ts ? new Date(it.ts).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "—"}
          </span>
          <span style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: it.level === "error" ? C.danger : it.level === "warn" ? C.warn : C.accent, flexShrink: 0 }}>
            {it.agent_id}
          </span>
          <span style={{ color: C.inkDim, minWidth: 0 }}>{it.msg}</span>
        </div>
      ))}
      <button onClick={() => go("/agents")} style={{ alignSelf: "flex-start", marginTop: 6, background: "none", border: "none", color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "4px 2px", fontFamily: C.body }}>
        Open Agent Console →
      </button>
    </div>
  );
}

export default function OverviewPage({ data, go }) {
  const [range, setRange] = useState(30);
  const [pendingApprovals, setPendingApprovals] = useState(null);
  const [goal, setGoal] = useState(() => loadJSON(GOAL_KEY, DEFAULT_GOAL));
  const saveGoal = (next) => {
    setGoal(next);
    saveJSON(GOAL_KEY, next);
  };
  const goalCurrent = goal.current != null ? goal.current : data.accounts.mrrZAR;
  const goalPct = goal.target > 0 ? Math.min(100, Math.max(0, (goalCurrent / goal.target) * 100)) : 0;

  useEffect(() => {
    let alive = true;
    fetchApprovals().then(({ ok, data: res }) => {
      if (alive && ok && res.ok) setPendingApprovals((res.items || []).length);
      else if (alive) setPendingApprovals(0);
    });
    return () => {
      alive = false;
    };
  }, []);

  const attn = useMemo(() => {
    const items = [];
    for (const i of (data.systemHealth.issues || []).filter((i) => i.severity === "high")) {
      items.push({ tone: "high", title: `${i.kind} — ${i.workflow}`, meta: i.detail });
    }
    for (const a of data.accounts.atRisk) {
      items.push({ tone: "high", title: `${a.dealname} — payment ${a.daysOverdue}d overdue`, meta: a.dunningCallMade ? "Dunning call made" : "No dunning call yet" });
    }
    for (const c of (data.profitability.clients || []).filter((c) => c.marginPct != null && c.marginPct < 0)) {
      items.push({ tone: "high", title: `${c.client} is unprofitable`, meta: `${c.marginPct}% margin — serving cost above revenue` });
    }
    for (const g of (data.accounts.goingQuiet || []).filter((g) => g.dropPct >= 60)) {
      items.push({ tone: "med", title: `${g.dealname} going quiet`, meta: `Calls down ${g.dropPct}% · last call ${g.lastCallDaysAgo}d ago` });
    }
    for (const t of data.tasks.recent.filter((t) => t.status === "overdue")) {
      items.push({ tone: "high", title: t.title, meta: `Overdue — was due ${t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-ZA") : "—"} · ${t.relatedTo}` });
    }
    for (const u of data.accounts.usage.filter((u) => u.status === "over")) {
      items.push({ tone: "med", title: `${u.dealname} is over its usage limit`, meta: `${u.pct}% of included ${u.product}` });
    }
    for (const p of data.payments.recentTransactions.filter((t) => t.status === "failed").slice(0, 2)) {
      items.push({ tone: "med", title: `Payment failed — ${p.email}`, meta: `${zar(p.amountZAR)} · ${p.paidAt ? new Date(p.paidAt).toLocaleString("en-ZA") : "—"}` });
    }
    return items;
  }, [data]);

  const netPositive = data.financials.netThisMonthZAR != null && data.financials.netThisMonthZAR >= 0;

  const trendPoints = (data.payments.revenueTrend || [])
    .filter((p) => withinDays(p.date, range))
    .map((p) => ({ label: new Date(p.date).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }), value: p.amountZAR }));

  const monthly = useMemo(() => buildMonthlySeries(data.payments.recentTransactions, data.expenses.recent, 6), [data]);

  const productMix = useMemo(() => {
    const counts = {};
    for (const d of data.pipeline.recentDeals || []) {
      const key = d.product || "Unlabeled";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [data]);

  const spendItems = useMemo(
    () => (data.expenses.categories || []).map((c) => ({ label: c.category, count: c.amountZAR })).sort((a, b) => b.count - a.count),
    [data],
  );

  const briefingLines = attn.slice(0, 3);

  return (
    <div>
      <Eyebrow>{new Date().toLocaleDateString("en-ZA", { weekday: "long", month: "long", day: "numeric" })}</Eyebrow>
      <PageTitle>Command Deck</PageTitle>
      <PageDek>
        The whole business, one screen. {attn.length} item{attn.length === 1 ? "" : "s"} need attention, {pendingApprovals == null ? "…" : pendingApprovals} approval
        {pendingApprovals === 1 ? "" : "s"} waiting on you.
      </PageDek>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 18 }} className="grid-2-fallback">
        <NorthStar mrrZAR={data.accounts.mrrZAR} goal={goal} onSave={saveGoal} />
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontFamily: C.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: C.accent, fontWeight: 700 }}>Chief of Staff</span>
            <button onClick={() => go("/agents")} style={{ background: "none", border: "none", color: C.inkFaint, fontSize: 11, cursor: "pointer", fontFamily: C.body, fontWeight: 600 }}>
              Ask them →
            </button>
          </div>
          {briefingLines.length === 0 ? (
            <div style={{ fontSize: 13, color: C.inkDim, marginTop: 6 }}>Nothing urgent — the business is clear to run as planned today.</div>
          ) : (
            <ul style={{ margin: "6px 0 0", padding: "0 0 0 16px", fontSize: 12.5, color: C.inkDim, lineHeight: 1.6 }}>
              {briefingLines.map((it, i) => (
                <li key={i}>
                  <span style={{ color: C.ink, fontWeight: 600 }}>{it.title}</span> — {it.meta}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <MetricTile label="MRR" value={zarCompact(data.accounts.mrrZAR)} accent />
        <MetricTile
          label="Net this month"
          value={data.financials.netThisMonthZAR != null ? zarCompact(data.financials.netThisMonthZAR) : "—"}
          sparkValues={data.financials.netTrend && data.financials.netTrend.length > 1 ? data.financials.netTrend.map((m) => m.valueZAR) : null}
          sparkColor={netPositive ? C.ok : C.danger}
        />
        <MetricTile label="Gross margin" value={data.profitability.grossMarginPct != null ? data.profitability.grossMarginPct + "%" : "—"} />
        <MetricTile label="Weighted forecast" value={zarCompact(data.forecast.weightedForecastZAR)} />
        <MetricTile label="Churned MRR (30d)" value={zarCompact(data.churn.mrrLostZAR)} sparkColor={C.danger} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }} className="grid-2-fallback">
        <div>
          <Toolbar left={<SectionTitle style={{ margin: 0 }}>Revenue, trailing {range} days</SectionTitle>} right={<RangeControl value={range} onChange={setRange} />} />
          <TrendLine points={trendPoints} formatValue={zar} />
        </div>
        <div>
          <SectionTitle>Income vs expenses, last 6 months</SectionTitle>
          <MonthlyBarChart data={monthly} nameA="Income" nameB="Expenses" formatValue={zar} />
        </div>
        <div>
          <SectionTitle>Spend by category</SectionTitle>
          {spendItems.length ? (
            <DistributionBars items={spendItems} formatValue={zarCompact} colorFor={() => C.expense} labelWidth={88} />
          ) : (
            <div style={{ fontSize: 13, color: C.inkFaint, padding: "18px 4px" }}>No expenses logged yet.</div>
          )}
        </div>
        <div>
          <SectionTitle>Pipeline mix, by product</SectionTitle>
          <Donut data={productMix} formatValue={(v) => `${v} deal${v === 1 ? "" : "s"}`} />
        </div>
      </div>

      <Grid2>
        <div>
          <SectionTitle>Needs attention</SectionTitle>
          <AttentionList items={attn.slice(0, 6)} />
        </div>
        <div>
          <SectionTitle>Recent activity</SectionTitle>
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "4px 12px", background: C.paper }}>
            <ActivityPreview go={go} />
          </div>
        </div>
      </Grid2>

      <Rule />
      <Eyebrow>Command</Eyebrow>
      <SectionTitle>The org, working as one</SectionTitle>
      <OrgSection go={go} tasksOpen={data.tasks.openCount} pendingApprovals={pendingApprovals} goalPct={goalPct} />

      <Rule />
      <SectionTitle>This week, by group</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <MetricTile label="New leads" value={String(data.pipeline.newLeads7d)} />
        <MetricTile label="Calls booked" value={String(data.calls.booked)} />
        <MetricTile label="Open tasks" value={String(data.tasks.openCount)} sparkColor={data.tasks.overdueCount > 0 ? C.danger : C.ok} />
        <MetricTile label="Emails sent" value={String(data.emails.sent.total)} />
      </div>
    </div>
  );
}
