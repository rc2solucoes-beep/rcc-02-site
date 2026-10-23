import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { POSTS_LIST_PATH, POST_STATUS_LABEL, POST_STATUSES, hasActivePostFilters, type PostListParams } from "@/lib/admin/postList";
import { SEARCH_MAX } from "@/lib/admin/listParams";

const fieldClass =
  "w-full border border-rc2-border bg-rc2-surface px-3 py-2 text-sm text-rc2-text placeholder:text-rc2-text-muted";
const labelClass = "block text-xs font-medium text-rc2-text-secondary mb-1";

/**
 * Filtros da lista. `next/form` navega no cliente (mostra o loading.tsx) e, sem
 * JavaScript, degrada para um GET comum. A página não é enviada: filtrar volta à 1.
 */
export function PostsFilterBar({ params }: { params: PostListParams }) {
  const active = hasActivePostFilters(params);

  return (
    <Form
      action={POSTS_LIST_PATH}
      role="search"
      aria-label="Filtrar posts"
      className="bg-rc2-surface border border-rc2-border p-4 mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-end"
    >
      <div className="sm:col-span-2 lg:col-span-1">
        <label htmlFor="posts-q" className={labelClass}>
          Buscar por título, slug ou resumo
        </label>
        <input
          id="posts-q"
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
        <label htmlFor="posts-status" className={labelClass}>
          Status
        </label>
        <select id="posts-status" name="status" defaultValue={params.status ?? ""} className={fieldClass}>
          <option value="">Todos</option>
          {POST_STATUSES.map((status) => (
            <option key={status} value={status}>
              {POST_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="posts-from" className={labelClass}>
          De
        </label>
        <input id="posts-from" name="from" type="date" defaultValue={params.from ?? ""} className={fieldClass} />
      </div>

      <div>
        <label htmlFor="posts-to" className={labelClass}>
          Até
        </label>
        <input id="posts-to" name="to" type="date" defaultValue={params.to ?? ""} className={fieldClass} />
      </div>

      <div>
        <label htmlFor="posts-dir" className={labelClass}>
          Ordem
        </label>
        <select id="posts-dir" name="dir" defaultValue={params.dir} className={fieldClass}>
          <option value="desc">Mais recentes primeiro</option>
          <option value="asc">Mais antigos primeiro</option>
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
          <Link href={POSTS_LIST_PATH} className="text-sm font-medium text-rc2-brand-text underline">
            Limpar filtros
          </Link>
        )}
      </div>
    </Form>
  );
}
