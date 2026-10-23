import { defineConfig } from "vitest/config";
import { resolve } from "path";

// Suíte de integração de RLS (RF-OPS-02). Só roda sob `npm run test:integration`
// e depois que a guarda anti-produção aprovar o alvo (globalSetup).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["./tests/integration/support/globalSetup.ts"],
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
  // Mesmo alias de vitest.config.ts: o teste da E1 importa módulos de src/ que usam "@/".
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
