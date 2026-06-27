import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { ApiError } from "@strophic/types";
import { AppError } from "../lib/errors";

const HTTP_CODE_BY_STATUS: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  429: "TOO_MANY_REQUESTS",
};

/** Maps thrown errors to the consistent `{ ok:false, error }` envelope. */
export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof AppError) {
    const body: ApiError = {
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
    };
    return c.json(body, err.status);
  }

  // Hono's own HTTPException (e.g. from the csrf middleware) — preserve its status.
  if (err instanceof HTTPException) {
    const code = HTTP_CODE_BY_STATUS[err.status] ?? "HTTP_ERROR";
    const body: ApiError = { ok: false, error: { code, message: err.message || code } };
    return c.json(body, err.status);
  }

  if (err instanceof ZodError) {
    const body: ApiError = {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues },
    };
    return c.json(body, 400);
  }

  // Unknown error — log full detail server-side, never leak it to the client.
  console.error("[api] unhandled error:", err);
  const body: ApiError = {
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  };
  return c.json(body, 500);
}

export function notFoundHandler(c: Context): Response {
  const body: ApiError = { ok: false, error: { code: "NOT_FOUND", message: "Route not found" } };
  return c.json(body, 404);
}
