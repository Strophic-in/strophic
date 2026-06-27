import { Hono } from "hono";
import { idParamSchema, leadFilterSchema, leadNoteSchema, updateLeadSchema } from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { getUser, requireRole } from "../../middleware/auth";

/** Admin lead management (RBAC-gated). */
export function leadRoutes(container: Container) {
  const app = new Hono<AppEnv>();

  // List + read: any editor; mutations: admin (enforced per-route below).
  app.use("*", requireRole(container.config, "EDITOR"));

  app.get("/", validate("query", leadFilterSchema), async (c) => {
    const { page, pageSize, status } = c.req.valid("query");
    const { items, total } = await container.leads.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
      status,
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  app.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { lead: await container.leads.get(c.req.valid("param").id) });
  });

  app.patch(
    "/:id",
    requireRole(container.config, "ADMIN"),
    validate("param", idParamSchema),
    validate("json", updateLeadSchema),
    async (c) => {
      const lead = await container.leads.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { lead });
    },
  );

  app.post(
    "/:id/notes",
    validate("param", idParamSchema),
    validate("json", leadNoteSchema),
    async (c) => {
      const note = await container.leads.addNote(
        c.req.valid("param").id,
        getUser(c).id,
        c.req.valid("json").body,
      );
      return ok(c, { note });
    },
  );

  return app;
}
