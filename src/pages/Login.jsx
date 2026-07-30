import React, { useState } from "react";
import { api } from "../api.js";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", bg: "#F5F7FA", border: "#E4E7EC", danger: "#DC2626" };

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token, user } = await api.login(username, password);
      onLogin(token, user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.ink }}>
      <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div style={{ background: `linear-gradient(135deg, ${C.cyan}, #FFC93C)` }} className="w-9 h-9 rounded-lg" />
          <span style={{ color: C.ink }} className="text-xl font-bold">Wosha</span>
        </div>
        {error && <div style={{ background: "#FEE2E2", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-4">{error}</div>}
        <label className="text-xs font-semibold mb-1 block" style={{ color: "#667085" }}>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
        <label className="text-xs font-semibold mb-1 block" style={{ color: "#667085" }}>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
        <button disabled={busy} style={{ background: C.cyan }} className="w-full text-white rounded-lg py-2.5 text-sm font-semibold">{busy ? "Logging in…" : "Log In"}</button>
        <div style={{ color: "#667085" }} className="text-xs mt-4 text-center">First time? Run the migration script — it seeds <b>owner</b> / <b>owner123</b>.</div>
      </form>
    </div>
  );
}
