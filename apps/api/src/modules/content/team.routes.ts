import { Hono } from "hono";
import {
  createTeamMemberSchema,
  idParamSchema,
  paginationSchema,
  updateTeamMemberSchema,
} from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { requireRole } from "../../middleware/auth";

/** Admin team-member management (RBAC-gated). */
export function teamRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.use("*", requireRole(container.config, "EDITOR"));

  app.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.team.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  app.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { member: await container.team.get(c.req.valid("param").id) });
  });

  app.post("/", validate("json", createTeamMemberSchema), async (c) => {
    return ok(c, { member: await container.team.create(c.req.valid("json")) });
  });

  app.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateTeamMemberSchema),
    async (c) => {
      const member = await container.team.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { member });
    },
  );

  app.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.team.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });

  return app;
}

/** Public, read-only team members (published only). */
export function publicTeamRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.get("/", async (c) => {
    const { items } = await container.team.listPublished();
    return ok(c, { items });
  });
  return app;
}
