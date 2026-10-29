import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateProbe } from "@/lib/newsletter/probe";
import type { OutboxStore } from "@/lib/newsletter/processor";
import type { EmailProvider } from "@/lib/newsletter/provider";
import type { Lc01Backend } from "./backend";
import { SIMULATOR_KEY_PREFIX, assertSimulatorUrl, startResendSimulator, type Simulator } from "./resendSimulator";

// Os sete cenários do gate de lançamento do processador (SDD Newsletter §8.9, LC-01), escritos uma
// vez e executados contra qualquer `Lc01Backend`. O provedor é o `ResendProvider` REAL (SDK 6.12.2)
// apontado, via RESEND_BASE_URL, para o simulador em loopback: o caminho HTTP de verdade, sem
// e-mail real. O módulo do Resend é carregado DEPOIS de a variável existir (o SDK a lê na carga).

type Mod = {
  dispatchOnce: typeof import("@/lib/newsletter/processor").dispatchOnce;
  PROCESSOR_PARAMS: typeof import("@/lib/newsletter/processor").PROCESSOR_PARAMS;
  ResendProvider: typeof import("@/lib/newsletter/provider").ResendProvider;
};

export function defineLc01Scenarios(label: string, makeBackend: () => Promise<Lc01Backend>, options: { enabled?: boolean } = {}): void {
  const run = options.enabled === false ? describe.skip : describe;

  run(`LC-01 — ${label}`, () => {
    let sim: Simulator;
    let mod: Mod;
    let backend: Lc01Backend;
    const savedBaseUrl = process.env.RESEND_BASE_URL;

    beforeAll(async () => {
      sim = await startResendSimulator();
      assertSimulatorUrl(sim.url); // trava: loopback, nunca api.resend.com
      process.env.RESEND_BASE_URL = sim.url;
      vi.resetModules(); // o SDK lê RESEND_BASE_URL na carga do módulo
      const processor = await import("@/lib/newsletter/processor");
      const provider = await import("@/lib/newsletter/provider");
      mod = { dispatchOnce: processor.dispatchOnce, PROCESSOR_PARAMS: processor.PROCESSOR_PARAMS, ResendProvider: provider.ResendProvider };
    });

    afterAll(async () => {
      if (savedBaseUrl === undefined) delete process.env.RESEND_BASE_URL;
      else process.env.RESEND_BASE_URL = savedBaseUrl;
      await sim.close();
    });

    beforeEach(async () => {
      sim.reset();
      backend = await makeBackend();
    });
    afterEach(async () => {
      // O simulador jamais pode ter recebido destinatário real nem chave fora do padrão re_sim_*.
      expect(sim.violations).toEqual([]);
      expect(sim.requests.every((r) => r.syntheticRecipient)).toBe(true);
      await backend.cleanup();
    });

    const newProvider = (): EmailProvider => new mod.ResendProvider(`${SIMULATOR_KEY_PREFIX}lc01`);
    const dispatch = (opts: { store?: OutboxStore; provider?: EmailProvider; timeoutMs?: number } = {}) =>
      mod.dispatchOnce({
        store: opts.store ?? backend.store,
        provider: opts.provider ?? newProvider(),
        confirmationEnabled: true,
        now: () => backend.now(),
        params: { ...mod.PROCESSOR_PARAMS, timeoutMs: opts.timeoutMs ?? mod.PROCESSOR_PARAMS.timeoutMs },
      });
    const keyOf = (id: string) => `nl-${id}`;
    const reqsOf = (id: string) => sim.requests.filter((r) => r.idempotencyKey === keyOf(id));

    it("1. envio normal: confirmação e link de descadastro saem uma vez, com os cabeçalhos certos", async () => {
      const confirmation = await backend.enqueue("confirmation");
      const link = await backend.enqueue("unsubscribe_link");
      const summary = await dispatch();
      expect(summary).toMatchObject({ claimed: 2, sent: 2, retried: 0, dead: 0, storeErrors: 0 });
      expect(sim.deliveries.size).toBe(2);
      expect(reqsOf(confirmation)).toHaveLength(1);
      expect(reqsOf(link)).toHaveLength(1);
      expect(reqsOf(confirmation)[0].hasListUnsubscribe).toBe(true); // RFC 8058 na confirmação
      expect(reqsOf(link)[0].hasListUnsubscribe).toBe(false);
      for (const id of [confirmation, link]) {
        const snap = await backend.snapshot(id);
        expect(snap).toMatchObject({ status: "sent", outcomeUnknown: false, hasPayload: false });
        expect(snap.providerMessageId).toBe(sim.deliveries.get(keyOf(id)));
      }
    });

    it("2. falha ao gravar o resultado depois do envio: o lease vence, OUTRO worker recupera e a chave evita o e-mail duplicado", async () => {
      const id = await backend.enqueue("confirmation");
      // Worker A envia (entrega aceita), mas a gravação do resultado falha: o item fica `sending`.
      let failOnce = true;
      const flaky = new Proxy(backend.store, {
        get(target, prop, receiver) {
          if (prop === "complete" && failOnce) {
            return async () => {
              failOnce = false;
              throw new Error("queda simulada do worker");
            };
          }
          const value = Reflect.get(target, prop, receiver) as unknown;
          return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(target) : value;
        },
      });
      const first = await dispatch({ store: flaky });
      expect(first.storeErrors).toBe(1);
      expect(sim.deliveries.has(keyOf(id))).toBe(true);
      expect((await backend.snapshot(id)).status).toBe("sending");

      // Enquanto o lease é válido ninguém mais reivindica.
      expect((await dispatch()).claimed).toBe(0);

      // O lease vence; o próximo claim de qualquer worker recupera (ambíguo) com a MESMA chave.
      await backend.expireLease(id);
      const second = await dispatch();
      expect(second).toMatchObject({ claimed: 1, sent: 1 });
      const calls = reqsOf(id);
      expect(calls).toHaveLength(2);
      expect(calls[1].replay).toBe(true); // o provedor reconheceu a chave e devolveu a resposta original
      expect(calls[1].bodyHash).toBe(calls[0].bodyHash); // payload idêntico entre tentativas
      expect(sim.deliveries.size).toBe(1); // UM e-mail entregue
      const snap = await backend.snapshot(id);
      expect(snap).toMatchObject({ status: "sent", attempts: 2, outcomeUnknown: false });
      expect(snap.providerMessageId).toBe(sim.deliveries.get(keyOf(id)));
    });

    it("3. 5xx (e conexão derrubada após aceitar): retry com a mesma chave e um único e-mail entregue", async () => {
      const a = await backend.enqueue("unsubscribe_link");
      sim.script("server_error", "ok");
      expect(await dispatch()).toMatchObject({ retried: 1, sent: 0 });
      expect(await backend.snapshot(a)).toMatchObject({ status: "retry", outcomeUnknown: true, lastErrorCode: "internal_server_error" });
      expect(sim.deliveries.size).toBe(0);
      await backend.releaseBackoff(a);
      expect(await dispatch()).toMatchObject({ sent: 1 });
      expect(reqsOf(a)).toHaveLength(2);
      expect(reqsOf(a)[1].bodyHash).toBe(reqsOf(a)[0].bodyHash);
      expect(sim.deliveries.size).toBe(1);

      // Pior caso: o provedor ACEITA e a resposta se perde. A repetição devolve a resposta original.
      sim.reset();
      const b = await backend.enqueue("unsubscribe_link");
      sim.script("accept_then_drop", "ok");
      expect(await dispatch()).toMatchObject({ retried: 1 });
      expect(sim.deliveries.has(keyOf(b))).toBe(true); // já foi entregue, mas o cliente não soube
      await backend.releaseBackoff(b);
      expect(await dispatch()).toMatchObject({ sent: 1 });
      expect(reqsOf(b)[1].replay).toBe(true);
      expect([...sim.deliveries.keys()].filter((k) => k === keyOf(b))).toHaveLength(1);
    });

    it("3b. timeout do cliente (provedor que não responde): ambíguo; a repetição enquanto a original está em voo recebe 'concurrent' e só depois entrega, com a mesma chave", async () => {
      const id = await backend.enqueue("unsubscribe_link");
      sim.script("hang", "ok");
      expect(await dispatch({ timeoutMs: 150 })).toMatchObject({ retried: 1 });
      expect(await backend.snapshot(id)).toMatchObject({ status: "retry", lastErrorCode: "timeout", outcomeUnknown: true });

      // A requisição original ainda está em voo no provedor: a mesma chave é recusada como concorrente.
      await backend.releaseBackoff(id);
      expect(await dispatch()).toMatchObject({ retried: 1, sent: 0 });
      expect(await backend.snapshot(id)).toMatchObject({ status: "retry", lastErrorCode: "concurrent_idempotent_requests", outcomeUnknown: true });

      // O provedor termina o processamento em voo; a próxima tentativa conclui.
      sim.releaseHangs();
      await backend.releaseBackoff(id);
      expect(await dispatch()).toMatchObject({ sent: 1 });
      const keys = new Set(reqsOf(id).map((r) => r.idempotencyKey));
      expect(keys).toEqual(new Set([keyOf(id)])); // sempre a mesma chave
      expect(sim.deliveries.size).toBe(1);
    });

    it("4. indisponibilidade prolongada: tenta com backoff, não envia depois do prazo e morre por deadline preservando o resultado desconhecido", async () => {
      const id = await backend.enqueue("unsubscribe_link");
      sim.script("server_error");
      for (let i = 0; i < 3; i += 1) {
        expect(await dispatch()).toMatchObject({ retried: 1, sent: 0 });
        await backend.releaseBackoff(id);
      }
      expect(reqsOf(id)).toHaveLength(3);

      await backend.elapseDeadline(id);
      const after = await dispatch();
      expect(after).toMatchObject({ claimed: 0, expired: 1 }); // alerta de entrega é gerado a partir de `expired`
      expect(reqsOf(id)).toHaveLength(3); // nenhuma tentativa depois do prazo
      expect(await backend.snapshot(id)).toMatchObject({ status: "dead", deadReason: "deadline_elapsed", outcomeUnknown: true, hasPayload: false });
      expect(sim.deliveries.size).toBe(0);
    });

    it("5. dispatcher parado: a idade do item pronto estoura 15 min e a sonda alerta; depois de processar, normaliza", async () => {
      const id = await backend.enqueue("unsubscribe_link");
      await backend.ageReady(id, 20 * 60);
      const stalled = await backend.health();
      expect(stalled.oldest_ready_age_seconds).toBeGreaterThan(15 * 60);
      expect(evaluateProbe(stalled)).toEqual({ alert: true, reasons: ["queue_stalled"] });
      expect(evaluateProbe(null)).toEqual({ alert: true, reasons: ["probe_failed"] }); // a própria sonda falhou

      expect(await dispatch()).toMatchObject({ sent: 1 });
      const healthy = await backend.health();
      expect(healthy.oldest_ready_age_seconds).toBeNull();
      expect(evaluateProbe(healthy, stalled).alert).toBe(false);
      expect(JSON.stringify(stalled)).not.toMatch(/@|nlt_|nl-/); // health sem PII
    });

    it("6. dois workers concorrentes: nenhum item é processado duas vezes", async () => {
      const ids: string[] = [];
      for (let i = 0; i < 6; i += 1) ids.push(await backend.enqueue(i % 2 === 0 ? "confirmation" : "unsubscribe_link"));
      const [a, b] = await Promise.all([dispatch(), dispatch()]);
      expect(a.sent + b.sent).toBe(6);
      expect(a.stale + b.stale).toBe(0);
      for (const id of ids) {
        expect(reqsOf(id), `chave ${id} enviada mais de uma vez`).toHaveLength(1);
        expect((await backend.snapshot(id)).status).toBe("sent");
      }
      expect(sim.deliveries.size).toBe(6);
      expect(sim.requests.some((r) => r.replay)).toBe(false);
    });

    it("7. item que falha sempre: 12 tentativas, depois attempts_exhausted, sem laço infinito", async () => {
      const id = await backend.enqueue("unsubscribe_link");
      sim.script("drop"); // conexão derrubada em toda tentativa (resultado ambíguo)
      for (let i = 0; i < 12; i += 1) {
        await dispatch();
        await backend.releaseBackoff(id);
      }
      expect(reqsOf(id)).toHaveLength(12);
      expect((await backend.snapshot(id)).attempts).toBe(12);

      const last = await dispatch(); // o claim não reivindica mais; o expire encerra
      expect(last).toMatchObject({ claimed: 0, expired: 1 });
      expect(await backend.snapshot(id)).toMatchObject({ status: "dead", deadReason: "attempts_exhausted", outcomeUnknown: true });
      await dispatch();
      await dispatch();
      expect(reqsOf(id)).toHaveLength(12); // nada mais é enviado
    });
  });
}
