import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import { config, isProd } from "./config.js";
import { requireLogin } from "./auth.js";
import { authRouter } from "./routes/auth.js";
import { habitmaxxingRouter } from "./routes/habitmaxxing.js";
import { ruudjuffermansRouter } from "./routes/ruudjuffermans.js";

const app = express();

if (isProd) {
  app.set("trust proxy", 1);
}

// Credentialed CORS so the admin client can send the session cookie. In
// production the client is served same-origin (nginx + Traefik) so this mainly
// matters for local dev (Vite on a different port).
app.use(
  cors({
    origin: config.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
    credentials: true,
  }),
);
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser(config.COOKIE_SECRET));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Operator login (public).
app.use("/api/auth", authRouter);

// Everything below requires a valid session.
app.use("/api/habitmaxxing", requireLogin, habitmaxxingRouter);
app.use("/api/ruudjuffermans", requireLogin, ruudjuffermansRouter);

// Centralized error handler.
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.flatten() });
      return;
    }
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  },
);

app.listen(config.PORT, () => {
  console.log(`central-admin server listening on :${config.PORT} [${config.NODE_ENV}]`);
  if (!config.ADMIN_PASSWORD) {
    console.warn("[admin] ADMIN_PASSWORD is empty — login is disabled until you set it.");
  }
  if (!config.ADMIN_SERVICE_TOKEN) {
    console.warn("[admin] ADMIN_SERVICE_TOKEN is empty — upstream calls will fail until set.");
  }
});
