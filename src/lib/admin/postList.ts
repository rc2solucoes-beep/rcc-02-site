import {
  addDaysToYmd,
  formatMonthKeyPtBr,
  isValidYmd,
  saoPauloDayStartUtcIso,
  saoPauloMonthKey,
} from "@/lib/datetime";
import {
  buildListHref,
  firstParam,
  parsePage,
  parseSearchTerm,
  type RawSearchParams,
} from "@/lib/admin/listParams";
import type { PostStatus } from "@/lib/types/post";

export const POSTS_LIST_PATH = "/admin/posts";
export const POST_STATUSES: readonly PostStatus[] = ["draft", "scheduled", "published"];
export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
};

/** Tolerância antes de um agendamento ser considerado vencido (o cron roda a cada 5 min). */
export const OVERDUE_GRACE_MS = 15 * 60_000;

export type PostSortDir = "asc" | "desc";

export type PostListParams = {
  q: string;
  status: PostStatus | null;
  from: string | null;
  to: string | null;
  page: number;
  dir: PostSortDir;
  /** `from > to`: o período foi descartado e a tela mostra aviso. */
  rangeIgnored: boolean;
};

export function parsePostListParams(raw: RawSearchParams): PostListParams {
  const status = firstParam(raw.status);
  const parsedStatus = POST_STATUSES.find((s) => s === status) ?? null;

  const from = firstParam(raw.from)?.trim() ?? "";
  const to = firstParam(raw.to)?.trim() ?? "";
  let fromValue: string | null = isValidYmd(from) ? from : null;
  let toValue: string | null = isValidYmd(to) ? to : null;
  let rangeIgnored = false;
  if (fromValue && toValue && fromValue > toValue) {
    fromValue = null;
    toValue = null;
    rangeIgnored = true;
  }

  return {
    q: parseSearchTerm(raw.q),
    status: parsedStatus,
    from: fromValue,
    to: toValue,
    page: parsePage(raw.page),
    dir: firstParam(raw.dir) === "asc" ? "asc" : "desc",
    rangeIgnored,
  };
}

export function hasActivePostFilters(params: PostListParams): boolean {
  return Boolean(params.q || params.status || params.from || params.to);
}

/** Link da lista preservando filtros e omitindo os padrões. */
export function postListHref(params: PostListParams, overrides: Partial<PostListParams> = {}): string {
  const p = { ...params, ...overrides };
  return buildListHref(POSTS_LIST_PATH, {
    q: p.q,
    status: p.status,
    from: p.from,
    to: p.to,
    dir: p.dir === "asc" ? "asc" : null,
    page: p.page > 1 ? p.page : null,
  });
}

/** Intervalo UTC [gte, lt) correspondente aos dias `from`/`to` de Brasília. */
export function postListDateBounds(params: Pick<PostListParams, "from" | "to">): {
  gte: string | null;
  lt: string | null;
} {
  return {
    gte: params.from ? saoPauloDayStartUtcIso(params.from) : null,
    lt: params.to ? saoPauloDayStartUtcIso(addDaysToYmd(params.to, 1)) : null,
  };
}

// ─── Itens, origem da data e anomalias ────────────────────────────────────────

export type PostListItem = {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
  published_at: string | null;
  scheduled_publish_at: string | null;
  created_at: string;
  updated_at: string;
  sort_at: string;
};

export type PostDateSource = "published_at" | "scheduled_publish_at" | "updated_at" | "created_at";

export type PostAnomalyCode = "published_without_date" | "scheduled_without_date" | "scheduled_overdue";

export const POST_ANOMALY_LABEL: Record<PostAnomalyCode, string> = {
  published_without_date: "Publicado sem data de publicação",
  scheduled_without_date: "Agendado sem data: não será publicado",
  scheduled_overdue: "Agendamento vencido",
};

/** Espelho em TypeScript da expressão de `posts.sort_at` (migration 014). */
export function computeSortAt(
  item: Pick<PostListItem, "status" | "published_at" | "scheduled_publish_at" | "created_at" | "updated_at">,
): { source: PostDateSource; value: string } {
  if (item.status === "published") {
    return item.published_at
      ? { source: "published_at", value: item.published_at }
      : { source: "created_at", value: item.created_at };
  }
  if (item.status === "scheduled") {
    return item.scheduled_publish_at
      ? { source: "scheduled_publish_at", value: item.scheduled_publish_at }
      : { source: "updated_at", value: item.updated_at };
  }
  return { source: "updated_at", value: item.updated_at };
}

const DATE_LABEL: Record<PostDateSource, string> = {
  published_at: "Publicado em",
  scheduled_publish_at: "Agendado para",
  updated_at: "Atualizado em",
  created_at: "Criado em",
};

/** Rótulo pela ORIGEM REAL da data: fallback nunca se apresenta como publicação/agendamento (RN-15). */
export function describePostDate(item: PostListItem): { source: PostDateSource; label: string; iso: string } {
  const { source, value } = computeSortAt(item);
  return { source, label: DATE_LABEL[source], iso: value };
}

export function detectPostAnomalies(item: PostListItem, now: Date = new Date()): PostAnomalyCode[] {
  const found: PostAnomalyCode[] = [];
  if (item.status === "published" && !item.published_at) found.push("published_without_date");
  if (item.status === "scheduled") {
    if (!item.scheduled_publish_at) {
      found.push("scheduled_without_date");
    } else if (now.getTime() - new Date(item.scheduled_publish_at).getTime() > OVERDUE_GRACE_MS) {
      found.push("scheduled_overdue");
    }
  }
  return found;
}

// ─── Agrupamento ──────────────────────────────────────────────────────────────

export type PostMonthGroup = { key: string; label: string; items: PostListItem[] };

/** Agrupa a página já ordenada por mês de Brasília de `sort_at`, preservando a ordem. */
export function groupByMonth(items: readonly PostListItem[]): PostMonthGroup[] {
  const groups: PostMonthGroup[] = [];
  for (const item of items) {
    const key = saoPauloMonthKey(item.sort_at) ?? "sem-data";
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, label: key === "sem-data" ? "Sem data" : formatMonthKeyPtBr(key), items: [item] });
    }
  }
  return groups;
}
