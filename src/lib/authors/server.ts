import "server-only";

import { mapPostSnapshotToAuthorPayload } from "@/lib/authors/mappers";
import { createSessionClient } from "@/lib/supabase/server";
import type { Author, AuthorSnapshotComparableFields } from "@/lib/types/author";
import { AuthorSchema } from "@/lib/validations/author";

export async function listAuthors(): Promise<Author[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("authors")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Author[];
}

export async function createAuthorRecord(
  snapshot: AuthorSnapshotComparableFields
): Promise<Author> {
  const supabase = await createSessionClient();
  const payload = AuthorSchema.parse(mapPostSnapshotToAuthorPayload(snapshot));
  const { data, error } = await supabase
    .from("authors")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Author;
}

export async function updateAuthorRecord(
  authorId: string,
  snapshot: AuthorSnapshotComparableFields
): Promise<Author> {
  const supabase = await createSessionClient();
  const payload = AuthorSchema.parse(mapPostSnapshotToAuthorPayload(snapshot));
  const { data, error } = await supabase
    .from("authors")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", authorId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Author;
}
