import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "./ui.jsx";
import { callAdmin } from "./api.js";
import Sidebar, { PAGES } from "./Sidebar.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import AssistantPage from "./pages/AssistantPage.jsx";
import AgentConsolePage from "./pages/AgentConsolePage.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";
import ForecastPage from "./pages/ForecastPage.jsx";
import ProfitabilityPage from "./pages/ProfitabilityPage.jsx";
import PipelinePage from "./pages/PipelinePage.jsx";
import CallsPage from "./pages/CallsPage.jsx";
import AccountsPage from "./pages/AccountsPage.jsx";
import ChurnPage from "./pages/ChurnPage.jsx";
import LeadsPage from "./pages/LeadsPage.jsx";
import CostsPage from "./pages/CostsPage.jsx";
import EmailsPage from "./pages/EmailsPage.jsx";
import TasksPage from "./pages/TasksPage.jsx";
import SystemHealthPage from "./pages/SystemHealthPage.jsx";

const PAGE_COMPONENTS = {
  "/overview": OverviewPage,
  "/assistant": AssistantPage,
  "/agents": AgentConsolePage,
  "/payments": PaymentsPage,
  "/forecast": ForecastPage,
  "/profitability": ProfitabilityPage,
  "/pipeline": PipelinePage,
  "/calls": CallsPage,
  "/accounts": AccountsPage,
  "/churn": ChurnPage,
  "/leads": LeadsPage,
  "/costs": CostsPage,
  "/emails": EmailsPage,
  "/tasks": TasksPage,
  "/system": SystemHealthPage,
};

// Sections the n8n Owner Dashboard API doesn't return yet — default them so
// the console still renders instead of crashing on a missing field.
function withFallbacks(data) {
  return {
    ...data,
    forecast: data.forecast || { pipelineValueZAR: 0, weightedForecastZAR: 0, byStage: [], monthlyForecastTrend: [] },
    churn: data.churn || { churned30d: 0, churnRateMonthly: 0, mrrLostZAR: 0, recent: [] },
    tasks: data.tasks || { openCount: 0, overdueCount: 0, recent: [] },
    profitability: data.profitability || { grossMarginPct: null, totalServingCostZAR: 0, unprofitableCount: 0, clients: [] },
    financials: data.financials || { netThisMonthZAR: null, cashOnHandZAR: null, monthlyBurnZAR: null, runwayMonths: null, netTrend: [] },
    marketing: data.marketing || { adSpend30dZAR: 0, blendedCacZAR: null, costPerLeadZAR: null, paybackMonths: null, newCustomers30d: 0 },
    systemHealth: data.systemHealth || { failedRuns24h: 0, provisioningFailures: 0, missingRates: 0, issues: [] },
    accounts: {
      ...data.accounts,
      goingQuiet: (data.accounts && data.accounts.goingQuiet) || [],
      onboarding: (data.accounts && data.accounts.onboarding) || [],
    },
    calls: {
      ...data.calls,
      avgQaScore: data.calls && data.calls.avgQaScore != null ? data.calls.avgQaScore : null,
      qaScored: (data.calls && data.calls.qaScored) || 0,
      poorCalls: (data.calls && data.calls.poorCalls) || 0,
      qaDistribution: (data.calls && data.calls.qaDistribution) || [],
      flaggedCalls: (data.calls && data.calls.flaggedCalls) || [],
    },
  };
}

// BASE is the deploy path prefix (e.g. "/admin"), set via vite.config.js's
// `base` option and reflected in import.meta.env.BASE_URL at build time.
// Route state below is always the app-relative path (no prefix); BASE is
// added only when touching the real browser URL.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(pathname) {
  if (BASE && pathname.startsWith(BASE)) return pathname.slice(BASE.length) || "/";
  return pathname || "/";
}

function useRoute() {
  const [path, setPath] = useState(() => stripBase(window.location.pathname));
  useEffect(() => {
    const onPop = () => setPath(stripBase(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const go = useCallback((to) => {
    const full = BASE + to;
    if (full !== window.location.pathname) window.history.pushState({}, "", full);
    setPath(to);
  }, []);
  return { path, go };
}

export default function Console({ onSignedOut }) {
  const { path, go } = useRoute();
  const [state, setState] = useState("loading"); // loading | ready | error
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent) => {
    if (silent) setRefreshing(true);
    else setState("loading");
    const { ok, data: res } = await callAdmin("overview", {});
    if (ok && res.ok) {
      setData(withFallbacks(res.data));
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

  const activePath = PAGE_COMPONENTS[path] ? path : PAGES[0].path;
  const PageComponent = PAGE_COMPONENTS[activePath];

  return (
    <div className="app-frame" style={{ flex: 1, display: "flex", minHeight: "100vh" }}>
      <Sidebar path={activePath} go={go} refreshing={refreshing} onRefresh={() => load(true)} onSignOut={signOut} data={data} />
      <div className="app-main" style={{ flex: 1, padding: "32px 40px 80px", maxWidth: 1080 }}>
        {state === "error" ? (
          <div style={{ color: "#C43D3D", fontSize: 14 }}>Couldn't load the dashboard. Try refreshing.</div>
        ) : data ? (
          <PageComponent data={data} onRefresh={() => load(true)} go={go} />
        ) : null}
      </div>
    </div>
  );
}
