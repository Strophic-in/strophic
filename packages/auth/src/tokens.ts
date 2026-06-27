import { bytesToHex } from "@noble/hashes/utils.js";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@strophic/types";

const ACCESS_ALG = "HS256";

export interface AccessTokenClaims {
  /** user id */
  sub: string;
  role: Role;
  jti: string;
}

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

function isRole(value: unknown): value is Role {
  return value === "SUPER_ADMIN" || value === "ADMIN" || value === "EDITOR";
}

/** Sign a short-lived access JWT (default 15m). */
export function signAccessToken(opts: {
  userId: string;
  role: Role;
  secret: string;
  jti: string;
  expiresIn?: string;
}): Promise<string> {
  return new SignJWT({ role: opts.role })
    .setProtectedHeader({ alg: ACCESS_ALG })
    .setSubject(opts.userId)
    .setIssuedAt()
    .setJti(opts.jti)
    .setExpirationTime(opts.expiresIn ?? "15m")
    .sign(secretKey(opts.secret));
}

/** Verify an access token; returns claims or null (never throws). */
export async function verifyAccessToken(
  token: string,
  secret: string,
): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), { algorithms: [ACCESS_ALG] });
    if (typeof payload.sub !== "string" || typeof payload.jti !== "string" || !isRole(payload.role)) {
      return null;
    }
    return { sub: payload.sub, role: payload.role, jti: payload.jti };
  } catch {
    return null;
  }
}

// ── Opaque tokens (refresh tokens, families, jti, reset tokens) ───────────────

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** A cryptographically-random, URL-safe opaque token. */
export function generateOpaqueToken(bytes = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** A shorter random id (jti, token-family id). */
export function generateId(bytes = 16): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

/**
 * Hash of an opaque token for storage — store only this, never the raw token.
 * Refresh/reset tokens are high-entropy random values, so a fast hash (not a slow
 * KDF) is correct. When `secret` is supplied it is used as an HMAC key (a "pepper"),
 * so a leaked token table can't be matched without also holding the server secret.
 */
export async function hashToken(token: string, secret?: string): Promise<string> {
  const enc = new TextEncoder();
  if (secret) {
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, enc.encode(token));
    return bytesToHex(new Uint8Array(signature));
  }
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(token));
  return bytesToHex(new Uint8Array(digest));
}
