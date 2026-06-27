import { Hono } from "hono";
import type { ApiResponse } from "@strophic/types";

/**
 * Strophic API entrypoint.
 *
 * Phase 0: health check + the consistent response envelope only.
 * Phase 1 layers in middleware (cors, prisma, auth, rateLimit, error), and the
 * route → service → repository modules described in CLAUDE.md §6.
 */
const app = new Hono();

app.get("/health", (c) => {
  const body: ApiResponse<{ status: string; service: string }> = {
    ok: true,
    data: { status: "healthy", service: "strophic-api" },
  };
  return c.json(body);
});

app.notFound((c) => {
  const body: ApiResponse<never> = {
    ok: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  };
  return c.json(body, 404);
});

export default app;
