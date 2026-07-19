import React from "react";
import { C } from "../tokens.js";
import { StatCard, Pill, StatRow, PageTitle } from "../ui.jsx";

export default function LeadsPage({ data }) {
  return (
    <div>
      <PageTitle>Lead Sources</PageTitle>
      <StatRow>
        <StatCard label="Total contacts" value={data.leadSources.totalContacts} />
        <StatCard label="New (7d)" value={data.leadSources.new7d} accent={C.blueLight} />
        <StatCard label="New (30d)" value={data.leadSources.new30d} />
      </StatRow>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {data.leadSources.sources.length === 0 ? (
          <div style={{ fontSize: 13, color: C.textFaint }}>No contacts yet.</div>
        ) : (
          data.leadSources.sources.map((s) => (
            <Pill key={s.source} tone="neutral">
              {s.source}: {s.count}
            </Pill>
          ))
        )}
      </div>
    </div>
  );
}
