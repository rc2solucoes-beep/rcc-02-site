import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type Author = {
  name: string;
  title?: string | null;
  bio?: string | null;
  photo?: string | null;
  linkedin?: string | null;
};

/**
 * Author byline — extraído do bloco de autor de `BlogPostArticle`.
 *
 * `card` é a caixa da sidebar do artigo. `inline` é a assinatura curta, para
 * onde couber um autor sem ocupar uma coluna inteira.
 *
 * O cargo usa `--rc2-brand-text`, nunca `--rc2-brand`: texto laranja pequeno em
 * fundo claro é regra inviolável nº 2.
 */
interface AuthorBylineProps {
  author: Author;
  variant?: "card" | "inline";
  className?: string;
}

export function AuthorByline({
  author,
  variant = "card",
  className,
}: AuthorBylineProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {author.photo && (
          <Image
            src={author.photo}
            alt={author.name}
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full object-cover"
          />
        )}
        <div className="text-sm">
          <p className="font-semibold text-rc2-heading">{author.name}</p>
          {author.title && (
            <p className="text-rc2-text-secondary">{author.title}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-rc2-card-border bg-rc2-surface",
        className
      )}
    >
      <div className="border-b border-rc2-border-soft px-5 py-4">
        <h3 className="rc2-label text-rc2-text-secondary">Sobre o autor</h3>
      </div>

      <div className="p-5">
        {author.photo && (
          <Image
            src={author.photo}
            alt={author.name}
            width={200}
            height={200}
            className="mb-4 aspect-square w-full rounded-lg object-cover"
          />
        )}

        <h4 className="mb-0.5 text-lg font-semibold text-rc2-heading">
          {author.name}
        </h4>
        {author.title && (
          <p className="mb-3 text-sm font-medium text-rc2-brand-text">
            {author.title}
          </p>
        )}
        {author.bio && (
          <p className="mb-4 text-sm leading-relaxed text-rc2-text/70">
            {author.bio}
          </p>
        )}
        {author.linkedin && (
          <a
            href={author.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-focus-ring inline-flex items-center gap-2 rounded-sm text-sm font-medium text-rc2-brand-text hover:underline"
          >
            <ExternalLink size={16} strokeWidth={1.5} /> LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}
