// Armazenamento do processador sobre a migration 018: chama as RPCs `newsletter_outbox_*` e faz
// apenas as LEITURAS necessárias à revalidação. Nenhuma regra transacional é reimplementada aqui.
// Erros viram NewsletterStoreError sem detalhes (nada de e-mail, token ou texto do banco).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClaimedItem, CompleteArgs, ItemContext, OutboxStore } from "@/lib/newsletter/processor";
import { NewsletterStoreError } from "@/lib/newsletter/service";
import type { TemplateKind } from "@/lib/newsletter/templates";

type ClaimRow = {
  id: string;
  subscriber_id: string;
  kind: TemplateKind;
  attempts: number;
  consent_text_version: string | null;
  policy_version: string | null;
  idempotency_key: string;
  outcome_unknown: boolean;
};

async function rpc(client: SupabaseClient, fn: string, args: Record<string, unknown>): Promise<unknown> {
  let result: { data: unknown; error: unknown };
  try {
    result = await client.rpc(fn, args);
  } catch {
    throw new NewsletterStoreError(`falha de rede em ${fn}`);
  }
  if (result.error) throw new NewsletterStoreError(`erro do banco em ${fn}`);
  return result.data;
}

async function maybeRow<T>(query: PromiseLike<{ data: T | null; error: unknown }>, what: string): Promise<T | null> {
  let result: { data: T | null; error: unknown };
  try {
    result = await query;
  } catch {
    throw new NewsletterStoreError(`falha de rede ao ler ${what}`);
  }
  if (result.error) throw new NewsletterStoreError(`erro do banco ao ler ${what}`);
  return result.data;
}

export function createSupabaseStore(client: SupabaseClient): OutboxStore {
  return {
    async claim(batch, leaseSeconds, kinds): Promise<ClaimedItem[]> {
      const data = await rpc(client, "newsletter_outbox_claim", { p_batch: batch, p_lease_seconds: leaseSeconds, p_kinds: kinds });
      return ((data as ClaimRow[] | null) ?? []).map((row) => ({
        id: row.id,
        subscriberId: row.subscriber_id,
        kind: row.kind,
        attempts: row.attempts,
        consentTextVersion: row.consent_text_version,
        policyVersion: row.policy_version,
        idempotencyKey: row.idempotency_key,
        outcomeUnknown: row.outcome_unknown,
      }));
    },

    async loadContext(item): Promise<ItemContext> {
      const outbox = await maybeRow<{ created_at: string }>(
        client.from("newsletter_outbox").select("created_at").eq("id", item.id).maybeSingle(),
        "outbox",
      );
      const subscriber = await maybeRow<{ email: string; status: "pending" | "active" | "unsubscribed"; unsubscribed_at: string | null }>(
        client.from("newsletter_subscribers").select("email, status, unsubscribed_at").eq("id", item.subscriberId).maybeSingle(),
        "assinante",
      );
      const payload = await maybeRow<{ confirm_token: string | null; unsubscribe_token: string; template_version: string }>(
        client.from("newsletter_outbox_payload").select("confirm_token, unsubscribe_token, template_version").eq("outbox_id", item.id).maybeSingle(),
        "payload",
      );
      const confirmToken = await maybeRow<{ expires_at: string }>(
        client.from("newsletter_tokens").select("expires_at").eq("outbox_id", item.id).eq("kind", "confirm").maybeSingle(),
        "token",
      );
      return {
        subscriber: subscriber && { email: subscriber.email, status: subscriber.status, unsubscribedAt: subscriber.unsubscribed_at },
        outboxCreatedAt: outbox?.created_at ?? new Date(0).toISOString(),
        payload: payload && { confirmToken: payload.confirm_token, unsubscribeToken: payload.unsubscribe_token, templateVersion: payload.template_version },
        confirmTokenExpiresAt: confirmToken?.expires_at ?? null,
      };
    },

    async prepare(args) {
      const data = await rpc(client, "newsletter_outbox_prepare", {
        p_id: args.id,
        p_attempt: args.attempt,
        p_confirm_hash: args.confirm?.hash ?? null,
        p_confirm_raw: args.confirm?.raw ?? null,
        p_unsub_hash: args.unsubscribe.hash,
        p_unsub_raw: args.unsubscribe.raw,
        p_template_version: args.templateVersion,
      });
      if (data === "prepared" || data === "already_prepared" || data === "stale") return data;
      throw new NewsletterStoreError("resposta inesperada de newsletter_outbox_prepare");
    },

    async complete(args: CompleteArgs) {
      const base = { p_id: args.id, p_attempt: args.attempt, p_outcome: args.outcome };
      const params: Record<string, unknown> =
        args.outcome === "sent"
          ? { ...base, p_provider_message_id: args.providerMessageId }
          : args.outcome === "retry"
            ? { ...base, p_next_attempt_at: args.nextAttemptAt.toISOString(), p_error_code: args.errorCode, p_outcome_unknown: args.outcomeUnknown }
            : { ...base, p_dead_reason: args.deadReason, p_error_code: args.errorCode, p_outcome_unknown: args.outcomeUnknown };
      const data = await rpc(client, "newsletter_outbox_complete", params);
      if (data === "applied" || data === "stale") return data;
      throw new NewsletterStoreError("resposta inesperada de newsletter_outbox_complete");
    },

    async expire() {
      const data = await rpc(client, "newsletter_outbox_expire", {});
      return typeof data === "number" ? data : 0;
    },
  };
}
