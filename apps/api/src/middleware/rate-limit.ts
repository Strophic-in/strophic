import { createMiddleware } from "hono/factory";
import { TooManyRequestsError } from "../lib/errors";
import { clientIp } from "../lib/request";

interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory fixed-window limiter, keyed on the TRUSTED client IP (see lib/request).
// Fine for a single Node instance / warm serverless instance. PHASE 6 HARDENING:
// back this with a shared store (Upstash Redis / Durable Object) for multi-instance
// correctness, and add a per-account (email) limit on login/forgot/reset — the
// interface stays the same.
const store = new Map<string, Bucket>();

export function rateLimit(opts: { windowMs: number; max: number; keyPrefix?: string }) {
  return createMiddleware(async (c, next) => {
    const ip = clientIp(c) ?? "unknown";
    const key = `${opts.keyPrefix ?? "rl"}:${ip}`;
    const now = Date.now();
    const bucket = store.get(key);

    if (!bucket || bucket.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + opts.windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > opts.max) {
        throw new TooManyRequestsError("Too many requests — please slow down");
      }
    }
    await next();
  });
}
