import { useEffect, useState } from "react";
import { api } from "../api";
import type { ContactStats, NewsletterStats, AnalyticsOverview } from "../types";

// A small card that shows a number, or an error if its source app is unreachable.
function Card({ label, value, error }: { label: string; value?: number | string; error?: string }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value" style={error ? { color: "var(--danger)", fontSize: 14 } : undefined}>
        {error ? "unavailable" : (value ?? "—")}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [contact, setContact] = useState<ContactStats>();
  const [newsletter, setNewsletter] = useState<NewsletterStats>();
  const [analytics, setAnalytics] = useState<AnalyticsOverview>();
  const [userCount, setUserCount] = useState<number>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fail = (key: string) => (e: unknown) =>
      setErrors((prev) => ({ ...prev, [key]: e instanceof Error ? e.message : "error" }));

    api.contactStats().then(setContact).catch(fail("contact"));
    api.newsletterStats().then(setNewsletter).catch(fail("newsletter"));
    api.analyticsOverview(30).then(setAnalytics).catch(fail("analytics"));
    api
      .habitUsers()
      .then((r) => setUserCount(r.users.length))
      .catch(fail("habit"));
  }, []);

  return (
    <>
      <h2>Dashboard</h2>
      <p className="sub">Overview across both sites. Last 30 days for analytics.</p>

      <h3>ruudjuffermans.nl</h3>
      <div className="cards">
        <Card label="New messages" value={contact?.counts.new} error={errors.contact} />
        <Card label="Total messages" value={contact?.total} error={errors.contact} />
        <Card
          label="Active subscribers"
          value={newsletter?.active}
          error={errors.newsletter}
        />
        <Card label="Page views (30d)" value={analytics?.totalViews} error={errors.analytics} />
      </div>

      <h3>Habitmaxxing</h3>
      <div className="cards">
        <Card
          label="Users (latest 200)"
          value={userCount === 200 ? "200+" : userCount}
          error={errors.habit}
        />
      </div>
    </>
  );
}
