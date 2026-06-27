import baseConfig from "@strophic/config/eslint/base";

export default [
  ...baseConfig,
  // The Prisma client is generated; never lint it.
  { ignores: ["src/generated/**", "prisma/migrations/**"] },
];
