import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Flat config for Next.js 16 (next lint was removed in v16).
 * The design deliberately uses raw <img> tags for logotype cards and
 * cinematic frames (CSS-only filters: invert, grayscale, scale) and for
 * the hero stills that are already streamed to canvas by the Hero, so
 * @next/next/no-img-element is disabled for those exact elements.
 */
const eslintConfig = defineConfig([
  globalIgnores([
    "**/node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "opendesign/**",
    ".opencode/**",
    "public/**"
  ]),
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "@next/next/no-page-custom-font": "off"
    }
  }
]);

export default eslintConfig;
