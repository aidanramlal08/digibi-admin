import React, { useState, useEffect, useCallback } from "react";
import { C } from "./tokens.js";
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

// Shows the actual server error from /api/admin?action=overview and maps the
// HTTP status to a likely cause, so we don't need DevTools to diagnose.
function ErrorBanner({ detail, onRetry }) {
  const status = detail?.status;
  const serverMsg = detail?.message || "";
  let title = "Couldn't load the dashboard.";
  let hint = "";
  if (status === 503) {
    title = "Admin backend not configured.";
    hint =
      "The /api/admin endpoint needs ADMIN_JWT_SECRET, ADMIN_PROXY_SECRET, and N8N_ADMIN_WEBHOOK_URL set on this Vercel project. Add whichever is missing under Project → Settings → Environment Variables, then redeploy.";
  } else if (status === 502) {
    title = "n8n webhook not reachable.";
    hint =
      "Your Owner Dashboard workflow in n8n either isn't responding or returned an error. Check that N8N_ADMIN_WEBHOOK_URL points at the correct workflow, the workflow is Active, and it accepts POST { action: 'overview' } with header x-admin-proxy-secret matching ADMIN_PROXY_SECRET.";
  } else if (status === 401) {
    title = "Session expired.";
    hint = "Sign out and back in.";
  } else if (!status) {
    title = "Couldn't reach /api/admin.";
    hint = "Network error or the API function crashed. Check Vercel → Deployments → latest → Functions logs.";
  }
  return (
    <div style={{ border: `1px solid color-mix(in srgb, ${C.danger} 20%, transparent)`, background: C.dangerWash, borderRadius: 12, padding: 18, maxWidth: 640 }}>
      <div style={{ color: C.danger, fontSize: 15, fontWeight: 700, marginBottom: 6, fontFamily: C.display }}>{title}</div>
      {serverMsg ? (
        <div style={{ fontSize: 12.5, color: C.inkDim, marginBottom: hint ? 10 : 0 }}>
          <strong>Server said:</strong> {serverMsg}
          {status ? <> · HTTP {status}</> : null}
        </div>
      ) : status ? (
        <div style={{ fontSize: 12.5, color: C.inkDim, marginBottom: hint ? 10 : 0 }}>HTTP {status}</div>
      ) : null}
      {hint ? <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.5, marginBottom: 12 }}>{hint}</div> : null}
      <button
        onClick={onRetry}
        style={{
          fontFamily: C.body,
          fontSize: 13,
          fontWeight: 700,
          padding: "8px 14px",
          borderRadius: 8,
          border: `1px solid ${C.lineStrong}`,
          background: C.paper,
          color: C.ink,
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}

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
  const [errorDetail, setErrorDetail] = useState(null); // { status, message }

  const load = useCallback(async (silent) => {
    if (silent) setRefreshing(true);
    else setState("loading");
    const { ok, status, data: res } = await callAdmin("overview", {});
    if (ok && res.ok) {
      setData(withFallbacks(res.data));
      setErrorDetail(null);
      setState("ready");
    } else {
      setErrorDetail({ status, message: (res && res.error) || "" });
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
          <ErrorBanner detail={errorDetail} onRetry={() => load(false)} />
        ) : data ? (
          <PageComponent data={data} onRefresh={() => load(true)} go={go} />
        ) : null}
      </div>
    </div>
  );
}
