import React, { useState, useEffect, useCallback } from "react";
import { C, zar } from "./tokens.js";
import { callAdmin } from "./api.js";
import { Spinner, Button, StatCard, Pill, Table, Notice } from "./ui.jsx";

const STAGE_LABELS = {
  "5698192615": "In Progress",
  "5698192620": "Closed Won",
};

function stageLabel(id) {
  return STAGE_LABELS[id] || id || "Unknown";
}

function Section({ title, children, right }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontFamily: C.display, fontSize: 18, fontWeight: 800, margin: 0 }}>{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function StatRow({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 18 }}>
      {children}
    </div>
  );
}

export default function Dashboard({ onSignedOut }) {
  const [state, setState] = useState("loading"); // loading | ready | error
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent) => {
    if (silent) setRefreshing(true);
    else setState("loading");
    const { ok, data: res } = await callAdmin("overview", {});
    if (ok && res.ok) {
      setData(res.data);
      setState("ready");
    } else {
      setState("error");
    }
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const signOut = async () => {
    await callAdmin("logout", {});
    onSignedOut();
  };

  if (state === "loading") return <Spinner label="Loading overview…" />;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", padding: "28px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: C.display, fontSize: 22, fontWeight: 800 }}>
            Digi<span style={{ color: C.blueLight }}>Bi</span> Owner Dashboard
          </div>
          {data ? (
            <div style={{ fontSize: 12, color: C.textFaint, marginTop: 4 }}>
              Updated {new Date(data.generatedAt).toLocaleString("en-ZA")}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="subtle" onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>

      {state === "error" ? <Notice kind="error">Couldn't load the dashboard. Try refreshing.</Notice> : null}

      {data ? (
        <>
          <Section title="Payments">
            <StatRow>
              <StatCard label="Revenue (all time)" value={zar(data.payments.totalRevenueZAR)} accent={C.ok} />
              <StatCard label="Revenue (30d)" value={zar(data.payments.revenue30dZAR)} />
              <StatCard label="Successful charges" value={data.payments.successCount} />
              <StatCard label="Failed / abandoned" value={data.payments.failedCount} accent={data.payments.failedCount > 0 ? C.warn : undefined} />
            </StatRow>
            <Table
              empty="No transactions yet."
              columns={[
                { key: "paidAt", label: "Date", render: (r) => (r.paidAt ? new Date(r.paidAt).toLocaleString("en-ZA") : "—") },
                { key: "email", label: "Customer" },
                { key: "amountZAR", label: "Amount", render: (r) => zar(r.amountZAR) },
                {
                  key: "status",
                  label: "Status",
                  render: (r) => <Pill tone={r.status === "success" ? "ok" : r.status === "failed" ? "miss" : "warn"}>{r.status}</Pill>,
                },
                { key: "chargeType", label: "Type" },
              ]}
              rows={data.payments.recentTransactions}
            />
          </Section>

          <Section title="Pipeline & Leads">
            <StatRow>
              <StatCard label="Total deals" value={data.pipeline.totalDeals} />
              <StatCard label="New leads (7d)" value={data.pipeline.newLeads7d} accent={C.blueLight} />
              <StatCard label="New leads (30d)" value={data.pipeline.newLeads30d} />
            </StatRow>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {Object.entries(data.pipeline.byStage).map(([stage, count]) => (
                <Pill key={stage} tone="neutral">
                  {stageLabel(stage)}: {count}
                </Pill>
              ))}
            </div>
            <Table
              empty="No deals yet."
              columns={[
                { key: "dealname", label: "Deal" },
                { key: "email", label: "Contact" },
                { key: "product", label: "Product" },
                { key: "tier", label: "Tier" },
                { key: "dealstage", label: "Stage", render: (r) => <Pill tone="neutral">{stageLabel(r.dealstage)}</Pill> },
                { key: "createdate", label: "Created", render: (r) => (r.createdate ? new Date(r.createdate).toLocaleDateString("en-ZA") : "—") },
              ]}
              rows={data.pipeline.recentDeals}
            />
          </Section>

          <Section title="Call Activity">
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
          </Section>
        </>
      ) : null}
    </div>
  );
}
