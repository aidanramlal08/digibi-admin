import React from "react";
import { C, zar } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, DataTable } from "../ui.jsx";

export default function ChurnPage({ data }) {
  return (
    <div>
      <Eyebrow>Retention</Eyebrow>
      <PageTitle>Churn</PageTitle>
      <PageDek>Cancelled or downgraded accounts, and MRR lost.</PageDek>
      <StatRow>
        <StatCard label="Churned (30d)" value={data.churn.churned30d} accent={data.churn.churned30d > 0 ? C.danger : undefined} />
        <StatCard label="Monthly churn rate" value={data.churn.churnRateMonthly + "%"} />
        <StatCard label="MRR lost (30d)" value={zar(data.churn.mrrLostZAR)} accent={C.danger} />
      </StatRow>
      <DataTable
        empty="No cancellations logged."
        searchKeys={["dealname", "product", "reason"]}
        exportName="churn"
        columns={[
          { key: "dealname", label: "Account" },
          { key: "product", label: "Product" },
          { key: "tier", label: "Tier" },
          { key: "cancelledAt", label: "Cancelled", render: (r) => (r.cancelledAt ? new Date(r.cancelledAt).toLocaleDateString("en-ZA") : "—"), csv: (r) => r.cancelledAt },
          { key: "reason", label: "Reason" },
          { key: "mrrZAR", label: "MRR lost", num: true, render: (r) => zar(r.mrrZAR), csv: (r) => r.mrrZAR },
        ]}
        rows={data.churn.recent}
      />
    </div>
  );
}
