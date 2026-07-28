import React from "react";
import { C, zar } from "../tokens.js";
import { StatCard, StatRow, Eyebrow, PageTitle, PageDek, Rule, SectionTitle, DataTable, Pill, TrendLine } from "../ui.jsx";

export default function ForecastPage({ data }) {
  const avgDeal = data.pipeline.totalDeals ? Math.round(data.forecast.pipelineValueZAR / data.pipeline.totalDeals) : 0;
  return (
    <div>
      <Eyebrow>Revenue</Eyebrow>
      <PageTitle>Forecast</PageTitle>
      <PageDek>Open pipeline value and a weighted forecast based on stage.</PageDek>
      <StatRow>
        <StatCard label="Open pipeline value" value={zar(data.forecast.pipelineValueZAR)} />
        <StatCard label="Weighted forecast" value={zar(data.forecast.weightedForecastZAR)} hint="sum of value × stage probability" accent={C.accent} />
        <StatCard label="Avg. deal size" value={zar(avgDeal)} />
      </StatRow>
      <SectionTitle>By stage</SectionTitle>
      <DataTable
        empty="No open pipeline."
        columns={[
          { key: "stage", label: "Stage", render: (r) => <Pill tone="neutral">{r.stage}</Pill> },
          { key: "count", label: "Deals", num: true },
          { key: "valueZAR", label: "Value", num: true, render: (r) => zar(r.valueZAR), csv: (r) => r.valueZAR },
          { key: "probability", label: "Probability", num: true, render: (r) => r.probability + "%" },
          { key: "weightedZAR", label: "Weighted", num: true, render: (r) => zar(r.weightedZAR), csv: (r) => r.weightedZAR },
        ]}
        rows={data.forecast.byStage}
      />
      <Rule />
      <SectionTitle>Forecast, next 3 months</SectionTitle>
      <TrendLine points={(data.forecast.monthlyForecastTrend || []).map((m) => ({ label: m.month, value: m.valueZAR }))} formatValue={zar} />
    </div>
  );
}
