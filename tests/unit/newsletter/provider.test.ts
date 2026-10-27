import { describe, expect, it } from "vitest";
import {
  PROVIDER_ERROR_CODES,
  ResendProvider,
  ScriptedProvider,
  classifyProviderError,
  createProviderFromEnv,
  failure,
  toProviderErrorCode,
  type FailureClass,
  type OutgoingEmail,
  type ProviderErrorCode,
} from "@/lib/newsletter/provider";

// T-NL-U05 (SDD §17, classificação do §8.3) e adaptador do Resend com cliente simulado.
const message: OutgoingEmail = {
  from: "RC2 Soluções <newsletter@rc2solucoes.com.br>",
  to: "pessoa@example.com",
  replyTo: "contato@rc2solucoes.com.br",
  subject: "Assunto",
  html: "<p>x</p>",
  text: "x",
  headers: { "List-Unsubscribe": "<https://example.com/u>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
};
const options = { idempotencyKey: "nl-abc", timeoutMs: 40 };

describe("classificação dos códigos do provedor (SDD §8.3)", () => {
  const expected: Record<FailureClass, ProviderErrorCode[]> = {
    permanent: ["validation_error", "invalid_from_address", "invalid_parameter", "missing_required_field", "missing_api_key", "invalid_api_key", "restricted_api_key", "invalid_access", "security_error"],
    transient: ["rate_limit_exceeded", "daily_quota_exceeded", "monthly_quota_exceeded"],
    concurrent: ["concurrent_idempotent_requests"],
    bug: ["invalid_idempotent_request"],
    ambiguous: ["application_error", "internal_server_error", "network_error", "timeout", "aborted", "process_crash", "unknown"],
  };

  it.each(Object.entries(expected))("%s", (cls, codes) => {
    for (const code of codes) expect(classifyProviderError(code), code).toBe(cls);
  });

  it("todo código da lista fechada está classificado (a lista é a do CHECK do banco)", () => {
    const all = Object.values(expected).flat().sort();
    expect([...PROVIDER_ERROR_CODES].sort()).toEqual(all);
  });

  it("nome desconhecido ou status 5xx/429 não escapa da lista fechada", () => {
    expect(toProviderErrorCode("rate_limit_exceeded")).toBe("rate_limit_exceeded");
    expect(toProviderErrorCode("algo_novo", 503)).toBe("internal_server_error");
    expect(toProviderErrorCode("algo_novo", 429)).toBe("rate_limit_exceeded");
    expect(toProviderErrorCode("algo_novo", 400)).toBe("unknown");
    expect(toProviderErrorCode(undefined)).toBe("unknown");
    expect(classifyProviderError(toProviderErrorCode("algo_novo"))).toBe("ambiguous");
  });
});

describe("ResendProvider (cliente simulado, sem rede)", () => {
  const client = (impl: () => Promise<{ data: { id?: string } | null; error: { name?: unknown; statusCode?: number | null } | null }>) => {
    const sent: Array<{ payload: Record<string, unknown>; options?: { idempotencyKey?: string } }> = [];
    return {
      sent,
      api: { emails: { send: async (payload: never, opts?: { idempotencyKey?: string }) => { sent.push({ payload: payload as never, options: opts }); return impl(); } } },
    };
  };

  it("sucesso: devolve o id e envia chave de idempotência, cabeçalhos RFC 8058 e Reply-To", async () => {
    const c = client(async () => ({ data: { id: "re_123" }, error: null }));
    const result = await new ResendProvider("k", c.api).send(message, options);
    expect(result).toEqual({ ok: true, messageId: "re_123" });
    expect(c.sent[0].options).toEqual({ idempotencyKey: "nl-abc" });
    expect(c.sent[0].payload).toMatchObject({ to: message.to, from: message.from, replyTo: message.replyTo, headers: message.headers });
    expect(Object.keys(c.sent[0].payload)).not.toContain("tags"); // sem metadados de rastreamento
  });

  it("erro do provedor vira código da lista fechada e classe", async () => {
    const r = await new ResendProvider("k", client(async () => ({ data: null, error: { name: "invalid_api_key", statusCode: 403 } })).api).send(message, options);
    expect(r).toEqual({ ok: false, code: "invalid_api_key", failure: "permanent" });
    const q = await new ResendProvider("k", client(async () => ({ data: null, error: { name: "daily_quota_exceeded", statusCode: 429 } })).api).send(message, options);
    expect(q).toMatchObject({ ok: false, code: "daily_quota_exceeded", failure: "transient" });
  });

  it("resposta sem id é ambígua; exceção de rede também", async () => {
    const noId = await new ResendProvider("k", client(async () => ({ data: {}, error: null })).api).send(message, options);
    expect(noId).toMatchObject({ ok: false, failure: "ambiguous" });
    const thrown = await new ResendProvider("k", client(async () => { throw new Error("socket"); }).api).send(message, options);
    expect(thrown).toEqual({ ok: false, code: "network_error", failure: "ambiguous" });
  });

  it("sem resposta dentro de T: timeout (ambíguo)", async () => {
    const hang = client(() => new Promise(() => {}));
    const r = await new ResendProvider("k", hang.api).send(message, options);
    expect(r).toEqual({ ok: false, code: "timeout", failure: "ambiguous" });
  });
});

describe("adaptador simulado e criação a partir do ambiente", () => {
  it("ScriptedProvider devolve os passos na ordem e repete o último; registra as chamadas", async () => {
    const p = new ScriptedProvider([failure("rate_limit_exceeded"), { ok: true, messageId: "m" }]);
    expect(await p.send(message, options)).toMatchObject({ ok: false, code: "rate_limit_exceeded" });
    expect(await p.send(message, options)).toEqual({ ok: true, messageId: "m" });
    expect(await p.send(message, options)).toEqual({ ok: true, messageId: "m" });
    expect(p.calls).toHaveLength(3);
  });

  it("sem RESEND_API_KEY (ou placeholder) não há provedor: o dispatch recusa antes de reivindicar", () => {
    expect(createProviderFromEnv({})).toBeNull();
    expect(createProviderFromEnv({ RESEND_API_KEY: "xxxx" })).toBeNull();
    expect(createProviderFromEnv({ RESEND_API_KEY: "  " })).toBeNull();
    expect(createProviderFromEnv({ RESEND_API_KEY: "re_fake_para_teste" })).not.toBeNull(); // só constrói; não envia
  });
});
