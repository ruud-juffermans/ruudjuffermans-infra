import { useEffect, useState } from "react";
import { api } from "../api";
import type { HabitUser } from "../types";

export function HabitmaxxingUsers() {
  const [users, setUsers] = useState<HabitUser[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load(q = search) {
    setError("");
    try {
      const { users } = await api.habitUsers(q || undefined);
      setUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
  }

  useEffect(() => {
    load("");
  }, []);

  // Run an action, then refresh. `key` makes the clicked row's buttons disable.
  async function act(key: string, fn: () => Promise<unknown>, successMsg: string) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(successMsg);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <h2>Habitmaxxing users</h2>
      <p className="sub">Account management. Habit content is never shown — metadata only.</p>

      {error && <div className="notice err">{error}</div>}
      {notice && <div className="notice ok">{notice}</div>}

      <div className="toolbar">
        <input
          placeholder="Search email or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          style={{ minWidth: 260 }}
        />
        <button onClick={() => load()}>Search</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Status</th>
            <th>Activity</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const disabled = busy === u.id;
            return (
              <tr key={u.id}>
                <td>
                  <div>{u.name || <span className="muted">no name</span>}</div>
                  <div className="muted">{u.email}</div>
                </td>
                <td>
                  <div className="actions">
                    {u.role === "admin" && <span className="badge admin">admin</span>}
                    {u.isGuest && <span className="badge guest">guest</span>}
                    {u.disabledAt && <span className="badge suspended">suspended</span>}
                    {!u.emailVerified && <span className="badge new">unverified</span>}
                  </div>
                </td>
                <td className="muted">
                  {u._count.habits} habits · {u._count.entries} entries
                </td>
                <td className="muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="actions">
                    {!u.emailVerified && (
                      <button
                        disabled={disabled}
                        onClick={() =>
                          act(u.id, () => api.habitUserAction(u.id, "verify-email"), "Email verified")
                        }
                      >
                        Verify
                      </button>
                    )}
                    <button
                      disabled={disabled}
                      onClick={() =>
                        act(u.id, () => api.habitUserAction(u.id, "reset-password"), "Reset link sent")
                      }
                    >
                      Reset pw
                    </button>
                    <button
                      disabled={disabled}
                      onClick={() =>
                        act(u.id, () => api.habitUserAction(u.id, "revoke-sessions"), "Sessions revoked")
                      }
                    >
                      Sign out
                    </button>
                    {u.disabledAt ? (
                      <button
                        disabled={disabled}
                        onClick={() =>
                          act(u.id, () => api.habitUserAction(u.id, "unsuspend"), "Unsuspended")
                        }
                      >
                        Unsuspend
                      </button>
                    ) : (
                      <button
                        disabled={disabled}
                        onClick={() =>
                          act(u.id, () => api.habitUserAction(u.id, "suspend"), "Suspended")
                        }
                      >
                        Suspend
                      </button>
                    )}
                    <button
                      className="danger"
                      disabled={disabled}
                      onClick={() => {
                        if (confirm(`Delete ${u.email} and all their data? This cannot be undone.`))
                          act(u.id, () => api.habitUserDelete(u.id), "User deleted");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
