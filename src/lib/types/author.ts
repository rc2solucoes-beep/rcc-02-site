export interface Author {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthorSnapshotFields {
  author_id?: string | null;
  author_name: string;
  author_title: string;
  author_photo: string;
  author_bio: string;
  author_linkedin: string;
}

export interface AuthorPostSnapshot {
  author_id: string;
  author_name: string;
  author_title: string;
  author_photo: string;
  author_bio: string;
  author_linkedin: string;
}

export type AuthorSnapshotComparableFields = Pick<
  AuthorSnapshotFields,
  | "author_name"
  | "author_title"
  | "author_photo"
  | "author_bio"
  | "author_linkedin"
>;
