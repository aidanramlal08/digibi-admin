import React from "react";
import { C, zar } from "../tokens.js";
import { StatCard, Pill, Table, StatRow, PageTitle } from "../ui.jsx";

export default function HealthPage({ data }) {
  return (
    <div>
      <PageTitle>Business Health</PageTitle>
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
    </div>
  );
}
