"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSessionClient } from "@/lib/supabase/server";
import type { PostStatus } from "@/lib/types/post";

const postSchema = z.object({
  title:    z.string().min(1, "Título obrigatório"),
  slug:     z.string().min(1, "Slug obrigatório").regex(/^[a-z0-9-]+$/, "Slug: apenas letras minúsculas, números e hífens"),
  summary:  z.string().min(1, "Resumo obrigatório"),
  content:  z.string().min(1, "Conteúdo obrigatório"),
  cover_url: z.string().url("URL inválida").optional().or(z.literal("")),
  status:   z.enum(["draft", "published", "archived"]),
});

export type PostFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createPost(prevState: PostFormState, formData: FormData): Promise<PostFormState> {
  const raw = {
    title:     formData.get("title") as string,
    slug:      formData.get("slug") as string,
    summary:   formData.get("summary") as string,
    content:   formData.get("content") as string,
    cover_url: (formData.get("cover_url") as string) || "",
    status:    formData.get("status") as string,
  };

  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { title, slug, summary, content, cover_url, status } = parsed.data;

  try {
    const supabase = await createSessionClient();
    const { error } = await supabase.from("posts").insert({
      title, slug, summary, content,
      cover_url: cover_url || null,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    });

    if (error) {
      if (error.code === "23505") {
        return { errors: { slug: ["Este slug já está em uso."] } };
      }
      throw error;
    }
  } catch {
    return { message: "Erro ao salvar post. Tente novamente." };
  }

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect("/admin/posts");
}

export async function updatePost(id: string, prevState: PostFormState, formData: FormData): Promise<PostFormState> {
  const raw = {
    title:     formData.get("title") as string,
    slug:      formData.get("slug") as string,
    summary:   formData.get("summary") as string,
    content:   formData.get("content") as string,
    cover_url: (formData.get("cover_url") as string) || "",
    status:    formData.get("status") as string,
  };

  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { title, slug, summary, content, cover_url, status } = parsed.data;

  try {
    const supabase = await createSessionClient();

    // Preserve published_at if already published
    const { data: existing } = await supabase.from("posts").select("status,published_at").eq("id", id).single();
    const published_at =
      status === "published"
        ? (existing?.published_at ?? new Date().toISOString())
        : null;

    const { error } = await supabase.from("posts").update({
      title, slug, summary, content,
      cover_url: cover_url || null,
      status: status as PostStatus,
      published_at,
    }).eq("id", id);

    if (error) {
      if (error.code === "23505") {
        return { errors: { slug: ["Este slug já está em uso."] } };
      }
      throw error;
    }
  } catch {
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
