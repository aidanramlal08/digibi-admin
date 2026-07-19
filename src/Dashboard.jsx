import React, { useState, useEffect, useCallback } from "react";
import { C, zar } from "./tokens.js";
import { callAdmin } from "./api.js";
import { Spinner, Button, StatCard, Pill, Table, Notice, Field } from "./ui.jsx";

const EXPENSE_CATEGORIES = ["Software", "Infrastructure", "Marketing", "Contractors", "Other"];

const STAGE_LABELS = {
  "5698192615": "In Progress",
  "5698192620": "Closed Won",
};

function stageLabel(id) {
  return STAGE_LABELS[id] || id || "Unknown";
}

function Section({ id, title, children, right }) {
  return (
    <div id={id} style={{ marginBottom: 32, scrollMarginTop: 68 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontFamily: C.display, fontSize: 18, fontWeight: 800, margin: 0 }}>{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

const NAV_SECTIONS = [
  { id: "payments", label: "Payments" },
  { id: "pipeline", label: "Pipeline & Leads" },
  { id: "calls", label: "Call Activity" },
  { id: "health", label: "Business Health" },
  { id: "leads", label: "Lead Sources" },
  { id: "costs", label: "Costs" },
];

function NavBar({ activeId }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        gap: 6,
        overflowX: "auto",
        padding: "10px 0",
        marginBottom: 24,
        background: "rgba(1,2,10,0.92)",
        backdropFilter: "blur(6px)",
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      {NAV_SECTIONS.map((s) => {
        const active = activeId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            style={{
              flexShrink: 0,
              padding: "7px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: C.body,
              cursor: "pointer",
              border: active ? "none" : `1px solid ${C.lineStrong}`,
              background: active ? `linear-gradient(180deg, ${C.blue}, ${C.blueDeep})` : "transparent",
              color: active ? "#fff" : C.textDim,
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

function StatRow({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 18 }}>
      {children}
    </div>
  );
}

function ExpenseForm({ onAdded }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { ok, data } = await callAdmin("add-expense", {
      date,
      category: category.trim(),
      description: description.trim(),
      amount_cents: Math.round(Number(amount) * 100),
    });
    setBusy(false);
    if (ok && data.ok) {
      setCategory("");
      setDescription("");
      setAmount("");
      onAdded();
    } else {
      setError((data && data.error) || "Couldn't add that expense.");
    }
  };

  return (
    <form onSubmit={submit} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
      <Notice kind="error">{error}</Notice>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, alignItems: "end" }}>
        <Field label="Date" type="date" value={date} onChange={setDate} />
        <div>
          <label style={{ display: "block", fontSize: 12.5, color: C.textDim, marginBottom: 7, fontWeight: 600 }}>Category</label>
          <input
            list="expense-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Software"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 11, fontSize: 15, background: C.bgDeep, border: `1px solid ${C.lineStrong}`, color: C.text, fontFamily: C.body, outline: "none" }}
          />
          <datalist id="expense-categories">
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <Field label="Description" value={description} onChange={setDescription} placeholder="What was it for?" />
        <Field label="Amount (ZAR)" type="number" value={amount} onChange={setAmount} placeholder="0.00" />
        <Button type="submit" disabled={busy || !date || !category || !amount}>
          {busy ? "Adding…" : "Add expense"}
        </Button>
      </div>
    </form>
  );
}

export default function Dashboard({ onSignedOut }) {
  const [state, setState] = useState("loading"); // loading | ready | error
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeId, setActiveId] = useState(NAV_SECTIONS[0].id);

  const load = useCallback(async (silent) => {
    if (silent) setRefreshing(true);
    else setState("loading");
    const { ok, data: res } = await callAdmin("overview", {});
    if (ok && res.ok) {
      setData(res.data);
      setState("ready");
    } else {
      setState("error");
    }
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    if (!data) return;
    const elements = NAV_SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-64px 0px -70% 0px", threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [data]);

  const signOut = async () => {
    await callAdmin("logout", {});
    onSignedOut();
  };

  if (state === "loading") return <Spinner label="Loading overview…" />;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", padding: "28px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: C.display, fontSize: 22, fontWeight: 800 }}>
            Digi<span style={{ color: C.blueLight }}>Bi</span> Owner Dashboard
          </div>
          {data ? (
            <div style={{ fontSize: 12, color: C.textFaint, marginTop: 4 }}>
              Updated {new Date(data.generatedAt).toLocaleString("en-ZA")}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="subtle" onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>

      {state === "error" ? <Notice kind="error">Couldn't load the dashboard. Try refreshing.</Notice> : null}

      {data ? (
        <>
          <NavBar activeId={activeId} />

          <Section id="payments" title="Payments">
            <StatRow>
              <StatCard label="Revenue (all time)" value={zar(data.payments.totalRevenueZAR)} accent={C.ok} />
              <StatCard label="Revenue (30d)" value={zar(data.payments.revenue30dZAR)} />
              <StatCard label="Successful charges" value={data.payments.successCount} />
              <StatCard label="Failed / abandoned" value={data.payments.failedCount} accent={data.payments.failedCount > 0 ? C.warn : undefined} />
            </StatRow>
            <Table
              empty="No transactions yet."
              columns={[
                { key: "paidAt", label: "Date", render: (r) => (r.paidAt ? new Date(r.paidAt).toLocaleString("en-ZA") : "—") },
                { key: "email", label: "Customer" },
                { key: "amountZAR", label: "Amount", render: (r) => zar(r.amountZAR) },
                {
                  key: "status",
                  label: "Status",
                  render: (r) => <Pill tone={r.status === "success" ? "ok" : r.status === "failed" ? "miss" : "warn"}>{r.status}</Pill>,
                },
                { key: "chargeType", label: "Type" },
              ]}
              rows={data.payments.recentTransactions}
            />
          </Section>

          <Section id="pipeline" title="Pipeline & Leads">
            <StatRow>
              <StatCard label="Total deals" value={data.pipeline.totalDeals} />
              <StatCard label="New leads (7d)" value={data.pipeline.newLeads7d} accent={C.blueLight} />
              <StatCard label="New leads (30d)" value={data.pipeline.newLeads30d} />
            </StatRow>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {Object.entries(data.pipeline.byStage).map(([stage, count]) => (
                <Pill key={stage} tone="neutral">
                  {stageLabel(stage)}: {count}
                </Pill>
              ))}
            </div>
            <Table
              empty="No deals yet."
              columns={[
                { key: "dealname", label: "Deal" },
                { key: "email", label: "Contact" },
                { key: "product", label: "Product" },
                { key: "tier", label: "Tier" },
                { key: "dealstage", label: "Stage", render: (r) => <Pill tone="neutral">{stageLabel(r.dealstage)}</Pill> },
                { key: "createdate", label: "Created", render: (r) => (r.createdate ? new Date(r.createdate).toLocaleDateString("en-ZA") : "—") },
              ]}
              rows={data.pipeline.recentDeals}
            />
          </Section>

          <Section id="calls" title="Call Activity">
            <StatRow>
              <StatCard label="Total calls" value={data.calls.totalCalls} />
              <StatCard label="Total minutes" value={data.calls.totalMinutes} />
              <StatCard label="Connected" value={data.calls.connected} />
              <StatCard label="Bookings" value={data.calls.booked} accent={C.ok} />
              <StatCard label="Booking rate" value={data.calls.bookingRate + "%"} />
            </StatRow>
            <Table
              empty="No calls yet."
              columns={[
                { key: "ts", label: "Time", render: (r) => (r.ts ? new Date(r.ts).toLocaleString("en-ZA") : "—") },
                { key: "client_key", label: "Client" },
                { key: "call_type", label: "Type" },
                { key: "duration_min", label: "Minutes" },
                { key: "connected", label: "Connected", render: (r) => <Pill tone={r.connected ? "ok" : "miss"}>{r.connected ? "Yes" : "No"}</Pill> },
                { key: "booked", label: "Booked", render: (r) => <Pill tone={r.booked ? "ok" : "neutral"}>{r.booked ? "Yes" : "No"}</Pill> },
              ]}
              rows={data.calls.recentCalls}
            />
          </Section>

          <Section id="health" title="Business Health">
            <StatRow>
              <StatCard label="MRR" value={zar(data.accounts.mrrZAR)} accent={C.ok} />
              <StatCard label="At-risk accounts" value={data.accounts.atRisk.length} accent={data.accounts.atRisk.length > 0 ? C.danger : undefined} />
              <StatCard label="Near/over usage limit" value={data.accounts.usage.length} accent={data.accounts.usage.length > 0 ? C.warn : undefined} />
            </StatRow>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12.5, color: C.textDim, fontWeight: 600, marginBottom: 8 }}>At-risk accounts</div>
              <Table
                empty="No overdue accounts."
                columns={[
                  { key: "dealname", label: "Deal" },
                  { key: "daysOverdue", label: "Days overdue" },
                  { key: "dunningCallMade", label: "Dunning call", render: (r) => <Pill tone={r.dunningCallMade ? "ok" : "warn"}>{r.dunningCallMade ? "Made" : "Pending"}</Pill> },
                ]}
                rows={data.accounts.atRisk}
              />
            </div>
            <div>
              <div style={{ fontSize: 12.5, color: C.textDim, fontWeight: 600, marginBottom: 8 }}>Near/over usage limit</div>
              <Table
                empty="Everyone's within their plan."
                columns={[
                  { key: "dealname", label: "Deal" },
                  { key: "product", label: "Product" },
                  { key: "tier", label: "Tier" },
                  { key: "used", label: "Used" },
                  { key: "included", label: "Included" },
                  { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "over" ? "miss" : "warn"}>{r.pct}%</Pill> },
                ]}
                rows={data.accounts.usage}
              />
            </div>
          </Section>

          <Section id="leads" title="Lead Sources">
            <StatRow>
              <StatCard label="Total contacts" value={data.leadSources.totalContacts} />
              <StatCard label="New (7d)" value={data.leadSources.new7d} accent={C.blueLight} />
              <StatCard label="New (30d)" value={data.leadSources.new30d} />
            </StatRow>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {data.leadSources.sources.length === 0 ? (
                <div style={{ fontSize: 13, color: C.textFaint }}>No contacts yet.</div>
              ) : (
                data.leadSources.sources.map((s) => (
                  <Pill key={s.source} tone="neutral">
                    {s.source}: {s.count}
                  </Pill>
                ))
              )}
            </div>
          </Section>

          <Section id="costs" title="Costs">
            <StatRow>
              <StatCard label="This month" value={zar(data.expenses.thisMonthZAR)} />
              <StatCard label="Last month" value={zar(data.expenses.lastMonthZAR)} />
            </StatRow>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {data.expenses.categories.map((c) => (
                <Pill key={c.category} tone="neutral">
                  {c.category}: {zar(c.amountZAR)}
                </Pill>
              ))}
            </div>
            <ExpenseForm onAdded={() => load(true)} />
            <Table
              empty="No expenses logged yet."
              columns={[
                { key: "date", label: "Date", render: (r) => (r.date ? new Date(r.date).toLocaleDateString("en-ZA") : "—") },
                { key: "category", label: "Category" },
                { key: "description", label: "Description" },
                { key: "amountZAR", label: "Amount", render: (r) => zar(r.amountZAR) },
              ]}
              rows={data.expenses.recent}
            />
          </Section>
        </>
      ) : null}
    </div>
  );
}
