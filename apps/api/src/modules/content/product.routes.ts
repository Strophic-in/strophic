import { Hono } from "hono";
import {
  createProductSchema,
  idParamSchema,
  paginationSchema,
  slugParamSchema,
  updateProductSchema,
} from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { requireRole } from "../../middleware/auth";

/** Admin Micro-SaaS product management (RBAC-gated). */
export function productRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.use("*", requireRole(container.config, "EDITOR"));

  app.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.products.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  app.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { product: await container.products.get(c.req.valid("param").id) });
  });

  app.post("/", validate("json", createProductSchema), async (c) => {
    return ok(c, { product: await container.products.create(c.req.valid("json")) });
  });

  app.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateProductSchema),
    async (c) => {
      const product = await container.products.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { product });
    },
  );

  app.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.products.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });

  return app;
}

/** Public, read-only products (published only). */
export function publicProductRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.get("/", async (c) => {
    const { items } = await container.products.listPublished();
    return ok(c, { items });
  });
  app.get("/:slug", validate("param", slugParamSchema), async (c) => {
    return ok(c, { product: await container.products.getPublishedBySlug(c.req.valid("param").slug) });
  });
  return app;
}
