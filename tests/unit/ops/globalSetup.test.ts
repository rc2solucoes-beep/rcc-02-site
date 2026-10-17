import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("carga do env e globalSetup da suíte de integração", () => {
  it("carrega somente .env.test.local, nunca .env.local nem dotenv", () => {
    const env = read("tests/integration/support/env.ts");
    expect(env).toContain('path: string = ".env.test.local"');
    expect(env).toContain("process.loadEnvFile(path)");
    expect(env).not.toMatch(/["'`]\.env\.local["'`]/);
    expect(env).not.toMatch(/dotenv/i);
  });

  it("o globalSetup carrega o env e valida o alvo, nesta ordem, sem abrir conexão", () => {
    const setup = read("tests/integration/support/globalSetup.ts");
    const loadIndex = setup.indexOf("loadTestEnvFile(");
    const targetIndex = setup.indexOf("getVerifiedTarget(");
    expect(loadIndex).toBeGreaterThan(-1);
    expect(targetIndex).toBeGreaterThan(loadIndex);
    expect(setup).not.toMatch(/createClient|fetch\(/);
  });
});
