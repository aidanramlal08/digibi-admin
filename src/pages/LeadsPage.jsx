import React from "react";
import { C, zar } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, SectionTitle, Table } from "../ui.jsx";

export default function LeadsPage({ data }) {
  const m = data.marketing;
  const sources = data.leadSources.sources;
  return (
    <div>
      <Eyebrow>Growth</Eyebrow>
      <PageTitle>Lead Sources</PageTitle>
      <PageDek>Where new contacts come from, and what they cost to acquire.</PageDek>
      <StatRow>
        <StatCard label="Total contacts" value={data.leadSources.totalContacts} />
        <StatCard label="New (30d)" value={data.leadSources.new30d} accent={C.accent} />
        <StatCard label="Ad spend (30d)" value={zar(m.adSpend30dZAR)} />
        <StatCard label="Blended CAC" value={m.blendedCacZAR != null ? zar(m.blendedCacZAR) : "—"} hint={`${m.newCustomers30d} new customers`} />
        <StatCard label="Cost / lead" value={m.costPerLeadZAR != null ? zar(m.costPerLeadZAR) : "—"} hint="paid sources" />
        <StatCard label="Payback" value={m.paybackMonths != null ? m.paybackMonths + " mo" : "—"} accent={m.paybackMonths != null && m.paybackMonths <= 3 ? C.ok : undefined} />
      </StatRow>
      <SectionTitle>By source</SectionTitle>
      <Table
        empty="No contacts yet."
        columns={[
          { key: "source", label: "Source" },
          { key: "count", label: "Leads", num: true },
          { key: "spendZAR", label: "Spend (30d)", num: true, render: (r) => (r.spendZAR ? zar(r.spendZAR) : "—") },
          { key: "costPerLeadZAR", label: "Cost / lead", num: true, render: (r) => (r.costPerLeadZAR ? zar(r.costPerLeadZAR) : "—") },
          { key: "deals", label: "Deals won", num: true },
        ]}
        rows={sources}
      />
    </div>
  );
}
