import React from "react";
import { C } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, DataTable, Pill } from "../ui.jsx";

export default function SystemHealthPage({ data }) {
  const h = data.systemHealth;
  return (
    <div>
      <Eyebrow>Operations</Eyebrow>
      <PageTitle>System Health</PageTitle>
      <PageDek>Silent failures that cost money — failed provisioning, workflow errors, and missing billing rates.</PageDek>
      <StatRow>
        <StatCard label="Failed runs (24h)" value={h.failedRuns24h} accent={h.failedRuns24h > 0 ? C.warn : undefined} />
        <StatCard label="Provisioning failures" value={h.provisioningFailures} accent={h.provisioningFailures > 0 ? C.danger : undefined} />
        <StatCard label="Missing billing rates" value={h.missingRates} accent={h.missingRates > 0 ? C.danger : undefined} />
      </StatRow>
      <DataTable
        empty="Everything's running clean."
        searchKeys={["workflow", "kind", "detail"]}
        exportName="system-health"
        columns={[
          { key: "ts", label: "When", render: (r) => (r.ts ? new Date(r.ts).toLocaleString("en-ZA") : "—"), csv: (r) => r.ts },
          { key: "workflow", label: "Workflow" },
          { key: "kind", label: "Issue" },
          { key: "detail", label: "Detail" },
          { key: "severity", label: "Severity", render: (r) => <Pill tone={r.severity === "high" ? "miss" : r.severity === "med" ? "warn" : "neutral"}>{r.severity}</Pill>, csv: (r) => r.severity },
        ]}
        rows={h.issues}
      />
    </div>
  );
}
