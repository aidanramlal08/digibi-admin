import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "./ui.jsx";
import { callAdmin } from "./api.js";
import Sidebar, { PAGES } from "./Sidebar.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";
import PipelinePage from "./pages/PipelinePage.jsx";
import CallsPage from "./pages/CallsPage.jsx";
import HealthPage from "./pages/HealthPage.jsx";
import LeadsPage from "./pages/LeadsPage.jsx";
import CostsPage from "./pages/CostsPage.jsx";
import EmailsPage from "./pages/EmailsPage.jsx";

const PAGE_COMPONENTS = {
  "/payments": PaymentsPage,
  "/pipeline": PipelinePage,
  "/calls": CallsPage,
  "/health": HealthPage,
  "/leads": LeadsPage,
  "/costs": CostsPage,
  "/emails": EmailsPage,
};

function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname || "/");
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const go = useCallback((to) => {
    if (to !== window.location.pathname) window.history.pushState({}, "", to);
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

  const activePath = PAGE_COMPONENTS[path] ? path : PAGES[0].path;
  const PageComponent = PAGE_COMPONENTS[activePath];

  return (
    <div style={{ flex: 1, display: "flex", minHeight: "100vh" }}>
      <Sidebar path={activePath} go={go} refreshing={refreshing} onRefresh={() => load(true)} onSignOut={signOut} />
      <div style={{ flex: 1, padding: "28px 32px 60px", maxWidth: 980 }}>
        {state === "error" ? (
          <div style={{ color: "#FF6B6B", fontSize: 14 }}>Couldn't load the dashboard. Try refreshing.</div>
        ) : data ? (
          <PageComponent data={data} onRefresh={() => load(true)} />
        ) : null}
      </div>
    </div>
  );
}
