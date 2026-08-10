import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types/post";
import { BASE_URL } from "@/lib/siteMetadata";
import { BlogPostArticle } from "@/components/blog/BlogPostArticle";

export const revalidate = 60;

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
    alternates: {
      canonical: `${BASE_URL}/blog/${slug}`,
    },
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post.related_post_ids);

  return <BlogPostArticle post={post} relatedPosts={relatedPosts} />;
}
