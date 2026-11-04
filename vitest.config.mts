import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false,
    env: { DATABASE_URL: process.env.DATABASE_URL_TEST ?? "postgresql://fmf:fmf@localhost:5432/fixmyfreedom_test" },
  },
});
