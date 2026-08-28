"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  image?: string | null;
  title: string;
  summary: string;
  slug: string;
  author?: string | null;
  publishedAt?: string | Date | null;
  readingTimeMinutes?: number | null;
  category?: string;
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
}: BlogCardProps) {
  const formattedDate = formatDate(publishedAt);

  return (
    <FadeIn className="group block">
      <Link href={`/blog/${slug}`}>
        <div className="border border-rc2-border rounded-lg overflow-hidden bg-rc2-surface hover:shadow-lift transition-shadow duration-200 hover:border-rc2-brand/50">
          {/* Grid: image left, content right on desktop; stack on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[300px_1fr] gap-0">
            {/* Image section */}
            <div className="relative overflow-hidden bg-rc2-bg min-h-[200px] md:min-h-[auto]">
              {image ? (
                <>
                  <Image
                    src={image}
                    alt={title}
                    width={300}
                    height={200}
                    className="w-full h-full object-cover"
                    priority={false}
                  />
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 0%, rgba(11,23,38,0.2) 100%)",
                    }}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-rc2-accent-soft to-rc2-brand/10 flex items-center justify-center">
                  <span className="text-rc2-text-muted text-sm">Sem imagem</span>
                </div>
              )}
            </div>

            {/* Content section */}
            <div className="p-5 sm:p-6 flex flex-col justify-between">
              {/* Header: category + title */}
              <div>
                {category && (
                  <span className="inline-flex items-center rounded-full border border-rc2-brand/25 bg-rc2-brand/10 px-2 py-0.5 text-xs font-semibold text-rc2-brand-text mb-3">
                    {category}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-rc2-heading mb-2 leading-snug group-hover:text-rc2-brand transition-colors">
                  {title}
                </h3>
              </div>

              {/* Summary */}
              <p className="text-sm text-rc2-text-secondary leading-relaxed mb-4 line-clamp-2">
                {summary}
              </p>

              {/* Meta footer */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-rc2-border/40">
                <div className="flex items-center gap-2 text-xs text-rc2-text-muted">
                  {author && <span className="font-medium text-rc2-text-secondary">{author}</span>}
                  {author && formattedDate && <span>·</span>}
                  {formattedDate && <span>{formattedDate}</span>}
                  {readingTimeMinutes && (
                    <>
                      <span>·</span>
                      <span>{readingTimeMinutes} min read</span>
                    </>
                  )}
                </div>
                <ArrowRight
                  size={16}
                  className="text-rc2-brand-text group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </FadeIn>
  );
}
