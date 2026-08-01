import React, { useState } from "react";
import { C, zar } from "../tokens.js";
import { callAdmin } from "../api.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, PillRow, Pill, DataTable, Field, Button, Notice, Rule, SectionTitle, TrendLine } from "../ui.jsx";
import { EXPENSE_CATEGORIES } from "../lib.js";

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
    <form onSubmit={submit} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px", marginBottom: 20 }}>
      <Notice kind="error">{error}</Notice>
      <div style={{ display: "grid", gridTemplateColumns: "160px 180px 1fr 140px auto", gap: 12, alignItems: "end" }}>
        <Field label="Date" type="date" value={date} onChange={setDate} />
        <div>
          <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: C.inkFaint, marginBottom: 6, fontWeight: 700 }}>Category</label>
          <input
            list="expense-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Software"
            style={{ width: "100%", padding: "9px 11px", borderRadius: 8, fontSize: 14, background: C.paper, border: `1px solid ${C.lineStrong}`, color: C.ink, fontFamily: C.body, outline: "none" }}
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

export default function CostsPage({ data, onRefresh }) {
  const f = data.financials;
  const netPositive = f.netThisMonthZAR != null && f.netThisMonthZAR >= 0;
  return (
    <div>
      <Eyebrow>Revenue</Eyebrow>
      <PageTitle>Costs &amp; Cash</PageTitle>
      <PageDek>Money out, net position, and runway.</PageDek>

      <SectionTitle>Cash position</SectionTitle>
      <StatRow>
        <StatCard
          label="Net this month"
          value={f.netThisMonthZAR != null ? zar(f.netThisMonthZAR) : "—"}
          hint="revenue − costs"
          accent={f.netThisMonthZAR == null ? undefined : netPositive ? C.ok : C.danger}
        />
        <StatCard label="Cash on hand" value={f.cashOnHandZAR != null ? zar(f.cashOnHandZAR) : "—"} />
        <StatCard
          label={netPositive ? "Monthly surplus" : "Monthly burn"}
          value={f.monthlyBurnZAR != null ? zar(Math.abs(f.monthlyBurnZAR)) : netPositive ? zar(f.netThisMonthZAR) : "—"}
        />
        <StatCard label="Runway" value={netPositive ? "Profitable" : f.runwayMonths != null ? f.runwayMonths + " mo" : "—"} accent={netPositive ? C.ok : f.runwayMonths != null && f.runwayMonths < 6 ? C.danger : undefined} />
      </StatRow>
      {f.netTrend && f.netTrend.length > 0 ? (
        <>
          <div style={{ fontSize: 12.5, color: C.inkDim, fontWeight: 600, marginBottom: 8 }}>Net profit, trailing months</div>
          <TrendLine points={f.netTrend.map((m) => ({ label: m.month, value: m.valueZAR }))} formatValue={zar} />
        </>
      ) : null}

      <Rule />
      <SectionTitle>Operating expenses</SectionTitle>
      <StatRow>
        <StatCard label="This month" value={zar(data.expenses.thisMonthZAR)} />
        <StatCard label="Last month" value={zar(data.expenses.lastMonthZAR)} />
      </StatRow>
      <PillRow>
        {data.expenses.categories.map((c) => (
          <Pill key={c.category} tone="neutral">
            {c.category}: {zar(c.amountZAR)}
          </Pill>
        ))}
      </PillRow>
      <ExpenseForm onAdded={onRefresh} />
      <DataTable
        empty="No expenses logged yet."
        searchKeys={["category", "description"]}
        exportName="expenses"
        columns={[
          { key: "date", label: "Date", render: (r) => (r.date ? new Date(r.date).toLocaleDateString("en-ZA") : "—"), csv: (r) => r.date },
          { key: "category", label: "Category" },
          { key: "description", label: "Description" },
          { key: "amountZAR", label: "Amount", num: true, render: (r) => zar(r.amountZAR), csv: (r) => r.amountZAR },
        ]}
        rows={data.expenses.recent}
      />
    </div>
  );
}
