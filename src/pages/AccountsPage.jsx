import React from "react";
import { C, zar } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, Rule, SectionTitle, DataTable, Table, Pill } from "../ui.jsx";

export default function AccountsPage({ data }) {
  const goingQuiet = data.accounts.goingQuiet || [];
  const onboarding = data.accounts.onboarding || [];
  return (
    <div>
      <Eyebrow>Retention</Eyebrow>
      <PageTitle>Accounts</PageTitle>
      <PageDek>Payment risk, usage, early churn signals, and who's still being onboarded.</PageDek>
      <StatRow>
        <StatCard label="MRR" value={zar(data.accounts.mrrZAR)} accent={C.ok} />
        <StatCard label="At-risk (payment)" value={data.accounts.atRisk.length} accent={data.accounts.atRisk.length > 0 ? C.danger : undefined} />
        <StatCard label="Going quiet" value={goingQuiet.length} accent={goingQuiet.length > 0 ? C.warn : undefined} hint="call volume dropping" />
        <StatCard label="In onboarding" value={onboarding.length} accent={C.accent} />
      </StatRow>

      <SectionTitle>Going quiet — early churn signal</SectionTitle>
      <PageDek>Accounts whose call volume dropped sharply — the earliest warning, well before a payment fails.</PageDek>
      <DataTable
        empty="Everyone's still active."
        columns={[
          { key: "dealname", label: "Account" },
          { key: "callsPrev30d", label: "Calls prev 30d", num: true },
          { key: "callsLast30d", label: "Calls last 30d", num: true },
          { key: "dropPct", label: "Drop", num: true, render: (r) => <Pill tone={r.dropPct >= 60 ? "miss" : "warn"}>−{r.dropPct}%</Pill>, csv: (r) => r.dropPct },
          { key: "lastCallDaysAgo", label: "Last call", num: true, render: (r) => `${r.lastCallDaysAgo}d ago` },
        ]}
        rows={goingQuiet}
      />

      <Rule />
      <SectionTitle>At-risk accounts (payment)</SectionTitle>
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

      <Rule />
      <SectionTitle>Onboarding &amp; activation</SectionTitle>
      <Table
        empty="No accounts mid-onboarding."
        columns={[
          { key: "dealname", label: "Account" },
          { key: "step", label: "Current step" },
          { key: "daysInOnboarding", label: "Days in", num: true },
          { key: "activated", label: "Activated", render: (r) => <Pill tone={r.activated ? "ok" : "warn"}>{r.activated ? "Live" : "Pending"}</Pill> },
        ]}
        rows={onboarding}
      />
    </div>
  );
}
