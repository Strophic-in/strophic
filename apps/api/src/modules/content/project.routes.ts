import { Hono } from "hono";
import {
  createProjectSchema,
  idParamSchema,
  paginationSchema,
  slugParamSchema,
  updateProjectSchema,
} from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { requireRole } from "../../middleware/auth";

/** Admin project/portfolio management (RBAC-gated). */
export function projectRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.use("*", requireRole(container.config, "EDITOR"));

  app.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.projects.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  app.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { project: await container.projects.get(c.req.valid("param").id) });
  });

  app.post("/", validate("json", createProjectSchema), async (c) => {
    return ok(c, { project: await container.projects.create(c.req.valid("json")) });
  });

  app.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateProjectSchema),
    async (c) => {
      const project = await container.projects.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { project });
    },
  );

  app.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.projects.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });

  return app;
}

/** Public, read-only projects (published only). */
export function publicProjectRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.get("/", async (c) => {
    const { items } = await container.projects.listPublished();
    return ok(c, { items });
  });
  app.get("/:slug", validate("param", slugParamSchema), async (c) => {
    return ok(c, { project: await container.projects.getPublishedBySlug(c.req.valid("param").slug) });
  });
  return app;
}
