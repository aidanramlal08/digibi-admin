import React, { useState } from "react";
import { C } from "./tokens.js";
import { callAdmin } from "./api.js";
import { CenteredCard, Field, Button, Notice } from "./ui.jsx";

export default function Login({ onAuthed }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { ok, data } = await callAdmin("login", { password });
    setBusy(false);
    if (ok && data.ok) onAuthed();
    else setError(data.error || "Incorrect password.");
  };

  return (
    <CenteredCard>
      <h1 style={{ fontFamily: C.display, fontSize: 22, marginBottom: 6 }}>Sign in</h1>
      <p style={{ fontSize: 13.5, color: C.textDim, marginBottom: 22 }}>Internal use only.</p>
      <Notice kind="error">{error}</Notice>
      <form onSubmit={submit}>
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" placeholder="••••••••" />
        <Button type="submit" disabled={busy || !password} style={{ width: "100%", padding: "12px 16px", fontSize: 15 }}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </CenteredCard>
  );
}
