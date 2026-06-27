import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { hasRole, verifyAccessToken } from "@strophic/auth";
import type { Role } from "@strophic/types";
import type { AppEnv, AuthUser } from "../context";
import type { AppConfig } from "../env";
import { ACCESS_COOKIE } from "../lib/cookies";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";

function extractToken(c: Context): string | undefined {
  const cookie = getCookie(c, ACCESS_COOKIE);
  if (cookie) return cookie;
  const header = c.req.header("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return undefined;
}

async function authenticate(c: Context, config: AppConfig): Promise<AuthUser> {
  const token = extractToken(c);
  if (!token) throw new UnauthorizedError();
  const claims = await verifyAccessToken(token, config.jwt.accessSecret);
  if (!claims) throw new UnauthorizedError();
  return { id: claims.sub, role: claims.role };
}

/** Require a valid access token; attaches `user` to the context. */
export function requireAuth(config: AppConfig) {
  return createMiddleware<AppEnv>(async (c, next) => {
    c.set("user", await authenticate(c, config));
    await next();
  });
}

/** Require a valid token AND a role at least as privileged as `min`. */
export function requireRole(config: AppConfig, min: Role) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = await authenticate(c, config);
    if (!hasRole(user.role, min)) throw new ForbiddenError();
    c.set("user", user);
    await next();
  });
}

/** Read the authenticated user inside a protected handler (throws if absent). */
export function getUser(c: Context<AppEnv>): AuthUser {
  const user = c.get("user");
  if (!user) throw new UnauthorizedError();
  return user;
}
