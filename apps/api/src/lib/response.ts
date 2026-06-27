import type { Context } from "hono";
import type { ApiSuccess } from "@strophic/types";

/** Send a success envelope: `{ ok: true, data, meta? }`. */
export function ok<T>(c: Context, data: T, meta?: Record<string, unknown>) {
  const body: ApiSuccess<T> = meta ? { ok: true, data, meta } : { ok: true, data };
  return c.json(body);
}
