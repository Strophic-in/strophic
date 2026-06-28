import { Hono } from "hono";
import {
  idParamSchema,
  updateHomepageSectionSchema,
  upsertHomepageSectionSchema,
} from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { requireRole } from "../../middleware/auth";

/** Admin homepage-section management (RBAC-gated). */
export function homepageRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.use("*", requireRole(container.config, "EDITOR"));

  app.get("/", async (c) => {
    return ok(c, { items: await container.homepage.list() });
  });

  app.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { section: await container.homepage.get(c.req.valid("param").id) });
  });

  // Create-or-update by stable key.
  app.put("/", validate("json", upsertHomepageSectionSchema), async (c) => {
    return ok(c, { section: await container.homepage.upsert(c.req.valid("json")) });
  });

  app.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateHomepageSectionSchema),
    async (c) => {
      const section = await container.homepage.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { section });
    },
  );

  app.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.homepage.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });

  return app;
}

/**
 * Public, read-only homepage sections. Returns ALL sections (each with its
 * `enabled` flag) so the static site can both customize and hide blocks at
 * build time - homepage block config is not sensitive.
 */
export function publicHomepageRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.get("/", async (c) => {
    return ok(c, { items: await container.homepage.list() });
  });
  return app;
}
