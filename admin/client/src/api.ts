import type {
  HabitUser,
  ContactSubmission,
  ContactStats,
  ContactStatus,
  NewsletterSubscriber,
  NewsletterStats,
  AnalyticsOverview,
  TopPage,
  TopReferrer,
  TimeseriesPoint,
} from "./types";

// All requests are same-origin and send the session cookie. A non-2xx response
// throws with the server's error message so callers can surface it.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const api = {
  // ─── auth ───
  me: () => request<{ authenticated: boolean }>("/auth/me"),
  login: (password: string) =>
    request<{ ok: true }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),

  // ─── habitmaxxing ───
  habitUsers: (search?: string) =>
    request<{ users: HabitUser[] }>(`/habitmaxxing/users${qs({ search })}`),
  habitUserAction: (
    id: string,
    action: "suspend" | "unsuspend" | "verify-email" | "reset-password" | "revoke-sessions",
  ) => request<{ ok: true }>(`/habitmaxxing/users/${id}/${action}`, { method: "POST" }),
  habitUserDelete: (id: string) =>
    request<{ ok: true }>(`/habitmaxxing/users/${id}`, { method: "DELETE" }),

  // ─── ruudjuffermans.nl: contact ───
  contact: (status?: ContactStatus, limit?: number) =>
    request<{ submissions: ContactSubmission[] }>(`/ruudjuffermans/contact${qs({ status, limit })}`),
  contactStats: () => request<ContactStats>("/ruudjuffermans/contact/stats"),
  contactSetStatus: (id: string, status: ContactStatus) =>
    request<{ submission: ContactSubmission }>(`/ruudjuffermans/contact/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  contactDelete: (id: string) =>
    request<{ ok: true }>(`/ruudjuffermans/contact/${id}`, { method: "DELETE" }),

  // ─── ruudjuffermans.nl: newsletter ───
  newsletter: (active?: boolean, limit?: number) =>
    request<{ subscribers: NewsletterSubscriber[] }>(
      `/ruudjuffermans/newsletter${qs({ active: active === undefined ? undefined : String(active), limit })}`,
    ),
  newsletterStats: () => request<NewsletterStats>("/ruudjuffermans/newsletter/stats"),
  newsletterUnsubscribe: (id: string) =>
    request<{ subscriber: NewsletterSubscriber }>(`/ruudjuffermans/newsletter/${id}/unsubscribe`, {
      method: "POST",
    }),
  newsletterDelete: (id: string) =>
    request<{ ok: true }>(`/ruudjuffermans/newsletter/${id}`, { method: "DELETE" }),

  // ─── ruudjuffermans.nl: analytics ───
  analyticsOverview: (days: number) =>
    request<AnalyticsOverview>(`/ruudjuffermans/analytics/overview${qs({ days })}`),
  topPages: (days: number, limit = 20) =>
    request<{ pages: TopPage[] }>(`/ruudjuffermans/analytics/top-pages${qs({ days, limit })}`),
  topReferrers: (days: number, limit = 20) =>
    request<{ referrers: TopReferrer[] }>(
      `/ruudjuffermans/analytics/top-referrers${qs({ days, limit })}`,
    ),
  timeseries: (days: number) =>
    request<{ series: TimeseriesPoint[] }>(`/ruudjuffermans/analytics/timeseries${qs({ days })}`),
};
