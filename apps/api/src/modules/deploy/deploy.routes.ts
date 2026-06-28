import { Hono } from "hono";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { requireRole } from "../../middleware/auth";

/** Manual "rebuild the site" trigger for the admin (RBAC-gated). */
export function deployRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.use("*", requireRole(container.config, "EDITOR"));

  app.post("/", async (c) => {
    return ok(c, await container.deploy.triggerRebuild());
  });

  return app;
}
