import React from "react";
import { C } from "../tokens.js";
import { StatCard, Pill, Table, StatRow, PageTitle, Notice } from "../ui.jsx";

export default function EmailsPage({ data }) {
  const { received, sent } = data.emails;
  return (
    <div>
      <PageTitle>Emails</PageTitle>
      <Notice kind="warn">
        Both logs below only capture activity from when this page went live — there's no way to pull in emails from before that, so don't expect
        history here.
      </Notice>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: C.display, fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Received (hello@digi-bi.com)</h2>
        <StatRow>
          <StatCard label="Total logged" value={received.total} />
          <StatCard label="New today" value={received.newToday} accent={C.blueLight} />
        </StatRow>
        <Table
          empty="No incoming emails logged yet."
          columns={[
            { key: "received_at", label: "Received", render: (r) => (r.received_at ? new Date(r.received_at).toLocaleString("en-ZA") : "—") },
            { key: "from_address", label: "From" },
            { key: "subject", label: "Subject" },
            { key: "snippet", label: "Preview" },
          ]}
          rows={received.recent}
        />
      </div>

      <div>
        <h2 style={{ fontFamily: C.display, fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Sent (automated)</h2>
        <StatRow>
          <StatCard label="Total logged" value={sent.total} />
        </StatRow>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {sent.byType.length === 0 ? (
            <div style={{ fontSize: 13, color: C.textFaint }}>Nothing sent yet.</div>
          ) : (
            sent.byType.map((t) => (
              <Pill key={t.type} tone="neutral">
                {t.type}: {t.count}
              </Pill>
            ))
          )}
        </div>
        <Table
          empty="No automated emails logged yet."
          columns={[
            { key: "sent_at", label: "Sent", render: (r) => (r.sent_at ? new Date(r.sent_at).toLocaleString("en-ZA") : "—") },
            { key: "to_address", label: "To" },
            { key: "subject", label: "Subject" },
            { key: "email_type", label: "Type", render: (r) => <Pill tone="neutral">{r.email_type}</Pill> },
          ]}
          rows={sent.recent}
        />
      </div>
    </div>
  );
}
