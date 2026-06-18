import { Router } from "express";
import { forward } from "../upstream.js";

// Wraps habitmaxxing's existing /api/admin/* user-management API. Each route maps
// 1:1 to an upstream endpoint; the forwarder attaches the service token. Mounted
// behind requireLogin in index.ts.
export const habitmaxxingRouter = Router();

const base = "/api/admin";

// List / search users.
habitmaxxingRouter.get("/users", (req, res) =>
  forward(res, "habitmaxxing", `${base}/users`, {
    query: { search: req.query.search as string | undefined },
  }),
);

// Single user detail.
habitmaxxingRouter.get("/users/:id", (req, res) =>
  forward(res, "habitmaxxing", `${base}/users/${req.params.id}`),
);

// Account actions. All are POST upstream except delete.
const actions = ["suspend", "unsuspend", "verify-email", "reset-password", "revoke-sessions"] as const;
for (const action of actions) {
  habitmaxxingRouter.post(`/users/:id/${action}`, (req, res) =>
    forward(res, "habitmaxxing", `${base}/users/${req.params.id}/${action}`, {
      method: "POST",
    }),
  );
}

// Delete a user and all their data.
habitmaxxingRouter.delete("/users/:id", (req, res) =>
  forward(res, "habitmaxxing", `${base}/users/${req.params.id}`, { method: "DELETE" }),
);
