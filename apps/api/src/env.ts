import type { EmailAddress } from "@strophic/email";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(8787),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  // Used as the HMAC pepper for refresh/reset token hashing (packages/auth hashToken).
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  COOKIE_DOMAIN: z.string().optional(),

  EMAIL_PROVIDER: z.enum(["resend", "console"]).default("console"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Strophic <onboarding@resend.dev>"),
  CONTACT_NOTIFY_EMAIL: z.string().optional(),

  SUPABASE_STORAGE_ENDPOINT: z.string().optional(),
  SUPABASE_STORAGE_REGION: z.string().default("us-east-1"),
  SUPABASE_STORAGE_ACCESS_KEY_ID: z.string().optional(),
  SUPABASE_STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("media"),
  SUPABASE_STORAGE_PUBLIC_URL: z.string().optional(),

  PUBLIC_SITE_URL: z.string().default("http://localhost:4321"),
  ADMIN_URL: z.string().default("http://localhost:3000"),
});

export interface StorageConfig {
  endpoint?: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket: string;
  publicUrl?: string;
}

export interface AppConfig {
  isProd: boolean;
  port: number;
  databaseUrl: string;
  jwt: { accessSecret: string; refreshSecret: string };
  cookieDomain?: string;
  email: { provider: "resend" | "console"; resendApiKey?: string; from: EmailAddress; notifyEmail?: string };
  storage: StorageConfig;
  corsOrigins: string[];
  siteUrl: string;
  adminUrl: string;
}

/** Parse a "Name <email>" or "email" string into an EmailAddress. */
function parseAddress(value: string): EmailAddress {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  if (match?.[2]) {
    return { name: match[1] || undefined, email: match[2].trim() };
  }
  return { email: value.trim() };
}

/** Load and validate configuration from the environment. Throws on invalid config. */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const env = parsed.data;
  const isProd = env.NODE_ENV === "production";

  // Allowed browser origins. In non-prod also accept the local dev hosts so the
  // admin (3000) and website (4321) dev servers can call the API even when the
  // configured URLs point at production domains.
  const corsOrigins = Array.from(
    new Set(
      isProd
        ? [env.ADMIN_URL, env.PUBLIC_SITE_URL]
        : [env.ADMIN_URL, env.PUBLIC_SITE_URL, "http://localhost:3000", "http://localhost:4321"],
    ),
  );

  return {
    isProd,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    jwt: { accessSecret: env.JWT_ACCESS_SECRET, refreshSecret: env.JWT_REFRESH_SECRET },
    cookieDomain: env.COOKIE_DOMAIN,
    email: {
      provider: env.EMAIL_PROVIDER,
      resendApiKey: env.RESEND_API_KEY,
      from: parseAddress(env.EMAIL_FROM),
      notifyEmail: env.CONTACT_NOTIFY_EMAIL,
    },
    storage: {
      endpoint: env.SUPABASE_STORAGE_ENDPOINT,
      region: env.SUPABASE_STORAGE_REGION,
      accessKeyId: env.SUPABASE_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: env.SUPABASE_STORAGE_SECRET_ACCESS_KEY,
      bucket: env.SUPABASE_STORAGE_BUCKET,
      publicUrl: env.SUPABASE_STORAGE_PUBLIC_URL,
    },
    corsOrigins,
    siteUrl: env.PUBLIC_SITE_URL,
    adminUrl: env.ADMIN_URL,
  };
}
