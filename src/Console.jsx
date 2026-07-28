import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "./ui.jsx";
import { callAdmin } from "./api.js";
import Sidebar, { PAGES } from "./Sidebar.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";
import ForecastPage from "./pages/ForecastPage.jsx";
import PipelinePage from "./pages/PipelinePage.jsx";
import CallsPage from "./pages/CallsPage.jsx";
import AccountsPage from "./pages/AccountsPage.jsx";
import ChurnPage from "./pages/ChurnPage.jsx";
import LeadsPage from "./pages/LeadsPage.jsx";
import CostsPage from "./pages/CostsPage.jsx";
import EmailsPage from "./pages/EmailsPage.jsx";
import TasksPage from "./pages/TasksPage.jsx";

const PAGE_COMPONENTS = {
  "/overview": OverviewPage,
  "/payments": PaymentsPage,
  "/forecast": ForecastPage,
  "/pipeline": PipelinePage,
  "/calls": CallsPage,
  "/accounts": AccountsPage,
  "/churn": ChurnPage,
  "/leads": LeadsPage,
  "/costs": CostsPage,
  "/emails": EmailsPage,
  "/tasks": TasksPage,
};

// Sections the n8n Owner Dashboard API doesn't return yet — default them so
// the console still renders instead of crashing on a missing field.
function withFallbacks(data) {
  return {
    ...data,
    forecast: data.forecast || { pipelineValueZAR: 0, weightedForecastZAR: 0, byStage: [], monthlyForecastTrend: [] },
    churn: data.churn || { churned30d: 0, churnRateMonthly: 0, mrrLostZAR: 0, recent: [] },
    tasks: data.tasks || { openCount: 0, overdueCount: 0, recent: [] },
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
