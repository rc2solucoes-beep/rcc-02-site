import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { createPublicClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types/post";
import { ExternalLink, Share2 } from "lucide-react";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { BackToTopButton } from "@/components/blog/BackToTopButton";

const BASE_URL = "https://rc2solucoes.com.br";

export const revalidate = 60;

// Helper function to add IDs to headings using regex (server-safe)
function sanitizeAndAddIds(html: string): string {
  const sanitized = DOMPurify.sanitize(html);
  let headingCounter = 0;

  // Replace h2 and h3 opening tags with ID attributes and scroll-margin-top
  return sanitized.replace(/<(h[23])([^>]*)>/gi, (match, tag, attrs) => {
    // Skip if already has an id attribute
    if (/\sid\s*=/i.test(attrs)) {
      return match;
    }

    headingCounter++;
    // Add scroll-margin-top: 120px to account for navbar height + padding
    return `<${tag}${attrs} id="heading-${headingCounter}" style="scroll-margin-top: 120px;">`;
  });
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    return (data as Post) ?? null;
  } catch {
    return null;
  }
}

async function getRelatedPosts(relatedIds: string[] | null): Promise<Post[]> {
  if (!relatedIds || relatedIds.length === 0) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("posts")
      .select("*")
      .in("id", relatedIds)
      .eq("status", "published");
    return (data ?? []) as Post[];
  } catch {
    return [];
  }
}

async function getAllSlugs(): Promise<string[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("posts")
      .select("slug")
      .eq("status", "published");
    return (data ?? []).map((p: { slug: string }) => p.slug);
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  // Usar campos de SEO se disponíveis, senão usar valores padrão
  const metaTitle = post.seo_meta_title || `${post.title} — RC2 Soluções`;
  const metaDescription = post.seo_meta_description || post.summary;
  const ogImage = post.og_image || post.cover_url;

  return {
    title: metaTitle,
    description: metaDescription,
    robots: {
      index: post.seo_index_status !== "noindex",
      follow: post.seo_index_status !== "nofollow",
    },
    openGraph: {
      title: post.og_title || post.title,
      description: post.og_description || metaDescription,
      type: "article",
      url: `${BASE_URL}/blog/${slug}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: post.author_name ? [post.author_name] : ["RC2 Soluções"],
      images: ogImage ? [{ url: ogImage, alt: post.cover_url_alt || post.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      creator: post.author_name ? `@${post.author_name.replace(/\s+/g, "")}` : "@rc2solucoes",
    },
  };
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post.related_post_ids);

  // Sanitize content and add IDs to headings
  const sanitizedContent = sanitizeAndAddIds(post.content);

  // Calculate if article is long enough for TOC and back-to-top
  // Count words as proxy for reading length
  const wordCount = post.content.split(/\s+/).length;
  const showNavigation = wordCount > 800;

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
        url: `${BASE_URL}/logo.png`,
      },
    },
  };

  const shareUrl = `${BASE_URL}/blog/${slug}`;
  const encodedTitle = encodeURIComponent(post.title);

  return (
    <>
      {showNavigation && <BackToTopButton />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="bg-rc2-sand">
        {/* Breadcrumbs */}
        <nav className="bg-rc2-sand border-b border-border/40">
          <div className="container mx-auto max-w-4xl px-4 py-2.5">
            <ol className="flex items-center gap-1 text-xs md:text-sm text-rc2-ebony/50 flex-wrap">
              <li><Link href="/" className="hover:text-rc2-orange transition-colors font-medium">Home</Link></li>
              <li className="text-rc2-ebony/30 mx-1">/</li>
              <li><Link href="/blog" className="hover:text-rc2-orange transition-colors font-medium">Blog</Link></li>
              {post.category && (
                <>
                  <li className="text-rc2-ebony/30 mx-1">/</li>
                  <li className="text-rc2-ebony/70 font-medium">{post.category}</li>
                </>
              )}
              <li className="text-rc2-ebony/30 mx-1">/</li>
              <li className="text-rc2-ebony line-clamp-1 font-medium">{post.title}</li>
            </ol>
          </div>
        </nav>

        {/* Header do post */}
        <header className="bg-rc2-ink py-16">
          <div className="container mx-auto max-w-4xl px-4">
            {post.category && (
              <Link
                href={`/blog?category=${post.category}`}
                className="inline-block px-3 py-1 text-xs font-medium text-rc2-orange bg-rc2-orange/10 rounded-full mb-4 hover:bg-rc2-orange/20 transition-colors"
              >
                {post.category}
              </Link>
            )}

            <h1 className="text-4xl md:text-5xl font-bold text-rc2-sand leading-tight mb-4">
              {post.title}
            </h1>

            <p className="text-rc2-sand/80 text-lg leading-relaxed mb-6">{post.summary}</p>

            {/* Meta info: data, tempo de leitura */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-rc2-sand/70">
              <time>{formatDate(post.published_at)}</time>
              {post.updated_at && post.updated_at !== post.published_at && (
                <span className="flex items-center gap-1">
                  Atualizado em {formatDate(post.updated_at)}
                </span>
              )}
              {post.reading_time_minutes && (
                <span className="flex items-center gap-1">
                  ⏱️ {post.reading_time_minutes} min de leitura
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Imagem de capa */}
        {post.cover_url && (
          <div className="bg-rc2-ebony/5 border-b border-border">
            <figure className="container mx-auto max-w-4xl px-4 py-12 relative aspect-video max-h-[500px] overflow-hidden rounded">
              <Image
                src={post.cover_url}
                alt={post.cover_url_alt || post.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
              />
              {post.cover_url_caption && (
                <figcaption className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-4 py-2">
                  {post.cover_url_caption}
                </figcaption>
              )}
            </figure>
          </div>
        )}

        {/* Conteúdo + Autor na Sidebar */}
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className={`grid gap-8 ${showNavigation ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1 lg:grid-cols-3"}`}>
            {/* Table of Contents Desktop (1/4 em desktop, apenas se artigo é longo) */}
            {showNavigation && <TableOfContents contentHtml={sanitizedContent} isMobile={false} />}

            {/* Conteúdo principal (2/3 em layouts sem TOC, 2/4 em layouts com TOC) */}
            <div className={showNavigation ? "lg:col-span-2" : "lg:col-span-2"}>
              {/* Table of Contents Mobile (collapsible, apenas se artigo é longo) */}
              {showNavigation && <div className="lg:hidden"><TableOfContents contentHtml={sanitizedContent} isMobile={true} /></div>}
              <div
                className="prose prose-rc2 max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />

              {/* Compartilhamento */}
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-sm font-medium text-rc2-ebony mb-4">Compartilhe este artigo:</p>
                <div className="flex gap-3">
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white text-sm font-medium rounded hover:bg-[#0A66C2]/90 transition-colors"
                  >
                    <ExternalLink size={16} /> LinkedIn
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodedTitle}%20${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white text-sm font-medium rounded hover:bg-[#25D366]/90 transition-colors"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-black/90 transition-colors"
                  >
                    X (Twitter)
                  </a>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-12 pt-8 border-t border-border">
                <div className="bg-rc2-orange/10 border border-rc2-orange/20 rounded p-6">
                  <h3 className="text-lg font-bold text-rc2-ebony mb-2">
                    Quer identificar gargalos nos processos da sua empresa?
                  </h3>
                  <p className="text-rc2-ebony/70 mb-4">
                    Fale com a RC2 Soluções e descubra como tornar sua operação mais eficiente.
                  </p>
                  <Link
                    href="/contato"
                    className="inline-block px-6 py-2.5 bg-rc2-orange text-white font-medium rounded hover:bg-rc2-orange/90 transition-colors"
                  >
                    Solicitar Diagnóstico →
                  </Link>
                </div>
              </div>

              {/* Posts Relacionados */}
              {relatedPosts.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border">
                  <h2 className="text-2xl font-bold text-rc2-ebony mb-6">Posts Relacionados</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {relatedPosts.slice(0, 2).map((relPost) => (
                      <Link
                        key={relPost.id}
                        href={`/blog/${relPost.slug}`}
                        className="group border border-border rounded overflow-hidden hover:border-rc2-orange transition-colors"
                      >
                        {relPost.cover_url && (
                          <div className="relative aspect-video overflow-hidden bg-rc2-ebony/5">
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
                          <h3 className="font-semibold text-rc2-ebony group-hover:text-rc2-orange transition-colors line-clamp-2">
                            {relPost.title}
                          </h3>
                          <p className="text-sm text-rc2-ebony/60 mt-2 line-clamp-2">
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
                <div className="sticky top-20 border border-border rounded p-6 bg-white">
                  <h3 className="text-sm font-medium text-rc2-ebony/60 uppercase tracking-widest mb-4">
                    Sobre o Autor
                  </h3>

                  {post.author_photo && (
                    <Image
                      src={post.author_photo}
                      alt={post.author_name}
                      width={200}
                      height={200}
                      className="w-full aspect-square object-cover rounded-lg mb-4"
                    />
                  )}

                  <h4 className="font-bold text-lg text-rc2-ebony mb-1">
                    {post.author_name}
                  </h4>
                  {post.author_title && (
                    <p className="text-sm text-rc2-orange font-medium mb-3">
                      {post.author_title}
                    </p>
                  )}

                  {post.author_bio && (
                    <p className="text-sm text-rc2-ebony/70 mb-4 leading-relaxed">
                      {post.author_bio}
                    </p>
                  )}

                  {post.author_linkedin && (
                    <a
                      href={post.author_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[#0A66C2] hover:underline font-medium"
                    >
                      <ExternalLink size={16} /> LinkedIn
                    </a>
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
