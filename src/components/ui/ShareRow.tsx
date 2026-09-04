import { ExternalLink } from "lucide-react";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { cn } from "@/lib/utils";

/**
 * Share row — extraído de `BlogPostArticle`, onde os três links eram copiados
 * à mão com o payload de tracking repetido em cada um.
 *
 * O payload é montado num lugar só: o `network` era o único campo que variava
 * e já tinha divergido em `label`. O verde é o do WhatsApp, a única exceção
 * cromática que o AGENTS.md admite fora de Success.
 */
interface ShareRowProps {
  /** URL canônica do conteúdo compartilhado. */
  url: string;
  title: string;
  /** Slug do post, para o payload de analytics. */
  slug: string;
  className?: string;
}

export function ShareRow({ url, title, slug, className }: ShareRowProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const networks = [
    {
      id: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      className:
        "bg-rc2-dark text-rc2-dark-text hover:bg-rc2-dark/90 transition-colors",
      icon: true,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      className:
        "bg-[var(--rc2-whatsapp)] text-rc2-heading hover:opacity-90 transition-opacity",
      icon: false,
    },
    {
      id: "x",
      label: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      className:
        "bg-rc2-dark text-rc2-dark-text hover:bg-rc2-dark/90 transition-colors",
      icon: false,
    },
  ] as const;

  return (
    <div className={className}>
      <p className="mb-4 text-sm font-medium text-rc2-text">
        Compartilhe este artigo:
      </p>
      <div className="flex flex-wrap gap-3">
        {networks.map((network) => (
          <TrackedLink
            key={network.id}
            href={network.href}
            target="_blank"
            rel="noopener noreferrer"
            tracking={{
              kind: "blog_share",
              location: "blog_post_share",
              label: `share_${network.id}`,
              destination: network.href,
              source_page: `/blog/${slug}`,
              source_type: "blog_post",
              post_slug: slug,
              network: network.id,
            }}
            className={cn(
              "ui-focus-ring inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium",
              network.className
            )}
          >
            {network.icon && <ExternalLink size={16} strokeWidth={1.5} />}
            {network.label}
          </TrackedLink>
        ))}
      </div>
    </div>
  );
}
