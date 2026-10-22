import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

// The demo video (docs/plans/E9-01-demo.md): one scenario against real Stripe
// test mode. Needs a filled `.env` and `stripe login`; `stripe listen` is
// started here, forwarding to this server's port.
const PORT = 3300;
const URL = `http://localhost:${PORT}`;
const SIZE = { width: 1280, height: 720 };

const testDir = defineBddConfig({
  features: "e2e/demo/*.feature",
  steps: ["e2e/steps/**/*.ts", "e2e/demo/*.steps.ts"],
  // Apart from the suite's, or `pnpm test:e2e` would pick it up.
  outputDir: ".features-gen-demo",
});

export default defineConfig<{ typingDelay: number }>({
  testDir,
  outputDir: "test-results/demo",
  timeout: 10 * 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL: URL,
    viewport: SIZE,
    video: { mode: "on", size: SIZE },
    launchOptions: { slowMo: 300 },
    typingDelay: 60,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `pnpm build && pnpm start --port ${PORT}`,
      url: URL,
      reuseExistingServer: false,
      timeout: 180_000,
      // Real keys come from `.env`; a fresh database keeps the take clean.
      env: { DATABASE_URL: `data/demo-${Date.now()}.db`, BETTER_AUTH_URL: URL },
    },
    {
      command: `stripe listen --all-snapshot --forward-to localhost:${PORT}/api/webhooks/stripe`,
      wait: { stderr: /Ready!/ },
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
