"use server";

import { mapAuthorToPostSnapshot } from "@/lib/authors/mappers";
import {
  createAuthorRecord,
  updateAuthorRecord,
} from "@/lib/authors/server";
import { createSessionClient } from "@/lib/supabase/server";
import type { Author, AuthorSnapshotComparableFields } from "@/lib/types/author";

interface AuthorActionResult {
  author: Author;
  snapshot: ReturnType<typeof mapAuthorToPostSnapshot>;
}

async function requireAdminSession() {
  const supabase = await createSessionClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("Unable to verify session for author action.");
  }

  if (!session) {
    throw new Error("Unauthorized: admin session required.");
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", session.user.id)
    .single();

  if (adminError || !adminUser) {
    throw new Error("Unauthorized: admin access required.");
  }

  return session;
}

export async function createAuthor(
  snapshot: AuthorSnapshotComparableFields
): Promise<AuthorActionResult> {
  await requireAdminSession();
  const author = await createAuthorRecord(snapshot);

  return {
    author,
    snapshot: mapAuthorToPostSnapshot(author),
  };
}

export async function updateAuthor(
  authorId: string,
  snapshot: AuthorSnapshotComparableFields
): Promise<AuthorActionResult> {
  await requireAdminSession();
  const author = await updateAuthorRecord(authorId, snapshot);

  return {
    author,
    snapshot: mapAuthorToPostSnapshot(author),
  };
}
