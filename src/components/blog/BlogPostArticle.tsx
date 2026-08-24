import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ChevronDown } from "lucide-react";
import type { Post, FaqItem, CtaBlock } from "@/lib/types/post";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { BackToTopButton } from "@/components/blog/BackToTopButton";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { BASE_URL } from "@/lib/siteMetadata";
import { sanitizeAndAddIds, extractHeadings } from "@/lib/blog/sanitize";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

interface BlogPostArticleProps {
  post: Post;
  relatedPosts: Post[];
}

/**
 * Renderização completa de um post do blog (JSON-LD, artigo, FAQ, CTA, autor,
 * relacionados). Componente puro: recebe o post já carregado e não busca dados.
 * Usado tanto pela página pública quanto pela rota de preview do admin.
 */
export function BlogPostArticle({ post, relatedPosts }: BlogPostArticleProps) {
  const slug = post.slug;

  // Sanitize content and add IDs to headings
  const sanitizedContent = sanitizeAndAddIds(post.content);

  // Headings extraídos no servidor — fonte de verdade para o TOC
  const tocHeadings = extractHeadings(sanitizedContent);
  const showNavigation = tocHeadings.length > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    image: post.cover_url ?? undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    author: post.author_name ? {
      "@type": "Person",
      name: post.author_name,
      jobTitle: post.author_title,
      image: post.author_photo,
    } : {
      "@type": "Organization",
      name: "RC2 Soluções",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "RC2 Soluções",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/images/logo-base-transparente-preto.png`,
      },
    },
  };

  const shareUrl = `${BASE_URL}/blog/${slug}`;
  const encodedTitle = encodeURIComponent(post.title);
  const whatsappShareUrl = `https://wa.me/?text=${encodedTitle}%20${encodeURIComponent(shareUrl)}`;

  // Parse cta_block (pode vir como string após sanitização)
  let ctaBlock: CtaBlock | null = null;
  if (post.cta_block) {
    if (typeof post.cta_block === "string") {
      try { ctaBlock = JSON.parse(post.cta_block as unknown as string); } catch { ctaBlock = null; }
    } else {
      ctaBlock = post.cta_block as CtaBlock;
    }
  }

  // Parse faq_items (pode vir como string após sanitização)
  let faqItems: FaqItem[] = [];
  if (post.faq_items) {
    if (typeof post.faq_items === "string") {
      try { faqItems = JSON.parse(post.faq_items as unknown as string); } catch { faqItems = []; }
    } else if (Array.isArray(post.faq_items)) {
      faqItems = (post.faq_items as unknown[]).map((item) =>
        typeof item === "string" ? JSON.parse(item) : item
      ) as FaqItem[];
    }
  }

  const faqJsonLd = faqItems.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  return (
    <>
      {showNavigation && <BackToTopButton />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <article className="bg-rc2-bg">
        {/* Breadcrumbs */}
        <nav className="bg-rc2-bg border-b border-border/40">
          <div className="container mx-auto max-w-4xl px-4 py-2.5">
            <ol className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground flex-wrap">
              <li><Link href="/" className="hover:text-rc2-brand-text transition-colors font-medium">Home</Link></li>
              <li className="text-rc2-text/30 mx-1">/</li>
              <li><Link href="/blog" className="hover:text-rc2-brand-text transition-colors font-medium">Blog</Link></li>
              {post.category && (
                <>
                  <li className="text-rc2-text/30 mx-1">/</li>
                  <li className="text-rc2-text/70 font-medium">{post.category}</li>
                </>
              )}
              <li className="text-rc2-text/30 mx-1">/</li>
              <li className="text-rc2-heading line-clamp-1 font-medium">{post.title}</li>
            </ol>
          </div>
        </nav>

        {/* Header do post */}
        <header className="bg-rc2-dark py-16">
          <div className="container mx-auto max-w-4xl px-4">
            {post.category && (
              <Link
                href={`/blog?category=${post.category}`}
                className="inline-block px-3 py-1 text-xs font-medium text-rc2-brand bg-rc2-brand/10 rounded-full mb-4 hover:bg-rc2-brand/20 transition-colors"
              >
                {post.category}
              </Link>
            )}

            <h1 className="text-4xl md:text-5xl font-bold text-rc2-dark-text leading-tight mb-4">
              {post.title}
            </h1>

            <p className="text-rc2-dark-text-secondary text-lg leading-relaxed mb-6">{post.summary}</p>

            {/* Meta info: data, tempo de leitura */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-rc2-dark-text-secondary">
              <time>{formatDate(post.published_at)}</time>
              {post.updated_at && post.updated_at !== post.published_at && (
                <span>Atualizado em {formatDate(post.updated_at)}</span>
              )}
              {post.reading_time_minutes && (
                <span>⏱️ {post.reading_time_minutes} min de leitura</span>
              )}
            </div>
          </div>
        </header>

        {/* Conteúdo + Autor na Sidebar */}
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className={`grid gap-8 ${showNavigation ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1 lg:grid-cols-3"}`}>
            {/* Table of Contents — instância única, gerencia mobile/desktop internamente */}
            {showNavigation && <TableOfContents headings={tocHeadings} />}

            {/* Conteúdo principal */}
            <div className={showNavigation ? "lg:col-span-2" : "lg:col-span-2"}>
              <div
                className="prose prose-rc2 max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />

              {/* FAQ */}
              {faqItems.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border">
                  <h2 className="text-2xl font-bold text-rc2-heading mb-6">
                    Perguntas Frequentes
                  </h2>
                  <div className="space-y-2">
                    {faqItems.map((item, index) => (
                      <details
                        key={index}
                        className="group border border-border rounded-lg overflow-hidden"
                      >
                        <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none hover:bg-rc2-text/[0.02] transition-colors">
                          <span className="font-medium text-rc2-heading text-base leading-snug">
                            {item.question}
                          </span>
                          <ChevronDown
                            size={18}
                            className="flex-shrink-0 text-rc2-text/40 transition-transform duration-200 group-open:rotate-180"
                          />
                        </summary>
                        <div className="px-5 pb-5 pt-1 text-rc2-text/75 text-sm leading-relaxed border-t border-border bg-white">
                          {item.answer}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {/* Compartilhamento */}
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-sm font-medium text-rc2-text mb-4">Compartilhe este artigo:</p>
                <div className="flex gap-3">
                  <TrackedLink
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    tracking={{
                      kind: "blog_share",
                      location: "blog_post_share",
                      label: "share_linkedin",
                      destination: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                      source_page: `/blog/${slug}`,
                      source_type: "blog_post",
                      post_slug: slug,
                      network: "linkedin",
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rc2-dark text-rc2-dark-text text-sm font-medium rounded hover:bg-rc2-dark/90 transition-colors"
                  >
                    <ExternalLink size={16} /> LinkedIn
                  </TrackedLink>
                  <TrackedLink
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    tracking={{
                      kind: "blog_share",
                      location: "blog_post_share",
                      label: "share_whatsapp",
                      destination: whatsappShareUrl,
                      source_page: `/blog/${slug}`,
                      source_type: "blog_post",
                      post_slug: slug,
                      network: "whatsapp",
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--rc2-whatsapp)] text-rc2-heading text-sm font-medium rounded hover:opacity-90 transition-opacity"
                  >
                    WhatsApp
                  </TrackedLink>
                  <TrackedLink
                    href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    tracking={{
                      kind: "blog_share",
                      location: "blog_post_share",
                      label: "share_x",
                      destination: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodeURIComponent(shareUrl)}`,
                      source_page: `/blog/${slug}`,
                      source_type: "blog_post",
                      post_slug: slug,
                      network: "x",
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rc2-dark text-rc2-dark-text text-sm font-medium rounded hover:bg-rc2-dark/90 transition-colors"
                  >
                    X (Twitter)
                  </TrackedLink>
                </div>
              </div>

              {/* CTA */}
              {ctaBlock ? (
                <div className="mt-12 pt-8 border-t border-border">
                  {ctaBlock.type === "next_steps" ? (
                    /* Próximos passos: visual de lista numerada */
                    <div className="bg-rc2-dark rounded-lg p-6 md:p-8">
                      <h3 className="text-xl font-bold text-rc2-dark-text mb-2">
                        {ctaBlock.title}
                      </h3>
                      {ctaBlock.description && (
                        <p className="text-rc2-dark-text-secondary mb-5 text-sm">{ctaBlock.description}</p>
                      )}
                      {ctaBlock.items && ctaBlock.items.filter(Boolean).length > 0 && (
                        <ol className="space-y-3">
                          {ctaBlock.items.filter(Boolean).map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rc2-brand text-rc2-heading text-xs font-bold flex items-center justify-center mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-rc2-dark-text-secondary text-sm leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ) : (
                    /* Service / Contact: visual de destaque laranja */
                    <div className="bg-rc2-brand/10 border border-rc2-brand/20 rounded-lg p-6 md:p-8">
                      <h3 className="text-xl font-bold text-rc2-heading mb-2">
                        {ctaBlock.title}
                      </h3>
                      {ctaBlock.description && (
                        <p className="text-rc2-text/70 mb-5">{ctaBlock.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {ctaBlock.primaryButton && (
                          <TrackedLink
                            href={ctaBlock.primaryButton.url}
                            tracking={{
                              kind: ctaBlock.primaryButton.url.startsWith("https://wa.me") ? "whatsapp" : "cta",
                              location: "blog_post_cta_primary",
                              label: "blog_post_cta_primary",
                              destination: ctaBlock.primaryButton.url,
                            }}
                            className="inline-block px-6 py-2.5 bg-rc2-brand text-rc2-heading font-medium rounded hover:bg-rc2-brand/90 transition-colors"
                          >
                            {ctaBlock.primaryButton.text}
                          </TrackedLink>
                        )}
                        {ctaBlock.secondaryButton && (
                          <TrackedLink
                            href={ctaBlock.secondaryButton.url}
                            tracking={{
                              kind: ctaBlock.secondaryButton.url.startsWith("https://wa.me") ? "whatsapp" : "cta",
                              location: "blog_post_cta_secondary",
                              label: "blog_post_cta_secondary",
                              destination: ctaBlock.secondaryButton.url,
                            }}
                            className="inline-block px-6 py-2.5 border border-rc2-brand-text text-rc2-brand-text font-medium rounded hover:bg-rc2-brand-text/5 transition-colors"
                          >
                            {ctaBlock.secondaryButton.text}
                          </TrackedLink>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* CTA padrão quando nenhum configurado */
                <div className="mt-12 pt-8 border-t border-border">
                  <div className="bg-rc2-brand/10 border border-rc2-brand/20 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-rc2-heading mb-2">
                      Quer identificar gargalos nos processos da sua empresa?
                    </h3>
                    <p className="text-rc2-text/70 mb-4">
                      Fale com a RC2 Soluções e descubra como tornar sua operação mais eficiente.
                    </p>
                    <TrackedLink
                      href="/contato"
                      tracking={{ kind: "cta", location: "blog_post_default_cta", label: "solicitar_diagnostico", destination: "/contato" }}
                      className="inline-block px-6 py-2.5 bg-rc2-brand text-rc2-heading font-medium rounded hover:bg-rc2-brand/90 transition-colors"
                    >
                      Falar sobre o meu caso →
                    </TrackedLink>
                  </div>
                </div>
              )}

              {/* Posts Relacionados */}
              {relatedPosts.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border">
                  <h2 className="text-2xl font-bold text-rc2-heading mb-6">Posts Relacionados</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {relatedPosts.slice(0, 2).map((relPost) => (
                      <Link
                        key={relPost.id}
                        href={`/blog/${relPost.slug}`}
                        className="group border border-border rounded overflow-hidden hover:border-rc2-brand transition-colors"
                      >
                        {relPost.cover_url && (
                          <div className="rc2-blog-cover relative aspect-video overflow-hidden bg-rc2-surface-2">
                            <Image
                              src={relPost.cover_url}
                              alt={relPost.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="(max-width: 640px) 100vw, 50vw"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-rc2-heading group-hover:text-rc2-brand-text transition-colors line-clamp-2">
                            {relPost.title}
                          </h3>
                          <p className="text-sm text-rc2-text/60 mt-2 line-clamp-2">
                            {relPost.summary}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: Autor (1/3) */}
            {post.author_name && (
              <aside className="lg:col-span-1">
                <div className="sticky top-20 border border-border rounded bg-white overflow-hidden">
                  <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Sobre o Autor
                    </h3>
                  </div>

                  <div className="p-5">
                    {post.author_photo && (
                      <Image
                        src={post.author_photo}
                        alt={post.author_name}
                        width={200}
                        height={200}
                        className="w-full aspect-square object-cover rounded-lg mb-4"
                      />
                    )}

                    <h4 className="font-bold text-lg text-rc2-heading mb-0.5">
                      {post.author_name}
                    </h4>
                    {post.author_title && (
                      <p className="text-sm text-rc2-brand-text font-medium mb-3">
                        {post.author_title}
                      </p>
                    )}

                    {post.author_bio && (
                      <p className="text-sm text-rc2-text/70 mb-4 leading-relaxed">
                        {post.author_bio}
                      </p>
                    )}

                    {post.author_linkedin && (
                      <a
                        href={post.author_linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-rc2-brand-text hover:underline font-medium"
                      >
                        <ExternalLink size={16} /> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
