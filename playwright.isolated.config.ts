import { defineConfig, devices } from "@playwright/test";
import { loadTestEnvFile } from "./tests/integration/support/env";
import { getVerifiedTarget } from "./tests/integration/support/target";
import { E2E_BASE_URL, E2E_PORT, allowedSupabaseHost, buildIsolatedServerEnv } from "./tests/e2e-support/isolatedEnv";

// E2E do CMS (EX-4) EXCLUSIVAMENTE contra o Supabase isolado.
//
// Esta configuração falha ANTES de iniciar o servidor se o alvo não passar na guarda anti-produção
// (URL, ref, allowlist, ref de produção, claims das chaves, conflito com o shell). O servidor
// recebe o ambiente explícito de `buildIsolatedServerEnv`, nunca depende de `.env.local`, usa uma
// porta própria e nunca reaproveita um servidor já em execução.
if (process.env.RC2_E2E_ISOLATED !== "1") {
  throw new Error("E2E isolado recusado: defina RC2_E2E_ISOLATED=1 (e use .env.test.local).");
}

loadTestEnvFile(); // somente .env.test.local; recusa variáveis divergentes do shell
const target = getVerifiedTarget(); // lança IntegrationGuardError se o alvo não for o isolado
process.env.RC2_E2E_SUPABASE_HOST = allowedSupabaseHost(target);

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /admin-posts-list\.spec\.ts/,
  globalSetup: "./tests/e2e-support/isolatedGlobalSetup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [["list"]],
  use: {
    baseURL: E2E_BASE_URL,
    // Sem trace, vídeo nem captura: a senha do admin sintético é digitada nos formulários.
    trace: "off",
    screenshot: "off",
    video: "off",
    actionTimeout: 10_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- -p ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: buildIsolatedServerEnv(target),
  },
});
