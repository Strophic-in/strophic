import type { Role } from "@strophic/types";

/** The authenticated principal attached to the request by the auth middleware. */
export interface AuthUser {
  id: string;
  role: Role;
}

/** Hono environment for this app (typed context variables). */
export type AppEnv = {
  Variables: {
    user?: AuthUser;
  };
};
