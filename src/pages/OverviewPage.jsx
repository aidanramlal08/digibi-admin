import React, { useState, useMemo } from "react";
import { C, zar } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, Rule, SectionTitle, Grid2, Toolbar, RangeControl, TrendLine, AttentionList } from "../ui.jsx";

function withinDays(iso, n) {
  const cutoff = Date.now() - n * 24 * 3600 * 1000;
  return new Date(iso).getTime() >= cutoff;
}

export default function OverviewPage({ data, go }) {
  const [range, setRange] = useState(30);

  const attn = useMemo(() => {
    const items = [];
    for (const a of data.accounts.atRisk) {
      items.push({ tone: "high", title: `${a.dealname} — payment ${a.daysOverdue}d overdue`, meta: a.dunningCallMade ? "Dunning call made" : "No dunning call yet" });
    }
    for (const t of data.tasks.recent.filter((t) => t.status === "overdue")) {
      items.push({ tone: "high", title: t.title, meta: `Overdue — was due ${t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-ZA") : "—"} · ${t.relatedTo}` });
    }
    for (const u of data.accounts.usage.filter((u) => u.status === "over")) {
      items.push({ tone: "med", title: `${u.dealname} is over its usage limit`, meta: `${u.pct}% of included ${u.product}` });
    }
    for (const p of data.payments.recentTransactions.filter((t) => t.status === "failed").slice(0, 2)) {
      items.push({ tone: "med", title: `Payment failed — ${p.email}`, meta: `${zar(p.amountZAR)} · ${p.paidAt ? new Date(p.paidAt).toLocaleString("en-ZA") : "—"}` });
    }
    return items;
  }, [data]);

  const trendPoints = (data.payments.revenueTrend || [])
    .filter((p) => withinDays(p.date, range))
    .map((p) => ({ label: new Date(p.date).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }), value: p.amountZAR }));

  return (
    <div>
      <Eyebrow>{new Date().toLocaleDateString("en-ZA", { weekday: "long", month: "long", day: "numeric" })}</Eyebrow>
      <PageTitle>Good morning.</PageTitle>
      <PageDek>
        MRR is {zar(data.accounts.mrrZAR)}, up against {zar(data.payments.revenue30dZAR)} collected this month. {attn.length} item{attn.length === 1 ? "" : "s"} need
        attention below.
      </PageDek>
      <StatRow>
        <StatCard label="MRR" value={zar(data.accounts.mrrZAR)} accent={C.ok} />
        <StatCard label="Weighted forecast" value={zar(data.forecast.weightedForecastZAR)} hint="next 90 days" />
        <StatCard label="Open pipeline" value={zar(data.forecast.pipelineValueZAR)} hint={`${data.pipeline.totalDeals} deals`} />
        <StatCard
          label="Churned MRR (30d)"
          value={zar(data.churn.mrrLostZAR)}
          hint={`${data.churn.churned30d} account${data.churn.churned30d === 1 ? "" : "s"}`}
          accent={data.churn.churned30d > 0 ? C.danger : undefined}
        />
      </StatRow>
      <Grid2>
        <div>
          <Toolbar left={<SectionTitle style={{ margin: 0 }}>Revenue, trailing {range} days</SectionTitle>} right={<RangeControl value={range} onChange={setRange} />} />
          <TrendLine points={trendPoints} formatValue={zar} />
        </div>
        <div>
          <SectionTitle>Needs attention</SectionTitle>
          <AttentionList items={attn.slice(0, 6)} />
        </div>
      </Grid2>
      <Rule />
      <SectionTitle>This week, by group</SectionTitle>
      <StatRow>
        <StatCard label="New leads" value={data.pipeline.newLeads7d} hint="past 7 days" accent={C.accent} />
        <StatCard label="Calls booked" value={data.calls.booked} hint={`${data.calls.bookingRate}% booking rate`} />
        <StatCard label="Open tasks" value={data.tasks.openCount} hint={`${data.tasks.overdueCount} overdue`} accent={data.tasks.overdueCount > 0 ? C.danger : undefined} />
        <StatCard label="Emails sent" value={data.emails.sent.total} hint="automated" />
      </StatRow>
    </div>
  );
}
