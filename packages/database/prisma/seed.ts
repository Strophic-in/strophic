import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword } from "@strophic/auth";
import { config as loadEnv } from "dotenv";
import { getPrisma } from "../src/client";
import { Role } from "../src/generated/prisma/client";

// seed.ts lives in packages/database/prisma → repo root is three levels up.
const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, "../../../.env") });

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required to run the seed");

  const db = getPrisma(url);

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@strophic.in";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";
  const name = process.env.SEED_ADMIN_NAME ?? "Strophic Admin";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.warn(`[seed] super admin "${email}" already exists - skipping`);
  } else {
    const passwordHash = await hashPassword(password);
    await db.user.create({
      data: { email, name, passwordHash, role: Role.SUPER_ADMIN },
    });
    console.warn(`[seed] created super admin "${email}" - rotate the password on first login`);
  }

  // Seed sensible default settings groups (no-op if they already exist).
  await db.setting.upsert({
    where: { group: "company" },
    create: {
      group: "company",
      value: { name: "Strophic", url: "https://strophic.in", email: "hafeez@strophic.in" },
    },
    update: {},
  });

  console.warn("[seed] done");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
