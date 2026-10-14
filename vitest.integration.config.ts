import { defineConfig } from "vitest/config";

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
});
