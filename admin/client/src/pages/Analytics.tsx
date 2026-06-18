import { useEffect, useState } from "react";
import { api } from "../api";
import type {
  AnalyticsOverview,
  TopPage,
  TopReferrer,
  TimeseriesPoint,
} from "../types";

// Horizontal bar list: each row's bar is scaled to the largest value shown.
function BarList({ rows }: { rows: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div>
      {rows.map((r, i) => (
        <div className="barrow" key={i}>
          <div>
            <div style={{ marginBottom: 4, wordBreak: "break-all" }}>{r.label}</div>
            <div className="track">
              <div className="bar" style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
          </div>
          <div className="num">{r.count}</div>
        </div>
      ))}
      {rows.length === 0 && <div className="muted">No data.</div>}
    </div>
  );
}

const RANGES = [7, 30, 90];

export function Analytics() {
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<AnalyticsOverview>();
  const [pages, setPages] = useState<TopPage[]>([]);
  const [referrers, setReferrers] = useState<TopReferrer[]>([]);
  const [series, setSeries] = useState<TimeseriesPoint[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    Promise.all([
      api.analyticsOverview(days),
      api.topPages(days),
      api.topReferrers(days),
      api.timeseries(days),
    ])
      .then(([o, p, r, t]) => {
        setOverview(o);
        setPages(p.pages);
        setReferrers(r.referrers);
        setSeries(t.series);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analytics"));
  }, [days]);

  return (
    <>
      <h2>Analytics</h2>
      <p className="sub">Page views from ruudjuffermans.nl.</p>

      {error && <div className="notice err">{error}</div>}

      <div className="toolbar">
        {RANGES.map((d) => (
          <button key={d} className={d === days ? "primary" : ""} onClick={() => setDays(d)}>
            Last {d}d
          </button>
        ))}
      </div>

      <div className="cards">
        <div className="card">
          <div className="label">Total views</div>
          <div className="value">{overview?.totalViews ?? "—"}</div>
        </div>
        {overview?.byLocale.map((l) => (
          <div className="card" key={l.locale}>
            <div className="label">{l.locale}</div>
            <div className="value">{l.count}</div>
          </div>
        ))}
      </div>

      <h3>Views per day</h3>
      <BarList rows={series.map((s) => ({ label: s.day, count: s.count }))} />

      <h3 style={{ marginTop: 28 }}>Top pages</h3>
      <BarList rows={pages.map((p) => ({ label: p.path, count: p.count }))} />

      <h3 style={{ marginTop: 28 }}>Top referrers</h3>
      <BarList rows={referrers.map((r) => ({ label: r.referrer, count: r.count }))} />
    </>
  );
}
