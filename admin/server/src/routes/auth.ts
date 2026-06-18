import { Router } from "express";
import { z } from "zod";
import { login, logout, isAuthenticated } from "../auth.js";

// Operator login: a single password, no accounts. POST the password, get a
// signed session cookie; GET /me reports whether the cookie is valid.
export const authRouter = Router();

const loginSchema = z.object({ password: z.string().min(1) });

authRouter.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password is required." });
    return;
  }
  if (!login(parsed.data.password, res)) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }
  res.json({ ok: true });
});

authRouter.post("/logout", (_req, res) => {
  logout(res);
  res.json({ ok: true });
});

authRouter.get("/me", (req, res) => {
  res.json({ authenticated: isAuthenticated(req) });
});
