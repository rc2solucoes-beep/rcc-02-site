import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CleanupRegistry, runTeardownPhases } from "../../integration/support/cleanup";
import { HarnessError, describeError, sanitizeThrown } from "../../integration/support/errors";
import { IntegrationGuardError } from "../../integration/support/guard";
import { check } from "../../integration/support/probes";

// Credenciais FICTÍCIAS.
const SECRETS = [
  "eyJhbGciOiJIUzI1NiJ9.FICTICIO.assinatura",
  "sb_secret_FICTICIO_123",
  "Bearer token-ficticio",
  "SEGREDO_FICTICIO",
  "https://abc.supabase.co/rest/v1/x?apikey=SEGREDO_FICTICIO",
];
const HOSTILE = SECRETS.join(" ");

function expectClean(text: string): void {
  for (const secret of SECRETS) expect(text).not.toContain(secret);
  expect(text).not.toContain("Bearer");
  expect(text).not.toContain("apikey");
}

describe("describeError: nunca reproduz conteúdo externo", () => {
  it("Error com credenciais na mensagem", () => {
    expectClean(describeError(new Error(HOSTILE)));
    expect(describeError(new Error(HOSTILE))).toBe("excecao:Error");
  });

  it("nome de classe fora da lista fechada vira 'nao_classificado' (o nome também é externo)", () => {
    const error = new Error("x");
    error.name = HOSTILE;
    expect(describeError(error)).toBe("excecao:nao_classificado");
  });

  it("código arbitrário (inclusive uma chave no campo code) é descartado; códigos conhecidos são mantidos", () => {
    expect(describeError({ message: HOSTILE, code: "sb_secret_FICTICIO_123" })).toBe("excecao:nao_classificado");
    expect(describeError({ code: "42501" })).toBe("excecao:nao_classificado;codigo=42501");
    expect(describeError({ code: "PGRST116", status: 406 })).toBe("excecao:nao_classificado;codigo=PGRST116;http=406");
    expect(describeError({ name: "AuthApiError", code: "user_already_exists", status: 422 })).toBe(
      "excecao:AuthApiError;codigo=user_already_exists;http=422",
    );
    expect(describeError({ name: "TypeError", cause: { code: "ECONNREFUSED", message: HOSTILE } })).toBe(
      "excecao:TypeError;codigo=ECONNREFUSED",
    );
  });

  it("códigos de sistema: só a lista fechada passa; padrões 'E...' arbitrários são rejeitados", () => {
    for (const code of ["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "EAI_AGAIN", "UND_ERR_CONNECT_TIMEOUT"]) {
      expect(describeError({ name: "TypeError", cause: { code } })).toBe(`excecao:TypeError;codigo=${code}`);
      expect(describeError({ code })).toBe(`excecao:nao_classificado;codigo=${code}`);
    }
    for (const code of [
      "EAPIKEY_SECRET123",
      "EACCESS_TOKEN_2026",
      "ECONNREFUSED_sb_secret_FICTICIO",
      "ECONNREFUSED2",
      "econnrefused",
      "EUNKNOWN",
      "EXYZ",
      "E",
      "ESEGREDO_FICTICIO",
    ]) {
      const direct = describeError({ message: HOSTILE, code });
      const nested = describeError({ name: "TypeError", cause: { code, message: HOSTILE } });
      expect(direct).toBe("excecao:nao_classificado");
      expect(nested).toBe("excecao:TypeError");
      for (const text of [direct, nested]) {
        if (code.length > 4) expect(text).not.toContain(code);
        expectClean(text);
      }
    }
  });

  it("código arbitrário no pipeline de limpeza: relatório e exceção final não reproduzem o valor", async () => {
    const registry = new CleanupRegistry();
    registry.track("posts", "id", "a");
    const service = {
      from: () => ({
        delete: () => ({ eq: async () => ({ error: { code: "EAPIKEY_SECRET123", message: HOSTILE } }) }),
        select: () => ({ eq: () => Promise.reject(Object.assign(new Error(HOSTILE), { code: "EACCESS_TOKEN_2026" })) }),
      }),
    } as unknown as SupabaseClient;
    const text = [...(await registry.run(service)), ...(await registry.inspectResidue(service))].join(" | ");
    expect(text.length).toBeGreaterThan(0);
    for (const leaked of ["EAPIKEY_SECRET123", "EACCESS_TOKEN_2026"]) expect(text).not.toContain(leaked);
    expectClean(text);
    expect(sanitizeThrown(Object.assign(new Error(HOSTILE), { code: "EACCESS_TOKEN_2026" }), "ctx").message).toBe(
      "ctx: excecao:Error",
    );
  });

  it("status fora de 100-599 ou não numérico é ignorado", () => {
    expect(describeError({ status: "500; apikey=x" })).toBe("excecao:nao_classificado");
    expect(describeError({ status: 99999 })).toBe("excecao:nao_classificado");
  });

  it("primitivos, strings e nulos", () => {
    for (const value of [HOSTILE, null, undefined, 42]) expect(describeError(value)).toBe("excecao:nao_classificado");
  });

  it("preserva o motivo conhecido de IntegrationGuardError", () => {
    expect(describeError(new IntegrationGuardError("target_changed"))).toBe("guarda:target_changed");
    expect(describeError(new IntegrationGuardError("is_production"))).toBe("guarda:is_production");
  });
});

describe("sanitizeThrown", () => {
  it("mantém guarda e erros do próprio harness; reduz qualquer outro e não anexa a causa", () => {
    const guard = new IntegrationGuardError("missing_marker");
    expect(sanitizeThrown(guard, "ctx")).toBe(guard);
    const own = new HarnessError("mensagem controlada");
    expect(sanitizeThrown(own, "ctx")).toBe(own);

    const reduced = sanitizeThrown(new Error(HOSTILE), "setup");
    expect(reduced.message).toBe("setup: excecao:Error");
    expect((reduced as Error & { cause?: unknown }).cause).toBeUndefined();
    expectClean(reduced.message);
  });
});

describe("CleanupRegistry e fases: erros hostis não vazam", () => {
  function hostileService(mode: "throw" | "return") {
    const failure = () =>
      mode === "throw"
        ? Promise.reject(new Error(HOSTILE))
        : Promise.resolve({ data: null, error: { message: HOSTILE, code: HOSTILE } });
    return {
      from: () => ({
        delete: () => ({ eq: failure }),
        select: () => ({ eq: failure }),
      }),
    } as unknown as SupabaseClient;
  }

  for (const mode of ["throw", "return"] as const) {
    it(`run e inspectResidue (${mode})`, async () => {
      const registry = new CleanupRegistry();
      registry.track("posts", "id", "a");
      const text = [
        ...(await registry.run(hostileService(mode))),
        ...(await registry.inspectResidue(hostileService(mode))),
      ].join(" | ");
      expect(text.length).toBeGreaterThan(0);
      expectClean(text);
    });
  }

  it("runTeardownPhases com fase que lança erro hostil", async () => {
    const problems = await runTeardownPhases([
      {
        name: "x",
        run: async () => {
          throw new Error(HOSTILE);
        },
        evidence: () => ["posts.id=a"],
      },
    ]);
    expect(problems.join(" | ")).toContain("posts.id=a");
    expectClean(problems.join(" | "));
  });
});

describe("check(): observação que lança é registrada e propagada sem conteúdo externo", () => {
  it("propaga erro sanitizado", async () => {
    const error = await check({
      table: "posts",
      role: "anon",
      operation: "SELECT",
      expected: "allow",
      observe: async () => {
        throw new Error(HOSTILE);
      },
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    const message = (error as Error).message;
    expect(message).toBe("observação falhou em posts/anon/SELECT: excecao:Error");
    expectClean(message);
  });
});
