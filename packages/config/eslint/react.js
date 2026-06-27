// @ts-check
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import baseConfig from "./base.js";

/** Flat ESLint config for React-based workspaces (admin, ui). */
export default [
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx,jsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
