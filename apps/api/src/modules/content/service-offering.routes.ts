import { Hono } from "hono";
import {
  createServiceSchema,
  idParamSchema,
  paginationSchema,
  slugParamSchema,
  updateServiceSchema,
} from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { requireRole } from "../../middleware/auth";

/** Admin service-offering management (RBAC-gated). */
export function serviceOfferingRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.use("*", requireRole(container.config, "EDITOR"));

  app.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.serviceOfferings.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  app.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { service: await container.serviceOfferings.get(c.req.valid("param").id) });
  });

  app.post("/", validate("json", createServiceSchema), async (c) => {
    return ok(c, { service: await container.serviceOfferings.create(c.req.valid("json")) });
  });

  app.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateServiceSchema),
    async (c) => {
      const service = await container.serviceOfferings.update(
        c.req.valid("param").id,
        c.req.valid("json"),
      );
      return ok(c, { service });
    },
  );

  app.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.serviceOfferings.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });

  return app;
}

/** Public, read-only services (published only). */
export function publicServiceOfferingRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.get("/", async (c) => {
    const { items } = await container.serviceOfferings.listPublished();
    return ok(c, { items });
  });
  app.get("/:slug", validate("param", slugParamSchema), async (c) => {
    return ok(c, {
      service: await container.serviceOfferings.getPublishedBySlug(c.req.valid("param").slug),
    });
  });
  return app;
}
