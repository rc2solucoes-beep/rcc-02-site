"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { writeAdminAuditLog } from "@/lib/admin/auditLog";
import { createSessionClient } from "@/lib/supabase/server";
import { NEWSLETTER_PATH } from "@/lib/admin/newsletterAdmin";

const uuid = z.uuid();
const unsubscribeSchema = z.object({
  id: uuid,
  reason: z.enum(["titular_request", "bounce_or_complaint", "other"]),
});
const deleteSchema = z.object({ id: uuid, confirmation: z.literal("EXCLUIR") });

export type NewsletterActionResult = {
  ok: boolean;
  code: string;
};

async function adminGuard(): Promise<boolean> {
  const admin = await requireAdmin();
  if (admin.ok) return true;
  await writeAdminAuditLog({
    event: "admin_newsletter_action_denied", severity: "warn",
    actorType: admin.status === 401 ? "unknown" : "authenticated",
    actorUserId: admin.userId,
    path: NEWSLETTER_PATH, method: "SERVER_ACTION",
    status: admin.status, resourceType: "newsletter_subscriber",
  });
  return false;
}

async function execute(
  fn: "newsletter_admin_unsubscribe" | "newsletter_admin_delete_subscriber",
  args: Record<string, string>,
  id: string,
): Promise<NewsletterActionResult> {
  try {
    const client = await createSessionClient();
    const { data, error } = await client.rpc(fn, args);
    if (error || typeof data !== "string") {
      console.error("[newsletter/admin] falha na ação", { fn, code: error?.code ?? "unknown" });
      return { ok: false, code: "failed" };
    }
    if (data === "unsubscribed" || data === "deleted" || data === "already_unsubscribed") {
      revalidatePath(NEWSLETTER_PATH);
      revalidatePath(NEWSLETTER_PATH + "/" + id);
      return { ok: true, code: data };
    }
    if (["not_found", "confirmation_invalid"].includes(data)) return { ok: false, code: data };
    return { ok: false, code: "failed" };
  } catch {
    return { ok: false, code: "failed" };
  }
}

/** Todas as escritas e sua auditoria estão na mesma transação da RPC N4. */
export async function unsubscribeNewsletterSubscriber(input: {
  id: string; reason: string;
}): Promise<NewsletterActionResult> {
  if (process.env.NEWSLETTER_ADMIN_MUTATIONS_ENABLED !== "true") return { ok: false, code: "not_enabled" };
  if (!(await adminGuard())) return { ok: false, code: "forbidden" };
  const parsed = unsubscribeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  return execute("newsletter_admin_unsubscribe", {
    p_subscriber_id: parsed.data.id,
    p_reason: parsed.data.reason,
  }, parsed.data.id);
}

export async function deleteNewsletterSubscriber(input: {
  id: string; confirmation: string;
}): Promise<NewsletterActionResult> {
  if (process.env.NEWSLETTER_ADMIN_MUTATIONS_ENABLED !== "true") return { ok: false, code: "not_enabled" };
  if (!(await adminGuard())) return { ok: false, code: "forbidden" };
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  return execute("newsletter_admin_delete_subscriber", {
    p_subscriber_id: parsed.data.id,
    p_confirmation: parsed.data.confirmation,
  }, parsed.data.id);
}
