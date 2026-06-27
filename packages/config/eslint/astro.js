// @ts-check
import astro from "eslint-plugin-astro";
import baseConfig from "./base.js";

/** Flat ESLint config for the Astro website (TS + .astro + React islands). */
export default [...baseConfig, ...astro.configs.recommended];
