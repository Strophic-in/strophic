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
    // The hook's result is a *generic* discriminated union; some tsc toolchains
    // won't narrow it on `!result.success`, so read the error without relying on
    // control-flow narrowing. It's re-thrown for the central handler, which does
    // the runtime `instanceof ZodError` check - hence `unknown` over a named type.
    if (!result.success) {
      throw (result as unknown as { error: unknown }).error;
    }
  });
