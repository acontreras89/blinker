import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.test.ts"],
    env: {
      DATABASE_URL: ":memory:",
      BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
    },
  },
});
