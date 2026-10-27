import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CleanupRegistry } from "../integration/support/cleanup";
import { HarnessError, describeError } from "../integration/support/errors";
import { getQueueHealth, type QueueHealth } from "@/lib/newsletter/health";
import { createSupabaseStore } from "@/lib/newsletter/store";
import type { TemplateKind } from "@/lib/newsletter/templates";
import type { ItemSnapshot, Lc01Backend } from "./backend";

// Backend do LC-01 sobre o Supabase ISOLADO (RPCs reais da migration 018). NÃO executado nesta etapa.
// Cria assinantes sintéticos (lc01-<tag>-*@example.com), registrados ANTES do uso, e os remove no
// cleanup (os itens do outbox saem por CASCADE). Nunca toca registros que não sejam seus.
export class SupabaseBackend implements Lc01Backend {
  readonly store;
  private readonly registry = new CleanupRegistry();
  private n = 0;

  constructor(private readonly client: SupabaseClient, private readonly tag: string) {
    this.store = createSupabaseStore(client);
  }

  now(): Date {
    return new Date();
  }

  private async ok<T>(label: string, query: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
    const { data, error } = await query;
    if (error) throw new HarnessError(`${label} falhou: ${describeError(error)}`);
    return data as T;
  }

  private async rpc(fn: string, args: Record<string, unknown>): Promise<void> {
    const { error } = await this.client.rpc(fn, args);
    if (error) throw new HarnessError(`${fn} falhou: ${describeError(error)}`);
  }

  async enqueue(kind: TemplateKind): Promise<string> {
    this.n += 1;
    const email = `lc01-${this.tag}-${this.n}-${randomUUID().slice(0, 6)}@example.com`;
    this.registry.track("newsletter_subscribers", "email_normalized", email);

    if (kind === "confirmation") {
      await this.rpc("newsletter_request_subscription", {
        p_email: email, p_email_normalized: email, p_consent_text_version: "lc01-consent", p_policy_version: "lc01-policy", p_source_path: "/", p_ip_hash: null,
      });
    } else {
      // Link de descadastro só existe para assinante pending/active: cria um ativo sintético.
      await this.ok("insert subscriber", this.client.from("newsletter_subscribers").insert({ email, email_normalized: email, status: "active", confirmed_at: new Date().toISOString() }).select("id"));
      await this.rpc("newsletter_request_unsubscribe_link", { p_email_normalized: email });
    }
    const sub = await this.ok<Array<{ id: string }>>("select subscriber", this.client.from("newsletter_subscribers").select("id").eq("email_normalized", email));
    const out = await this.ok<Array<{ id: string }>>("select outbox", this.client.from("newsletter_outbox").select("id").eq("subscriber_id", sub[0].id).eq("kind", kind));
    if (!out[0]) throw new HarnessError("item do outbox não foi criado");
    return out[0].id;
  }

  async snapshot(id: string): Promise<ItemSnapshot> {
    const rows = await this.ok<Array<{ status: string; attempts: number; outcome_unknown: boolean; dead_reason: string | null; last_error_code: string | null; provider_message_id: string | null }>>(
      "snapshot",
      this.client.from("newsletter_outbox").select("status, attempts, outcome_unknown, dead_reason, last_error_code, provider_message_id").eq("id", id),
    );
    const payload = await this.ok<Array<{ outbox_id: string }>>("payload", this.client.from("newsletter_outbox_payload").select("outbox_id").eq("outbox_id", id));
    const r = rows[0];
    return { status: r.status, attempts: r.attempts, outcomeUnknown: r.outcome_unknown, deadReason: r.dead_reason, lastErrorCode: r.last_error_code, providerMessageId: r.provider_message_id, hasPayload: payload.length > 0 };
  }

  private async update(id: string, patch: Record<string, unknown>): Promise<void> {
    await this.ok("update", this.client.from("newsletter_outbox").update(patch).eq("id", id).select("id"));
  }

  expireLease = (id: string) => this.update(id, { lease_until: new Date(Date.now() - 1000).toISOString() });
  elapseDeadline = (id: string) => this.update(id, { deadline_at: new Date(Date.now() - 60_000).toISOString() });
  releaseBackoff = (id: string) => this.update(id, { next_attempt_at: new Date(Date.now() - 1000).toISOString() });
  ageReady = (id: string, seconds: number) => this.update(id, { next_attempt_at: new Date(Date.now() - seconds * 1000).toISOString() });

  health(): Promise<QueueHealth> {
    return getQueueHealth(this.client);
  }

  async cleanup(): Promise<void> {
    const problems = [...(await this.registry.run(this.client)), ...(await this.registry.inspectResidue(this.client))];
    if (problems.length > 0) throw new HarnessError(`Falha de limpeza do LC-01: ${problems.join(" | ")}`);
  }
}
