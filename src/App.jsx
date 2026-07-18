import React, { useState, useEffect, useCallback } from "react";
import { Shell, Spinner } from "./ui.jsx";
import { callAdmin } from "./api.js";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";

export default function App() {
  const [status, setStatus] = useState("loading"); // loading | in | out

  const probe = useCallback(async () => {
    const { ok, data } = await callAdmin("overview", {});
    setStatus(ok && data.ok ? "in" : "out");
  }, []);

  useEffect(() => {
    probe();
  }, [probe]);

  let view;
  if (status === "loading") view = <Spinner />;
  else if (status === "in") view = <Dashboard onSignedOut={() => setStatus("out")} />;
  else view = <Login onAuthed={() => setStatus("in")} />;

  return <Shell>{view}</Shell>;
}
