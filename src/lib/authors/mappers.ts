import type {
  Author,
  AuthorPostSnapshot,
  AuthorSnapshotComparableFields,
} from "@/lib/types/author";
import { normalizeOptionalUrl } from "@/lib/validations/author";

function normalizeSnapshotValue(value: string | null | undefined) {
  return (value ?? "").trim();
}

export function mapAuthorToPostSnapshot(
  author: Author
): AuthorPostSnapshot {
  return {
    author_id: author.id,
    author_name: author.name,
    author_title: author.title ?? "",
    author_photo: author.photo_url ?? "",
    author_bio: author.bio ?? "",
    author_linkedin: author.linkedin_url ?? "",
  };
}

export function mapPostSnapshotToAuthorPayload(
  snapshot: AuthorSnapshotComparableFields
) {
  return {
    name: normalizeSnapshotValue(snapshot.author_name),
    title: normalizeSnapshotValue(snapshot.author_title) || null,
    photo_url: normalizeOptionalUrl(snapshot.author_photo),
    bio: normalizeSnapshotValue(snapshot.author_bio) || null,
    linkedin_url: normalizeOptionalUrl(snapshot.author_linkedin),
  };
}

export function hasAuthorSnapshotChanged(
  author: Author,
  formData: AuthorSnapshotComparableFields
) {
  return (
    normalizeSnapshotValue(formData.author_name) !==
      normalizeSnapshotValue(author.name) ||
    normalizeSnapshotValue(formData.author_title) !==
      normalizeSnapshotValue(author.title) ||
    normalizeSnapshotValue(formData.author_photo) !==
      normalizeSnapshotValue(author.photo_url) ||
    normalizeSnapshotValue(formData.author_bio) !==
      normalizeSnapshotValue(author.bio) ||
    normalizeSnapshotValue(formData.author_linkedin) !==
      normalizeSnapshotValue(author.linkedin_url)
  );
}
