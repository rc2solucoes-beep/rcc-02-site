import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types/post";

export const revalidate = 60;

async function getPost(slug: string): Promise<Post | null> {
  try {
    const supabase = createServiceClient();
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

async function getAllSlugs(): Promise<string[]> {
  try {
    const supabase = createServiceClient();
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

  return {
    title: `${post.title} — RC2 Soluções`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      images: post.cover_url ? [{ url: post.cover_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    image: post.cover_url ?? undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Organization",
      name: "RC2 Soluções",
      url: "https://rc2solucoes.com.br",
    },
    publisher: {
      "@type": "Organization",
      name: "RC2 Soluções",
      url: "https://rc2solucoes.com.br",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="bg-rc2-sand">
        {/* Header do post */}
        <header className="bg-rc2-ink py-20 px-4">
          <div className="container mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-rc2-sand/50 hover:text-rc2-sand/80 transition-colors mb-8 uppercase tracking-wider"
            >
              ← Blog
            </Link>
            <time className="block text-xs text-rc2-orange uppercase tracking-widest mb-4">
              {formatDate(post.published_at)}
            </time>
            <h1 className="text-3xl md:text-4xl font-bold text-rc2-sand leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-rc2-sand/60 text-lg leading-relaxed">{post.summary}</p>
          </div>
        </header>

        {/* Imagem de capa */}
        {post.cover_url && (
          <div className="relative aspect-video w-full max-h-[480px] overflow-hidden">
            <Image
              src={post.cover_url}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <div
            className="prose prose-rc2 max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Footer do post */}
          <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link
              href="/blog"
              className="text-sm font-medium text-rc2-ebony/60 hover:text-rc2-orange transition-colors"
            >
              ← Voltar para o blog
            </Link>
            <Link
              href="/contato"
              className="text-sm font-medium text-rc2-orange hover:underline underline-offset-4"
            >
              Fale com a RC2 →
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
