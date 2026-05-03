export type PostStatus = "draft" | "published" | "archived";

export interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  cover_url: string | null;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  whatsapp: string;
  segment: string;
  size: string;
  solution: string;
  message: string;
  source: string;
  ip_hash: string;
  created_at: string;
}
