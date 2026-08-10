import React, { useState } from "react";
import { C, zar } from "../tokens.js";
import { callAdmin } from "../api.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, PillRow, Pill, DataTable, Notice, Rule, SectionTitle, TrendLine } from "../ui.jsx";
import { EXPENSE_CATEGORIES } from "../lib.js";

// Renders as an inline table row (<tr>) so the form's columns are literally
// the same table columns as the data rows below — perfect alignment.
function ExpenseRow({ onAdded }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy || !date || !category || !amount) return;
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
    }
  };

  const cellStyle = { padding: "8px 12px", borderBottom: `1px solid ${C.line}`, background: C.bg, verticalAlign: "middle" };
  const inputStyle = { width: "100%", padding: "7px 9px", borderRadius: 6, fontSize: 13, background: C.paper, border: `1px solid ${C.lineStrong}`, color: C.ink, fontFamily: C.body, outline: "none" };

  return (
    <tr>
      <td style={cellStyle}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </td>
      <td style={cellStyle}>
        <input list="expense-categories" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" style={inputStyle} />
        <datalist id="expense-categories">
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} />)}
        </datalist>
      </td>
      <td style={cellStyle}>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was it for?" style={inputStyle} />
      </td>
      <td style={{ ...cellStyle, textAlign: "right" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="0.00"
            style={{ ...inputStyle, width: 100, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !date || !category || !amount}
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              border: "none",
              background: busy || !date || !category || !amount ? C.lineStrong : C.accent,
              color: C.onAccent,
              fontFamily: C.body,
              fontWeight: 700,
              fontSize: 12,
              cursor: busy || !date || !category || !amount ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {busy ? "…" : "Add"}
          </button>
        </div>
      </td>
    </tr>
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
      <DataTable
        empty="No expenses logged yet — add one above."
        searchKeys={["category", "description"]}
        exportName="expenses"
        topRow={<ExpenseRow onAdded={onRefresh} />}
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
