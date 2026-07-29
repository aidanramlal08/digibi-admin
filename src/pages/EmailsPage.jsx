import React from "react";
import { C } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, Rule, SectionTitle, PillRow, Pill, DataTable, Notice } from "../ui.jsx";

export default function EmailsPage({ data }) {
  const { received, sent } = data.emails;
  return (
    <div>
      <Eyebrow>Retention</Eyebrow>
      <PageTitle>Emails</PageTitle>
      <Notice kind="warn">
        Both logs below only capture activity from when this page went live — there's no history from before that.
      </Notice>

      <SectionTitle>Received (hello@digi-bi.com)</SectionTitle>
      <StatRow>
        <StatCard label="Total logged" value={received.total} />
        <StatCard label="New today" value={received.newToday} accent={C.accent} />
      </StatRow>
      <DataTable
        empty="No incoming emails logged yet."
        searchKeys={["from_address", "subject"]}
        exportName="emails-received"
        columns={[
          { key: "received_at", label: "Received", render: (r) => (r.received_at ? new Date(r.received_at).toLocaleString("en-ZA") : "—"), csv: (r) => r.received_at },
          { key: "from_address", label: "From" },
          { key: "subject", label: "Subject" },
          { key: "snippet", label: "Preview" },
        ]}
        rows={received.recent}
      />

      <Rule />

      <SectionTitle>Sent (automated)</SectionTitle>
      <StatRow>
        <StatCard label="Total logged" value={sent.total} />
      </StatRow>
      <PillRow>
        {sent.byType.length === 0 ? (
          <div style={{ fontSize: 13, color: C.inkFaint }}>Nothing sent yet.</div>
        ) : (
          sent.byType.map((t) => (
            <Pill key={t.type} tone="neutral">
              {t.type}: {t.count}
            </Pill>
          ))
        )}
      </PillRow>
      <DataTable
        empty="No automated emails logged yet."
        searchKeys={["to_address", "subject", "email_type"]}
        exportName="emails-sent"
        columns={[
          { key: "sent_at", label: "Sent", render: (r) => (r.sent_at ? new Date(r.sent_at).toLocaleString("en-ZA") : "—"), csv: (r) => r.sent_at },
          { key: "to_address", label: "To" },
          { key: "subject", label: "Subject" },
          { key: "email_type", label: "Type", render: (r) => <Pill tone="neutral">{r.email_type}</Pill>, csv: (r) => r.email_type },
        ]}
        rows={sent.recent}
      />
    </div>
  );
}
