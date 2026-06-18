import { useState } from "react";
import { api } from "../api";

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.login(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <h1>Central Admin</h1>
        <p>Enter the admin password to continue.</p>
        {error && <div className="notice err">{error}</div>}
        <form onSubmit={submit}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="primary" type="submit" disabled={busy || !password}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
