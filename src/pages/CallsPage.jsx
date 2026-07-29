import React from "react";
import { C } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, Rule, SectionTitle, DataTable, DistributionBars, Pill } from "../ui.jsx";

function qaScoreColor(score) {
  if (score <= 2) return C.danger;
  if (score === 3) return C.warn;
  return C.ok;
}

export default function CallsPage({ data }) {
  const dist = (data.calls.qaDistribution || []).map((d) => ({ label: `${d.score} ★`, count: d.count, score: d.score }));
  return (
    <div>
      <Eyebrow>Growth</Eyebrow>
      <PageTitle>Call Activity</PageTitle>
      <PageDek>Volume and quality of every call the AI voice agent handles.</PageDek>
      <StatRow>
        <StatCard label="Total calls" value={data.calls.totalCalls} />
        <StatCard label="Connected" value={data.calls.connected} />
        <StatCard label="Bookings" value={data.calls.booked} accent={C.ok} />
        <StatCard label="Booking rate" value={data.calls.bookingRate + "%"} />
        <StatCard label="Avg QA score" value={data.calls.avgQaScore != null ? data.calls.avgQaScore + " / 5" : "—"} accent={data.calls.avgQaScore != null && data.calls.avgQaScore < 3 ? C.danger : C.accent} />
        <StatCard label="Poor calls (≤2)" value={data.calls.poorCalls} accent={data.calls.poorCalls > 0 ? C.danger : undefined} hint="flagged by QA scorer" />
      </StatRow>

      {dist.length > 0 ? (
        <>
          <SectionTitle>QA score distribution</SectionTitle>
          <DistributionBars items={dist} colorFor={(it) => qaScoreColor(it.score)} />
        </>
      ) : null}

      {data.calls.flaggedCalls && data.calls.flaggedCalls.length > 0 ? (
        <>
          <SectionTitle>Flagged calls (score ≤ 2)</SectionTitle>
          <DataTable
            empty="No poor-scoring calls."
            exportName="flagged-calls"
            columns={[
              { key: "ts", label: "Time", render: (r) => (r.ts ? new Date(r.ts).toLocaleString("en-ZA") : "—"), csv: (r) => r.ts },
              { key: "client_key", label: "Client" },
              { key: "score", label: "Score", num: true, render: (r) => <Pill tone="miss">{r.score} / 5</Pill>, csv: (r) => r.score },
              { key: "reason", label: "Why flagged" },
            ]}
            rows={data.calls.flaggedCalls}
          />
          <Rule />
        </>
      ) : null}

      <SectionTitle>Recent calls</SectionTitle>
      <DataTable
        empty="No calls yet."
        searchKeys={["client_key", "call_type"]}
        exportName="calls"
        columns={[
          { key: "ts", label: "Time", render: (r) => (r.ts ? new Date(r.ts).toLocaleString("en-ZA") : "—"), csv: (r) => r.ts },
          { key: "client_key", label: "Client" },
          { key: "call_type", label: "Type" },
          { key: "duration_min", label: "Minutes", num: true },
          { key: "connected", label: "Connected", render: (r) => <Pill tone={r.connected ? "ok" : "miss"}>{r.connected ? "Yes" : "No"}</Pill>, csv: (r) => r.connected },
          { key: "booked", label: "Booked", render: (r) => <Pill tone={r.booked ? "ok" : "neutral"}>{r.booked ? "Yes" : "No"}</Pill>, csv: (r) => r.booked },
        ]}
        rows={data.calls.recentCalls}
      />
    </div>
  );
}
