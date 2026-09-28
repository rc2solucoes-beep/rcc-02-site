import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types/post";
import { blogPostUrl } from "@/lib/blog/url";
import { BlogPostArticle } from "@/components/blog/BlogPostArticle";

export const revalidate = 60;

/**
 * Post publicado pelo slug, ou `null` quando ele não existe.
 *
 * Só "não existe" vira `null` — e daí 404. Falha de banco lança: a página cai
 * no `error.tsx` e o ISR mantém a última versão válida, em vez de responder
 * 404 para um post que existe. `cache` garante uma consulta por request,
 * compartilhada entre `generateMetadata` e a página.
 */
const getPost = cache(async (slug: string): Promise<Post | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar o post "${slug}": ${error.message}`);
  return (data as Post | null) ?? null;
});

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
  // A metadata do 404 vem de `not-found.tsx`, não daqui.
  if (!post) notFound();

  // Usar campos de SEO se disponíveis, senão usar valores padrão
  const metaTitle = post.seo_meta_title || `${post.title} — RC2 Soluções`;
  const metaDescription = post.seo_meta_description || post.summary;
  const ogImage = post.og_image || post.cover_url;
  const shouldIndex = post.seo_index_status !== "noindex";
  const shouldFollow = post.seo_index_status !== "nofollow";

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: blogPostUrl(slug),
    },
    // O merge de metadata é raso: este `robots` substitui o do layout raiz
    // inteiro, `googleBot` incluído. Por isso as diretivas de preview do site
    // são repetidas aqui, com index/follow sempre iguais aos do robots genérico.
    robots: {
      index: shouldIndex,
      follow: shouldFollow,
      googleBot: {
        index: shouldIndex,
        follow: shouldFollow,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: post.og_title || post.title,
      description: post.og_description || metaDescription,
      type: "article",
      url: blogPostUrl(slug),
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post.related_post_ids);

  return <BlogPostArticle post={post} relatedPosts={relatedPosts} />;
}
