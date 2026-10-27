import type { QueueHealth } from "@/lib/newsletter/health";
import type { TemplateKind } from "@/lib/newsletter/templates";
import { FakeStore } from "../unit/newsletter/fakeStore";
import type { ItemSnapshot, Lc01Backend } from "./backend";

// Backend em memória do LC-01 (ensaio). Relógio simulado: o tempo só anda quando o cenário manda.
export class FakeBackend implements Lc01Backend {
  readonly clock = { now: Date.UTC(2026, 9, 27, 12, 0, 0) };
  readonly fake = new FakeStore(this.clock);
  readonly store = this.fake;
  private n = 0;

  now(): Date {
    return new Date(this.clock.now);
  }

  async enqueue(kind: TemplateKind): Promise<string> {
    this.n += 1;
    const id = `lc01-${this.n}`;
    this.fake.addSubscriber(`sub-${id}`, { status: kind === "confirmation" ? "pending" : "active" });
    this.fake.enqueue(id, kind, `sub-${id}`);
    return id;
  }

  async snapshot(id: string): Promise<ItemSnapshot> {
    const i = this.fake.get(id);
    return { status: i.status, attempts: i.attempts, outcomeUnknown: i.outcomeUnknown, deadReason: i.deadReason, lastErrorCode: i.lastErrorCode, providerMessageId: i.providerMessageId, hasPayload: i.payload !== null };
  }

  async expireLease(id: string): Promise<void> {
    this.fake.get(id).leaseUntil = this.clock.now - 1000;
  }

  async elapseDeadline(id: string): Promise<void> {
    this.fake.get(id).deadlineAt = this.clock.now - 60_000;
  }

  async releaseBackoff(id: string): Promise<void> {
    this.fake.get(id).nextAttemptAt = this.clock.now - 1000;
  }

  async ageReady(id: string, seconds: number): Promise<void> {
    this.fake.get(id).nextAttemptAt = this.clock.now - seconds * 1000;
  }

  async health(): Promise<QueueHealth> {
    const items = [...this.fake.items.values()];
    const count = (s: string) => items.filter((i) => i.status === s).length;
    const ready = items.filter((i) => (i.status === "queued" || i.status === "retry") && i.nextAttemptAt <= this.clock.now);
    const oldest = ready.length ? Math.min(...ready.map((i) => i.nextAttemptAt)) : null;
    return {
      queued: count("queued"),
      retry: count("retry"),
      sending: count("sending"),
      sending_lease_expired: items.filter((i) => i.status === "sending" && i.leaseUntil !== null && i.leaseUntil <= this.clock.now).length,
      dead_24h: count("dead"),
      oldest_ready_age_seconds: oldest === null ? null : Math.floor((this.clock.now - oldest) / 1000),
    };
  }

  async cleanup(): Promise<void> {
    this.fake.items.clear();
    this.fake.subscribers.clear();
  }
}
