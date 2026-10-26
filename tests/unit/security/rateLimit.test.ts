import { describe, expect, it, vi } from "vitest";
import {
  CONTACT_RATE_LIMIT,
  CONTACT_RATE_WINDOW_SECONDS,
  RateLimitConfigError,
  RateLimitStoreError,
  checkContactRateLimit,
  contactRateLimitKey,
  getRateLimitPepper,
  normalizeEmail,
  rateLimitHit,
  type RateLimitClient,
} from "@/lib/security/rateLimit";

// E0c (RF-SEG-05, T-RL-U01): lógica do limitador com banco simulado. Nenhuma rede nem Supabase.
const PEPPER = "p".repeat(40);
const env = { RATE_LIMIT_PEPPER: PEPPER };

type Row = { allowed: boolean; count: number; reset_at: string };

/** Banco simulado: contador por chave, como a função rate_limit_hit. */
function fakeClient(limit = CONTACT_RATE_LIMIT) {
  const counts = new Map<string, number>();
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const client: RateLimitClient = {
    rpc: async (fn, args) => {
      calls.push({ fn, args });
      const key = String(args.p_key);
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      const row: Row = { allowed: count <= limit, count, reset_at: "2026-10-27T00:00:00.000Z" };
      return { data: [row], error: null };
    },
  };
  return { client, counts, calls };
}

describe("chaves HMAC", () => {
  it("normaliza o e-mail (trim + minúsculas) e é determinística", () => {
    expect(normalizeEmail("  Maria@Example.TEST ")).toBe("maria@example.test");
    expect(contactRateLimitKey("email", "  Maria@Example.TEST ", PEPPER)).toBe(contactRateLimitKey("email", "maria@example.test", PEPPER));
  });

  it("tem o formato contact:<escopo>:<hmac hex de 64> e não contém o valor original", () => {
    const key = contactRateLimitKey("email", "maria@example.test", PEPPER);
    expect(key).toMatch(/^contact:email:[0-9a-f]{64}$/);
    expect(key).not.toContain("maria");
    expect(contactRateLimitKey("ip", "203.0.113.5", PEPPER)).toMatch(/^contact:ip:[0-9a-f]{64}$/);
  });

  it("escopos e peppers diferentes geram chaves diferentes", () => {
    expect(contactRateLimitKey("email", "a", PEPPER)).not.toBe(contactRateLimitKey("ip", "a", PEPPER));
    expect(contactRateLimitKey("ip", "203.0.113.5", PEPPER)).not.toBe(contactRateLimitKey("ip", "203.0.113.5", "q".repeat(40)));
  });

  it("cabe no limite de 200 caracteres da tabela", () => {
    expect(contactRateLimitKey("email", "x".repeat(500), PEPPER).length).toBeLessThanOrEqual(200);
  });
});

describe("pepper (configuração crítica)", () => {
  it.each([undefined, "", "   ", "curto"])("recusa pepper ausente ou curto: %j", (value) => {
    expect(() => getRateLimitPepper({ RATE_LIMIT_PEPPER: value })).toThrow(RateLimitConfigError);
  });

  it("aceita pepper com 32+ caracteres", () => {
    expect(getRateLimitPepper({ RATE_LIMIT_PEPPER: "a".repeat(32) })).toBe("a".repeat(32));
  });
});

describe("rateLimitHit", () => {
  it("chama a função com p_key, p_limit e p_window_seconds", async () => {
    const { client, calls } = fakeClient();
    const decision = await rateLimitHit(client, "k", 3, 3600);
    expect(calls).toEqual([{ fn: "rate_limit_hit", args: { p_key: "k", p_limit: 3, p_window_seconds: 3600 } }]);
    expect(decision).toEqual({ allowed: true, count: 1, resetAt: "2026-10-27T00:00:00.000Z" });
  });

  it("aceita retorno como objeto único ou como lista", async () => {
    const row = { allowed: false, count: 4, reset_at: "2026-10-27T00:00:00.000Z" };
    const asObject: RateLimitClient = { rpc: async () => ({ data: row, error: null }) };
    expect((await rateLimitHit(asObject, "k", 3, 3600)).allowed).toBe(false);
  });

  it("erro do banco, exceção de rede e resposta malformada viram RateLimitStoreError", async () => {
    const withError: RateLimitClient = { rpc: async () => ({ data: null, error: { message: "boom", details: "segredo" } }) };
    const throwing: RateLimitClient = { rpc: async () => Promise.reject(new Error("rede com e-mail maria@example.test")) };
    const empty: RateLimitClient = { rpc: async () => ({ data: [], error: null }) };
    const wrong: RateLimitClient = { rpc: async () => ({ data: [{ allowed: "yes", count: "3" }], error: null }) };
    for (const client of [withError, throwing, empty, wrong]) {
      await expect(rateLimitHit(client, "k", 3, 3600)).rejects.toBeInstanceOf(RateLimitStoreError);
    }
  });

  it("a mensagem do erro não vaza detalhes do banco nem dados do chamador", async () => {
    const leaky: RateLimitClient = { rpc: async () => Promise.reject(new Error("falha para maria@example.test")) };
    await expect(rateLimitHit(leaky, "k", 3, 3600)).rejects.not.toThrow(/maria|example/);
  });
});

describe("checkContactRateLimit — 3/h por e-mail e por IP", () => {
  it("usa limite 3 e janela de 1 h nos dois baldes", async () => {
    const { client, calls } = fakeClient();
    await checkContactRateLimit(client, { email: "maria@example.test", ip: "203.0.113.5" }, env);
    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call.args.p_limit).toBe(3);
      expect(call.args.p_window_seconds).toBe(CONTACT_RATE_WINDOW_SECONDS);
      expect(call.args.p_window_seconds).toBe(3600);
    }
    expect(calls.map((call) => String(call.args.p_key).split(":")[1]).sort()).toEqual(["email", "ip"]);
  });

  it("permite as 3 primeiras e nega a 4ª (e as seguintes, que também contam)", async () => {
    const { client, counts } = fakeClient();
    const results: boolean[] = [];
    for (let i = 0; i < 5; i += 1) {
      results.push((await checkContactRateLimit(client, { email: "maria@example.test", ip: "203.0.113.5" }, env)).allowed);
    }
    expect(results).toEqual([true, true, true, false, false]);
    expect([...counts.values()]).toEqual([5, 5]);
  });

  it("sem IP confiável aplica só o limite por e-mail", async () => {
    const { client, calls } = fakeClient();
    await checkContactRateLimit(client, { email: "maria@example.test", ip: null }, env);
    expect(calls).toHaveLength(1);
    expect(String(calls[0].args.p_key)).toMatch(/^contact:email:/);
  });

  it("e-mail estourado nega mesmo com IP livre, e o balde do IP também é incrementado", async () => {
    const { client, counts } = fakeClient();
    for (let i = 0; i < 3; i += 1) await checkContactRateLimit(client, { email: "maria@example.test", ip: `198.51.100.${i + 1}` }, env);
    const fourth = await checkContactRateLimit(client, { email: "maria@example.test", ip: "198.51.100.200" }, env);
    expect(fourth.allowed).toBe(false);
    expect(counts.get(contactRateLimitKey("ip", "198.51.100.200", PEPPER))).toBe(1);
  });

  it("IP estourado nega mesmo com e-mail diferente", async () => {
    const { client } = fakeClient();
    for (let i = 0; i < 3; i += 1) await checkContactRateLimit(client, { email: `u${i}@example.test`, ip: "203.0.113.5" }, env);
    expect((await checkContactRateLimit(client, { email: "novo@example.test", ip: "203.0.113.5" }, env)).allowed).toBe(false);
  });

  it("e-mails com caixa diferente caem no mesmo balde", async () => {
    const { client } = fakeClient();
    for (const email of ["Maria@Example.test", "maria@example.TEST", " MARIA@example.test "]) {
      await checkContactRateLimit(client, { email, ip: null }, env);
    }
    expect((await checkContactRateLimit(client, { email: "maria@example.test", ip: null }, env)).allowed).toBe(false);
  });

  it("FALHA FECHADA: pepper ausente não consulta o banco e lança", async () => {
    const { client, calls } = fakeClient();
    await expect(checkContactRateLimit(client, { email: "a@example.test", ip: null }, {})).rejects.toBeInstanceOf(RateLimitConfigError);
    expect(calls).toHaveLength(0);
  });

  it("FALHA FECHADA: erro do banco em qualquer balde lança", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: [{ allowed: true, count: 1, reset_at: "x" }], error: null }).mockResolvedValueOnce({ data: null, error: { message: "db" } });
    await expect(checkContactRateLimit({ rpc }, { email: "a@example.test", ip: "203.0.113.5" }, env)).rejects.toBeInstanceOf(RateLimitStoreError);
  });
});
