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
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? "postgresql://fmf:fmf@localhost:5432/fixmyfreedom_test",
      // Valores ficticios: los tests nunca llaman a Stripe.
      STRIPE_SECRET_KEY: "sk_test_ficticia_para_tests",
      STRIPE_WEBHOOK_SECRET: "whsec_ficticio_para_tests",
      STRIPE_PRICE_CONSERVADORA: "price_test_conservadora",
      STRIPE_PRICE_MODERADA: "price_test_moderada",
      STRIPE_PRICE_DINAMICA: "price_test_dinamica",
      STRIPE_TAX_ENABLED: "false",
      STRIPE_PORTAL_CONFIGURATION: "",
      APP_URL: "https://fixmyfreedom.test",
    },
  },
});
