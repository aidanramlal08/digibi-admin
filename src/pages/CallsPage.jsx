import React from "react";
import { C } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, DataTable, Pill } from "../ui.jsx";

export default function CallsPage({ data }) {
  return (
    <div>
      <Eyebrow>Growth</Eyebrow>
      <PageTitle>Call Activity</PageTitle>
      <PageDek>Inbound and outbound calls logged by the voice agent.</PageDek>
      <StatRow>
        <StatCard label="Total calls" value={data.calls.totalCalls} />
        <StatCard label="Total minutes" value={data.calls.totalMinutes} />
        <StatCard label="Connected" value={data.calls.connected} />
        <StatCard label="Bookings" value={data.calls.booked} accent={C.ok} />
        <StatCard label="Booking rate" value={data.calls.bookingRate + "%"} />
      </StatRow>
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
