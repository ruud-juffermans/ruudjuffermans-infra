// Shapes returned by the admin server (which relays each app's admin API).

// ─── habitmaxxing ───
export interface HabitUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  isGuest: boolean;
  role: "user" | "admin";
  disabledAt: string | null;
  createdAt: string;
  _count: { habits: number; entries: number; groups: number };
}

// ─── ruudjuffermans.nl: contact ───
export type ContactStatus = "new" | "responded" | "archived";

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: ContactStatus;
  createdAt: string;
}

export interface ContactStats {
  counts: Record<ContactStatus, number>;
  total: number;
}

// ─── ruudjuffermans.nl: newsletter ───
export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  active: boolean;
  createdAt: string;
  unsubscribedAt: string | null;
}

export interface NewsletterStats {
  total: number;
  active: number;
  unsubscribed: number;
  bySource: Array<{ source: string; count: number }>;
}

// ─── ruudjuffermans.nl: analytics ───
export interface AnalyticsOverview {
  days: number;
  totalViews: number;
  byLocale: Array<{ locale: string; count: number }>;
}

export interface TopPage {
  path: string;
  count: number;
}

export interface TopReferrer {
  referrer: string;
  count: number;
}

export interface TimeseriesPoint {
  day: string;
  count: number;
}
