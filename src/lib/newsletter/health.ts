// Saúde da fila (SDD Newsletter §8.6). Só contagens e idade: sem PII, sem token, sem e-mail.

import type { SupabaseClient } from "@supabase/supabase-js";
import { NewsletterStoreError } from "@/lib/newsletter/service";

export type QueueHealth = {
  queued: number;
  retry: number;
  sending: number;
  sending_lease_expired: number;
  dead_24h: number;
  oldest_ready_age_seconds: number | null;
};

async function count(query: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  let result: { count: number | null; error: unknown };
  try {
    result = await query;
  } catch {
    throw new NewsletterStoreError("falha de rede ao ler a saúde da fila");
  }
  if (result.error) throw new NewsletterStoreError("erro do banco ao ler a saúde da fila");
  return result.count ?? 0;
}

export async function getQueueHealth(client: SupabaseClient, now: Date = new Date()): Promise<QueueHealth> {
  const nowIso = now.toISOString();
  const since = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const head = () => client.from("newsletter_outbox").select("id", { count: "exact", head: true });

  const [queued, retry, sending, expired, dead] = await Promise.all([
    count(head().eq("status", "queued")),
    count(head().eq("status", "retry")),
    count(head().eq("status", "sending")),
    count(head().eq("status", "sending").lte("lease_until", nowIso)),
    count(head().eq("status", "dead").gte("updated_at", since)),
  ]);

  let oldest: { data: Array<{ next_attempt_at: string }> | null; error: unknown };
  try {
    oldest = await client
      .from("newsletter_outbox")
      .select("next_attempt_at")
      .in("status", ["queued", "retry"])
      .lte("next_attempt_at", nowIso)
      .order("next_attempt_at", { ascending: true })
      .limit(1);
  } catch {
    throw new NewsletterStoreError("falha de rede ao ler o item mais antigo");
  }
  if (oldest.error) throw new NewsletterStoreError("erro do banco ao ler o item mais antigo");
  const first = oldest.data?.[0]?.next_attempt_at;

  return {
    queued,
    retry,
    sending,
    sending_lease_expired: expired,
    dead_24h: dead,
    oldest_ready_age_seconds: first ? Math.max(0, Math.floor((now.getTime() - new Date(first).getTime()) / 1000)) : null,
  };
}
