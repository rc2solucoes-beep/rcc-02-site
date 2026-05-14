export type PostStatus = "draft" | "scheduled" | "published";
export type PostCategory = "Tecnologia" | "Automação" | "Gestão Empresarial" | "Segurança" | "Produtividade" | "Transformação Digital" | "Infraestrutura" | "Sistemas e Processos";
export type ContentType = "artigo" | "guia" | "tutorial" | "case" | "notícia";
export type SeoIndexStatus = "index" | "noindex" | "nofollow";

export interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  cover_url: string | null;
  cover_url_alt: string | null;
  cover_url_caption: string | null;
  og_image: string | null;
  og_title: string | null;
  og_description: string | null;
  status: PostStatus;
  published_at: string | null;
  updated_at: string;
  scheduled_publish_at: string | null;
  reading_time_minutes: number | null;
  created_at: string;

  // SEO
  seo_keyword_primary: string | null;
  seo_keyword_secondary: string[] | null;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
  seo_index_status: SeoIndexStatus;

  // Publicação
  category: PostCategory | null;
  tags: string[] | null;
  content_type: ContentType | null;

  // Autor
  author_id: string | null;
  author_name: string | null;
  author_title: string | null;
  author_photo: string | null;
  author_bio: string | null;
  author_linkedin: string | null;

  // Relacionamento
  related_post_ids: string[] | null;
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
