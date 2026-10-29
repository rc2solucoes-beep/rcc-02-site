import { describe, expect, it } from "vitest";
import {
  BATCH_BUDGET_MS,
  PROCESSOR_PARAMS,
  type ProcessorParams,
  backoffSeconds,
  checkProcessorInvariants,
  dispatchOnce,
  type DispatchSummary,
} from "@/lib/newsletter/processor";
import { ScriptedProvider, failure, type ScriptedStep } from "@/lib/newsletter/provider";
import { FakeStore } from "./fakeStore";

// T-NL-U04 a U07 e U16 (SDD §17): máquina de estados, classificação, idempotência, backoff, teto e
// deadline, revalidação. O armazenamento é um fake com o CONTRATO das RPCs; sem rede e sem relógio real.

const T0 = Date.UTC(2026, 9, 27, 12, 0, 0);
const HOUR = 3600_000;

function setup(steps?: ScriptedStep[], opts: { confirmationEnabled?: boolean; params?: ProcessorParams } = {}) {
  const clock = { now: T0 };
  const store = new FakeStore(clock);
  const provider = new ScriptedProvider(steps);
  const run = (): Promise<DispatchSummary> =>
    dispatchOnce({
      store, provider, now: () => new Date(clock.now), rng: () => 0.5,
      confirmationEnabled: opts.confirmationEnabled ?? true, params: opts.params,
    });
  return { clock, store, provider, run };
}

describe("parâmetros e invariantes (SDD §8.5)", () => {
  it("os valores iniciais respeitam D ≥ B·T + M, L > D e deadline < janela de idempotência", () => {
    expect(checkProcessorInvariants()).toEqual([]);
    expect(PROCESSOR_PARAMS.maxDurationSeconds).toBeGreaterThanOrEqual((PROCESSOR_PARAMS.batch * PROCESSOR_PARAMS.timeoutMs) / 1000 + PROCESSOR_PARAMS.marginSeconds);
    expect(PROCESSOR_PARAMS.leaseSeconds).toBeGreaterThan(PROCESSOR_PARAMS.maxDurationSeconds);
    expect(PROCESSOR_PARAMS.leaseSeconds + PROCESSOR_PARAMS.sweepSeconds).toBe(240); // latência máxima de recuperação
  });

  it("detecta violações dos invariantes", () => {
    expect(checkProcessorInvariants({ ...PROCESSOR_PARAMS, maxDurationSeconds: 60 })).toHaveLength(1);
    expect(checkProcessorInvariants({ ...PROCESSOR_PARAMS, leaseSeconds: 100 })).toHaveLength(1);
    expect(checkProcessorInvariants({ ...PROCESSOR_PARAMS, deadlineHours: 25 }).length).toBeGreaterThan(0);
  });

  it("backoff: 1 min, 5 min, 15 min, 1 h, 3 h e depois a cada 3 h, com jitter de ±10%", () => {
    const mid = (n: number) => backoffSeconds(n, () => 0.5);
    expect([1, 2, 3, 4, 5, 6, 12].map(mid)).toEqual([60, 300, 900, 3600, 10800, 10800, 10800]);
    expect(backoffSeconds(3, () => 0)).toBe(Math.round(900 * 0.9));
    expect(backoffSeconds(3, () => 1)).toBe(Math.round(900 * 1.1));
  });
});

describe("envio e classificação (SDD §8.3)", () => {
  it("sucesso: prepara uma vez, envia com a chave de idempotência da linha e conclui 'sent' apagando o payload", async () => {
    const { store, provider, run } = setup();
    store.enqueue("a", "confirmation");
    const summary = await run();
    expect(summary).toMatchObject({ claimed: 1, sent: 1, retried: 0, dead: 0 });
    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0].options.idempotencyKey).toBe("nl-a");
    expect(provider.calls[0].message.to).toBe("sub-a@example.com");
    expect(store.get("a")).toMatchObject({ status: "sent", providerMessageId: "simulated-id", payload: null });
    expect(store.calls.prepare).toBe(1);
  });

  it("e-mail de confirmação leva os cabeçalhos RFC 8058; o de link de descadastro não", async () => {
    const { store, provider, run } = setup();
    store.enqueue("c", "confirmation");
    store.enqueue("u", "unsubscribe_link");
    await run();
    const byKey = Object.fromEntries(provider.calls.map((c) => [c.options.idempotencyKey, c.message]));
    expect(byKey["nl-c"].headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(byKey["nl-u"].headers).toEqual({});
  });

  it("erro permanente → dead(permanent_error) com código; sem nova tentativa; alerta de configuração", async () => {
    const { store, run } = setup([failure("invalid_api_key")]);
    store.enqueue("p", "confirmation");
    const summary = await run();
    expect(summary).toMatchObject({ dead: 1, sent: 0 });
    expect(summary.deadByReason.permanent_error).toBe(1);
    expect(store.get("p")).toMatchObject({ status: "dead", deadReason: "permanent_error", lastErrorCode: "invalid_api_key", outcomeUnknown: false, payload: null });
  });

  it.each(["validation_error", "invalid_from_address", "invalid_parameter", "missing_required_field", "missing_api_key", "restricted_api_key", "invalid_access", "security_error"] as const)(
    "erro permanente %s → dead(permanent_error)",
    async (code) => {
      const { store, run } = setup([failure(code)]);
      store.enqueue("p", "confirmation");
      await run();
      expect(store.get("p").deadReason).toBe("permanent_error");
    },
  );

  it("rate limit do provedor → retry com backoff, sem marcar resultado desconhecido", async () => {
    const { clock, store, run } = setup([failure("rate_limit_exceeded")]);
    store.enqueue("r", "unsubscribe_link");
    const summary = await run();
    expect(summary).toMatchObject({ retried: 1, dead: 0, quotaHit: false });
    expect(store.get("r")).toMatchObject({ status: "retry", lastErrorCode: "rate_limit_exceeded", outcomeUnknown: false });
    expect(store.get("r").nextAttemptAt).toBe(clock.now + 60_000); // 1ª falha → 1 min (rng 0.5 = sem jitter)
  });

  it.each(["daily_quota_exceeded", "monthly_quota_exceeded"] as const)("%s → retry e sinaliza cota para o alerta", async (code) => {
    const { store, run } = setup([failure(code)]);
    store.enqueue("q", "unsubscribe_link");
    const summary = await run();
    expect(summary).toMatchObject({ retried: 1, quotaHit: true });
    expect(store.get("q").status).toBe("retry");
  });

  it("repetição concorrente de idempotência → retry curto (30 s) com resultado desconhecido", async () => {
    const { clock, store, run } = setup([failure("concurrent_idempotent_requests")]);
    store.enqueue("k", "unsubscribe_link");
    await run();
    expect(store.get("k")).toMatchObject({ status: "retry", outcomeUnknown: true });
    expect(store.get("k").nextAttemptAt).toBe(clock.now + 30_000);
  });

  it("idempotência inválida é bug → dead(invalid_state)", async () => {
    const { store, run } = setup([failure("invalid_idempotent_request")]);
    store.enqueue("b", "unsubscribe_link");
    const summary = await run();
    expect(summary.deadByReason.invalid_state).toBe(1);
    expect(store.get("b").deadReason).toBe("invalid_state");
  });

  it.each(["internal_server_error", "application_error", "network_error", "timeout", "aborted", "unknown"] as const)("%s é ambíguo → retry com outcome_unknown", async (code) => {
    const { store, run } = setup([failure(code)]);
    store.enqueue("x", "unsubscribe_link");
    await run();
    expect(store.get("x")).toMatchObject({ status: "retry", outcomeUnknown: true, lastErrorCode: code });
  });

  it("exceção do adaptador é tratada como resultado desconhecido (nunca derruba a invocação)", async () => {
    const { store, run } = setup([{ throws: true }]);
    store.enqueue("t", "unsubscribe_link");
    const summary = await run();
    expect(summary).toMatchObject({ retried: 1, storeErrors: 0 });
    expect(store.get("t")).toMatchObject({ status: "retry", outcomeUnknown: true });
  });

  it("timeout do processador impõe T ao adaptador que não responde", async () => {
    const params = { ...PROCESSOR_PARAMS, timeoutMs: 30 };
    const { store, run } = setup([{ hangs: true }], { params });
    store.enqueue("h", "unsubscribe_link");
    const summary = await run();
    expect(summary.retried).toBe(1);
    expect(store.get("h")).toMatchObject({ status: "retry", lastErrorCode: "timeout", outcomeUnknown: true });
  });
});

describe("idempotência, retry e recuperação de lease", () => {
  it("retentativa REUTILIZA o payload e os tokens e mantém a MESMA chave de idempotência e o mesmo conteúdo", async () => {
    const { clock, store, provider, run } = setup([failure("internal_server_error"), { ok: true, messageId: "ok-2" }]);
    store.enqueue("i", "confirmation");
    await run();
    expect(store.get("i").status).toBe("retry");
    const tokensAfterFirst = JSON.stringify(store.get("i").payload);

    clock.now += 2 * 60_000; // passa o backoff de 1 min
    const second = await run();
    expect(second.sent).toBe(1);
    expect(store.calls.prepare).toBe(1); // nenhum token novo foi gerado
    expect(provider.calls).toHaveLength(2);
    expect(provider.calls[0].options.idempotencyKey).toBe(provider.calls[1].options.idempotencyKey);
    expect(provider.calls[1].message).toEqual(provider.calls[0].message); // payload idêntico entre tentativas
    expect(tokensAfterFirst).toContain("nlt_");
    expect(store.get("i")).toMatchObject({ status: "sent", providerMessageId: "ok-2", outcomeUnknown: false });
  });

  it("item em retry só volta depois do backoff", async () => {
    const { clock, store, run } = setup([failure("rate_limit_exceeded"), { ok: true, messageId: "ok" }]);
    store.enqueue("w", "unsubscribe_link");
    await run();
    expect((await run()).claimed).toBe(0); // ainda dentro do backoff
    clock.now += 61_000;
    expect((await run()).sent).toBe(1);
  });

  it("queda do processo: o lease vence, OUTRO worker recupera o item (attempts+1, ambíguo) com a mesma chave", async () => {
    const a = setup([{ hangs: true }], { params: { ...PROCESSOR_PARAMS, timeoutMs: 20 } });
    a.store.enqueue("l", "confirmation");
    // Simula o worker que morreu depois de reivindicar e preparar: o item fica `sending`.
    const [claimed] = await a.store.claim(5, 180, ["confirmation"]);
    await a.store.prepare({ id: "l", attempt: claimed.attempts, confirm: { hash: "h".repeat(64), raw: "nlt_" + "C".repeat(43) }, unsubscribe: { hash: "g".repeat(64), raw: "nlt_" + "U".repeat(43) }, templateVersion: "confirmation-v1" });
    expect(a.store.get("l").status).toBe("sending");

    // Antes do vencimento ninguém mais reivindica.
    expect((await a.run()).claimed).toBe(0);

    // Depois do lease (L = 180 s), o próximo claim de qualquer worker recupera.
    a.clock.now += 181_000;
    const provider = new ScriptedProvider([{ ok: true, messageId: "recovered" }]);
    const summary = await dispatchOnce({ store: a.store, provider, now: () => new Date(a.clock.now), rng: () => 0.5, confirmationEnabled: true });
    expect(summary).toMatchObject({ claimed: 1, sent: 1 });
    expect(provider.calls[0].options.idempotencyKey).toBe("nl-l");
    expect(provider.calls[0].message.html).toContain("C".repeat(43)); // reutilizou o token já gravado
    expect(a.store.calls.prepare).toBe(1);
    expect(a.store.get("l")).toMatchObject({ status: "sent", attempts: 2 });
  });

  it("conclusão obsoleta (outro worker reivindicou depois do lease) é descartada, não aplicada", async () => {
    const { store, run } = setup();
    store.enqueue("s", "unsubscribe_link");
    store.forceStaleComplete = true;
    const summary = await run();
    expect(summary).toMatchObject({ stale: 1, sent: 0 });
  });

  it("teto de 12 tentativas: o item morre por attempts_exhausted, sem laço infinito", async () => {
    const { clock, store, run } = setup([failure("internal_server_error")]);
    store.enqueue("e", "unsubscribe_link");
    for (let i = 0; i < 40 && store.get("e").status !== "dead"; i += 1) {
      await run();
      clock.now += 3 * HOUR; // maior backoff
      if (clock.now - T0 > 19 * HOUR) break;
    }
    // Força o cenário de teto sem estourar o deadline.
    store.get("e").attempts = 12;
    store.get("e").status = "retry";
    store.get("e").nextAttemptAt = clock.now - 1;
    store.get("e").deadlineAt = clock.now + HOUR;
    const summary = await run();
    expect(summary.claimed).toBe(0);
    expect(summary.expired).toBe(1);
    expect(store.get("e")).toMatchObject({ status: "dead", deadReason: "attempts_exhausted" });
  });

  it("deadline de 20 h: nenhuma tentativa depois; o item vira dead(deadline_elapsed) preservando outcome_unknown", async () => {
    const { clock, store, provider, run } = setup([failure("timeout")]);
    store.enqueue("d", "unsubscribe_link");
    await run(); // ambíguo
    const calls = provider.calls.length;
    clock.now = T0 + 20 * HOUR + 1000;
    const summary = await run();
    expect(provider.calls.length).toBe(calls); // nada foi enviado depois do prazo
    expect(summary.expired).toBe(1);
    expect(store.get("d")).toMatchObject({ status: "dead", deadReason: "deadline_elapsed", outcomeUnknown: true });
  });
});

describe("revalidação antes do envio (SDD §8.2, T-NL-U16)", () => {
  it("confirmação: assinante descadastrado DEPOIS do pedido não recebe (superseded) e nada é enviado", async () => {
    const { clock, store, provider, run } = setup();
    store.enqueue("v1", "confirmation");
    store.subscribers.get("sub-v1")!.status = "unsubscribed";
    store.subscribers.get("sub-v1")!.unsubscribedAt = clock.now + 1000;
    const summary = await run();
    expect(summary).toMatchObject({ superseded: 1, sent: 0 });
    expect(provider.calls).toHaveLength(0);
    expect(store.get("v1")).toMatchObject({ status: "dead", deadReason: "superseded" });
  });

  it("confirmação: quem se descadastrou ANTES do pedido (e voltou a pedir) recebe", async () => {
    const { clock, store, run } = setup();
    store.enqueue("v2", "confirmation");
    store.subscribers.get("sub-v2")!.status = "unsubscribed";
    store.subscribers.get("sub-v2")!.unsubscribedAt = clock.now - 8 * 24 * HOUR;
    expect((await run()).sent).toBe(1);
  });

  it("confirmação para assinante já ativo é superada", async () => {
    const { store, provider, run } = setup();
    store.enqueue("v3", "confirmation");
    store.subscribers.get("sub-v3")!.status = "active";
    expect((await run()).superseded).toBe(1);
    expect(provider.calls).toHaveLength(0);
  });

  it("link de descadastro só para pending/active; assinante inexistente ou já descadastrado é superado", async () => {
    const { store, provider, run } = setup();
    store.enqueue("v4", "unsubscribe_link");
    store.subscribers.get("sub-v4")!.status = "unsubscribed";
    store.enqueue("v5", "unsubscribe_link");
    store.subscribers.delete("sub-v5");
    store.enqueue("v6", "unsubscribe_link"); // ativo: envia
    const summary = await run();
    expect(summary).toMatchObject({ superseded: 2, sent: 1 });
    expect(provider.calls).toHaveLength(1);
  });

  it("item já preparado cujo token C foi consumido ou expirou é superado (não reenvia)", async () => {
    const { clock, store, provider, run } = setup([failure("internal_server_error"), { ok: true, messageId: "x" }]);
    store.enqueue("v7", "confirmation");
    await run(); // prepara e falha de forma ambígua
    store.get("v7").confirmTokenExpiresAt = null; // token consumido/removido
    clock.now += 2 * 60_000;
    const summary = await run();
    expect(summary.superseded).toBe(1);
    expect(provider.calls).toHaveLength(1);
  });
});

describe("E4 — corrida entre prepare e envio", () => {
  it("descadastro ocorrido após renderização e antes do provedor impede envio", async () => {
    const { clock, store, provider, run } = setup();
    store.enqueue("e4-race", "confirmation");
    const originalLoad = store.loadContext.bind(store);
    let reads = 0;
    store.loadContext = async (item) => {
      reads++;
      // A última revalidação encontra um descadastro que ocorreu após o prepare.
      if (reads === 3) {
        const sub = store.subscribers.get(item.subscriberId)!;
        sub.status = "unsubscribed";
        sub.unsubscribedAt = clock.now + 1000;
      }
      return originalLoad(item);
    };
    const summary = await run();
    expect(reads).toBe(3);
    expect(summary).toMatchObject({ claimed: 1, sent: 0, superseded: 1 });
    expect(provider.calls).toHaveLength(0);
    expect(store.get("e4-race")).toMatchObject({ status: "dead", deadReason: "superseded" });
  });

  it("payload revogado após prepare também impede chamada ao provedor", async () => {
    const { store, provider, run } = setup();
    store.enqueue("e4-token", "confirmation");
    const originalLoad = store.loadContext.bind(store);
    let reads = 0;
    store.loadContext = async (item) => {
      reads++;
      if (reads === 3) store.get(item.id).payload = null;
      return originalLoad(item);
    };
    const summary = await run();
    expect(summary).toMatchObject({ sent: 0, superseded: 1 });
    expect(provider.calls).toHaveLength(0);
  });
});

describe("flag de confirmação, orçamento e falhas do armazenamento", () => {
  it("com NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED desligada só reivindica unsubscribe_link", async () => {
    const { store, provider, run } = setup(undefined, { confirmationEnabled: false });
    store.enqueue("f1", "confirmation");
    store.enqueue("f2", "unsubscribe_link");
    const summary = await run();
    expect(store.lastClaimKinds).toEqual(["unsubscribe_link"]);
    expect(summary).toMatchObject({ sent: 1, confirmationPaused: true });
    expect(provider.calls.map((c) => c.options.idempotencyKey)).toEqual(["nl-f2"]);
    expect(store.get("f1").status).toBe("queued"); // espera; morre por deadline se a flag seguir desligada
  });

  it("com a flag ligada reivindica os dois tipos", async () => {
    const { store, run } = setup(undefined, { confirmationEnabled: true });
    store.enqueue("f3", "confirmation");
    await run();
    expect(store.lastClaimKinds).toEqual(["confirmation", "unsubscribe_link"]);
  });

  it("não reivindica novo lote sem orçamento de tempo (restante < B·T + M)", async () => {
    const clock = { now: T0 };
    const store = new FakeStore(clock);
    store.enqueue("o1", "unsubscribe_link");
    let calls = 0;
    // Cada leitura do relógio avança: a segunda já está sem orçamento para um lote inteiro.
    const now = () => new Date(T0 + (calls++ > 0 ? 120_000 - BATCH_BUDGET_MS + 1 : 0));
    const summary = await dispatchOnce({ store, provider: new ScriptedProvider(), now, rng: () => 0.5, confirmationEnabled: true });
    expect(summary.claimed).toBe(0);
    expect(store.calls.claim).toBe(0);
  });

  it("falha do armazenamento interrompe a invocação sem lançar; o item fica para recuperação por lease", async () => {
    const { store, provider, run } = setup();
    store.enqueue("z", "unsubscribe_link");
    store.failNext.complete = true;
    const summary = await run();
    expect(summary.storeErrors).toBe(1);
    expect(provider.calls).toHaveLength(1); // o envio aconteceu; a recuperação reconcilia pela chave
    expect(store.get("z").status).toBe("sending");
  });

  it("o resumo só tem contagens: nenhum e-mail, token ou chave", async () => {
    const { store, run } = setup();
    store.enqueue("n", "confirmation");
    const text = JSON.stringify(await run());
    expect(text).not.toMatch(/@|nlt_|nl-n|sub-n/);
  });
});
