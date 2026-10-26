import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  LEADS_LIST_PATH,
  LEAD_ARCHIVE_FILTERS,
  LEAD_ARCHIVE_FILTER_LABEL,
  LEAD_SOLUTION_OPTIONS,
  LEAD_SOLUTION_OTHER,
  LEAD_SOLUTION_OTHER_LABEL,
  LEAD_SORTS,
  LEAD_SORT_LABEL,
  hasActiveLeadFilters,
  type LeadListParams,
} from "@/lib/admin/leadList";
import { SEARCH_MAX } from "@/lib/admin/listParams";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/types/lead";

const fieldClass =
  "w-full border border-rc2-border bg-rc2-surface px-3 py-2 text-sm text-rc2-text placeholder:text-rc2-text-muted";
const labelClass = "block text-xs font-medium text-rc2-text-secondary mb-1";

/**
 * Filtros da lista. `next/form` navega no cliente (mostra o loading.tsx) e, sem JavaScript,
 * degrada para um GET comum. A página não é enviada: filtrar volta à 1.
 */
export function LeadsFilterBar({ params }: { params: LeadListParams }) {
  const active = hasActiveLeadFilters(params);

  return (
    <Form
      action={LEADS_LIST_PATH}
      role="search"
      aria-label="Filtrar leads"
      className="bg-rc2-surface border border-rc2-border p-4 mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end"
    >
      <div className="sm:col-span-2">
        <label htmlFor="leads-q" className={labelClass}>
          Buscar por nome, empresa, e-mail ou mensagem
        </label>
        <input
          id="leads-q"
          name="q"
          type="search"
          defaultValue={params.q}
          maxLength={SEARCH_MAX}
          placeholder="Mínimo de 2 caracteres"
          autoComplete="off"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="leads-status" className={labelClass}>
          Status
        </label>
        <select id="leads-status" name="status" defaultValue={params.status ?? ""} className={fieldClass}>
          <option value="">Todos</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="leads-solution" className={labelClass}>
          Solução
        </label>
        <select id="leads-solution" name="solution" defaultValue={params.solution ?? ""} className={fieldClass}>
          <option value="">Todas</option>
          {LEAD_SOLUTION_OPTIONS.map((solution) => (
            <option key={solution} value={solution}>
              {solution}
            </option>
          ))}
          <option value={LEAD_SOLUTION_OTHER}>{LEAD_SOLUTION_OTHER_LABEL}</option>
        </select>
      </div>

      <div>
        <label htmlFor="leads-archived" className={labelClass}>
          Arquivamento
        </label>
        <select id="leads-archived" name="archived" defaultValue={params.archived} className={fieldClass}>
          {LEAD_ARCHIVE_FILTERS.map((value) => (
            <option key={value} value={value}>
              {LEAD_ARCHIVE_FILTER_LABEL[value]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="leads-from" className={labelClass}>
          Recebido de
        </label>
        <input id="leads-from" name="from" type="date" defaultValue={params.from ?? ""} className={fieldClass} />
      </div>

      <div>
        <label htmlFor="leads-to" className={labelClass}>
          Recebido até
        </label>
        <input id="leads-to" name="to" type="date" defaultValue={params.to ?? ""} className={fieldClass} />
      </div>

      <div>
        <label htmlFor="leads-sort" className={labelClass}>
          Ordem
        </label>
        <select id="leads-sort" name="sort" defaultValue={params.sort} className={fieldClass}>
          {LEAD_SORTS.map((value) => (
            <option key={value} value={value}>
              {LEAD_SORT_LABEL[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-rc2-brand text-rc2-heading text-sm font-medium hover:bg-rc2-brand-hover transition-colors"
        >
          <Search size={14} aria-hidden="true" />
          Filtrar
        </button>
        {active && (
          <Link href={LEADS_LIST_PATH} className="text-sm font-medium text-rc2-brand-text underline">
            Limpar filtros
          </Link>
        )}
      </div>
    </Form>
  );
}
