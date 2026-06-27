import react from "@strophic/config/eslint/react";

export default [
  ...react,
  // shadcn/ui components are vendored — don't lint generated component source.
  { ignores: ["src/components/ui/**", ".next/**"] },
];
