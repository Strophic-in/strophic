import type { Context } from "hono";

/**
 * Trusted client IP. The LEFTMOST `x-forwarded-for` entry is client-controlled and
 * MUST NOT be trusted (it would let attackers forge a fresh identity per request and
 * bypass rate limits). On Vercel, `x-real-ip` is set by the platform to the true
 * client IP; otherwise we take the RIGHTMOST XFF entry, which is the one appended by
 * our trusted edge. Adjust if more than one trusted proxy hop is introduced.
 */
export function clientIp(c: Context): string | null {
  const realIp = c.req.header("x-real-ip")?.trim();
  if (realIp) return realIp;

  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1] ?? null;
  }
  return null;
}

/** User-agent + IP captured for audit fields on tokens/leads. */
export function requestContext(c: Context): { userAgent: string | null; ip: string | null } {
  return { userAgent: c.req.header("user-agent") ?? null, ip: clientIp(c) };
}
