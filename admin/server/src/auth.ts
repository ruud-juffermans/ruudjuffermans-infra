import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { config, cookieSecure } from "./config.js";

// Single-operator auth. There is no user database: one shared password (from
// ADMIN_PASSWORD) gates the whole app. On success we set a signed, httpOnly
// cookie; the signature (COOKIE_SECRET) makes it unforgeable, so the session is
// fully stateless — no server-side store to keep.

const COOKIE_NAME = "central_admin_session";

// Constant-time password comparison to avoid leaking length/prefix via timing.
function passwordMatches(provided: string): boolean {
  const expected = config.ADMIN_PASSWORD;
  if (!expected) return false; // not configured → nobody gets in (fail closed)
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch; guard so the check stays constant
  // time relative to the *expected* length rather than short-circuiting.
  if (a.length !== b.length) {
    // Compare expected against itself to burn the same time, then return false.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

// Validate the password and, if good, set the session cookie. Returns whether
// login succeeded so the route can shape the response.
export function login(password: string, res: Response): boolean {
  if (!passwordMatches(password)) return false;
  res.cookie(COOKIE_NAME, "ok", {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure,
    maxAge: config.SESSION_TTL_HOURS * 60 * 60 * 1000,
  });
  return true;
}

export function logout(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure,
  });
}

export function isAuthenticated(req: Request): boolean {
  return req.signedCookies?.[COOKIE_NAME] === "ok";
}

// Gate every admin/proxy route behind a valid session.
export function requireLogin(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
