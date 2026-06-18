import { useEffect, useState } from "react";
import { api } from "../api";
import type { ContactSubmission, ContactStatus } from "../types";

const STATUSES: ContactStatus[] = ["new", "responded", "archived"];

export function Contact() {
  const [items, setItems] = useState<ContactSubmission[]>([]);
  const [filter, setFilter] = useState<ContactStatus | "">("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load(status = filter) {
    setError("");
    try {
      const { submissions } = await api.contact(status || undefined);
      setItems(submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    }
  }

  useEffect(() => {
    load("");
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

  return (
    <>
      <h2>Contact submissions</h2>
      <p className="sub">Messages from the ruudjuffermans.nl contact form.</p>

      {error && <div className="notice err">{error}</div>}

      <div className="toolbar">
        <select
          value={filter}
          onChange={(e) => {
            const v = e.target.value as ContactStatus | "";
            setFilter(v);
            load(v);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>Message</th>
            <th>Status</th>
            <th>Received</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => {
            const disabled = busy === c.id;
            return (
              <tr key={c.id}>
                <td>
                  <div>{c.name}</div>
                  <div className="muted">{c.email}</div>
                  {c.company && <div className="muted">{c.company}</div>}
                </td>
                <td style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>{c.message}</td>
                <td>
                  <span className={`badge ${c.status}`}>{c.status}</span>
                </td>
                <td className="muted">{new Date(c.createdAt).toLocaleString()}</td>
                <td>
                  <div className="actions">
                    {c.status !== "responded" && (
                      <button
                        disabled={disabled}
                        onClick={() => act(c.id, () => api.contactSetStatus(c.id, "responded"))}
                      >
                        Responded
                      </button>
                    )}
                    {c.status !== "archived" && (
                      <button
                        disabled={disabled}
                        onClick={() => act(c.id, () => api.contactSetStatus(c.id, "archived"))}
                      >
                        Archive
                      </button>
                    )}
                    {c.status !== "new" && (
                      <button
                        disabled={disabled}
                        onClick={() => act(c.id, () => api.contactSetStatus(c.id, "new"))}
                      >
                        Mark new
                      </button>
                    )}
                    <button
                      className="danger"
                      disabled={disabled}
                      onClick={() => {
                        if (confirm("Delete this submission?"))
                          act(c.id, () => api.contactDelete(c.id));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                No submissions.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
