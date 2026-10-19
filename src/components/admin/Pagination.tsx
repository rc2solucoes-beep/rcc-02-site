import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  /** Monta o href de uma página, preservando os filtros da lista. */
  hrefFor: (page: number) => string;
  /** Singular e plural do item listado (padrão: item/itens). */
  noun?: { singular: string; plural: string };
}

const linkClass =
  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rc2-heading border border-rc2-border bg-rc2-surface hover:border-rc2-brand-text hover:text-rc2-brand-text transition-colors";
const disabledClass =
  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rc2-text-secondary border border-rc2-border-soft bg-rc2-surface-2";

/** Paginação por links (funciona sem JavaScript). Compartilhada por CMS, Leads e Newsletter. */
export function Pagination({ page, pageCount, total, hrefFor, noun = { singular: "item", plural: "itens" } }: PaginationProps) {
  if (total <= 0) return null;
  const hasPrev = page > 1;
  const hasNext = page < pageCount;

  return (
    <nav aria-label="Paginação" className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-rc2-text-secondary">
        Página {page} de {pageCount} · {total} {total === 1 ? noun.singular : noun.plural}
      </p>
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link href={hrefFor(page - 1)} rel="prev" className={linkClass}>
            <ChevronLeft size={14} aria-hidden="true" />
            Anterior
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            <ChevronLeft size={14} aria-hidden="true" />
            Anterior
          </span>
        )}
        {hasNext ? (
          <Link href={hrefFor(page + 1)} rel="next" className={linkClass}>
            Próxima
            <ChevronRight size={14} aria-hidden="true" />
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            Próxima
            <ChevronRight size={14} aria-hidden="true" />
          </span>
        )}
      </div>
    </nav>
  );
}
