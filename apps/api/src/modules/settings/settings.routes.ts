import { Hono } from "hono";
import { updateSettingsSchema } from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { requireRole } from "../../middleware/auth";

export function settingsRoutes(container: Container) {
  const app = new Hono<AppEnv>();

  // Public, unauthenticated: safe settings groups for the static site build.
  app.get("/public", async (c) => {
    return ok(c, { settings: await container.settings.getPublic() });
  });

  app.get("/", requireRole(container.config, "ADMIN"), async (c) => {
    return ok(c, { settings: await container.settings.getAll() });
  });

  app.put(
    "/",
    requireRole(container.config, "ADMIN"),
    validate("json", updateSettingsSchema),
    async (c) => {
      const { group, value } = c.req.valid("json");
      return ok(c, { setting: await container.settings.updateGroup(group, value) });
    },
  );

  return app;
}
