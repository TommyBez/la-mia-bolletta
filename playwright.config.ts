import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180_000,
  expect: { timeout: 120_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "off",
    actionTimeout: 20000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  ...(!process.env.E2E_BASE_URL
    ? {
        webServer: {
          command: "pnpm dev --port 3100",
          url: "http://localhost:3100",
          reuseExistingServer: true,
        },
      }
    : {}),
});
