import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // The backend stays framework-agnostic (ADR-0005).
    files: ["src/server/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["next", "next/*", "@/app/*", "@/components/*", "@/lib/*"],
              message: "src/server must not depend on Next or the frontend.",
            },
          ],
        },
      ],
    },
  },
  {
    // The frontend reaches the backend only through the in-process client.
    files: ["src/app/**", "src/components/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/server/*"], message: "Use @/lib/api instead." },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".features-gen/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
