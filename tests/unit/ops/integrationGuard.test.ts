import { describe, expect, it } from "vitest";
import {
  IntegrationGuardError,
  assertSafeTestTarget,
  readGuardInputFromEnv,
  type GuardInput,
} from "../../integration/support/guard";

const TEST_REF = "abcdefghijklmnopqrst";
const PROD_REF = "uvwxyzabcdefghijklmn";

function jwtWithRef(ref: string): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ ref, role: "anon" })}.assinatura`;
}

function validInput(overrides: GuardInput = {}): GuardInput {
  return {
    testUrl: `https://${TEST_REF}.supabase.co`,
    testProjectRef: TEST_REF,
    allowlist: TEST_REF,
    productionRef: PROD_REF,
    productionUrls: [`https://${PROD_REF}.supabase.co`],
    keys: [],
    ...overrides,
  };
}

function reasonOf(input: GuardInput): string {
  try {
    assertSafeTestTarget(input);
  } catch (error) {
    expect(error).toBeInstanceOf(IntegrationGuardError);
    return (error as IntegrationGuardError).reason;
  }
  throw new Error("a guarda deveria ter recusado");
}

describe("guarda anti-produção (T-OPS-U01)", () => {
  it("aceita um alvo de teste válido e devolve o ref", () => {
    expect(assertSafeTestTarget(validInput())).toEqual({ projectRef: TEST_REF });
  });

  it("recusa quando falta a URL de teste", () => {
    expect(reasonOf(validInput({ testUrl: undefined }))).toBe("missing_test_url");
  });

  it("recusa quando falta o ref do projeto de teste", () => {
    expect(reasonOf(validInput({ testProjectRef: "  " }))).toBe("missing_test_ref");
  });

  it("recusa allowlist vazia", () => {
    expect(reasonOf(validInput({ allowlist: " , " }))).toBe("missing_allowlist");
  });

  it("recusa quando o ref de produção não foi declarado", () => {
    expect(reasonOf(validInput({ productionRef: undefined }))).toBe("missing_production_ref");
  });

  it("recusa URL que não seja https", () => {
    expect(reasonOf(validInput({ testUrl: `http://${TEST_REF}.supabase.co` }))).toBe("invalid_url");
  });

  it("recusa host que não seja <ref>.supabase.co (domínio próprio, localhost)", () => {
    expect(reasonOf(validInput({ testUrl: "https://db.rc2solucoes.com.br" }))).toBe("invalid_url");
    expect(reasonOf(validInput({ testUrl: "https://localhost:54321" }))).toBe("invalid_url");
  });

  it("recusa quando o ref informado difere do ref da URL", () => {
    expect(reasonOf(validInput({ testProjectRef: "zzzzzzzzzzzzzzzzzzzz", allowlist: "zzzzzzzzzzzzzzzzzzzz" }))).toBe(
      "ref_mismatch",
    );
  });

  it("recusa ref fora da allowlist", () => {
    expect(reasonOf(validInput({ allowlist: "outroprojetodeteste1" }))).toBe("not_allowlisted");
  });

  it("recusa quando o ref de teste é o de produção, mesmo que esteja na allowlist", () => {
    expect(
      reasonOf(
        validInput({
          testUrl: `https://${PROD_REF}.supabase.co`,
          testProjectRef: PROD_REF,
          allowlist: PROD_REF,
        }),
      ),
    ).toBe("is_production");
  });

  it("recusa quando a URL coincide com NEXT_PUBLIC_SUPABASE_URL de produção", () => {
    expect(
      reasonOf(
        validInput({
          productionRef: "naoeoprodutoreal0000",
          productionUrls: [`https://${TEST_REF}.supabase.co`],
        }),
      ),
    ).toBe("is_production");
  });

  it("recusa chave JWT cujo ref pertence a outro projeto", () => {
    expect(reasonOf(validInput({ keys: [jwtWithRef(PROD_REF)] }))).toBe("key_ref_mismatch");
  });

  it("ignora chaves que não são JWT (limitação documentada) e aceita JWT do próprio projeto", () => {
    // Chaves opacas (sb_publishable_/sb_secret_) não carregam o ref: a guarda não as
    // inspeciona. A verificação independente humana e o marcador cobrem esse caso.
    expect(
      assertSafeTestTarget(validInput({ keys: ["sb_secret_exemplo", undefined, jwtWithRef(TEST_REF)] })),
    ).toEqual({ projectRef: TEST_REF });
  });

  it("nunca inclui chaves nem URL na mensagem de erro", () => {
    const secret = jwtWithRef(PROD_REF);
    try {
      assertSafeTestTarget(validInput({ keys: [secret] }));
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain(secret);
      expect(message).not.toContain(".supabase.co");
    }
  });

  it("mapeia as variáveis de ambiente para a entrada da guarda", () => {
    expect(
      readGuardInputFromEnv({
        RC2_TEST_SUPABASE_URL: "u",
        RC2_TEST_PROJECT_REF: "r",
        RC2_TEST_PROJECT_REF_ALLOWLIST: "a",
        RC2_PRODUCTION_PROJECT_REF: "p",
        NEXT_PUBLIC_SUPABASE_URL: "n",
        RC2_TEST_SUPABASE_ANON_KEY: "k1",
        RC2_TEST_SUPABASE_SERVICE_ROLE_KEY: "k2",
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual({
      testUrl: "u",
      testProjectRef: "r",
      allowlist: "a",
      productionRef: "p",
      productionUrls: ["n"],
      keys: ["k1", "k2"],
    });
  });
});
