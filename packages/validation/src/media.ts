import { z } from "zod";

/** Upload limits — the single source of truth, enforced in the API and mirrored on the bucket. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

// SVG is intentionally excluded: it can carry scripts and would be served from the
// public media origin (stored-XSS risk). Re-add only with server-side sanitization.
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** Request body for obtaining a presigned upload URL (admin media library). */
export const presignUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_BYTES, `File exceeds the ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB limit`),
  folder: z
    .string()
    .regex(/^[a-z0-9][a-z0-9/_-]*$/i, "Invalid folder path")
    .max(120)
    .optional(),
});
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

/**
 * Request body to persist an uploaded object's metadata after a successful PUT.
 * `key` must match the server-generated shape (optional folder + random id + image
 * extension) so a client can't register arbitrary keys or path-traversal values.
 */
export const persistMediaSchema = z.object({
  key: z
    .string()
    .max(512)
    .regex(
      /^([a-z0-9][a-z0-9/_-]*\/)?[A-Za-z0-9_-]{8,}\.(jpg|png|webp|avif|gif)$/,
      "Invalid storage key",
    ),
  contentType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  alt: z.string().max(300).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type PersistMediaInput = z.infer<typeof persistMediaSchema>;
