"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateAuthorRecord } from "@/lib/authors/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { writeAdminAuditLog } from "@/lib/admin/auditLog";
import { createSessionClient } from "@/lib/supabase/server";
import type { AuthorSnapshotComparableFields } from "@/lib/types/author";
import { validatePostInputByStatus } from "@/lib/validations/post";
import { classifyRowsResult, validatePostSchedule } from "@/lib/admin/postSchedule";
import type { PostStatus } from "@/lib/types/post";

// Helper para calcular tempo de leitura (palavras / 200 = minutos)
function calculateReadingTime(htmlContent: string): number {
  // Remove HTML tags
  const text = htmlContent.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return minutes;
}

export type PostFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

async function requireAdminActorForPosts() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    await writeAdminAuditLog({
      event: "admin_post_action_denied",
      severity: "warning",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: admin.status === 401 ? "unknown" : "authenticated",
      path: "/admin/posts",
      method: "SERVER_ACTION",
      status: admin.status,
    });
    throw new Error("Unauthorized: admin access required.");
  }
  return admin;
}

function getAuthorSnapshotFromFormData(
  formData: FormData
): AuthorSnapshotComparableFields {
  return {
    author_name: (formData.get("author_name") as string) || "",
    author_title: (formData.get("author_title") as string) || "",
    author_photo: (formData.get("author_photo") as string) || "",
    author_bio: (formData.get("author_bio") as string) || "",
    author_linkedin: (formData.get("author_linkedin") as string) || "",
  };
}

async function syncGlobalAuthorIfRequested(
  formData: FormData,
  authorId: string | null | undefined
): Promise<PostFormState | null> {
  if (!authorId || formData.get("sync_author_global") !== "true") {
    return null;
  }

  try {
    await updateAuthorRecord(authorId, getAuthorSnapshotFromFormData(formData));
    return null;
  } catch (error) {
    console.error("Error updating global author:", error);
    return {
      message:
        "Erro ao atualizar cadastro global do autor. O post não foi salvo.",
    };
  }
}

export type DeletePostResult = { ok: false; message: string };

// Atualização que não encontrou o post (ou a RLS o escondeu): erro explícito, sem sucesso auditado.
async function postNotFoundOnUpdate(
  admin: Awaited<ReturnType<typeof requireAdminActorForPosts>>,
  id: string
): Promise<PostFormState> {
  await writeAdminAuditLog({
    event: "admin_post_update_not_found",
    severity: "warning",
    actorUserId: admin.userId,
    actorEmail: admin.email,
    actorType: "admin",
    path: "/admin/posts",
    method: "SERVER_ACTION",
    status: 404,
    resourceType: "post",
    resourceId: id,
  });
  return { message: "Post não encontrado ou sem permissão para editar." };
}

export async function createPost(prevState: PostFormState, formData: FormData): Promise<PostFormState> {
  const admin = await requireAdminActorForPosts();
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

  const parsed = validatePostInputByStatus(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { content, status } = parsed.data;
  const reading_time = parsed.data.reading_time_minutes || calculateReadingTime(content);

  // Novos agendamentos exigem data futura (DEC-18, RF-CMS-10).
  const schedule = validatePostSchedule({
    status,
    scheduledPublishAt: parsed.data.scheduled_publish_at,
    existing: null,
    now: new Date(),
  });
  if (!schedule.ok) {
    return { errors: { scheduled_publish_at: [schedule.message] } };
  }

  try {
    const syncAuthorError = await syncGlobalAuthorIfRequested(
      formData,
      parsed.data.author_id
    );
    if (syncAuthorError) {
      return syncAuthorError;
    }

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
        await writeAdminAuditLog({
          event: "admin_post_create_duplicate_slug",
          severity: "warning",
          actorUserId: admin.userId,
          actorEmail: admin.email,
          actorType: "admin",
          path: "/admin/posts",
          method: "SERVER_ACTION",
          status: 409,
        });
        return { errors: { slug: ["Este slug já está em uso."] } };
      }
      console.error("Supabase error:", error);
      throw error;
    }
  } catch (err) {
    console.error("Error creating post:", err);
    await writeAdminAuditLog({
      event: "admin_post_create_error",
      severity: "error",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: "/admin/posts",
      method: "SERVER_ACTION",
      status: 500,
    });
    return { message: "Erro ao salvar post. Tente novamente." };
  }

  await writeAdminAuditLog({
    event: "admin_post_created",
    severity: "info",
    actorUserId: admin.userId,
    actorEmail: admin.email,
    actorType: "admin",
    path: "/admin/posts",
    method: "SERVER_ACTION",
    status: 200,
    metadata: {
      slug: parsed.data.slug,
      status: parsed.data.status,
    },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect("/admin/posts");
}

export async function updatePost(id: string, prevState: PostFormState, formData: FormData): Promise<PostFormState> {
  const admin = await requireAdminActorForPosts();
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

  const parsed = validatePostInputByStatus(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { content, status } = parsed.data;
  const reading_time = parsed.data.reading_time_minutes || calculateReadingTime(content);

  try {
    const supabase = await createSessionClient();
    const now = new Date().toISOString();

    // Estado atual: preserva published_at e decide se o agendamento precisa ser revalidado.
    // maybeSingle: post inexistente (ou invisível pela RLS) vira `null`, não erro silencioso.
    const { data: existing, error: existingError } = await supabase
      .from("posts")
      .select("status,published_at,scheduled_publish_at")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }
    if (!existing) {
      return await postNotFoundOnUpdate(admin, id);
    }

    // Agendamento futuro; data inalterada de um agendamento histórico não é revalidada (DEC-18).
    const schedule = validatePostSchedule({
      status,
      scheduledPublishAt: parsed.data.scheduled_publish_at,
      existing,
      now: new Date(now),
    });
    if (!schedule.ok) {
      return { errors: { scheduled_publish_at: [schedule.message] } };
    }

    const syncAuthorError = await syncGlobalAuthorIfRequested(
      formData,
      parsed.data.author_id
    );
    if (syncAuthorError) {
      return syncAuthorError;
    }

    const published_at =
      status === "published"
        ? (existing.published_at ?? now)
        : null;

    // select("id"): confirma que exatamente uma linha foi atualizada (D8).
    const { data: updatedRows, error } = await supabase.from("posts").update({
      ...parsed.data,
      reading_time_minutes: reading_time,
      status: status as PostStatus,
      published_at,
      updated_at: now,
    }).eq("id", id).select("id");

    if (error) {
      if (error.code === "23505") {
        await writeAdminAuditLog({
          event: "admin_post_update_duplicate_slug",
          severity: "warning",
          actorUserId: admin.userId,
          actorEmail: admin.email,
          actorType: "admin",
          path: "/admin/posts",
          method: "SERVER_ACTION",
          status: 409,
          resourceType: "post",
          resourceId: id,
        });
        return { errors: { slug: ["Este slug já está em uso."] } };
      }
      console.error("Supabase error:", error);
      throw error;
    }

    if (classifyRowsResult({ data: updatedRows, error: null }) !== "affected") {
      return await postNotFoundOnUpdate(admin, id);
    }
  } catch (err) {
    console.error("Error updating post:", err);
    await writeAdminAuditLog({
      event: "admin_post_update_error",
      severity: "error",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: "/admin/posts",
      method: "SERVER_ACTION",
      status: 500,
      resourceType: "post",
      resourceId: id,
    });
    return { message: "Erro ao atualizar post. Tente novamente." };
  }

  await writeAdminAuditLog({
    event: "admin_post_updated",
    severity: "info",
    actorUserId: admin.userId,
    actorEmail: admin.email,
    actorType: "admin",
    path: "/admin/posts",
    method: "SERVER_ACTION",
    status: 200,
    resourceType: "post",
    resourceId: id,
    metadata: {
      slug: parsed.data.slug,
      status: parsed.data.status,
    },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect("/admin/posts");
}

export async function deletePost(id: string): Promise<DeletePostResult | void> {
  const admin = await requireAdminActorForPosts();
  const supabase = await createSessionClient();
  // select("id"): só audita sucesso depois de confirmar que a linha foi removida (RF-CMS-11).
  const { data, error } = await supabase.from("posts").delete().eq("id", id).select("id");
  const outcome = classifyRowsResult({ data, error });

  if (outcome !== "affected") {
    const notFound = outcome === "not_found";
    if (!notFound) {
      console.error("Error deleting post:", { code: error?.code ?? "unexpected_rows" });
    }
    await writeAdminAuditLog({
      event: notFound ? "admin_post_delete_not_found" : "admin_post_delete_error",
      severity: notFound ? "warning" : "error",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: "/admin/posts",
      method: "SERVER_ACTION",
      status: notFound ? 404 : 500,
      resourceType: "post",
      resourceId: id,
    });
    return {
      ok: false,
      message: notFound
        ? "Post não encontrado ou sem permissão para excluir."
        : "Erro ao excluir o post. Tente novamente.",
    };
  }

  await writeAdminAuditLog({
    event: "admin_post_deleted",
    severity: "warning",
    actorUserId: admin.userId,
    actorEmail: admin.email,
    actorType: "admin",
    path: "/admin/posts",
    method: "SERVER_ACTION",
    status: 200,
    resourceType: "post",
    resourceId: id,
  });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect("/admin/posts");
}
