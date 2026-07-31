import React, { useState } from "react";
import { C, zar } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, SectionTitle, Toolbar, RangeControl, TrendLine, DataTable, Pill } from "../ui.jsx";

function withinDays(iso, n) {
  const cutoff = Date.now() - n * 24 * 3600 * 1000;
  return new Date(iso).getTime() >= cutoff;
}

export default function PaymentsPage({ data }) {
  const [range, setRange] = useState(30);

  const trendPoints = (data.payments.revenueTrend || [])
    .filter((p) => withinDays(p.date, range))
    .map((p) => ({ label: new Date(p.date).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }), value: p.amountZAR }));
  const rangeRevenue = trendPoints.reduce((s, p) => s + p.value, 0);
  const rows = (data.payments.recentTransactions || []).filter((t) => withinDays(t.paidAt, range));

  return (
    <div>
      <Eyebrow>Revenue</Eyebrow>
      <PageTitle>Payments</PageTitle>
      <PageDek>Every charge Yoco has processed, successful or not.</PageDek>
      <StatRow>
        <StatCard label="Revenue (all time)" value={zar(data.payments.totalRevenueZAR)} accent={C.ok} />
        <StatCard label={`Revenue (${range}d)`} value={zar(rangeRevenue)} />
        <StatCard label="Recurring (30d)" value={data.payments.recurring30dZAR != null ? zar(data.payments.recurring30dZAR) : "—"} hint="subscriptions" />
        <StatCard label="Overage (30d)" value={data.payments.overage30dZAR != null ? zar(data.payments.overage30dZAR) : "—"} hint="metered voice minutes" accent={C.accent} />
        <StatCard label="Successful charges" value={data.payments.successCount} />
        <StatCard label="Failed / abandoned" value={data.payments.failedCount} accent={data.payments.failedCount > 0 ? C.warn : undefined} />
      </StatRow>
      <Toolbar left={<SectionTitle style={{ margin: 0 }}>Revenue trend</SectionTitle>} right={<RangeControl value={range} onChange={setRange} />} />
      <TrendLine points={trendPoints} formatValue={zar} />
      <DataTable
        empty="No transactions in this range."
        searchKeys={["email", "status", "chargeType"]}
        exportName="payments"
        columns={[
          { key: "paidAt", label: "Date", render: (r) => (r.paidAt ? new Date(r.paidAt).toLocaleString("en-ZA") : "—"), csv: (r) => r.paidAt },
          { key: "email", label: "Customer" },
          { key: "amountZAR", label: "Amount", num: true, render: (r) => zar(r.amountZAR), csv: (r) => r.amountZAR },
          { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "success" ? "ok" : r.status === "failed" ? "miss" : "warn"}>{r.status}</Pill>, csv: (r) => r.status },
          { key: "chargeType", label: "Type" },
        ]}
        rows={rows}
      />
    </div>
  );
}
