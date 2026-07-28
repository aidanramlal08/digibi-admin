import React from "react";
import { C } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, DataTable, Pill } from "../ui.jsx";

export default function TasksPage({ data }) {
  return (
    <div>
      <Eyebrow>Team</Eyebrow>
      <PageTitle>Tasks</PageTitle>
      <PageDek>Follow-ups owed across leads, at-risk accounts and dunning.</PageDek>
      <StatRow>
        <StatCard label="Open" value={data.tasks.openCount} />
        <StatCard label="Overdue" value={data.tasks.overdueCount} accent={data.tasks.overdueCount > 0 ? C.danger : undefined} />
      </StatRow>
      <DataTable
        empty="No open tasks."
        searchKeys={["title", "relatedTo"]}
        exportName="tasks"
        columns={[
          { key: "title", label: "Task" },
          { key: "relatedTo", label: "Related to" },
          { key: "dueDate", label: "Due", render: (r) => (r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-ZA") : "—"), csv: (r) => r.dueDate },
          { key: "priority", label: "Priority", render: (r) => <Pill tone={r.priority === "High" ? "miss" : r.priority === "Medium" ? "warn" : "neutral"}>{r.priority}</Pill>, csv: (r) => r.priority },
          { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "overdue" ? "miss" : r.status === "done" ? "ok" : "neutral"}>{r.status}</Pill>, csv: (r) => r.status },
        ]}
        rows={data.tasks.recent}
      />
    </div>
  );
}
