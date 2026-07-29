import React from "react";
import { C, zar } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, Notice, DataTable, Pill } from "../ui.jsx";

function marginTone(pct) {
  if (pct == null) return "neutral";
  if (pct < 0) return "miss";
  if (pct < 30) return "warn";
  return "ok";
}

export default function ProfitabilityPage({ data }) {
  const p = data.profitability;
  const hasData = p.clients && p.clients.length > 0;
  return (
    <div>
      <Eyebrow>Revenue</Eyebrow>
      <PageTitle>Profitability</PageTitle>
      <PageDek>Revenue minus cost-to-serve (voice minutes & telephony) for each active account — where the money actually is.</PageDek>
      {!hasData ? (
        <Notice kind="warn">Not connected yet — needs per-client serving cost from the Usage Reporting workflow wired into the Owner Dashboard API.</Notice>
      ) : null}
      <StatRow>
        <StatCard label="Gross margin" value={p.grossMarginPct != null ? p.grossMarginPct + "%" : "—"} accent={C.ok} />
        <StatCard label="Cost to serve (mo)" value={zar(p.totalServingCostZAR)} hint="voice minutes & telephony" />
        <StatCard label="Unprofitable accounts" value={p.unprofitableCount} accent={p.unprofitableCount > 0 ? C.danger : undefined} />
      </StatRow>
      <DataTable
        empty="No account margins yet."
        searchKeys={["client", "tier"]}
        exportName="profitability"
        columns={[
          { key: "client", label: "Account" },
          { key: "tier", label: "Tier" },
          { key: "revenueZAR", label: "Revenue/mo", num: true, render: (r) => zar(r.revenueZAR), csv: (r) => r.revenueZAR },
          { key: "serveCostZAR", label: "Cost to serve", num: true, render: (r) => zar(r.serveCostZAR), csv: (r) => r.serveCostZAR },
          { key: "marginZAR", label: "Margin", num: true, render: (r) => zar(r.marginZAR), csv: (r) => r.marginZAR },
          { key: "marginPct", label: "Margin %", num: true, render: (r) => <Pill tone={marginTone(r.marginPct)}>{r.marginPct}%</Pill>, csv: (r) => r.marginPct },
        ]}
        rows={p.clients}
      />
    </div>
  );
}
