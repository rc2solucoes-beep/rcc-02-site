import type { ClaimedItem, CompleteArgs, ItemContext, OutboxStore } from "@/lib/newsletter/processor";
import type { TemplateKind } from "@/lib/newsletter/templates";

// Armazenamento em memória que reproduz o CONTRATO das RPCs da migration 018 (elegibilidade do
// claim, lease, comparação e troca, teto de tentativas, deadline de 20 h). A lógica real é provada
// no banco pela suíte T-NL-I; aqui só se exercita a orquestração do processador. Sem relógio real.

export type FakeItem = {
  id: string;
  subscriberId: string;
  kind: TemplateKind;
  status: "queued" | "sending" | "retry" | "sent" | "dead";
  attempts: number;
  nextAttemptAt: number;
  leaseUntil: number | null;
  deadlineAt: number;
  createdAt: number;
  outcomeUnknown: boolean;
  lastErrorCode: string | null;
  deadReason: string | null;
  providerMessageId: string | null;
  payload: { confirmToken: string | null; unsubscribeToken: string; templateVersion: string } | null;
  confirmTokenExpiresAt: number | null;
};

export type FakeSubscriber = { email: string; status: "pending" | "active" | "unsubscribed"; unsubscribedAt: number | null };

export class FakeStore implements OutboxStore {
  items = new Map<string, FakeItem>();
  subscribers = new Map<string, FakeSubscriber>();
  calls = { claim: 0, prepare: 0, complete: 0, expire: 0 };
  lastClaimKinds: TemplateKind[] = [];
  failNext: Partial<Record<"claim" | "complete" | "loadContext" | "prepare" | "expire", boolean>> = {};
  /** Simula conclusão obsoleta: outro worker reivindicou depois do vencimento do lease. */
  forceStaleComplete = false;

  constructor(public clock: { now: number }) {}

  addSubscriber(id: string, sub: Partial<FakeSubscriber> = {}): void {
    this.subscribers.set(id, { email: `${id}@example.com`, status: "pending", unsubscribedAt: null, ...sub });
  }

  enqueue(id: string, kind: TemplateKind, subscriberId = `sub-${id}`): FakeItem {
    if (!this.subscribers.has(subscriberId)) this.addSubscriber(subscriberId, { status: kind === "confirmation" ? "pending" : "active" });
    const item: FakeItem = {
      id, subscriberId, kind, status: "queued", attempts: 0, nextAttemptAt: this.clock.now, leaseUntil: null,
      deadlineAt: this.clock.now + 20 * 3600_000, createdAt: this.clock.now, outcomeUnknown: false,
      lastErrorCode: null, deadReason: null, providerMessageId: null, payload: null, confirmTokenExpiresAt: null,
    };
    this.items.set(id, item);
    return item;
  }

  get(id: string): FakeItem {
    const item = this.items.get(id);
    if (!item) throw new Error(`item ${id} inexistente`);
    return item;
  }

  private maybeFail(op: keyof FakeStore["failNext"]): void {
    if (this.failNext[op]) {
      this.failNext[op] = false;
      throw new Error("falha simulada do armazenamento");
    }
  }

  async claim(batch: number, leaseSeconds: number, kinds: TemplateKind[]): Promise<ClaimedItem[]> {
    this.maybeFail("claim");
    this.calls.claim += 1;
    this.lastClaimKinds = kinds;
    const now = this.clock.now;
    const eligible = [...this.items.values()]
      .filter((i) => kinds.includes(i.kind) && i.deadlineAt > now && i.attempts < 12)
      .filter((i) => ((i.status === "queued" || i.status === "retry") && i.nextAttemptAt <= now) || (i.status === "sending" && i.leaseUntil !== null && i.leaseUntil <= now))
      .sort((a, b) => a.nextAttemptAt - b.nextAttemptAt)
      .slice(0, batch);
    return eligible.map((i) => {
      const recovering = i.status === "sending";
      i.status = "sending";
      i.attempts += 1;
      i.leaseUntil = now + leaseSeconds * 1000;
      i.outcomeUnknown = i.outcomeUnknown || recovering;
      return { id: i.id, subscriberId: i.subscriberId, kind: i.kind, attempts: i.attempts, consentTextVersion: "v", policyVersion: "p", idempotencyKey: `nl-${i.id}`, outcomeUnknown: i.outcomeUnknown };
    });
  }

  async loadContext(item: ClaimedItem): Promise<ItemContext> {
    this.maybeFail("loadContext");
    const row = this.get(item.id);
    const sub = this.subscribers.get(item.subscriberId);
    return {
      subscriber: sub ? { email: sub.email, status: sub.status, unsubscribedAt: sub.unsubscribedAt === null ? null : new Date(sub.unsubscribedAt).toISOString() } : null,
      outboxCreatedAt: new Date(row.createdAt).toISOString(),
      payload: row.payload && { ...row.payload },
      confirmTokenExpiresAt: row.confirmTokenExpiresAt === null ? null : new Date(row.confirmTokenExpiresAt).toISOString(),
    };
  }

  async prepare(args: Parameters<OutboxStore["prepare"]>[0]): Promise<"prepared" | "already_prepared" | "stale"> {
    this.maybeFail("prepare");
    this.calls.prepare += 1;
    const row = this.get(args.id);
    if (row.status !== "sending" || row.attempts !== args.attempt) return "stale";
    if (row.payload) return "already_prepared";
    row.payload = { confirmToken: args.confirm?.raw ?? null, unsubscribeToken: args.unsubscribe.raw, templateVersion: args.templateVersion };
    row.confirmTokenExpiresAt = args.confirm ? row.createdAt + 48 * 3600_000 : null;
    return "prepared";
  }

  async complete(args: CompleteArgs): Promise<"applied" | "stale"> {
    this.maybeFail("complete");
    this.calls.complete += 1;
    const row = this.get(args.id);
    if (this.forceStaleComplete || row.status !== "sending" || row.attempts !== args.attempt) return "stale";
    row.leaseUntil = null;
    if (args.outcome === "sent") {
      row.status = "sent";
      row.providerMessageId = args.providerMessageId;
      row.outcomeUnknown = false;
      row.payload = null;
    } else if (args.outcome === "retry") {
      row.status = "retry";
      row.nextAttemptAt = args.nextAttemptAt.getTime();
      row.lastErrorCode = args.errorCode;
      row.outcomeUnknown = args.outcomeUnknown;
    } else {
      row.status = "dead";
      row.deadReason = args.deadReason;
      row.lastErrorCode = args.errorCode;
      row.outcomeUnknown = args.outcomeUnknown;
      row.payload = null;
      if (!args.outcomeUnknown) row.confirmTokenExpiresAt = null;
    }
    return "applied";
  }

  async expire(): Promise<number> {
    this.maybeFail("expire");
    this.calls.expire += 1;
    const now = this.clock.now;
    let killed = 0;
    for (const i of this.items.values()) {
      const open = i.status === "queued" || i.status === "retry" || (i.status === "sending" && i.leaseUntil !== null && i.leaseUntil <= now);
      if (open && (i.deadlineAt <= now || i.attempts >= 12)) {
        i.status = "dead";
        i.deadReason = i.deadlineAt <= now ? "deadline_elapsed" : "attempts_exhausted";
        i.leaseUntil = null;
        i.payload = null;
        killed += 1;
      }
    }
    return killed;
  }
}
