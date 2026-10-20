import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AMBIENT_ENV_NAMES,
  E2E_BASE_URL,
  E2E_PORT,
  NEUTRALIZED_ENV_NAMES,
  SUPABASE_ENV_NAMES,
  SYNTHETIC_ENV_NAMES,
  allowedSupabaseHost,
  buildIsolatedServerEnv,
} from "../../e2e-support/isolatedEnv";
import { isForeignSupabaseHost } from "../../e2e-support/supabaseGuard";

// EX-4: o E2E isolado não pode usar o Supabase de produção. Tudo aqui é local, sem rede e sem
// iniciar navegador ou servidor.

vi.mock("../../integration/support/env", () => ({ loadTestEnvFile: () => {} }));

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

// Valores sintéticos: refs de 20 letras e chaves opacas, nada real.
const TEST_REF = "abcdefghijklmnopqrst";
const PROD_REF = "zyxwvutsrqponmlkjihg";
const SNAPSHOT_KEYS = [
  "RC2_TEST_SUPABASE_URL",
  "RC2_TEST_PROJECT_REF",
  "RC2_TEST_PROJECT_REF_ALLOWLIST",
  "RC2_PRODUCTION_PROJECT_REF",
  "RC2_TEST_SUPABASE_ANON_KEY",
  "RC2_TEST_SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "RC2_E2E_ISOLATED",
];

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

describe("ambiente do servidor do E2E isolado", () => {
  it("usa só o alvo verificado para o Supabase e valores neutros para o resto", () => {
    const env = buildIsolatedServerEnv({ url: `https://${TEST_REF}.supabase.co`, anonKey: "anon-sintetica", serviceKey: "service-sintetica" });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(`https://${TEST_REF}.supabase.co`);
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-sintetica");
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("service-sintetica");
    expect(env.RESEND_API_KEY).toBe("e2e-isolated-disabled");
    expect(env.NEXT_PUBLIC_SITE_URL).toBe(E2E_BASE_URL);
    for (const value of Object.values(env)) expect(value).not.toBe("");
  });

  it("cobre TODA variável de ambiente lida em src/ e as documentadas em .env.example", () => {
    const covered = new Set<string>([...NEUTRALIZED_ENV_NAMES, ...SYNTHETIC_ENV_NAMES, ...SUPABASE_ENV_NAMES, ...AMBIENT_ENV_NAMES]);
    const used = new Set<string>();
    for (const file of listFiles(resolve(root, "src")).filter((f) => /\.(ts|tsx)$/.test(f))) {
      for (const match of readFileSync(file, "utf8").matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) used.add(match[1]);
    }
    const documented = [...read(".env.example").matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]).filter((n) => !n.startsWith("RC2_"));
    const missing = [...new Set([...used, ...documented])].filter((name) => !covered.has(name));
    // Se este teste falhar, uma variável nova pode vir do .env.local (produção): cubra-a em isolatedEnv.ts.
    expect(missing).toEqual([]);
  });

  it("o host permitido sai da URL do alvo e hosts do Supabase de outro projeto são bloqueados", () => {
    const host = allowedSupabaseHost({ url: `https://${TEST_REF}.supabase.co` });
    expect(host).toBe(`${TEST_REF}.supabase.co`);
    expect(isForeignSupabaseHost(`${TEST_REF}.supabase.co`, host)).toBe(false);
    expect(isForeignSupabaseHost(`${PROD_REF}.supabase.co`, host)).toBe(true);
    expect(isForeignSupabaseHost(`${PROD_REF}.supabase.co:443`, host)).toBe(true);
    expect(isForeignSupabaseHost("localhost:3100", host)).toBe(false);
    expect(isForeignSupabaseHost("example.com", host)).toBe(false);
  });
});

describe("playwright.isolated.config.ts (comportamento)", () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const key of SNAPSHOT_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    process.env.RC2_E2E_ISOLATED = "1";
    process.env.RC2_TEST_SUPABASE_URL = `https://${TEST_REF}.supabase.co`;
    process.env.RC2_TEST_PROJECT_REF = TEST_REF;
    process.env.RC2_TEST_PROJECT_REF_ALLOWLIST = TEST_REF;
    process.env.RC2_PRODUCTION_PROJECT_REF = PROD_REF;
    process.env.RC2_TEST_SUPABASE_ANON_KEY = "anon-sintetica";
    process.env.RC2_TEST_SUPABASE_SERVICE_ROLE_KEY = "service-sintetica";
    vi.resetModules();
  });
  afterEach(() => {
    for (const key of SNAPSHOT_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    delete process.env.RC2_E2E_SUPABASE_HOST;
  });

  it("com alvo válido: porta própria, sem reaproveitar servidor e com o ambiente explícito", async () => {
    const config = (await import("../../../playwright.isolated.config")).default;
    expect(config.webServer).toMatchObject({ reuseExistingServer: false, url: E2E_BASE_URL });
    expect(String((config.webServer as { command: string }).command)).toContain(`-p ${E2E_PORT}`);
    const env = (config.webServer as { env: Record<string, string> }).env;
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(`https://${TEST_REF}.supabase.co`);
    expect(config.use).toMatchObject({ baseURL: E2E_BASE_URL, trace: "off", screenshot: "off", video: "off" });
    expect(config.workers).toBe(1);
    expect(process.env.RC2_E2E_SUPABASE_HOST).toBe(`${TEST_REF}.supabase.co`);
  });

  it("recusa antes de montar o servidor sem RC2_E2E_ISOLATED=1", async () => {
    delete process.env.RC2_E2E_ISOLATED;
    await expect(import("../../../playwright.isolated.config")).rejects.toThrow(/RC2_E2E_ISOLATED/);
  });

  it("recusa se o ref de produção for o do alvo", async () => {
    process.env.RC2_PRODUCTION_PROJECT_REF = TEST_REF;
    await expect(import("../../../playwright.isolated.config")).rejects.toThrow();
  });

  it("recusa se o NEXT_PUBLIC_SUPABASE_URL do shell apontar para o mesmo projeto tratado como produção", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${TEST_REF}.supabase.co`;
    await expect(import("../../../playwright.isolated.config")).rejects.toThrow();
  });

  it("recusa alvo fora da allowlist", async () => {
    process.env.RC2_TEST_PROJECT_REF_ALLOWLIST = PROD_REF;
    await expect(import("../../../playwright.isolated.config")).rejects.toThrow();
  });

  it("recusa URL de teste de outro projeto (ref divergente)", async () => {
    process.env.RC2_TEST_SUPABASE_URL = `https://${PROD_REF}.supabase.co`;
    await expect(import("../../../playwright.isolated.config")).rejects.toThrow();
  });
});

describe("contratos estáticos do E2E isolado", () => {
  it("a configuração padrão ignora o spec que escreve e o launcher o executa", () => {
    expect(read("playwright.config.ts")).toMatch(/testIgnore:\s*\/admin-posts-list/);
    expect(read("playwright.isolated.config.ts")).toMatch(/testMatch:\s*\/admin-posts-list/);
  });

  it("o launcher valida o alvo antes de defineConfig e nunca lê .env.local", () => {
    const config = read("playwright.isolated.config.ts");
    expect(config.indexOf("getVerifiedTarget(")).toBeGreaterThan(-1);
    expect(config.indexOf("getVerifiedTarget(")).toBeLessThan(config.indexOf("defineConfig({"));
    expect(config.indexOf("loadTestEnvFile(")).toBeLessThan(config.indexOf("getVerifiedTarget("));
    const code = config
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n");
    expect(code).not.toMatch(/["'`]\.env\.local["'`]/);
    expect(code).not.toContain("dotenv");
  });

  it("existe o script npm do E2E isolado e o padrão não o contém", () => {
    const scripts = JSON.parse(read("package.json")).scripts as Record<string, string>;
    expect(scripts["test:e2e:isolated"]).toBe("playwright test --config playwright.isolated.config.ts");
    expect(scripts["test:e2e"]).toBe("playwright test");
  });

  it("o setup registra antes de criar, semeia só com prefixo sintético e limpa por prefixo", () => {
    const setup = read("tests/e2e-support/isolatedGlobalSetup.ts");
    expect(setup).toContain("createRoleClients()");
    expect(setup).toContain("runTeardownPhases(");
    expect(setup.indexOf("registry.track(\"posts\"")).toBeLessThan(setup.indexOf(".insert(rows)"));
    expect(setup).toContain("e0a-e2e-");
    expect(setup).toMatch(/\.like\("slug", `\$\{prefix\}-%`\)/);
    expect(setup).toContain("return async () =>");
  });

  it("o spec só usa variáveis RC2_E2E_* do launcher e instala a guarda de rede do navegador", () => {
    const spec = read("tests/e2e/admin-posts-list.spec.ts");
    expect(spec).not.toMatch(/process\.env\.ADMIN_(EMAIL|PASSWORD)/);
    expect(spec).toContain("RC2_E2E_ADMIN_EMAIL");
    expect(spec).toContain("installSupabaseGuard(");
    expect(spec).toContain("T-CMS-E01");
    expect(spec).toContain("T-CMS-E05");
  });

  it("nenhum arquivo do E2E isolado contém segredos literais", () => {
    for (const file of ["playwright.isolated.config.ts", "tests/e2e/admin-posts-list.spec.ts", ...listFiles(resolve(root, "tests/e2e-support")).map((f) => f.slice(root.length + 1))]) {
      const text = read(file);
      expect(text, file).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
      expect(text, file).not.toMatch(/sb_(secret|publishable)_[A-Za-z0-9_-]{10,}/);
    }
  });
});
