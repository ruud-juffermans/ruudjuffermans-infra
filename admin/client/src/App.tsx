import { useEffect, useState } from "react";
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { api } from "./api";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { HabitmaxxingUsers } from "./pages/HabitmaxxingUsers";
import { Contact } from "./pages/Contact";
import { Newsletter } from "./pages/Newsletter";
import { Analytics } from "./pages/Analytics";

export function App() {
  // null = still checking the session, true/false = known.
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .me()
      .then((r) => setAuthed(r.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return <div className="login-wrap">Loading…</div>;
  }
  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="layout">
      <nav className="sidebar">
        <h1>Central Admin</h1>
        <NavLink to="/" end>
          Dashboard
        </NavLink>

        <div className="section">ruudjuffermans.nl</div>
        <NavLink to="/contact">Contact</NavLink>
        <NavLink to="/newsletter">Newsletter</NavLink>
        <NavLink to="/analytics">Analytics</NavLink>

        <div className="section">habitmaxxing</div>
        <NavLink to="/habitmaxxing">Users</NavLink>

        <div className="spacer" />
        <button
          onClick={async () => {
            await api.logout().catch(() => {});
            setAuthed(false);
          }}
        >
          Log out
        </button>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/habitmaxxing" element={<HabitmaxxingUsers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
