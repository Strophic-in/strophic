import { createApiClient } from "@strophic/api-client";

/** Shared API client. Talks to the Hono API with httpOnly cookies (credentials: include). */
export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787",
});
