import React from "react";
import { C } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, PillRow, Pill } from "../ui.jsx";

export default function LeadsPage({ data }) {
  const sources = data.leadSources.sources;
  return (
    <div>
      <Eyebrow>Growth</Eyebrow>
      <PageTitle>Lead Sources</PageTitle>
      <PageDek>Where new contacts are coming from.</PageDek>
      <StatRow>
        <StatCard label="Total contacts" value={data.leadSources.totalContacts} />
        <StatCard label="New (7d)" value={data.leadSources.new7d} accent={C.accent} />
        <StatCard label="New (30d)" value={data.leadSources.new30d} />
      </StatRow>
      <PillRow>
        {sources.length === 0 ? (
          <div style={{ fontSize: 13, color: C.inkFaint }}>No contacts yet.</div>
        ) : (
          sources.map((s) => (
            <Pill key={s.source} tone="neutral">
              {s.source}: {s.count}
            </Pill>
          ))
        )}
      </PillRow>
    </div>
  );
}
