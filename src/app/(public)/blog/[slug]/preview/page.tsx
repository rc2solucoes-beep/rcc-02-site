import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import type { Post } from "@/lib/types/post";
import { BlogPostArticle } from "@/components/blog/BlogPostArticle";
import { PreviewBanner } from "@/components/blog/PreviewBanner";

// Preview sempre dinâmico e nunca indexado. O acesso é restrito a admin.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function BlogPostPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Só admin autenticado. 404 (não redirect) para não revelar a existência.
  const admin = await requireAdmin();
  if (!admin.ok) notFound();

  const { slug } = await params;
  const supabase = await createSessionClient();

  // Sem filtro de status: a RLS libera admin autenticado a ler qualquer status.
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const post = (data as Post) ?? null;
  if (!post) notFound();

  // Relacionados seguem a regra pública (apenas publicados).
  let relatedPosts: Post[] = [];
  if (post.related_post_ids && post.related_post_ids.length > 0) {
    const { data: related } = await supabase
      .from("posts")
      .select("*")
      .in("id", post.related_post_ids)
      .eq("status", "published");
    relatedPosts = (related ?? []) as Post[];
  }

  return (
    <>
      <PreviewBanner post={post} />
      <BlogPostArticle post={post} relatedPosts={relatedPosts} />
    </>
  );
}
