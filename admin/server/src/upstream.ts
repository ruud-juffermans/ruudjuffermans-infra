import type { Response } from "express";
import { config } from "./config.js";

// Thin forwarder to an upstream app's admin API. The admin client never talks to
// the apps directly — it calls this server (same-origin, cookie-authed), and we
// relay to the app over the internal network, attaching the shared service token.
//
// We deliberately do NOT pass arbitrary paths through: each admin route maps to a
// fixed upstream path, so this is an allowlist by construction, not an open proxy.

export type Upstream = "habitmaxxing" | "ruudjuffermans";

function baseUrl(upstream: Upstream): string {
  return upstream === "habitmaxxing"
    ? config.HABITMAXXING_API_URL
    : config.RUUDJUFFERMANS_API_URL;
}

interface ForwardOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | undefined>;
  body?: unknown;
}

// Call the upstream and pipe its status + JSON straight back to the client.
export async function forward(
  res: Response,
  upstream: Upstream,
  path: string,
  opts: ForwardOptions = {},
): Promise<void> {
  if (!config.ADMIN_SERVICE_TOKEN) {
    res.status(503).json({ error: "ADMIN_SERVICE_TOKEN is not configured." });
    return;
  }

  const url = new URL(path, baseUrl(upstream));
  for (const [key, value] of Object.entries(opts.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }

  let upstreamRes: globalThis.Response;
  try {
    upstreamRes = await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        "X-Service-Token": config.ADMIN_SERVICE_TOKEN,
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (err) {
    // Network/DNS failure reaching the app container — surface as a 502 so the UI
    // can show "app unreachable" rather than a generic 500.
    res.status(502).json({
      error: `Could not reach ${upstream}: ${err instanceof Error ? err.message : "unknown error"}`,
    });
    return;
  }

  // Relay the upstream status and body. Most responses are JSON; tolerate empty.
  const text = await upstreamRes.text();
  res.status(upstreamRes.status);
  if (!text) {
    res.end();
    return;
  }
  try {
    res.json(JSON.parse(text));
  } catch {
    res.type("text/plain").send(text);
  }
}
