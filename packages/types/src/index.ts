/**
 * @strophic/types - shared, runtime-free types used across api, admin, and website.
 * Keep this package free of any runtime code so it stays a safe leaf dependency.
 */

/** Roles for admin RBAC. Mirrors the Prisma `Role` enum (packages/database). */
export type Role = "SUPER_ADMIN" | "ADMIN" | "EDITOR";

/** Consistent API success envelope. */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

/** Consistent API error envelope. `code` is a stable machine-readable string. */
export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Every API response is one of these two shapes. */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** Pagination metadata returned alongside list endpoints. */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** A paginated collection of `T`. */
export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

/** Where a lead originated - drives source analytics. */
export type LeadSource =
  | "INSTAGRAM"
  | "X"
  | "LINKEDIN"
  | "GOOGLE"
  | "REFERRAL"
  | "DIRECT"
  | "OTHER";
