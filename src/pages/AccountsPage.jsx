import React from "react";
import { C, zar } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, Rule, SectionTitle, DataTable, Pill } from "../ui.jsx";

export default function AccountsPage({ data }) {
  return (
    <div>
      <Eyebrow>Retention</Eyebrow>
      <PageTitle>Accounts</PageTitle>
      <PageDek>Payment risk and usage across active accounts.</PageDek>
      <StatRow>
        <StatCard label="MRR" value={zar(data.accounts.mrrZAR)} accent={C.ok} />
        <StatCard label="At-risk accounts" value={data.accounts.atRisk.length} accent={data.accounts.atRisk.length > 0 ? C.danger : undefined} />
        <StatCard label="Near/over usage limit" value={data.accounts.usage.length} accent={data.accounts.usage.length > 0 ? C.warn : undefined} />
      </StatRow>
      <SectionTitle>At-risk accounts</SectionTitle>
      <DataTable
        empty="No overdue accounts."
        columns={[
          { key: "dealname", label: "Deal" },
          { key: "daysOverdue", label: "Days overdue", num: true },
          { key: "dunningCallMade", label: "Dunning call", render: (r) => <Pill tone={r.dunningCallMade ? "ok" : "warn"}>{r.dunningCallMade ? "Made" : "Pending"}</Pill>, csv: (r) => r.dunningCallMade },
        ]}
        rows={data.accounts.atRisk}
      />
      <Rule />
      <SectionTitle>Near/over usage limit</SectionTitle>
      <DataTable
        empty="Everyone's within their plan."
        columns={[
          { key: "dealname", label: "Deal" },
          { key: "product", label: "Product" },
          { key: "tier", label: "Tier" },
          { key: "used", label: "Used", num: true },
          { key: "included", label: "Included", num: true },
          { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "over" ? "miss" : "warn"}>{r.pct}%</Pill>, csv: (r) => r.pct },
        ]}
        rows={data.accounts.usage}
      />
    </div>
  );
}
