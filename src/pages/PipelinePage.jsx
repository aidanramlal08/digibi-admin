import React from "react";
import { C } from "../tokens.js";
import { StatCard, Pill, Table, StatRow, PageTitle } from "../ui.jsx";
import { stageLabel } from "../lib.js";

export default function PipelinePage({ data }) {
  return (
    <div>
      <PageTitle>Pipeline & Leads</PageTitle>
      <StatRow>
        <StatCard label="Total deals" value={data.pipeline.totalDeals} />
        <StatCard label="New leads (7d)" value={data.pipeline.newLeads7d} accent={C.blueLight} />
        <StatCard label="New leads (30d)" value={data.pipeline.newLeads30d} />
      </StatRow>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {Object.entries(data.pipeline.byStage).map(([stage, count]) => (
          <Pill key={stage} tone="neutral">
            {stageLabel(stage)}: {count}
          </Pill>
        ))}
      </div>
      <Table
        empty="No deals yet."
        columns={[
          { key: "dealname", label: "Deal" },
          { key: "email", label: "Contact" },
          { key: "product", label: "Product" },
          { key: "tier", label: "Tier" },
          { key: "dealstage", label: "Stage", render: (r) => <Pill tone="neutral">{stageLabel(r.dealstage)}</Pill> },
          { key: "createdate", label: "Created", render: (r) => (r.createdate ? new Date(r.createdate).toLocaleDateString("en-ZA") : "—") },
        ]}
        rows={data.pipeline.recentDeals}
      />
    </div>
  );
}
