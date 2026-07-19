import React, { useState } from "react";
import { C, zar } from "../tokens.js";
import { callAdmin } from "../api.js";
import { StatCard, Pill, Table, StatRow, PageTitle, Field, Button, Notice } from "../ui.jsx";
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

export default function CostsPage({ data, onRefresh }) {
  return (
    <div>
      <PageTitle>Costs</PageTitle>
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
      <ExpenseForm onAdded={onRefresh} />
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
    </div>
  );
}
