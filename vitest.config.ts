import { defineConfig } from "vitest/config";

// separate from vite.config.ts so tests don't boot the tanstack start plugin
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { include: ["src/**/*.test.ts"] },
});
