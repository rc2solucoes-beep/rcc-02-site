import { describe, expect, it } from "vitest";
import { IntegrationGuardError } from "../../integration/support/guard";
import { getVerifiedTarget } from "../../integration/support/target";

const TEST_REF = "abcdefghijklmnopqrst";
const PROD_REF = "uvwxyzabcdefghijklmn";

function safeEnv(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    RC2_TEST_SUPABASE_URL: ` https://${TEST_REF}.supabase.co `,
    RC2_TEST_PROJECT_REF: TEST_REF,
    RC2_TEST_PROJECT_REF_ALLOWLIST: TEST_REF,
    RC2_PRODUCTION_PROJECT_REF: PROD_REF,
    RC2_TEST_SUPABASE_ANON_KEY: "anon-opaca",
    RC2_TEST_SUPABASE_SERVICE_ROLE_KEY: "service-opaca",
    ...overrides,
  } as unknown as NodeJS.ProcessEnv;
}

function reasonOf(env: NodeJS.ProcessEnv): string {
  try {
    getVerifiedTarget(env);
  } catch (error) {
    expect(error).toBeInstanceOf(IntegrationGuardError);
    return (error as IntegrationGuardError).reason;
  }
  throw new Error("deveria ter recusado");
}

describe("getVerifiedTarget", () => {
  it("devolve o alvo validado, com valores sem espaços", () => {
    const target = getVerifiedTarget(safeEnv());
    expect(target.projectRef).toBe(TEST_REF);
    expect(target.url).toBe(`https://${TEST_REF}.supabase.co`);
    expect(target.anonKey).toBe("anon-opaca");
    expect(target.serviceKey).toBe("service-opaca");
  });

  it("recusa um alvo que a guarda reconhece como produção", () => {
    expect(reasonOf(safeEnv({ RC2_PRODUCTION_PROJECT_REF: TEST_REF }))).toBe("is_production");
  });

  it("recusa quando falta qualquer chave", () => {
    expect(reasonOf(safeEnv({ RC2_TEST_SUPABASE_SERVICE_ROLE_KEY: undefined }))).toBe("missing_keys");
    expect(reasonOf(safeEnv({ RC2_TEST_SUPABASE_ANON_KEY: "  " }))).toBe("missing_keys");
  });

  it("revalida a cada chamada: mudar o ambiente depois de um sucesso é detectado", () => {
    const env = safeEnv();
    expect(getVerifiedTarget(env).projectRef).toBe(TEST_REF);
    env.RC2_PRODUCTION_PROJECT_REF = TEST_REF;
    expect(reasonOf(env)).toBe("is_production");
  });
});
