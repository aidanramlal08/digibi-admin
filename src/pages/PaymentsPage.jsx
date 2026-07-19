import React from "react";
import { C, zar } from "../tokens.js";
import { StatCard, Pill, Table, StatRow, PageTitle } from "../ui.jsx";

export default function PaymentsPage({ data }) {
  return (
    <div>
      <PageTitle>Payments</PageTitle>
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
    </div>
  );
}
