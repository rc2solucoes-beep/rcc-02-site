import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IntegrationGuardError } from "../../integration/support/guard";
import { loadTestEnvFile } from "../../integration/support/env";

const KEY_A = "RC2_E0A_ENVTEST_A";
const KEY_B = "RC2_E0A_ENVTEST_B";

let dir: string;
let file: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "e0a-env-"));
  file = join(dir, ".env.test.local");
  delete process.env[KEY_A];
  delete process.env[KEY_B];
});

afterEach(() => {
  delete process.env[KEY_A];
  delete process.env[KEY_B];
  rmSync(dir, { recursive: true, force: true });
});

describe("loadTestEnvFile: variáveis efetivas versus arquivo de teste", () => {
  it("sem arquivo, não faz nada e não falha", () => {
    expect(() => loadTestEnvFile(join(dir, "inexistente"))).not.toThrow();
  });

  it("carrega do arquivo as variáveis ainda não definidas", () => {
    writeFileSync(file, `${KEY_A}=valor-a\n${KEY_B}=valor-b\n`);
    loadTestEnvFile(file);
    expect(process.env[KEY_A]).toBe("valor-a");
    expect(process.env[KEY_B]).toBe("valor-b");
  });

  it("aceita variável já definida com o MESMO valor do arquivo", () => {
    writeFileSync(file, `${KEY_A}=igual\n`);
    process.env[KEY_A] = "igual";
    expect(() => loadTestEnvFile(file)).not.toThrow();
  });

  it("recusa (env_conflict) quando uma variável do processo contradiz o arquivo", () => {
    writeFileSync(file, `${KEY_A}=do-arquivo\n`);
    process.env[KEY_A] = "do-shell";
    try {
      loadTestEnvFile(file);
      throw new Error("deveria ter recusado");
    } catch (error) {
      expect(error).toBeInstanceOf(IntegrationGuardError);
      expect((error as IntegrationGuardError).reason).toBe("env_conflict");
      // a mensagem nunca revela nomes nem valores
      expect((error as Error).message).not.toContain("do-shell");
      expect((error as Error).message).not.toContain(KEY_A);
    }
  });
});
