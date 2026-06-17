import { useEffect, useState } from "react";
import { api } from "../api";
import type { NewsletterSubscriber, NewsletterStats } from "../types";

export function Newsletter() {
  const [subs, setSubs] = useState<NewsletterSubscriber[]>([]);
  const [stats, setStats] = useState<NewsletterStats>();
  const [onlyActive, setOnlyActive] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load(active = onlyActive) {
    setError("");
    try {
      const [{ subscribers }, s] = await Promise.all([
        api.newsletter(active || undefined, 500),
        api.newsletterStats(),
      ]);
      setSubs(subscribers);
      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscribers");
    }
  }

  useEffect(() => {
    load(false);
  }, []);

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  // Export the currently loaded list as a CSV download (client-side, no server).
  function exportCsv() {
    const rows = [
      ["email", "source", "active", "created_at", "unsubscribed_at"],
      ...subs.map((s) => [
        s.email,
        s.source,
        String(s.active),
        s.createdAt,
        s.unsubscribedAt ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <h2>Newsletter</h2>
      <p className="sub">Subscribers mirrored from ruudjuffermans.nl signups.</p>

      {error && <div className="notice err">{error}</div>}

      <div className="cards">
        <div className="card">
          <div className="label">Active</div>
          <div className="value">{stats?.active ?? "—"}</div>
        </div>
        <div className="card">
          <div className="label">Unsubscribed</div>
          <div className="value">{stats?.unsubscribed ?? "—"}</div>
        </div>
        <div className="card">
          <div className="label">Total</div>
          <div className="value">{stats?.total ?? "—"}</div>
        </div>
      </div>

      <div className="toolbar">
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => {
              setOnlyActive(e.target.checked);
              load(e.target.checked);
            }}
            style={{ width: "auto" }}
          />
          Active only
        </label>
        <button onClick={exportCsv} disabled={subs.length === 0}>
          Export CSV
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Source</th>
            <th>Status</th>
            <th>Signed up</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((s) => {
            const disabled = busy === s.id;
            return (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td className="muted">{s.source}</td>
                <td>
                  <span className={`badge ${s.active ? "responded" : "archived"}`}>
                    {s.active ? "active" : "unsubscribed"}
                  </span>
                </td>
                <td className="muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="actions">
                    {s.active && (
                      <button
                        disabled={disabled}
                        onClick={() => act(s.id, () => api.newsletterUnsubscribe(s.id))}
                      >
                        Unsubscribe
                      </button>
                    )}
                    <button
                      className="danger"
                      disabled={disabled}
                      onClick={() => {
                        if (confirm(`Delete ${s.email}?`)) act(s.id, () => api.newsletterDelete(s.id));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {subs.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                No subscribers.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
