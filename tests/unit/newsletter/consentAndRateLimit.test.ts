import { describe, expect, it } from "vitest";
import { CONSENT_TEXT_VERSION, consentIpHash, isCurrentConsentVersion, sanitizeSourcePath } from "@/lib/newsletter/consent";
import {
  checkNewsletterRateLimit,
  NEWSLETTER_BUCKETS,
  newsletterRateLimitKey,
  recordInvalidTokenAttempt,
} from "@/lib/newsletter/rateLimit";
import { RateLimitConfigError, RateLimitStoreError, type RateLimitClient } from "@/lib/security/rateLimit";

const env = { RATE_LIMIT_PEPPER: "p".repeat(40) };

function fakeClient(allowedFor: (key: string) => boolean = () => true) {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const client: RateLimitClient = {
    rpc: async (fn, args) => {
      calls.push({ fn, args });
      return { data: [{ allowed: allowedFor(String(args.p_key)), count: 1, reset_at: "2026-10-27T14:00:00Z" }], error: null };
    },
  };
  return { client, calls };
}

const bucketOf = (call: { args: Record<string, unknown> }) => String(call.args.p_key).split(":").slice(0, 3).join(":");

describe("consentimento", () => {
  it("só aceita a versão vigente do servidor", () => {
    expect(isCurrentConsentVersion(CONSENT_TEXT_VERSION)).toBe(true);
    for (const v of ["", "draft-0", undefined, null, 1]) expect(isCurrentConsentVersion(v)).toBe(false);
  });

  it("source_path: só o caminho, sem query nem fragmento, até 200 caracteres", () => {
    expect(sanitizeSourcePath("/blog/post?utm=x#a")).toBe("/blog/post");
    expect(sanitizeSourcePath("/" + "a".repeat(500))).toHaveLength(200);
  });

  it("ip_hash: HMAC com pepper e prefixo; não contém o IP e exige pepper válido", () => {
    const hash = consentIpHash("203.0.113.9", env);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("203.0.113.9");
    expect(consentIpHash("203.0.113.9", { RATE_LIMIT_PEPPER: "q".repeat(40) })).not.toBe(hash);
    expect(() => consentIpHash("203.0.113.9", {})).toThrow(RateLimitConfigError);
  });
});

describe("rate limit da newsletter (integra a E0c)", () => {
  it("buckets e limites iniciais do SDD (PRP-02)", () => {
    expect(NEWSLETTER_BUCKETS).toEqual({
      "nl:sub:ip": { limit: 5, windowSeconds: 3600 },
      "nl:sub:email": { limit: 3, windowSeconds: 86400 },
      "nl:unreq:ip": { limit: 5, windowSeconds: 3600 },
      "nl:unreq:email": { limit: 3, windowSeconds: 86400 },
      "nl:tok:ip": { limit: 30, windowSeconds: 3600 },
    });
  });

  it("chaves HMAC: prefixo do bucket, e-mail normalizado, valor nunca em texto aberto", () => {
    const pepper = "x".repeat(32);
    const a = newsletterRateLimitKey("nl:sub:email", "  Pessoa@Exemplo.COM ", pepper);
    expect(a).toBe(newsletterRateLimitKey("nl:sub:email", "pessoa@exemplo.com", pepper));
    expect(a).toMatch(/^nl:sub:email:[0-9a-f]{64}$/);
    expect(a).not.toContain("exemplo");
    expect(newsletterRateLimitKey("nl:sub:ip", "203.0.113.9", pepper)).not.toContain("203.0.113.9");
  });

  it("inscrição: chama rate_limit_hit para e-mail e IP; sem IP, só e-mail", async () => {
    const withIp = fakeClient();
    await checkNewsletterRateLimit(withIp.client, "subscribe", { email: "a@b.com", ip: "203.0.113.9" }, env);
    expect(withIp.calls.map(bucketOf)).toEqual(["nl:sub:email", "nl:sub:ip"]);
    expect(withIp.calls.every((c) => c.fn === "rate_limit_hit")).toBe(true);
    const noIp = fakeClient();
    await checkNewsletterRateLimit(noIp.client, "subscribe", { email: "a@b.com", ip: null }, env);
    expect(noIp.calls).toHaveLength(1);
  });

  it("estouro de um bucket nega, e o outro continua sendo incrementado (rejeitadas também contam)", async () => {
    const { client, calls } = fakeClient((key) => !key.startsWith("nl:sub:email"));
    const result = await checkNewsletterRateLimit(client, "subscribe", { email: "a@b.com", ip: "203.0.113.9" }, env);
    expect(result.allowed).toBe(false);
    expect(calls).toHaveLength(2);
  });

  it("pedido de descadastro usa buckets próprios (nl:unreq)", async () => {
    const { client, calls } = fakeClient();
    await checkNewsletterRateLimit(client, "unsubscribe_request", { email: "a@b.com", ip: "203.0.113.9" }, env);
    expect(calls.map(bucketOf)).toEqual(["nl:unreq:email", "nl:unreq:ip"]);
  });

  it("falha fechada: pepper ausente e erro do banco lançam", async () => {
    const { client } = fakeClient();
    await expect(checkNewsletterRateLimit(client, "subscribe", { email: "a@b.com", ip: null }, {})).rejects.toBeInstanceOf(RateLimitConfigError);
    const broken: RateLimitClient = { rpc: async () => ({ data: null, error: { message: "boom" } }) };
    await expect(checkNewsletterRateLimit(broken, "subscribe", { email: "a@b.com", ip: null }, env)).rejects.toBeInstanceOf(RateLimitStoreError);
  });

  it("token inválido conta em nl:tok:ip; sem IP não conta", async () => {
    const { client, calls } = fakeClient();
    const decision = await recordInvalidTokenAttempt(client, "203.0.113.9", env);
    expect(decision?.allowed).toBe(true);
    expect(calls).toHaveLength(1);
    expect(String(calls[0].args.p_key)).toMatch(/^nl:tok:ip:/);
    expect(calls[0].args.p_limit).toBe(30);
    const none = fakeClient();
    expect(await recordInvalidTokenAttempt(none.client, null, env)).toBeNull();
    expect(none.calls).toHaveLength(0);
  });
});
