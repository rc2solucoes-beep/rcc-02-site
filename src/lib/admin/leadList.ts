import { isValidYmd } from "@/lib/datetime";
import {
  buildListHref,
  firstParam,
  parsePage,
  parseSearchTerm,
  type RawSearchParams,
} from "@/lib/admin/listParams";
import { postListDateBounds } from "@/lib/admin/postList";
import { LEAD_STATUSES, type LeadListItem, type LeadStatus } from "@/lib/types/lead";

export const LEADS_LIST_PATH = "/admin/leads";

/** Opções do formulário de contato (`ContactForm.tsx`); a paridade é verificada em teste. */
export const LEAD_SOLUTION_OPTIONS = [
  "Automatizar atendimento ou vendas",
  "Criar IA para apoiar a equipe interna",
  "Conectar sistemas, planilhas ou CRM",
  "E-commerce",
  "Criar site ou landing page",
  "Ainda não sei por onde começar",
] as const;

/** Valor de filtro para solução fora da lista (valores históricos). */
export const LEAD_SOLUTION_OTHER = "other";
export const LEAD_SOLUTION_OTHER_LABEL = "Outros";

export const LEAD_ARCHIVE_FILTERS = ["no", "only", "all"] as const;
export type LeadArchiveFilter = (typeof LEAD_ARCHIVE_FILTERS)[number];
export const LEAD_ARCHIVE_FILTER_LABEL: Record<LeadArchiveFilter, string> = {
  no: "Ativos",
  only: "Arquivados",
  all: "Todos",
};

export const LEAD_SORTS = ["recent", "next_action"] as const;
export type LeadSort = (typeof LEAD_SORTS)[number];
export const LEAD_SORT_LABEL: Record<LeadSort, string> = {
  recent: "Mais recentes primeiro",
  next_action: "Próxima ação mais próxima",
};

export type LeadListParams = {
  q: string;
  status: LeadStatus | null;
  /** Uma das opções do formulário, `other` ou nulo (todas). */
  solution: string | null;
  archived: LeadArchiveFilter;
  from: string | null;
  to: string | null;
  page: number;
  sort: LeadSort;
  /** `from > to`: o período foi descartado e a tela mostra aviso. */
  rangeIgnored: boolean;
};

export function parseLeadListParams(raw: RawSearchParams): LeadListParams {
  const status = firstParam(raw.status);
  const solution = firstParam(raw.solution);
  const archived = firstParam(raw.archived);
  const sort = firstParam(raw.sort);

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
    status: LEAD_STATUSES.find((s) => s === status) ?? null,
    solution:
      solution === LEAD_SOLUTION_OTHER
        ? LEAD_SOLUTION_OTHER
        : (LEAD_SOLUTION_OPTIONS.find((s) => s === solution) ?? null),
    archived: LEAD_ARCHIVE_FILTERS.find((a) => a === archived) ?? "no",
    from: fromValue,
    to: toValue,
    page: parsePage(raw.page),
    sort: LEAD_SORTS.find((s) => s === sort) ?? "recent",
    rangeIgnored,
  };
}

/** Filtros além do padrão (ativos, mais recentes): decide entre "vazio" e "vazio filtrado". */
export function hasActiveLeadFilters(params: LeadListParams): boolean {
  return Boolean(
    params.q || params.status || params.solution || params.from || params.to || params.archived !== "no",
  );
}

/** Link da lista preservando filtros e omitindo os padrões. */
export function leadListHref(params: LeadListParams, overrides: Partial<LeadListParams> = {}): string {
  const p = { ...params, ...overrides };
  return buildListHref(LEADS_LIST_PATH, {
    q: p.q,
    status: p.status,
    solution: p.solution,
    archived: p.archived === "no" ? null : p.archived,
    from: p.from,
    to: p.to,
    sort: p.sort === "recent" ? null : p.sort,
    page: p.page > 1 ? p.page : null,
  });
}

/** Intervalo UTC [gte, lt) dos dias `from`/`to` de Brasília sobre `created_at`. */
export const leadListDateBounds = postListDateBounds;

/** Colunas da listagem. Nunca `message` nem `ip_hash`: a lista não carrega texto livre do lead. */
export const LEAD_LIST_COLUMNS =
  "id,name,company,email,whatsapp,segment,size,solution,created_at,status,next_action,next_action_at,archived_at,updated_at";

/** Colunas pesquisadas pelo termo `q` (RF-LEAD-01). */
export const LEAD_SEARCH_COLUMNS = ["name", "company", "email", "message"] as const;

/** Colunas do detalhe: tudo de `LeadRecord`, exceto `ip_hash`. */
export const LEAD_DETAIL_COLUMNS =
  "id,name,company,email,whatsapp,segment,size,solution,message,source,created_at,status,status_updated_at,next_action,next_action_at,archived_at,updated_at";

/** Rótulo da solução; valor fora da lista (histórico) aparece como "Outros". */
export function leadSolutionLabel(solution: string): string {
  return (LEAD_SOLUTION_OPTIONS as readonly string[]).includes(solution) ? solution : LEAD_SOLUTION_OTHER_LABEL;
}

/** Próxima ação vencida: com data no passado, lead ativo e ainda não encerrado (RF-LEAD-05). */
export function isNextActionOverdue(
  lead: Pick<LeadListItem, "next_action_at" | "archived_at" | "status">,
  now: Date = new Date(),
): boolean {
  if (!lead.next_action_at || lead.archived_at || lead.status === "closed") return false;
  const at = new Date(lead.next_action_at).getTime();
  return Number.isFinite(at) && at < now.getTime();
}
