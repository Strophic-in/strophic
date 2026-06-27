import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

let client: PrismaClient | undefined;

/**
 * Returns a memoized PrismaClient backed by the Postgres driver adapter.
 * Memoizing keeps a single client across warm serverless invocations and for
 * the lifetime of a long-running Node process.
 *
 * @param connectionString Neon **pooled** URL (runtime). Migrations use the
 *   direct URL via prisma.config.ts instead.
 */
export function getPrisma(connectionString: string): PrismaClient {
  client ??= new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  return client;
}

export type Database = PrismaClient;
