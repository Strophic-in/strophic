import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "../../lib/cookies";
import { UnauthorizedError } from "../../lib/errors";
import { requestContext } from "../../lib/request";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { getUser, requireAuth } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rate-limit";

export function authRoutes(container: Container) {
  const app = new Hono<AppEnv>();

  app.post(
    "/login",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "login" }),
    validate("json", loginSchema),
    async (c) => {
      const result = await container.auth.login(c.req.valid("json"), requestContext(c));
      setAuthCookies(c, container.config, result);
      return ok(c, { user: result.user });
    },
  );

  app.post("/refresh", rateLimit({ windowMs: 15 * 60 * 1000, max: 60, keyPrefix: "refresh" }), async (c) => {
    const raw = getCookie(c, REFRESH_COOKIE);
    if (!raw) throw new UnauthorizedError();
    const result = await container.auth.refresh(raw, requestContext(c));
    setAuthCookies(c, container.config, result);
    return ok(c, { user: result.user });
  });

  app.post("/logout", async (c) => {
    await container.auth.logout(getCookie(c, REFRESH_COOKIE));
    clearAuthCookies(c, container.config);
    return ok(c, { success: true });
  });

  app.post(
    "/forgot-password",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: "forgot" }),
    validate("json", forgotPasswordSchema),
    async (c) => {
      await container.auth.forgotPassword(c.req.valid("json").email);
      return ok(c, { success: true });
    },
  );

  app.post(
    "/reset-password",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: "reset" }),
    validate("json", resetPasswordSchema),
    async (c) => {
      const { token, password } = c.req.valid("json");
      await container.auth.resetPassword(token, password);
      return ok(c, { success: true });
    },
  );

  app.get("/me", requireAuth(container.config), async (c) => {
    const user = getUser(c);
    return ok(c, { user: await container.auth.me(user.id) });
  });

  app.post(
    "/change-password",
    requireAuth(container.config),
    validate("json", changePasswordSchema),
    async (c) => {
      const { currentPassword, newPassword } = c.req.valid("json");
      await container.auth.changePassword(getUser(c).id, currentPassword, newPassword);
      return ok(c, { success: true });
    },
  );

  return app;
}
