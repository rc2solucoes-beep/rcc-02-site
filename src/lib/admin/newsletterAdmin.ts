import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSessionClient } from "@/lib/supabase/server";
import {
  PAGE_SIZE, buildListHref, buildSearchOrFilter, firstParam, pageCount, pageRange, parsePage, parseSearchTerm,
  type RawSearchParams,
} from "@/lib/admin/listParams";
import { getQueueHealth, type QueueHealth } from "@/lib/newsletter/health";

export const NEWSLETTER_PATH = "/admin/newsletter";
export const NEWSLETTER_STATUSES = ["pending", "active", "unsubscribed"] as const;
export type NewsletterStatus = (typeof NEWSLETTER_STATUSES)[number];
export const NEWSLETTER_STATUS_LABELS: Record<NewsletterStatus, string> = {
  pending: "Pendente", active: "Ativo", unsubscribed: "Descadastrado",
};

export type Subscriber = {
  id: string;
  email: string;
  status: NewsletterStatus;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  last_request_at: string | null;
};
export type ConsentEvent = {
  id: string;
  event: string;
  consent_text_version: string | null;
  policy_version: string | null;
  source_path: string | null;
  reason: string | null;
  created_at: string;
};
export type OutboxEvent = {
  id: string;
  kind: "confirmation" | "unsubscribe_link";
  status: "queued" | "sending" | "retry" | "sent" | "dead";
  attempts: number;
  last_error_code: string | null;
  outcome_unknown: boolean;
  dead_reason: string | null;
  created_at: string;
  updated_at: string;
};
export type NewsletterListParams = { q: string; status: NewsletterStatus | null; page: number };
export function parseNewsletterListParams(raw: RawSearchParams): NewsletterListParams {
  const status = firstParam(raw.status);
  return {
    q: parseSearchTerm(raw.q),
    status: NEWSLETTER_STATUSES.find(s => s === status) ?? null,
    page: parsePage(raw.page),
  };
}
export function newsletterHref(params: NewsletterListParams, overrides: Partial<NewsletterListParams> = {}): string {
  const p = { ...params, ...overrides };
  return buildListHref(NEWSLETTER_PATH, { q: p.q, status: p.status, page: p.page > 1 ? p.page : null });
}

export type NewsletterListResult =
  | { ok: true; items: Subscriber[]; page: number; total: number; pageCount: number }
  | { ok: false; error: "query_failed" };
export type NewsletterDetailResult =
  | { ok: true; subscriber: Subscriber; consents: ConsentEvent[]; outbox: OutboxEvent[]; consentsTruncated: boolean; outboxTruncated: boolean }
  | { ok: false; error: "not_found" | "query_failed" };

const SUBSCRIBER_COLUMNS = "id,email,status,created_at,updated_at,confirmed_at,unsubscribed_at,last_request_at";
const CONSENT_COLUMNS = "id,event,consent_text_version,policy_version,source_path,reason,created_at";
const OUTBOX_COLUMNS = "id,kind,status,attempts,last_error_code,outcome_unknown,dead_reason,created_at,updated_at";
const HISTORY_LIMIT = 200;

function baseQuery(supabase: SupabaseClient, params: NewsletterListParams, head = false) {
  let query = supabase.from("newsletter_subscribers").select(SUBSCRIBER_COLUMNS, { head, count: "exact" });
  if (params.status) query = query.eq("status", params.status);
  if (params.q) query = query.or(buildSearchOrFilter(params.q, ["email_normalized"]));
  return query;
}

/** Somente sessão/RLS do admin. Falhas de permissão ou rede NUNCA são listas vazias. */
export async function listNewsletterSubscribers(
  params: NewsletterListParams, client?: SupabaseClient,
): Promise<NewsletterListResult> {
  try {
    const supabase = client ?? (await createSessionClient());
    const { from, to } = pageRange(params.page);
    const { data, error, count } = await baseQuery(supabase, params)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range(from, to);
    if (error) {
      if (error.code === "PGRST103") {
        const counted = await baseQuery(supabase, params, true);
        if (!counted.error && typeof counted.count === "number")
          return { ok: true, items: [], page: params.page, total: counted.count, pageCount: pageCount(counted.count) };
      }
      console.error("[newsletter/admin] falha na listagem", { code: error.code ?? "unknown" });
      return { ok: false, error: "query_failed" };
    }
    const total = count ?? 0;
    return {
      ok: true, items: (data ?? []) as unknown as Subscriber[], page: params.page,
      total, pageCount: pageCount(total),
    };
  } catch {
    console.error("[newsletter/admin] indisponível na listagem");
    return { ok: false, error: "query_failed" };
  }
}

export async function getNewsletterSubscriber(
  id: string, client?: SupabaseClient,
): Promise<NewsletterDetailResult> {
  try {
    const supabase = client ?? (await createSessionClient());
    const single = await supabase.from("newsletter_subscribers").select(SUBSCRIBER_COLUMNS).eq("id", id).maybeSingle();
    if (single.error) return { ok: false, error: "query_failed" };
    if (!single.data) return { ok: false, error: "not_found" };
    const [consents, outbox] = await Promise.all([
      supabase.from("newsletter_consents").select(CONSENT_COLUMNS).eq("subscriber_id", id)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(HISTORY_LIMIT + 1),
      supabase.from("newsletter_outbox").select(OUTBOX_COLUMNS).eq("subscriber_id", id)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(HISTORY_LIMIT + 1),
    ]);
    if (consents.error || outbox.error) return { ok: false, error: "query_failed" };
    const c = (consents.data ?? []) as unknown as ConsentEvent[];
    const o = (outbox.data ?? []) as unknown as OutboxEvent[];
    return {
      ok: true,
      subscriber: single.data as unknown as Subscriber,
      consents: c.slice(0, HISTORY_LIMIT),
      outbox: o.slice(0, HISTORY_LIMIT),
      consentsTruncated: c.length > HISTORY_LIMIT,
      outboxTruncated: o.length > HISTORY_LIMIT,
    };
  } catch {
    console.error("[newsletter/admin] indisponível no detalhe");
    return { ok: false, error: "query_failed" };
  }
}

export async function getAdminNewsletterHealth(client?: SupabaseClient):
  Promise<{ ok: true; health: QueueHealth } | { ok: false }> {
  try {
    const supabase = client ?? (await createSessionClient());
    return { ok: true, health: await getQueueHealth(supabase) };
  } catch {
    return { ok: false };
  }
}
