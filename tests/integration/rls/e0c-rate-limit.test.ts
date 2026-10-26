import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CleanupRegistry, runTeardownPhases } from "../support/cleanup";
import { createRoleClients, type RoleClients } from "../support/clients";
import { HarnessError, describeError, sanitizeThrown } from "../support/errors";
import { makeLead } from "../support/fixtures";

// E0c (RF-SEG-05, DEC-12) — T-RL-I01, T-RL-I02 e T-RL-I03. ESCRITO, NÃO EXECUTADO.
//
// Só faz sentido DEPOIS de aplicar a migration 017 no ambiente isolado
// (docs/runbooks/migrations/017-rate-limit-counters/). Roda sob `npm run test:integration`, com a
// guarda anti-produção ativa e autorização expressa da execução. Não depende da fase E2.
// Todas as chaves são sintéticas (prefixo e0c-<tag>), registradas ANTES do uso e removidas no
// afterAll; nenhum e-mail ou IP real entra na tabela.

const registry = new CleanupRegistry();
let c: RoleClients | undefined;
let tearing: Promise<string[]> | undefined;

function clients(): RoleClients {
  if (!c) throw new Error("clientes não inicializados");
  return c;
}
const svc = (): SupabaseClient => clients().service;
const keyOf = (name: string): string => {
  const key = `e0c-${clients().tag}-${name}-${randomUUID().slice(0, 8)}`;
  registry.track("rate_limit_counters", "key", key);
  return key;
};

function teardown(): Promise<string[]> {
  const current = c;
  if (!current) return Promise.resolve([]);
  tearing ??= runTeardownPhases([
    { name: "remoção dos recursos registrados", run: async () => registry.run(current.service), evidence: () => registry.describePending() },
    { name: "inspeção de resíduos", run: async () => registry.inspectResidue(current.service), evidence: () => registry.describePending() },
    { name: "usuários sintéticos", run: () => current.cleanup() },
  ]);
  return tearing;
}

beforeAll(async () => {
  try {
    c = await createRoleClients();
  } catch (error) {
    const problems = [...(await teardown())];
    if (problems.length > 0) {
      throw new AggregateError([sanitizeThrown(error, "setup"), new Error(problems.join(" | "))], "O setup falhou e a limpeza também");
    }
    throw sanitizeThrown(error, "setup");
  }
});

afterAll(async () => {
  const problems = [...(await teardown())];
  if (problems.length > 0) throw new Error(`Falha de limpeza (${problems.length}): ${problems.join(" | ")}`);
});

type Hit = { allowed: boolean; count: number; reset_at: string };

async function hit(client: SupabaseClient, key: string, limit = 3, windowSeconds = 3600): Promise<Hit> {
  const { data, error } = await client.rpc("rate_limit_hit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
  if (error) throw new HarnessError(`rate_limit_hit falhou: ${describeError(error)}`);
  const row = (Array.isArray(data) ? data[0] : data) as Hit | undefined;
  if (!row) throw new HarnessError("rate_limit_hit sem linha de retorno");
  return row;
}

async function rowsOf(key: string): Promise<Array<{ count: number }>> {
  const { data, error } = await svc().from("rate_limit_counters").select("count").eq("key", key);
  if (error) throw new HarnessError(`Falha ao ler contadores: ${describeError(error)}`);
  return (data ?? []) as Array<{ count: number }>;
}

describe("T-RL-I01 — rate_limit_hit incrementa de forma atômica (PV-21)", () => {
  it("sequencial: conta 1..N e só permite até o limite; rejeitadas também contam", async () => {
    const key = keyOf("seq");
    const results: Hit[] = [];
    for (let i = 0; i < 5; i += 1) results.push(await hit(svc(), key));
    expect(results.map((r) => [r.allowed, r.count])).toEqual([
      [true, 1],
      [true, 2],
      [true, 3],
      [false, 4],
      [false, 5],
    ]);
    expect(await rowsOf(key)).toEqual([{ count: 5 }]);
  });

  it("concorrente: N chamadas paralelas produzem contagens exatas, sem repetição nem perda", async () => {
    const key = keyOf("par");
    const total = 40;
    const results = await Promise.all(Array.from({ length: total }, () => hit(svc(), key, 1000)));
    expect(results.map((r) => r.count).sort((a, b) => a - b)).toEqual(Array.from({ length: total }, (_, i) => i + 1));
    expect(await rowsOf(key)).toEqual([{ count: total }]);
  });

  it("concorrente no limite: exatamente `limit` chamadas são permitidas", async () => {
    const key = keyOf("lim");
    const results = await Promise.all(Array.from({ length: 12 }, () => hit(svc(), key, 3)));
    expect(results.filter((r) => r.allowed)).toHaveLength(3);
    expect(results.filter((r) => !r.allowed)).toHaveLength(9);
  });

  it("chaves diferentes não interferem; reset_at é o fim da janela fixa", async () => {
    const a = await hit(svc(), keyOf("a"), 3, 600);
    const b = await hit(svc(), keyOf("b"), 3, 600);
    expect([a.count, b.count]).toEqual([1, 1]);
    const reset = new Date(a.reset_at).getTime();
    expect(reset % 600_000).toBe(0);
    expect(reset).toBeGreaterThan(Date.now());
    expect(reset - Date.now()).toBeLessThanOrEqual(600_000);
  });

  it("rejeita parâmetros inválidos com erro", async () => {
    const key = keyOf("bad");
    const invalid: Array<[string, number, number]> = [
      ["", 3, 3600],
      ["x".repeat(201), 3, 3600],
      [key, 0, 3600],
      [key, 10_001, 3600],
      [key, 3, 0],
      [key, 3, 86_401],
    ];
    for (const [k, limit, window] of invalid) {
      const { error } = await svc().rpc("rate_limit_hit", { p_key: k, p_limit: limit, p_window_seconds: window });
      expect(error, `${k.slice(0, 6)}/${limit}/${window}`).not.toBeNull();
    }
    expect(await rowsOf(key)).toEqual([]);
  });
});

describe("T-RL-I02 — excluir leads não altera contadores (RF-SEG-05)", () => {
  it("o contador sobrevive à exclusão do lead e a tabela leads não participa do limite", async () => {
    const lead = await makeLead(svc(), registry, clients().tag);
    const key = keyOf("lead");
    await hit(svc(), key);
    await hit(svc(), key);
    const before = await rowsOf(key);

    const { error } = await svc().from("leads").delete().eq("id", lead.id);
    if (error) throw new HarnessError(`Falha ao excluir lead sintético: ${describeError(error)}`);

    expect(await rowsOf(key)).toEqual(before);
    expect((await hit(svc(), key)).count).toBe(3);
  });
});

describe("T-RL-I03 — função e tabela não acessíveis a anon/authenticated", () => {
  it.each([
    ["anon", () => clients().anon],
    ["authenticated (não-admin)", () => clients().nonAdmin],
    ["authenticated (admin)", () => clients().admin],
  ])("%s não executa rate_limit_hit nem acessa a tabela", async (_label, pick) => {
    const client = pick();
    const key = keyOf("deny");

    const rpc = await client.rpc("rate_limit_hit", { p_key: key, p_limit: 3, p_window_seconds: 3600 });
    expect(rpc.error, "EXECUTE deveria ser negado").not.toBeNull();

    const read = await client.from("rate_limit_counters").select("key");
    const readDenied = read.error !== null || (read.data ?? []).length === 0;
    expect(readDenied, "SELECT não pode devolver linhas").toBe(true);

    const write = await client.from("rate_limit_counters").insert({ key, window_start: new Date().toISOString(), count: 1 });
    expect(write.error, "INSERT deveria ser negado").not.toBeNull();

    // Nada foi gravado por esses papéis (confirmação independente pelo service_role).
    expect(await rowsOf(key)).toEqual([]);
  });
});
