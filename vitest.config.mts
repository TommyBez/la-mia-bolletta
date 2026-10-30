import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { defineConfig } from "vitest/config";

nextEnv.loadEnvConfig(process.cwd());

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./tests/setup-isolated-database.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    sequence: { hooks: "stack" },
  },
});
