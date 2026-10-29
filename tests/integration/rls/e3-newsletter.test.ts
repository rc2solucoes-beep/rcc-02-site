import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CleanupRegistry, runTeardownPhases } from "../support/cleanup";
import { createRoleClients, type RoleClients } from "../support/clients";
import { HarnessError, describeError, sanitizeThrown } from "../support/errors";
import { makeLead } from "../support/fixtures";
import { getVerifiedTarget } from "../support/target";
import { generateTokenPair, hashToken } from "@/lib/newsletter/tokens";

// E3 / migration 018 — T-NL-I* (SDD Newsletter §17). ESCRITO, NÃO EXECUTADO.
//
// Só faz sentido DEPOIS de aplicar a migration 018 no ambiente isolado, pelo operador, seguindo
// docs/runbooks/migrations/018-newsletter-core/ (preflight → apply → verify). Este arquivo:
//   * EXIGE o projeto isolado pyhhygvdjokddphftuua e RECUSA o de produção (além da guarda do harness);
//   * DETECTA se a 018 ainda não foi aplicada e para com instrução, SEM aplicar nada;
//   * só chama RPCs/tabelas da newsletter e fixtures próprias; nunca envia e-mail (o outbox é só
//     linha no banco: nenhum dispatcher existe nem é chamado);
//   * registra ANTES de usar e remove SOMENTE os assinantes sintéticos desta execução
//     (e-mail e3-<tag>-*@example.com; filhos saem por CASCADE).

// ATIVAÇÃO EXPLÍCITA: a suíte grava no isolado e só faz sentido DEPOIS de a 018 ser aplicada pelo
// operador. Sem RC2_RUN_E3_NEWSLETTER=1 ela é pulada (um `npm run test:integration` completo não a
// executa por acidente).
const ENABLED = process.env.RC2_RUN_E3_NEWSLETTER === "1";

const EXPECTED_REF = "pyhhygvdjokddphftuua";
const PRODUCTION_REF = "ymfcepzwhiemgkxzmbdm";

const registry = new CleanupRegistry();
let c: RoleClients | undefined;
let tearing: Promise<string[]> | undefined;

function clients(): RoleClients {
  if (!c) throw new Error("clientes não inicializados");
  return c;
}
const svc = (): SupabaseClient => clients().service;
const emailPrefix = (): string => `e3-${clients().tag}-`;

/** E-mail sintético registrado ANTES de qualquer uso. */
function newEmail(name: string): string {
  const email = `${emailPrefix()}${name}-${randomUUID().slice(0, 6)}@example.com`;
  registry.track("newsletter_subscribers", "email_normalized", email.toLowerCase());
  return email;
}

function teardown(): Promise<string[]> {
  const current = c;
  if (!current) return Promise.resolve([]);
  tearing ??= runTeardownPhases([
    { name: "remoção dos assinantes sintéticos", run: async () => registry.run(current.service), evidence: () => registry.describePending() },
    { name: "inspeção de resíduos", run: async () => registry.inspectResidue(current.service), evidence: () => registry.describePending() },
    { name: "usuários sintéticos", run: () => current.cleanup() },
  ]);
  return tearing;
}

beforeAll(async () => {
  if (!ENABLED) return;
  try {
    const target = getVerifiedTarget();
    if (target.projectRef === PRODUCTION_REF) throw new HarnessError("RECUSADO: o alvo é o projeto de PRODUÇÃO.");
    if (target.projectRef !== EXPECTED_REF) {
      throw new HarnessError(`RECUSADO: esta suíte só roda no projeto isolado ${EXPECTED_REF}.`);
    }
    c = await createRoleClients();

    // A 018 precisa estar aplicada. Este teste NUNCA a aplica.
    const probe = await svc().from("newsletter_subscribers").select("id", { head: true, count: "exact" });
    if (probe.error) {
      throw new HarnessError(
        "A migration 018 não está aplicada no isolado (ou a tabela está inacessível). " +
          "Aplique pelo runbook docs/runbooks/migrations/018-newsletter-core/ (preflight → apply → verify) " +
          `e rode de novo. Este teste não aplica migrations. Detalhe: ${describeError(probe.error)}`,
      );
    }

    // As funções de claim/expire são globais: nunca mexer em itens abertos que não sejam nossos.
    const open = await svc().from("newsletter_outbox").select("id").in("status", ["queued", "retry", "sending"]);
    if (open.error) throw new HarnessError(`Falha ao inspecionar o outbox: ${describeError(open.error)}`);
    if ((open.data ?? []).length > 0) {
      throw new HarnessError(
        `O outbox do isolado tem ${(open.data ?? []).length} item(ns) em aberto. A suíte recusa rodar para não ` +
          "reivindicar nem expirar itens que não são dela. Esvazie o outbox sintético e tente de novo.",
      );
    }
  } catch (error) {
    const problems = [...(await teardown())];
    if (problems.length > 0) {
      throw new AggregateError([sanitizeThrown(error, "setup"), new Error(problems.join(" | "))], "O setup falhou e a limpeza também");
    }
    throw sanitizeThrown(error, "setup");
  }
});

afterAll(async () => {
  if (!ENABLED) return;
  const problems = [...(await teardown())];
  if (problems.length > 0) throw new Error(`Falha de limpeza (${problems.length}): ${problems.join(" | ")}`);
});

// ─── Auxiliares ──────────────────────────────────────────────────────────────
const V1 = { text: "int-consent-v1", policy: "int-policy-v1" };
const V2 = { text: "int-consent-v2", policy: "int-policy-v2" };

async function rpc<T = unknown>(client: SupabaseClient, fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new HarnessError(`${fn} falhou: ${describeError(error)}`);
  return data as T;
}

function subscribe(email: string, versions = V1, ipHash: string | null = "e3-ip-hash") {
  return rpc(svc(), "newsletter_request_subscription", {
    p_email: email,
    p_email_normalized: email.toLowerCase(),
    p_consent_text_version: versions.text,
    p_policy_version: versions.policy,
    p_source_path: "/",
    p_ip_hash: ipHash,
  });
}

type Sub = { id: string; status: string; confirmed_at: string | null; unsubscribed_at: string | null; last_request_at: string | null };
async function subscriber(email: string): Promise<Sub | null> {
  const { data, error } = await svc().from("newsletter_subscribers").select("*").eq("email_normalized", email.toLowerCase());
  if (error) throw new HarnessError(`leitura de subscribers falhou: ${describeError(error)}`);
  return ((data ?? [])[0] as Sub | undefined) ?? null;
}
async function mustSubscriber(email: string): Promise<Sub> {
  const s = await subscriber(email);
  if (!s) throw new HarnessError("assinante sintético não encontrado");
  return s;
}

type Out = { id: string; kind: string; status: string; attempts: number; outcome_unknown: boolean; idempotency_key: string; consent_text_version: string | null; policy_version: string | null; dead_reason: string | null };
async function outboxOf(subscriberId: string, kind?: string): Promise<Out[]> {
  let q = svc().from("newsletter_outbox").select("*").eq("subscriber_id", subscriberId).order("created_at");
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw new HarnessError(`leitura de outbox falhou: ${describeError(error)}`);
  return (data ?? []) as Out[];
}
async function consentsOf(subscriberId: string): Promise<Array<{ event: string; consent_text_version: string | null; policy_version: string | null; ip_hash: string | null }>> {
  const { data, error } = await svc().from("newsletter_consents").select("*").eq("subscriber_id", subscriberId).order("created_at").order("id");
  if (error) throw new HarnessError(`leitura de consents falhou: ${describeError(error)}`);
  return (data ?? []) as never;
}
async function tokenCount(subscriberId: string, kind: string): Promise<number> {
  const { data, error } = await svc().from("newsletter_tokens").select("id").eq("subscriber_id", subscriberId).eq("kind", kind);
  if (error) throw new HarnessError(`leitura de tokens falhou: ${describeError(error)}`);
  return (data ?? []).length;
}

/** Leva um item do outbox a `sending` sem passar pelo claim global (setup de teste, via service_role). */
async function forceSending(outboxId: string, attempt = 1): Promise<void> {
  const { error } = await svc()
    .from("newsletter_outbox")
    .update({ status: "sending", attempts: attempt, lease_until: new Date(Date.now() + 180_000).toISOString() })
    .eq("id", outboxId);
  if (error) throw new HarnessError(`forceSending falhou: ${describeError(error)}`);
}

/** Cria o assinante e prepara os tokens do item de confirmação. Devolve os tokens brutos e hashes. */
async function pendingWithTokens(email: string, versions = V1) {
  await subscribe(email, versions);
  const sub = await mustSubscriber(email);
  const [item] = (await outboxOf(sub.id, "confirmation")).filter((o) => o.status === "queued");
  await forceSending(item.id);
  const confirm = generateTokenPair();
  const unsub = generateTokenPair();
  const prepared = await rpc<string>(svc(), "newsletter_outbox_prepare", {
    p_id: item.id,
    p_attempt: 1,
    p_confirm_hash: confirm.hash,
    p_confirm_raw: confirm.raw,
    p_unsub_hash: unsub.hash,
    p_unsub_raw: unsub.raw,
    p_template_version: "int-template-v1",
  });
  expect(prepared).toBe("prepared");
  return { sub, item, confirm, unsub };
}

async function activate(email: string) {
  const ctx = await pendingWithTokens(email);
  expect(await rpc(svc(), "newsletter_confirm", { p_token_hash: ctx.confirm.hash, p_ip_hash: "e3-ip" })).toBe("confirmed");
  return ctx;
}

// ─── T-NL-I01 — inscrição concorrente e cooldowns ────────────────────────────
describe.skipIf(!ENABLED)("T-NL-I01 — inscrições concorrentes e cooldowns", () => {
  it("10 pedidos paralelos para o mesmo e-mail normalizado: 1 assinante, 1 consent_requested, 1 item de confirmação", async () => {
    const email = newEmail("race");
    await Promise.all(Array.from({ length: 10 }, () => subscribe(email)));
    const sub = await mustSubscriber(email);
    expect(sub.status).toBe("pending");
    const { data } = await svc().from("newsletter_subscribers").select("id").eq("email_normalized", email.toLowerCase());
    expect(data).toHaveLength(1);
    expect((await consentsOf(sub.id)).filter((x) => x.event === "consent_requested")).toHaveLength(1);
    expect(await outboxOf(sub.id, "confirmation")).toHaveLength(1);
  });

  it("variações de caixa do mesmo endereço convergem para o mesmo assinante", async () => {
    const email = newEmail("case");
    await subscribe(email);
    await rpc(svc(), "newsletter_request_subscription", {
      p_email: email.toUpperCase(),
      p_email_normalized: email.toLowerCase(),
      p_consent_text_version: V1.text,
      p_policy_version: V1.policy,
      p_source_path: "/",
      p_ip_hash: null,
    });
    const { data } = await svc().from("newsletter_subscribers").select("id").eq("email_normalized", email.toLowerCase());
    expect(data).toHaveLength(1);
  });

  it("cooldown de 10 min e item em aberto bloqueiam; depois de liberar, enfileira com as versões novas", async () => {
    const email = newEmail("cool");
    await subscribe(email, V1);
    const sub = await mustSubscriber(email);
    await subscribe(email, V2); // dentro de 10 min: nada
    expect(await outboxOf(sub.id, "confirmation")).toHaveLength(1);

    // Passam os 10 min, mas o item continua em aberto (queued): ainda bloqueado.
    await svc().from("newsletter_subscribers").update({ last_request_at: new Date(Date.now() - 11 * 60_000).toISOString() }).eq("id", sub.id);
    await subscribe(email, V2);
    expect(await outboxOf(sub.id, "confirmation")).toHaveLength(1);

    // Item terminal + cooldown liberado: um novo item com as versões do NOVO pedido.
    const [first] = await outboxOf(sub.id, "confirmation");
    await svc().from("newsletter_outbox").update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: "int-msg" }).eq("id", first.id);
    await subscribe(email, V2);
    const items = await outboxOf(sub.id, "confirmation");
    expect(items).toHaveLength(2);
    expect(items[1]).toMatchObject({ status: "queued", consent_text_version: V2.text, policy_version: V2.policy });
  });

  it("no máximo 3 confirmações criadas em 24 h, mesmo sem item em aberto e com o cooldown liberado", async () => {
    const email = newEmail("cap3");
    await subscribe(email);
    const sub = await mustSubscriber(email);
    for (let i = 0; i < 2; i += 1) {
      const [open] = (await outboxOf(sub.id, "confirmation")).filter((o) => o.status === "queued");
      await svc().from("newsletter_outbox").update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: `int-${i}` }).eq("id", open.id);
      await svc().from("newsletter_subscribers").update({ last_request_at: new Date(Date.now() - 11 * 60_000).toISOString() }).eq("id", sub.id);
      await subscribe(email);
    }
    expect(await outboxOf(sub.id, "confirmation")).toHaveLength(3);
    const [open] = (await outboxOf(sub.id, "confirmation")).filter((o) => o.status === "queued");
    await svc().from("newsletter_outbox").update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: "int-3" }).eq("id", open.id);
    await svc().from("newsletter_subscribers").update({ last_request_at: new Date(Date.now() - 11 * 60_000).toISOString() }).eq("id", sub.id);
    await subscribe(email);
    expect(await outboxOf(sub.id, "confirmation")).toHaveLength(3);
  });

  it("índice parcial: o banco recusa uma segunda mensagem em aberto do mesmo tipo", async () => {
    const email = newEmail("idx");
    await subscribe(email);
    const sub = await mustSubscriber(email);
    const { error } = await svc().from("newsletter_outbox").insert({ subscriber_id: sub.id, kind: "confirmation", consent_text_version: V1.text, policy_version: V1.policy });
    expect(error).not.toBeNull();
    expect(await outboxOf(sub.id, "confirmation")).toHaveLength(1);
  });

  it("assinante ativo nunca gera e-mail de confirmação", async () => {
    const email = newEmail("active");
    const { sub } = await activate(email);
    await subscribe(email, V2);
    expect(await outboxOf(sub.id, "confirmation")).toHaveLength(1);
    expect((await mustSubscriber(email)).status).toBe("active");
  });

  it("parâmetro obrigatório nulo é rejeitado", async () => {
    const { error } = await svc().rpc("newsletter_request_subscription", {
      p_email: null, p_email_normalized: null, p_consent_text_version: V1.text, p_policy_version: V1.policy, p_source_path: "/", p_ip_hash: null,
    });
    expect(error).not.toBeNull();
  });
});

// ─── T-NL-I02 — confirmação ──────────────────────────────────────────────────
describe.skipIf(!ENABLED)("T-NL-I02 — confirmação com consumo único e versões originais", () => {
  it("token só como hash: o banco não guarda o bruto fora do payload transitório", async () => {
    const { sub, confirm, unsub } = await pendingWithTokens(newEmail("hash"));
    const { data } = await svc().from("newsletter_tokens").select("token_hash, kind").eq("subscriber_id", sub.id);
    const hashes = (data ?? []).map((r: { token_hash: string }) => r.token_hash).sort();
    expect(hashes).toEqual([confirm.hash, unsub.hash].sort());
    expect(JSON.stringify(data)).not.toContain(confirm.raw);
    expect(JSON.stringify(data)).not.toContain(unsub.raw);
    expect(confirm.hash).toBe(hashToken(confirm.raw));
  });

  it("6 confirmações paralelas do mesmo token: exatamente 1 'confirmed', as demais 'invalid', 1 evento", async () => {
    const { sub, confirm } = await pendingWithTokens(newEmail("cconf"));
    const results = await Promise.all(
      Array.from({ length: 6 }, () => rpc<string>(svc(), "newsletter_confirm", { p_token_hash: confirm.hash, p_ip_hash: "e3-ip" })),
    );
    expect(results.filter((r) => r === "confirmed")).toHaveLength(1);
    expect(results.filter((r) => r === "invalid")).toHaveLength(5);
    expect((await consentsOf(sub.id)).filter((x) => x.event === "consent_confirmed")).toHaveLength(1);
    const now = await mustSubscriber(await svcEmail(sub.id));
    expect(now.status).toBe("active");
    expect(now.confirmed_at).not.toBeNull();
    expect(now.unsubscribed_at).toBeNull();
    expect(await tokenCount(sub.id, "confirm")).toBe(0); // consumido: a linha some
  });

  it("o consent_confirmed usa as versões do PEDIDO ORIGINAL (copiadas do token), nunca do cliente", async () => {
    const { sub, confirm } = await pendingWithTokens(newEmail("ver"), V1);
    await rpc(svc(), "newsletter_confirm", { p_token_hash: confirm.hash, p_ip_hash: "e3-ip" });
    const confirmed = (await consentsOf(sub.id)).find((x) => x.event === "consent_confirmed");
    expect(confirmed).toMatchObject({ consent_text_version: V1.text, policy_version: V1.policy, ip_hash: "e3-ip" });
    // A assinatura da RPC não aceita versão: um parâmetro extra é recusado pelo PostgREST.
    const { error } = await svc().rpc("newsletter_confirm", { p_token_hash: confirm.hash, p_ip_hash: "x", p_consent_text_version: "hack" });
    expect(error).not.toBeNull();
  });

  it("novo pedido remove o C anterior (vira 'invalid') e a confirmação usa as versões do novo pedido", async () => {
    const email = newEmail("reissue");
    const first = await pendingWithTokens(email, V1);
    // Libera o cooldown: o item anterior fica terminal e passam os 10 min.
    await svc().from("newsletter_outbox").update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: "int-r1", lease_until: null }).eq("id", first.item.id);
    await svc().from("newsletter_subscribers").update({ last_request_at: new Date(Date.now() - 11 * 60_000).toISOString() }).eq("id", first.sub.id);
    await subscribe(email, V2);
    expect(await tokenCount(first.sub.id, "confirm")).toBe(0);
    expect(await rpc(svc(), "newsletter_confirm", { p_token_hash: first.confirm.hash, p_ip_hash: "e3-ip" })).toBe("invalid");

    const [, second] = await outboxOf(first.sub.id, "confirmation");
    await forceSending(second.id);
    const c2 = generateTokenPair();
    const u2 = generateTokenPair();
    await rpc(svc(), "newsletter_outbox_prepare", { p_id: second.id, p_attempt: 1, p_confirm_hash: c2.hash, p_confirm_raw: c2.raw, p_unsub_hash: u2.hash, p_unsub_raw: u2.raw, p_template_version: "int-template-v1" });
    expect(await rpc(svc(), "newsletter_confirm", { p_token_hash: c2.hash, p_ip_hash: "e3-ip" })).toBe("confirmed");
    const confirmed = (await consentsOf(first.sub.id)).filter((x) => x.event === "consent_confirmed");
    expect(confirmed).toHaveLength(1);
    expect(confirmed[0]).toMatchObject({ consent_text_version: V2.text, policy_version: V2.policy });
  });

  it("token expirado e hash desconhecido são 'invalid'; hash malformado é erro de parâmetro", async () => {
    const { sub, confirm } = await pendingWithTokens(newEmail("exp"));
    await svc().from("newsletter_tokens").update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq("subscriber_id", sub.id).eq("kind", "confirm");
    expect(await rpc(svc(), "newsletter_confirm", { p_token_hash: confirm.hash, p_ip_hash: "e3-ip" })).toBe("invalid");
    expect(await rpc(svc(), "newsletter_confirm", { p_token_hash: generateTokenPair().hash, p_ip_hash: "e3-ip" })).toBe("invalid");
    const { error } = await svc().rpc("newsletter_confirm", { p_token_hash: "nao-e-hash", p_ip_hash: "x" });
    expect(error).not.toBeNull();
    expect((await mustSubscriber(await svcEmail(sub.id))).status).toBe("pending");
  });
});

/** Resolve o e-mail (normalizado) do assinante pelo id, para reler o estado. */
async function svcEmail(id: string): Promise<string> {
  const { data, error } = await svc().from("newsletter_subscribers").select("email_normalized").eq("id", id);
  if (error || !data?.[0]) throw new HarnessError("assinante não encontrado pelo id");
  return (data[0] as { email_normalized: string }).email_normalized;
}

// ─── T-NL-I03 — descadastro e supressão ──────────────────────────────────────
describe.skipIf(!ENABLED)("T-NL-I03 — descadastro idempotente e supressão", () => {
  it("5 descadastros paralelos: 1 'unsubscribed', 4 'already_unsubscribed', 1 evento; o token U continua válido", async () => {
    const email = newEmail("unsub");
    const { sub, unsub } = await activate(email);
    const results = await Promise.all(
      Array.from({ length: 5 }, () => rpc<string>(svc(), "newsletter_unsubscribe", { p_token_hash: unsub.hash, p_channel: "one_click" })),
    );
    expect(results.filter((r) => r === "unsubscribed")).toHaveLength(1);
    expect(results.filter((r) => r === "already_unsubscribed")).toHaveLength(4);
    expect((await consentsOf(sub.id)).filter((x) => x.event === "unsubscribed_one_click")).toHaveLength(1);
    expect(await tokenCount(sub.id, "unsubscribe")).toBe(1);
    const now = await mustSubscriber(email);
    expect(now.status).toBe("unsubscribed");
    expect(now.unsubscribed_at).not.toBeNull();
    expect(await rpc(svc(), "newsletter_unsubscribe", { p_token_hash: unsub.hash, p_channel: "link" })).toBe("already_unsubscribed");
  });

  it("token desconhecido é 'not_found' e não cria estado; canal inválido é erro", async () => {
    expect(await rpc(svc(), "newsletter_unsubscribe", { p_token_hash: generateTokenPair().hash, p_channel: "link" })).toBe("not_found");
    const { error } = await svc().rpc("newsletter_unsubscribe", { p_token_hash: generateTokenPair().hash, p_channel: "outro" });
    expect(error).not.toBeNull();
  });

  it("assinante 'pending' descadastrado: o C pendente deixa de funcionar", async () => {
    const { sub, confirm, unsub } = await pendingWithTokens(newEmail("pendunsub"));
    expect(await rpc(svc(), "newsletter_unsubscribe", { p_token_hash: unsub.hash, p_channel: "link" })).toBe("unsubscribed");
    expect(await tokenCount(sub.id, "confirm")).toBe(0);
    expect(await rpc(svc(), "newsletter_confirm", { p_token_hash: confirm.hash, p_ip_hash: "e3-ip" })).toBe("invalid");
  });

  it("supressão: depois de descadastrar, nova inscrição só 7 dias depois, e continua 'unsubscribed' até confirmar", async () => {
    const email = newEmail("supp");
    const { sub, unsub, item } = await activate(email);
    // O activate() deixa o item de confirmação em `sending`; para testar SÓ a regra dos 7 dias,
    // ele precisa estar terminal (um item em aberto bloquearia o pedido por outra regra).
    await svc().from("newsletter_outbox").update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: "int-supp", lease_until: null }).eq("id", item.id);
    await rpc(svc(), "newsletter_unsubscribe", { p_token_hash: unsub.hash, p_channel: "link" });
    await subscribe(email, V2); // < 7 dias: nada
    expect(await outboxOf(sub.id, "confirmation")).toHaveLength(1);

    await svc().from("newsletter_subscribers").update({ unsubscribed_at: new Date(Date.now() - 8 * 86_400_000).toISOString(), last_request_at: new Date(Date.now() - 3_600_000).toISOString() }).eq("id", sub.id);
    await subscribe(email, V2);
    const items = await outboxOf(sub.id, "confirmation");
    expect(items).toHaveLength(2);
    expect(items[1].consent_text_version).toBe(V2.text);
    expect((await mustSubscriber(email)).status).toBe("unsubscribed");
  });

  it("link de descadastro: só enfileira para pending/active, nunca muda o status, sem duplicar", async () => {
    const email = newEmail("link");
    const { sub } = await activate(email);
    await rpc(svc(), "newsletter_request_unsubscribe_link", { p_email_normalized: email.toLowerCase() });
    await rpc(svc(), "newsletter_request_unsubscribe_link", { p_email_normalized: email.toLowerCase() });
    expect(await outboxOf(sub.id, "unsubscribe_link")).toHaveLength(1);
    expect((await mustSubscriber(email)).status).toBe("active");
    await rpc(svc(), "newsletter_request_unsubscribe_link", { p_email_normalized: `${emailPrefix()}nao-existe@example.com` });
    const { data } = await svc().from("newsletter_subscribers").select("id").like("email_normalized", `${emailPrefix()}nao-existe%`);
    expect(data).toHaveLength(0);
  });

  it("excluir o assinante remove tokens, consentimentos e outbox (CASCADE) e o link vira 'not_found'", async () => {
    const email = newEmail("cascade");
    const { sub, unsub } = await activate(email);
    const { error } = await svc().from("newsletter_subscribers").delete().eq("id", sub.id);
    expect(error).toBeNull();
    for (const table of ["newsletter_tokens", "newsletter_consents", "newsletter_outbox"]) {
      const { data } = await svc().from(table).select("id").eq("subscriber_id", sub.id);
      expect(data, table).toHaveLength(0);
    }
    expect(await rpc(svc(), "newsletter_unsubscribe", { p_token_hash: unsub.hash, p_channel: "one_click" })).toBe("not_found");
  });
});

// ─── T-NL-I04 — outbox: claim concorrente, lease, idempotência, expiração ────
describe.skipIf(!ENABLED)("T-NL-I04 — outbox", () => {
  // O claim é global: antes, tira da fila os itens abertos que os testes anteriores DESTA execução
  // deixaram (somente assinantes com o prefixo sintético). Nada de fora do prefixo é tocado.
  beforeAll(async () => {
    const own = await svc().from("newsletter_subscribers").select("id").like("email_normalized", `${emailPrefix()}%`);
    if (own.error) throw new HarnessError(`Falha ao listar assinantes sintéticos: ${describeError(own.error)}`);
    const ids = (own.data ?? []).map((r: { id: string }) => r.id);
    if (ids.length === 0) return;
    const parked = await svc()
      .from("newsletter_outbox")
      .update({ status: "dead", dead_reason: "superseded", lease_until: null })
      .in("subscriber_id", ids)
      .in("status", ["queued", "retry", "sending"]);
    if (parked.error) throw new HarnessError(`Falha ao estacionar itens abertos: ${describeError(parked.error)}`);
  });

  async function seedQueued(count: number, tagName: string): Promise<string[]> {
    const ids: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const email = newEmail(`${tagName}${i}`);
      await subscribe(email);
      const sub = await mustSubscriber(email);
      ids.push((await outboxOf(sub.id, "confirmation"))[0].id);
    }
    return ids;
  }

  it("claim concorrente (SKIP LOCKED): nenhum item reivindicado duas vezes, todos reivindicados uma vez", async () => {
    const ids = await seedQueued(8, "claim");
    const batches = await Promise.all(
      Array.from({ length: 4 }, () => rpc<Array<{ id: string; attempts: number; outcome_unknown: boolean }>>(svc(), "newsletter_outbox_claim", { p_batch: 3, p_lease_seconds: 180 })),
    );
    const claimed = batches.flat();
    const claimedIds = claimed.map((r) => r.id);
    expect(new Set(claimedIds).size).toBe(claimedIds.length); // sem duplicata
    expect(claimedIds.sort()).toEqual([...ids].sort());
    expect(claimed.every((r) => r.attempts === 1 && r.outcome_unknown === false)).toBe(true);
    for (const id of ids) {
      const { data } = await svc().from("newsletter_outbox").select("status, first_attempt_at, lease_until").eq("id", id);
      expect((data?.[0] as { status: string }).status).toBe("sending");
      expect((data?.[0] as { first_attempt_at: string | null }).first_attempt_at).not.toBeNull();
    }
  });

  it("recuperação de lease vencido: attempts+1, outcome_unknown=true, MESMA chave de idempotência", async () => {
    const [id] = await seedQueued(1, "lease");
    const [first] = await rpc<Array<{ id: string; idempotency_key: string }>>(svc(), "newsletter_outbox_claim", { p_batch: 5, p_lease_seconds: 180 });
    expect(first.id).toBe(id);
    expect(await rpc<unknown[]>(svc(), "newsletter_outbox_claim", { p_batch: 5, p_lease_seconds: 180 })).toHaveLength(0); // lease válido

    await svc().from("newsletter_outbox").update({ lease_until: new Date(Date.now() - 1000).toISOString() }).eq("id", id);
    const [again] = await rpc<Array<{ id: string; attempts: number; outcome_unknown: boolean; idempotency_key: string }>>(svc(), "newsletter_outbox_claim", { p_batch: 5, p_lease_seconds: 180 });
    expect(again).toMatchObject({ id, attempts: 2, outcome_unknown: true, idempotency_key: first.idempotency_key });
    expect(again.idempotency_key).toBe(`nl-${id}`);
  });

  it("claim filtrado por tipo respeita p_kinds (confirmação desligada não é reivindicada)", async () => {
    const [id] = await seedQueued(1, "kinds");
    const onlyLinks = await rpc<unknown[]>(svc(), "newsletter_outbox_claim", { p_batch: 5, p_lease_seconds: 180, p_kinds: ["unsubscribe_link"] });
    expect(onlyLinks).toHaveLength(0);
    const { data } = await svc().from("newsletter_outbox").select("status").eq("id", id);
    expect((data?.[0] as { status: string }).status).toBe("queued");
    await svc().from("newsletter_outbox").update({ status: "dead", dead_reason: "superseded" }).eq("id", id); // tira da fila
  });

  it("prepare é idempotente e a conclusão por comparação e troca descarta tentativa obsoleta", async () => {
    const email = newEmail("cas");
    await subscribe(email);
    const sub = await mustSubscriber(email);
    const [item] = await outboxOf(sub.id, "confirmation");
    const [claimed] = await rpc<Array<{ id: string; attempts: number }>>(svc(), "newsletter_outbox_claim", { p_batch: 1, p_lease_seconds: 180 });
    expect(claimed.id).toBe(item.id);
    const c1 = generateTokenPair();
    const u1 = generateTokenPair();
    const args = (cc: ReturnType<typeof generateTokenPair>, uu: ReturnType<typeof generateTokenPair>) => ({
      p_id: item.id, p_attempt: 1, p_confirm_hash: cc.hash, p_confirm_raw: cc.raw, p_unsub_hash: uu.hash, p_unsub_raw: uu.raw, p_template_version: "int-template-v1",
    });
    expect(await rpc(svc(), "newsletter_outbox_prepare", args(c1, u1))).toBe("prepared");
    expect(await rpc(svc(), "newsletter_outbox_prepare", args(generateTokenPair(), generateTokenPair()))).toBe("already_prepared");
    expect(await tokenCount(sub.id, "confirm")).toBe(1);
    expect(await rpc(svc(), "newsletter_outbox_prepare", { ...args(c1, u1), p_attempt: 9 })).toBe("stale");

    expect(await rpc(svc(), "newsletter_outbox_complete", { p_id: item.id, p_attempt: 9, p_outcome: "sent", p_provider_message_id: "int-obsoleto" })).toBe("stale");
    expect((await outboxOf(sub.id))[0].status).toBe("sending");
    expect(await rpc(svc(), "newsletter_outbox_complete", { p_id: item.id, p_attempt: 1, p_outcome: "sent", p_provider_message_id: "int-ok" })).toBe("applied");
    const { data: payload } = await svc().from("newsletter_outbox_payload").select("outbox_id").eq("outbox_id", item.id);
    expect(payload).toHaveLength(0); // payload apagado no estado terminal
    expect(await tokenCount(sub.id, "confirm")).toBe(1); // tokens de mensagem enviada permanecem
  });

  it("mensagem 'dead' sem entrega possível descarta os tokens; com outcome_unknown eles permanecem", async () => {
    const emails = [newEmail("deadA"), newEmail("deadB")];
    const subs: Sub[] = [];
    const items: string[] = [];
    for (const email of emails) {
      const ctx = await pendingWithTokens(email);
      subs.push(ctx.sub);
      items.push(ctx.item.id);
    }
    await rpc(svc(), "newsletter_outbox_complete", { p_id: items[0], p_attempt: 1, p_outcome: "dead", p_dead_reason: "permanent_error", p_error_code: "invalid_api_key", p_outcome_unknown: false });
    await rpc(svc(), "newsletter_outbox_complete", { p_id: items[1], p_attempt: 1, p_outcome: "dead", p_dead_reason: "deadline_elapsed", p_error_code: "timeout", p_outcome_unknown: true });
    expect(await tokenCount(subs[0].id, "confirm")).toBe(0);
    expect(await tokenCount(subs[1].id, "confirm")).toBe(1);
    for (const id of items) {
      const { data } = await svc().from("newsletter_outbox_payload").select("outbox_id").eq("outbox_id", id);
      expect(data).toHaveLength(0);
    }
  });

  it("expire: prazo vencido e teto de 12 tentativas viram 'dead'; sending com lease válido não é tocado", async () => {
    const [late, exhausted, busy] = await seedQueued(3, "exp");
    await svc().from("newsletter_outbox").update({ deadline_at: new Date(Date.now() - 1000).toISOString() }).eq("id", late);
    await svc().from("newsletter_outbox").update({ status: "retry", attempts: 12, next_attempt_at: new Date(Date.now() - 1000).toISOString() }).eq("id", exhausted);
    await svc().from("newsletter_outbox").update({ status: "sending", attempts: 1, lease_until: new Date(Date.now() + 600_000).toISOString() }).eq("id", busy);
    const expired = await rpc<number>(svc(), "newsletter_outbox_expire", {});
    expect(expired).toBe(2);
    const state = async (id: string) => (await svc().from("newsletter_outbox").select("status, dead_reason").eq("id", id)).data?.[0] as { status: string; dead_reason: string | null };
    expect(await state(late)).toEqual({ status: "dead", dead_reason: "deadline_elapsed" });
    expect(await state(exhausted)).toEqual({ status: "dead", dead_reason: "attempts_exhausted" });
    expect(await state(busy)).toEqual({ status: "sending", dead_reason: null });
    await svc().from("newsletter_outbox").update({ status: "dead", dead_reason: "superseded", lease_until: null }).eq("id", busy);
  });

  it("parâmetros do claim são validados", async () => {
    for (const bad of [{ p_batch: 0, p_lease_seconds: 180 }, { p_batch: 51, p_lease_seconds: 180 }, { p_batch: 1, p_lease_seconds: 5 }, { p_batch: 1, p_lease_seconds: 180, p_kinds: ["outro"] }]) {
      const { error } = await svc().rpc("newsletter_outbox_claim", bad);
      expect(error, JSON.stringify(bad)).not.toBeNull();
    }
  });
});

// ─── T-NL-I05 — privilégios reais por papel ──────────────────────────────────
describe.skipIf(!ENABLED)("T-NL-I05 — privilégios de anon, authenticated, admin e service_role", () => {
  const TABLES = ["newsletter_subscribers", "newsletter_consents", "newsletter_outbox", "newsletter_tokens", "newsletter_outbox_payload"] as const;
  const ADMIN_READABLE = ["newsletter_subscribers", "newsletter_consents", "newsletter_outbox"];
  const FUNCTIONS: Array<[string, Record<string, unknown>]> = [
    ["newsletter_request_subscription", { p_email: "x@example.com", p_email_normalized: "x@example.com", p_consent_text_version: "v", p_policy_version: "p", p_source_path: "/", p_ip_hash: null }],
    ["newsletter_request_unsubscribe_link", { p_email_normalized: "x@example.com" }],
    ["newsletter_confirm", { p_token_hash: "0".repeat(64), p_ip_hash: null }],
    ["newsletter_unsubscribe", { p_token_hash: "0".repeat(64), p_channel: "link" }],
    ["newsletter_outbox_claim", { p_batch: 1, p_lease_seconds: 60 }],
    ["newsletter_outbox_prepare", { p_id: randomUUID(), p_attempt: 1, p_confirm_hash: null, p_confirm_raw: null, p_unsub_hash: "0".repeat(64), p_unsub_raw: "nlt_" + "A".repeat(43), p_template_version: "t" }],
    ["newsletter_outbox_complete", { p_id: randomUUID(), p_attempt: 1, p_outcome: "retry", p_next_attempt_at: new Date().toISOString() }],
    ["newsletter_outbox_expire", {}],
  ];

  it("anon não lê nem escreve em nenhuma tabela e não executa nenhuma função", async () => {
    for (const table of TABLES) {
      const read = await clients().anon.from(table).select("*").limit(1);
      expect(read.error, `anon SELECT ${table}`).not.toBeNull();
      const write = await clients().anon.from(table).insert({});
      expect(write.error, `anon INSERT ${table}`).not.toBeNull();
    }
    for (const [fn, args] of FUNCTIONS) {
      const { error } = await clients().anon.rpc(fn, args);
      expect(error, `anon EXECUTE ${fn}`).not.toBeNull();
    }
  });

  it("authenticated não-admin: lê 0 linhas nas 3 tabelas liberadas (RLS), nada em tokens/payload, nenhuma função, nenhuma escrita", async () => {
    const { sub } = await activate(newEmail("rls"));
    for (const table of ADMIN_READABLE) {
      const { data, error } = await clients().nonAdmin.from(table).select("*");
      expect(error, table).toBeNull();
      expect(data, `${table} deve vir vazio para não-admin`).toHaveLength(0);
    }
    for (const table of ["newsletter_tokens", "newsletter_outbox_payload"]) {
      expect((await clients().nonAdmin.from(table).select("*").limit(1)).error, table).not.toBeNull();
    }
    for (const [fn, args] of FUNCTIONS) expect((await clients().nonAdmin.rpc(fn, args)).error, fn).not.toBeNull();
    for (const table of TABLES) {
      expect((await clients().nonAdmin.from(table).insert({})).error, `INSERT ${table}`).not.toBeNull();
      expect((await clients().nonAdmin.from(table).delete().neq("created_at", "1970-01-01T00:00:00Z")).error, `DELETE ${table}`).not.toBeNull();
    }
    expect(await subscriber(await svcEmail(sub.id))).not.toBeNull(); // nada foi apagado
  });

  it("admin: lê as 3 tabelas liberadas, não lê tokens/payload, não escreve, não executa funções", async () => {
    const email = newEmail("adm");
    const { sub } = await activate(email);
    for (const table of ADMIN_READABLE) {
      const { data, error } = await clients().admin.from(table).select("*");
      expect(error, table).toBeNull();
      expect((data ?? []).length, `${table} deve ter linhas para o admin`).toBeGreaterThan(0);
    }
    const mine = await clients().admin.from("newsletter_subscribers").select("id").eq("id", sub.id);
    expect(mine.data).toHaveLength(1);
    for (const table of ["newsletter_tokens", "newsletter_outbox_payload"]) {
      expect((await clients().admin.from(table).select("*").limit(1)).error, `admin SELECT ${table}`).not.toBeNull();
    }
    const upd = await clients().admin.from("newsletter_subscribers").update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() }).eq("id", sub.id).select("id");
    expect(upd.error !== null || (upd.data ?? []).length === 0, "admin UPDATE deve ser negado").toBe(true);
    expect((await clients().admin.from("newsletter_consents").insert({ subscriber_id: sub.id, event: "consent_confirmed", consent_text_version: "x", policy_version: "x" })).error).not.toBeNull();
    for (const [fn, args] of FUNCTIONS) expect((await clients().admin.rpc(fn, args)).error, `admin EXECUTE ${fn}`).not.toBeNull();
    expect((await mustSubscriber(email)).status).toBe("active");
  });

  it("service_role lê, escreve e executa tudo", async () => {
    for (const table of TABLES) {
      expect((await svc().from(table).select("*").limit(1)).error, table).toBeNull();
    }
    expect(await rpc(svc(), "newsletter_confirm", { p_token_hash: "0".repeat(64), p_ip_hash: null })).toBe("invalid");
  });
});

// ─── T-NL-I06 — isolamento entre newsletter e leads ──────────────────────────
describe.skipIf(!ENABLED)("T-NL-I06 — newsletter é independente de leads (RN-06, RF-NL-10)", () => {
  it("o mesmo e-mail pode existir nas duas tabelas sem relação; excluir um lado não afeta o outro", async () => {
    const lead = await makeLead(svc(), registry, clients().tag);
    const { data: row, error } = await svc().from("leads").select("email").eq("id", lead.id);
    expect(error).toBeNull();
    const leadEmail = (row?.[0] as { email: string }).email;
    registry.track("newsletter_subscribers", "email_normalized", leadEmail.toLowerCase());

    await subscribe(leadEmail);
    const sub = await mustSubscriber(leadEmail);
    expect(sub.status).toBe("pending");

    // Excluir o lead não toca o assinante.
    expect((await svc().from("leads").delete().eq("id", lead.id)).error).toBeNull();
    expect((await mustSubscriber(leadEmail)).id).toBe(sub.id);
    expect(await outboxOf(sub.id, "confirmation")).toHaveLength(1);

    // Excluir o assinante não recria nem altera leads.
    expect((await svc().from("newsletter_subscribers").delete().eq("id", sub.id)).error).toBeNull();
    const { data: leftover } = await svc().from("leads").select("id").eq("id", lead.id);
    expect(leftover).toHaveLength(0);
  });

  it("nenhuma coluna de vínculo com leads existe nas tabelas da newsletter", async () => {
    for (const table of ["newsletter_subscribers", "newsletter_consents", "newsletter_outbox", "newsletter_tokens", "newsletter_outbox_payload"]) {
      const { error } = await svc().from(table).select("lead_id").limit(1);
      expect(error, `${table}.lead_id não deve existir`).not.toBeNull();
    }
  });
});
