import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import type { AppConfig } from "../env";

export const ACCESS_COOKIE = "strophic_at";
export const REFRESH_COOKIE = "strophic_rt";

/** Refresh cookie is scoped to the auth endpoints so it isn't sent on every request. */
const REFRESH_PATH = "/api/v1/auth";

export const ACCESS_MAX_AGE = 60 * 15; // 15 minutes
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function baseCookieOptions(config: AppConfig) {
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "Lax" as const,
    // Only set a cross-subdomain domain in production; on localhost it must be host-only.
    ...(config.isProd && config.cookieDomain ? { domain: config.cookieDomain } : {}),
  };
}

export function setAuthCookies(
  c: Context,
  config: AppConfig,
  tokens: { accessToken: string; refreshToken: string },
): void {
  const base = baseCookieOptions(config);
  setCookie(c, ACCESS_COOKIE, tokens.accessToken, { ...base, path: "/", maxAge: ACCESS_MAX_AGE });
  setCookie(c, REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    path: REFRESH_PATH,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(c: Context, config: AppConfig): void {
  const domainOpt = config.isProd && config.cookieDomain ? { domain: config.cookieDomain } : {};
  deleteCookie(c, ACCESS_COOKIE, { path: "/", ...domainOpt });
  deleteCookie(c, REFRESH_COOKIE, { path: REFRESH_PATH, ...domainOpt });
}
