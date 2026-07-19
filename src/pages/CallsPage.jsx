import React from "react";
import { C } from "../tokens.js";
import { StatCard, Pill, Table, StatRow, PageTitle } from "../ui.jsx";

export default function CallsPage({ data }) {
  return (
    <div>
      <PageTitle>Call Activity</PageTitle>
      <StatRow>
        <StatCard label="Total calls" value={data.calls.totalCalls} />
        <StatCard label="Total minutes" value={data.calls.totalMinutes} />
        <StatCard label="Connected" value={data.calls.connected} />
        <StatCard label="Bookings" value={data.calls.booked} accent={C.ok} />
        <StatCard label="Booking rate" value={data.calls.bookingRate + "%"} />
      </StatRow>
      <Table
        empty="No calls yet."
        columns={[
          { key: "ts", label: "Time", render: (r) => (r.ts ? new Date(r.ts).toLocaleString("en-ZA") : "—") },
          { key: "client_key", label: "Client" },
          { key: "call_type", label: "Type" },
          { key: "duration_min", label: "Minutes" },
          { key: "connected", label: "Connected", render: (r) => <Pill tone={r.connected ? "ok" : "miss"}>{r.connected ? "Yes" : "No"}</Pill> },
          { key: "booked", label: "Booked", render: (r) => <Pill tone={r.booked ? "ok" : "neutral"}>{r.booked ? "Yes" : "No"}</Pill> },
        ]}
        rows={data.calls.recentCalls}
      />
    </div>
  );
}
