"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSessionClient } from "@/lib/supabase/server";
import { CreatePostSchema } from "@/lib/validations/post";
import type { PostStatus } from "@/lib/types/post";

// Helper para calcular tempo de leitura (palavras / 200 = minutos)
function calculateReadingTime(htmlContent: string): number {
  // Remove HTML tags
  const text = htmlContent.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return minutes;
}

// Helper para extrair conteúdo de texto a partir de HTML
function stripHtmlAndTruncate(html: string, maxLength: number): string {
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

export type PostFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createPost(prevState: PostFormState, formData: FormData): Promise<PostFormState> {
  const raw = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    summary: formData.get("summary") as string,
    content: formData.get("content") as string,
    cover_url: (formData.get("cover_url") as string) || null,
    status: formData.get("status") as string,
    // SEO
    seo_keyword_primary: formData.get("seo_keyword_primary") as string || null,
    seo_keyword_secondary: formData.get("seo_keyword_secondary") ? (formData.get("seo_keyword_secondary") as string).split(",").map(s => s.trim()) : null,
    seo_meta_title: formData.get("seo_meta_title") as string || null,
    seo_meta_description: formData.get("seo_meta_description") as string || null,
    seo_index_status: formData.get("seo_index_status") as string || "index",
    // Publicação
    category: formData.get("category") as string || null,
    tags: formData.get("tags") ? (formData.get("tags") as string).split(",").map(t => t.trim()) : null,
    content_type: formData.get("content_type") as string || null,
    scheduled_publish_at: formData.get("scheduled_publish_at") as string || null,
    reading_time_minutes: formData.get("reading_time_minutes") as string ? parseInt(formData.get("reading_time_minutes") as string) : null,
    // Autor
    author_id: formData.get("author_id") as string || null,
    author_name: formData.get("author_name") as string || null,
    author_title: formData.get("author_title") as string || null,
    author_photo: formData.get("author_photo") as string || null,
    author_bio: formData.get("author_bio") as string || null,
    author_linkedin: formData.get("author_linkedin") as string || null,
    // Imagem
    cover_url_alt: formData.get("cover_url_alt") as string || null,
    cover_url_caption: formData.get("cover_url_caption") as string || null,
    og_image: formData.get("og_image") as string || null,
    og_title: formData.get("og_title") as string || null,
    og_description: formData.get("og_description") as string || null,
    // Relacionamento
    related_post_ids: formData.get("related_post_ids") ? (formData.get("related_post_ids") as string).split(",").filter(Boolean) : null,
    // FAQ
    faq_items: (() => {
      const raw = formData.get("faq_items") as string;
      if (!raw || raw === "null") return null;
      try { return JSON.parse(raw); } catch { return null; }
    })(),
    // CTA
    cta_block: (() => {
      const raw = formData.get("cta_block") as string;
      if (!raw || raw === "null") return null;
      try { return JSON.parse(raw); } catch { return null; }
    })(),
  };

  const parsed = CreatePostSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { content, status } = parsed.data;
  const reading_time = parsed.data.reading_time_minutes || calculateReadingTime(content);

  try {
    const supabase = await createSessionClient();
    const now = new Date().toISOString();

    const { error } = await supabase.from("posts").insert({
      ...parsed.data,
      reading_time_minutes: reading_time,
      published_at: status === "published" ? now : null,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      if (error.code === "23505") {
        return { errors: { slug: ["Este slug já está em uso."] } };
      }
      console.error("Supabase error:", error);
      throw error;
    }
  } catch (err) {
    console.error("Error creating post:", err);
    return { message: "Erro ao salvar post. Tente novamente." };
  }

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect("/admin/posts");
}

export async function updatePost(id: string, prevState: PostFormState, formData: FormData): Promise<PostFormState> {
  const raw = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    summary: formData.get("summary") as string,
    content: formData.get("content") as string,
    cover_url: (formData.get("cover_url") as string) || null,
    status: formData.get("status") as string,
    // SEO
    seo_keyword_primary: formData.get("seo_keyword_primary") as string || null,
    seo_keyword_secondary: formData.get("seo_keyword_secondary") ? (formData.get("seo_keyword_secondary") as string).split(",").map(s => s.trim()) : null,
    seo_meta_title: formData.get("seo_meta_title") as string || null,
    seo_meta_description: formData.get("seo_meta_description") as string || null,
    seo_index_status: formData.get("seo_index_status") as string || "index",
    // Publicação
    category: formData.get("category") as string || null,
    tags: formData.get("tags") ? (formData.get("tags") as string).split(",").map(t => t.trim()) : null,
    content_type: formData.get("content_type") as string || null,
    scheduled_publish_at: formData.get("scheduled_publish_at") as string || null,
    reading_time_minutes: formData.get("reading_time_minutes") as string ? parseInt(formData.get("reading_time_minutes") as string) : null,
    // Autor
    author_id: formData.get("author_id") as string || null,
    author_name: formData.get("author_name") as string || null,
    author_title: formData.get("author_title") as string || null,
    author_photo: formData.get("author_photo") as string || null,
    author_bio: formData.get("author_bio") as string || null,
    author_linkedin: formData.get("author_linkedin") as string || null,
    // Imagem
    cover_url_alt: formData.get("cover_url_alt") as string || null,
    cover_url_caption: formData.get("cover_url_caption") as string || null,
    og_image: formData.get("og_image") as string || null,
    og_title: formData.get("og_title") as string || null,
    og_description: formData.get("og_description") as string || null,
    // Relacionamento
    related_post_ids: formData.get("related_post_ids") ? (formData.get("related_post_ids") as string).split(",").filter(Boolean) : null,
    // FAQ
    faq_items: (() => {
      const raw = formData.get("faq_items") as string;
      if (!raw || raw === "null") return null;
      try { return JSON.parse(raw); } catch { return null; }
    })(),
    // CTA
    cta_block: (() => {
      const raw = formData.get("cta_block") as string;
      if (!raw || raw === "null") return null;
      try { return JSON.parse(raw); } catch { return null; }
    })(),
  };

  const parsed = CreatePostSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { content, status } = parsed.data;
  const reading_time = parsed.data.reading_time_minutes || calculateReadingTime(content);

  try {
    const supabase = await createSessionClient();
    const now = new Date().toISOString();

    // Preserve published_at if already published
    const { data: existing } = await supabase
      .from("posts")
      .select("status,published_at")
      .eq("id", id)
      .single();

    const published_at =
      status === "published"
        ? (existing?.published_at ?? now)
        : null;

    const { error } = await supabase.from("posts").update({
      ...parsed.data,
      reading_time_minutes: reading_time,
      status: status as PostStatus,
      published_at,
      updated_at: now,
    }).eq("id", id);

    if (error) {
      if (error.code === "23505") {
        return { errors: { slug: ["Este slug já está em uso."] } };
      }
      console.error("Supabase error:", error);
      throw error;
    }
  } catch (err) {
    console.error("Error updating post:", err);
    return { message: "Erro ao atualizar post. Tente novamente." };
  }

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect("/admin/posts");
}

export async function deletePost(id: string): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.from("posts").delete().eq("id", id);
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect("/admin/posts");
}
