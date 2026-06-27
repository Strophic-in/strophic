import type { Role } from "@strophic/types";

/** Privilege ranking — higher is more privileged. */
const RANK: Record<Role, number> = {
  EDITOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

/** True when `role` is at least as privileged as `required`. */
export function hasRole(role: Role, required: Role): boolean {
  return RANK[role] >= RANK[required];
}

/** True when `role` is one of the explicitly allowed roles. */
export function isOneOf(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role);
}
