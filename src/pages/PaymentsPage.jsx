import React from "react";
import { C, zar } from "../tokens.js";
import { StatCard, Pill, Table, StatRow, PageTitle, TrendLine } from "../ui.jsx";

export default function PaymentsPage({ data }) {
  const trendPoints = (data.payments.revenueTrend || []).map((d) => ({
    label: new Date(d.date).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }),
    value: d.amountZAR,
  }));
  return (
    <div>
      <PageTitle>Payments</PageTitle>
      <StatRow>
        <StatCard label="Revenue (all time)" value={zar(data.payments.totalRevenueZAR)} accent={C.ok} />
        <StatCard label="Revenue (30d)" value={zar(data.payments.revenue30dZAR)} />
        <StatCard label="Successful charges" value={data.payments.successCount} />
        <StatCard label="Failed / abandoned" value={data.payments.failedCount} accent={data.payments.failedCount > 0 ? C.warn : undefined} />
      </StatRow>
      <div style={{ marginBottom: 8, fontSize: 12.5, color: C.textDim, fontWeight: 600 }}>Revenue, last 30 days</div>
      <TrendLine points={trendPoints} formatValue={zar} />
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
    </div>
  );
}
