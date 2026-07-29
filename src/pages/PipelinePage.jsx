import React from "react";
import { C } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, PillRow, Pill, DataTable } from "../ui.jsx";
import { stageLabel } from "../lib.js";

export default function PipelinePage({ data }) {
  return (
    <div>
      <Eyebrow>Growth</Eyebrow>
      <PageTitle>Pipeline</PageTitle>
      <PageDek>Deals moving through HubSpot, newest first.</PageDek>
      <StatRow>
        <StatCard label="Total deals" value={data.pipeline.totalDeals} />
        <StatCard label="New leads (7d)" value={data.pipeline.newLeads7d} accent={C.accent} />
        <StatCard label="New leads (30d)" value={data.pipeline.newLeads30d} />
      </StatRow>
      <PillRow>
        {Object.entries(data.pipeline.byStage).map(([stage, count]) => (
          <Pill key={stage} tone="neutral">
            {stageLabel(stage)}: {count}
          </Pill>
        ))}
      </PillRow>
      <DataTable
        empty="No deals yet."
        searchKeys={["dealname", "email", "product", "tier"]}
        exportName="pipeline"
        columns={[
          { key: "dealname", label: "Deal" },
          { key: "email", label: "Contact" },
          { key: "product", label: "Product" },
          { key: "tier", label: "Tier" },
          { key: "dealstage", label: "Stage", render: (r) => <Pill tone="neutral">{stageLabel(r.dealstage)}</Pill>, csv: (r) => stageLabel(r.dealstage) },
          { key: "createdate", label: "Created", render: (r) => (r.createdate ? new Date(r.createdate).toLocaleDateString("en-ZA") : "—"), csv: (r) => r.createdate },
        ]}
        rows={data.pipeline.recentDeals}
      />
    </div>
  );
}
