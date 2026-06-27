import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";

/**
 * zod request validator that throws on failure so the central error handler
 * formats it as our standard envelope (instead of @hono/zod-validator's own shape).
 */
export const validate = <Target extends keyof ValidationTargets, T extends ZodType>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw result.error;
    }
  });
