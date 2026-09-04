"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { trackCtaClick } from "@/lib/tracking";
import { cn } from "@/lib/utils";

/**
 * Card de artigo, em três composições da mesma anatomia.
 *
 * - `row` — imagem à esquerda, conteúdo à direita. Padrão; é o que a Home usa
 *   na seção Conteúdo.
 * - `feature` — o último post no índice do blog. Imagem em 3:2, a proporção que
 *   a §6 reserva a destaque, e título na escala de H2.
 * - `grid` — imagem em cima, conteúdo embaixo, para os demais em duas colunas.
 *
 * As três dividem tipografia, borda, hover e rodapé de metadados: dar destaque
 * a um post não pode criar um segundo sistema de card.
 */
interface BlogCardProps {
  image?: string | null;
  title: string;
  summary: string;
  slug: string;
  author?: string | null;
  publishedAt?: string | Date | null;
  readingTimeMinutes?: number | null;
  category?: string;
  variant?: "row" | "feature" | "grid";
  /**
   * Opcional. Quando presente, o clique no card emite `cta_click`.
   * Ausente (padrão), o card mantém o comportamento anterior sem medição.
   */
  tracking?: {
    location: string;
    label: string;
    destination: string;
  };
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function BlogCard({
  image,
  title,
  summary,
  slug,
  author,
  publishedAt,
  readingTimeMinutes,
  category,
  variant = "row",
  tracking,
}: BlogCardProps) {
  const formattedDate = formatDate(publishedAt);
  const isFeature = variant === "feature";
  const isGrid = variant === "grid";
  const isRow = variant === "row";

  return (
    <FadeIn className={cn("group block", isGrid && "h-full")}>
      <Link
        href={`/blog/${slug}`}
        className={cn("block", isGrid && "h-full")}
        onClick={
          tracking
            ? (event) => {
                // Mesma semântica de TrackedLink: clique cancelado não conta.
                if (event.defaultPrevented) return;
                trackCtaClick(tracking);
              }
            : undefined
        }
      >
        <div
          className={cn(
            // PENDENTE: o card não tem estado `active`. Duas tentativas
            // falharam — `active:` não alcança este `div`, que é descendente
            // do `<a>` pressionado, e `group-active:` também não pegou no
            // teste. Deixado sem a classe de propósito: classe morta no código
            // é pior que ausência, porque parece resolvido. Ver `docs/29`.
            "overflow-hidden rounded-lg border border-rc2-border bg-rc2-surface transition-shadow duration-200 hover:border-rc2-brand/50 hover:shadow-lift",
            isGrid && "flex h-full flex-col"
          )}
        >
          <div
            className={cn(
              // §8: "Thumbnail cresce de tamanho". A `row` mantém 400px à
              // esquerda; destaque e grid empilham imagem sobre texto.
              isRow && "grid grid-cols-1 gap-0 md:grid-cols-[400px_1fr]",
              // O destaque empilha no mobile e vira duas colunas no desktop:
              // em coluna única, a imagem 3:2 na largura do container deixava
              // o card com ~980px de altura e engolia o resto do índice.
              isFeature && "grid grid-cols-1 gap-0 lg:grid-cols-[1.15fr_1fr]",
              isGrid && "flex h-full flex-col"
            )}
          >
            {/* Imagem */}
            <div
              className={cn(
                "relative overflow-hidden bg-rc2-bg",
                isRow && "aspect-[4/3] md:aspect-auto md:min-h-[300px]",
                // §6 Imagens: 3:2 em foto de destaque, 4:3 em thumbnail.
                isFeature && "aspect-[3/2] lg:h-full lg:aspect-auto",
                isGrid && "aspect-[4/3]"
              )}
            >
              {image ? (
                <>
                  <Image
                    src={image}
                    alt={title}
                    width={isFeature ? 1200 : 400}
                    height={isFeature ? 800 : 300}
                    sizes={
                      isFeature
                        ? "(max-width: 1024px) 100vw, 1024px"
                        : "(max-width: 768px) 100vw, 400px"
                    }
                    className="h-full w-full object-cover"
                    // O destaque é o maior elemento acima da dobra do índice.
                    priority={isFeature}
                  />
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 0%, rgba(11,23,38,0.2) 100%)",
                    }}
                  />
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-rc2-accent-soft to-rc2-brand/10">
                  <span className="text-sm text-rc2-text-muted">Sem imagem</span>
                </div>
              )}
            </div>

            {/* Conteúdo */}
            <div
              className={cn(
                "flex flex-col justify-between p-5 sm:p-6",
                isFeature && "md:p-8 lg:justify-center",
                isGrid && "flex-1"
              )}
            >
              <div>
                {isFeature && (
                  <SectionLabel className="mb-3 block">
                    Último artigo
                  </SectionLabel>
                )}
                {category && (
                  <span className="mb-3 inline-flex items-center rounded-full border border-rc2-brand/25 bg-rc2-brand/10 px-2 py-0.5 text-xs font-semibold text-rc2-brand-text">
                    {category}
                  </span>
                )}
                <h3
                  className={cn(
                    "font-semibold leading-snug text-rc2-heading transition-colors group-hover:text-rc2-brand-text",
                    isFeature ? "rc2-h3 mb-3 md:text-3xl" : "mb-2 text-lg"
                  )}
                >
                  {title}
                </h3>
              </div>

              <p
                className={cn(
                  "mb-4 leading-relaxed text-rc2-text-secondary",
                  // Sem `line-clamp`: o resumo é a única prévia do conteúdo e
                  // aparece inteiro. Os cards do grid já se igualam em altura
                  // pela linha do grid, e o rodapé de metadados fica preso
                  // embaixo pelo `justify-between`.
                  isFeature ? "rc2-body-lg" : "text-sm"
                )}
              >
                {summary}
              </p>

              <div className="flex items-center justify-between gap-2 border-t border-rc2-border/40 pt-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-rc2-text-muted">
                  {author && (
                    <span className="font-medium text-rc2-text-secondary">
                      {author}
                    </span>
                  )}
                  {author && formattedDate && <span>·</span>}
                  {formattedDate && <span>{formattedDate}</span>}
                  {readingTimeMinutes && (
                    <>
                      <span>·</span>
                      <span>{readingTimeMinutes} min de leitura</span>
                    </>
                  )}
                </div>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-rc2-brand-text transition-transform group-hover:translate-x-1"
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </FadeIn>
  );
}
