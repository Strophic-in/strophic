import { scryptAsync } from "@noble/hashes/scrypt.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";

// scrypt parameters. N=2^15 (~32 MB, ~50-80ms) — OWASP-aligned and feasible on a
// full-CPU Node/Vercel runtime. Encoded into the hash so they can evolve safely.
const N = 2 ** 15;
const R = 8;
const P = 1;
const DK_LEN = 32;
const SALT_BYTES = 16;

function encode(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

/** Constant-time comparison to avoid leaking match position via timing. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

/** Hash a password with scrypt. Returns `scrypt$N$r$p$saltHex$hashHex`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const dk = await scryptAsync(encode(password), salt, { N, r: R, p: P, dkLen: DK_LEN });
  return `scrypt$${N}$${R}$${P}$${bytesToHex(salt)}$${bytesToHex(dk)}`;
}

/**
 * Verify a password against a stored hash. Returns false (never throws) on any
 * malformed input, so callers can treat it as a simple boolean check.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, nStr, rStr, pStr, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !nStr || !rStr || !pStr || !saltHex || !hashHex) return false;

  const n = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = hexToBytes(saltHex);
    expected = hexToBytes(hashHex);
  } catch {
    return false;
  }

  const derived = await scryptAsync(encode(password), salt, { N: n, r, p, dkLen: expected.length });
  return timingSafeEqual(derived, expected);
}
