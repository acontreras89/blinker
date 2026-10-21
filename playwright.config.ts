import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const PORT = 3100;

const testDir = defineBddConfig({
  features: "e2e/features/**/*.feature",
  steps: "e2e/steps/**/*.ts",
});

export default defineConfig({
  testDir,
  use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    // Never reuse: a stale server from another agent fails fast instead of
    // silently testing old code.
    reuseExistingServer: false,
    timeout: 180_000,
    // Fresh database per run; unique emails keep scenarios independent.
    env: {
      DATABASE_URL: `data/e2e-${Date.now()}.db`,
      BETTER_AUTH_SECRET: "e2e-secret-at-least-32-characters-long",
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
      AUTH_RATE_LIMIT: "off",
      E2E_SEED: "on",
    },
  },
});
