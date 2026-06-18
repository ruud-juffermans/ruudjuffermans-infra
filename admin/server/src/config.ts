import { z } from "zod";

// Central admin server config. Validated once at boot; a bad/missing value here
// fails the process rather than surfacing as a confusing runtime error later.
const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Single shared password for the operator login (you). Empty disables login
  // entirely (fail closed) — the app refuses to authenticate anyone.
  ADMIN_PASSWORD: z.string().default(""),
  // Secret used to sign the session cookie so it can't be forged. Set a long
  // random value in production (openssl rand -hex 32).
  COOKIE_SECRET: z.string().default("dev-insecure-change-me"),
  // How long a login stays valid before the cookie expires.
  SESSION_TTL_HOURS: z.coerce.number().default(12),
  // Force the Secure cookie flag. Auto-on in production.
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),

  // Allowed browser origin for the admin client (credentialed CORS).
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // Upstream app admin APIs, reached over the internal Docker network. Point
  // these at each app's server container (e.g. http://<service>:4000). They
  // include the API prefix base; route paths are appended per call.
  HABITMAXXING_API_URL: z.string().default("http://habitmaxxing-server:4000"),
  RUUDJUFFERMANS_API_URL: z.string().default("http://ruudjuffermans-server:4000"),
  // Shared secret presented to both upstream admin APIs as X-Service-Token.
  ADMIN_SERVICE_TOKEN: z.string().default(""),
});

export const config = envSchema.parse(process.env);

export const isProd = config.NODE_ENV === "production";
// Secure cookies in prod unless explicitly overridden (e.g. local HTTP testing).
export const cookieSecure = config.COOKIE_SECURE ?? isProd;
