import { Router } from "express";
import { forward } from "../upstream.js";

// Wraps ruudjuffermans.nl's /api/v1/admin/* API: contact submissions, newsletter
// subscribers, and page-view analytics. Mounted behind requireLogin in index.ts.
export const ruudjuffermansRouter = Router();

const base = "/api/v1/admin";

// ─── Contact submissions ───
ruudjuffermansRouter.get("/contact", (req, res) =>
  forward(res, "ruudjuffermans", `${base}/contact`, {
    query: {
      status: req.query.status as string | undefined,
      limit: req.query.limit as string | undefined,
    },
  }),
);

ruudjuffermansRouter.get("/contact/stats", (_req, res) =>
  forward(res, "ruudjuffermans", `${base}/contact/stats`),
);

ruudjuffermansRouter.patch("/contact/:id/status", (req, res) =>
  forward(res, "ruudjuffermans", `${base}/contact/${req.params.id}/status`, {
    method: "PATCH",
    body: req.body,
  }),
);

ruudjuffermansRouter.delete("/contact/:id", (req, res) =>
  forward(res, "ruudjuffermans", `${base}/contact/${req.params.id}`, { method: "DELETE" }),
);

// ─── Newsletter ───
ruudjuffermansRouter.get("/newsletter", (req, res) =>
  forward(res, "ruudjuffermans", `${base}/newsletter`, {
    query: {
      active: req.query.active as string | undefined,
      limit: req.query.limit as string | undefined,
    },
  }),
);

ruudjuffermansRouter.get("/newsletter/stats", (_req, res) =>
  forward(res, "ruudjuffermans", `${base}/newsletter/stats`),
);

ruudjuffermansRouter.post("/newsletter/:id/unsubscribe", (req, res) =>
  forward(res, "ruudjuffermans", `${base}/newsletter/${req.params.id}/unsubscribe`, {
    method: "POST",
  }),
);

ruudjuffermansRouter.delete("/newsletter/:id", (req, res) =>
  forward(res, "ruudjuffermans", `${base}/newsletter/${req.params.id}`, { method: "DELETE" }),
);

// ─── Analytics ───
for (const path of ["overview", "top-pages", "top-referrers", "timeseries"] as const) {
  ruudjuffermansRouter.get(`/analytics/${path}`, (req, res) =>
    forward(res, "ruudjuffermans", `${base}/analytics/${path}`, {
      query: {
        days: req.query.days as string | undefined,
        limit: req.query.limit as string | undefined,
      },
    }),
  );
}
