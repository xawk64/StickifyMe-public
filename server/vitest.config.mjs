import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.mjs"],
    setupFiles: ["./tests/setup-env.mjs"],
    testTimeout: 20000,
    hookTimeout: 60000,
    coverage: {
      provider: "v8",
      include: ["dist/**"],
      reporter: ["text-summary", "html"],
    },
  },
});
