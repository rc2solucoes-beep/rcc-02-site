"use server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { writeAdminAuditLog } from "@/lib/admin/auditLog";
import { mapAuthorToPostSnapshot } from "@/lib/authors/mappers";
import {
  createAuthorRecord,
  updateAuthorRecord,
} from "@/lib/authors/server";
import type { Author, AuthorSnapshotComparableFields } from "@/lib/types/author";

interface AuthorActionResult {
  author: Author;
  snapshot: ReturnType<typeof mapAuthorToPostSnapshot>;
}

async function requireAdminActor() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    await writeAdminAuditLog({
      event: "admin_author_action_denied",
      severity: "warning",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: admin.status === 401 ? "unknown" : "authenticated",
      path: "/admin/authors",
      method: "SERVER_ACTION",
      status: admin.status,
    });
    throw new Error("Unauthorized: admin access required.");
  }
  return admin;
}

export async function createAuthor(
  snapshot: AuthorSnapshotComparableFields
): Promise<AuthorActionResult> {
  const admin = await requireAdminActor();

  try {
    const author = await createAuthorRecord(snapshot);

    await writeAdminAuditLog({
      event: "admin_author_created",
      severity: "info",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: "/admin/authors",
      method: "SERVER_ACTION",
      status: 200,
      resourceType: "author",
      resourceId: author.id,
    });

    return {
      author,
      snapshot: mapAuthorToPostSnapshot(author),
    };
  } catch {
    await writeAdminAuditLog({
      event: "admin_author_create_error",
      severity: "error",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: "/admin/authors",
      method: "SERVER_ACTION",
      status: 500,
    });
    throw new Error("Unable to create author.");
  }
}

export async function updateAuthor(
  authorId: string,
  snapshot: AuthorSnapshotComparableFields
): Promise<AuthorActionResult> {
  const admin = await requireAdminActor();

  try {
    const author = await updateAuthorRecord(authorId, snapshot);

    await writeAdminAuditLog({
      event: "admin_author_updated",
      severity: "info",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: "/admin/authors",
      method: "SERVER_ACTION",
      status: 200,
      resourceType: "author",
      resourceId: authorId,
    });

    return {
      author,
      snapshot: mapAuthorToPostSnapshot(author),
    };
  } catch {
    await writeAdminAuditLog({
      event: "admin_author_update_error",
      severity: "error",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "admin",
      path: "/admin/authors",
      method: "SERVER_ACTION",
      status: 500,
      resourceType: "author",
      resourceId: authorId,
    });
    throw new Error("Unable to update author.");
  }
}
