import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { BlogCard } from "@/components/blog/BlogCard";
import { buttonVariants } from "@/components/ui/button";
import type { Post } from "@/lib/types/post";
import {
  BLOG_PATH,
  MAX_QUERY_LENGTH,
  buildArchiveHref,
  pageWindow,
  type ArchiveState,
} from "@/lib/blogArchive";
import { cn } from "@/lib/utils";

type ArchivePostItem = Pick<
  Post,
  "id" | "slug" | "title" | "summary" | "cover_url" | "author_name" | "published_at" | "reading_time_minutes"
>;

interface BlogArchiveProps {
  state: ArchiveState<ArchivePostItem>;
}

const targetClass =
  "inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors";

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

function resultsMessage(state: ArchiveState<ArchivePostItem>): string {
  const { query, totalMatches, page, totalPages } = state;
  if (query) {
    if (totalMatches === 0) return `Nenhum artigo encontrado para “${query}”.`;
    return `${totalMatches} ${plural(totalMatches, "artigo encontrado", "artigos encontrados")} para “${query}”.`;
  }
  const base = `${totalMatches} ${plural(totalMatches, "artigo", "artigos")}`;
  return totalPages > 1 ? `${base} · Página ${page} de ${totalPages}` : base;
}

function PostCard({
  post,
  variant,
}: {
  post: ArchivePostItem;
  variant: "feature" | "grid";
}) {
  return (
    <BlogCard
      editorial
      headingLevel="h3"
      variant={variant}
      image={post.cover_url}
      title={post.title}
      summary={post.summary}
      slug={post.slug}
      author={post.author_name}
      publishedAt={post.published_at}
      readingTimeMinutes={post.reading_time_minutes}
    />
  );
}

export function BlogArchive({ state }: BlogArchiveProps) {
  const { query, page, totalPages, featured, items } = state;
  const hasResults = featured !== null || items.length > 0;

  return (
    <div className="space-y-8">
      {/* Busca: formulário GET, funciona sem JavaScript e gera URL compartilhável. */}
      <form method="get" action={BLOG_PATH} role="search" className="space-y-2">
        <label htmlFor="blog-busca" className="block text-sm font-medium text-rc2-heading">
          Buscar artigos
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-rc2-text-secondary"
            />
            <input
              id="blog-busca"
              name="q"
              type="search"
              defaultValue={query}
              maxLength={MAX_QUERY_LENGTH}
              placeholder="Título ou assunto do artigo"
              autoComplete="off"
              className="h-11 w-full rounded-md border border-rc2-border bg-rc2-surface pl-10 pr-3 text-base text-rc2-text placeholder:text-rc2-text-muted"
            />
          </div>
          <button type="submit" className={cn(buttonVariants({ variant: "brand", size: "brand-md" }))}>
            Buscar
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p role="status" className="text-sm text-rc2-text-secondary">
            {resultsMessage(state)}
          </p>
          {query && (
            <Link
              href={BLOG_PATH}
              className="inline-flex min-h-11 items-center text-sm font-medium text-rc2-brand-text underline underline-offset-4"
            >
              Limpar busca
            </Link>
          )}
        </div>
      </form>

      <h2 className="sr-only">{query ? "Resultados da busca" : "Artigos"}</h2>

      {!hasResults ? (
        <div className="rounded-lg border border-rc2-border bg-rc2-surface p-6 sm:p-8">
          <p className="text-lg font-semibold text-rc2-heading">Nenhum artigo encontrado</p>
          <p className="mt-2 text-base leading-[1.75] text-rc2-text-secondary">
            Tente outro termo ou veja todos os artigos publicados.
          </p>
          <Link
            href={BLOG_PATH}
            className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-rc2-brand-text underline underline-offset-4"
          >
            Limpar busca
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {featured && <PostCard post={featured} variant="feature" />}
          {items.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {items.map((post) => (
                <PostCard key={post.id} post={post} variant="grid" />
              ))}
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginação do blog">
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {page > 1 && (
              <li>
                <Link
                  href={buildArchiveHref(query, page - 1)}
                  rel="prev"
                  className={cn(targetClass, "border-rc2-border bg-rc2-surface text-rc2-heading hover:border-rc2-brand/50")}
                >
                  <ChevronLeft size={16} aria-hidden />
                  Anterior
                </Link>
              </li>
            )}
            {pageWindow(page, totalPages).map((p, i) =>
              p === null ? (
                <li key={`gap-${i}`} aria-hidden className="px-1 text-rc2-text-secondary">
                  …
                </li>
              ) : (
                <li key={p}>
                  <Link
                    href={buildArchiveHref(query, p)}
                    aria-current={p === page ? "page" : undefined}
                    aria-label={`Página ${p}`}
                    className={cn(
                      targetClass,
                      p === page
                        ? "border-rc2-heading bg-rc2-heading text-rc2-dark-text"
                        : "border-rc2-border bg-rc2-surface text-rc2-heading hover:border-rc2-brand/50"
                    )}
                  >
                    {p}
                  </Link>
                </li>
              )
            )}
            {page < totalPages && (
              <li>
                <Link
                  href={buildArchiveHref(query, page + 1)}
                  rel="next"
                  className={cn(targetClass, "border-rc2-border bg-rc2-surface text-rc2-heading hover:border-rc2-brand/50")}
                >
                  Próxima
                  <ChevronRight size={16} aria-hidden />
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </div>
  );
}
