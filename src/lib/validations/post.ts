import { z } from "zod";

export const PostCategoryEnum = z.enum([
  "Tecnologia",
  "Automação",
  "Gestão Empresarial",
  "Segurança",
  "Produtividade",
  "Transformação Digital",
  "Infraestrutura",
  "Sistemas e Processos",
]);

export const ContentTypeEnum = z.enum([
  "artigo",
  "guia",
  "tutorial",
  "case",
  "notícia",
]);

export const PostStatusEnum = z.enum(["draft", "scheduled", "published"]);

export const SeoIndexStatusEnum = z.enum(["index", "noindex", "nofollow"]);

// Schemas por seção de aba

export const PostContentSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres").max(200),
  slug: z.string().min(1, "Slug é obrigatório").regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  summary: z.string().min(10, "Resumo deve ter pelo menos 10 caracteres").max(500),
  content: z.string().min(20, "Conteúdo deve ter pelo menos 20 caracteres"),
});

export const PostSeoSchema = z.object({
  seo_keyword_primary: z.string().max(60, "Máx 60 caracteres").optional().nullable(),
  seo_keyword_secondary: z.array(z.string()).optional().nullable(),
  seo_meta_title: z.string().max(60, "Meta title: máx 60 caracteres").optional().nullable(),
  seo_meta_description: z.string().max(160, "Meta description: máx 160 caracteres").optional().nullable(),
  seo_index_status: SeoIndexStatusEnum.default("index"),
});

export const PostPublicationSchema = z.object({
  category: PostCategoryEnum.optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  content_type: ContentTypeEnum.optional().nullable(),
  status: PostStatusEnum.default("draft"),
  published_at: z.string().datetime().optional().nullable(),
  updated_at: z.string().datetime().optional(),
  scheduled_publish_at: z.string().datetime().optional().nullable(),
  reading_time_minutes: z.number().int().min(1).optional().nullable(),
});

export const PostAuthorSchema = z.object({
  author_id: z.string().uuid().optional().nullable(),
  author_name: z.string().max(255).optional().nullable(),
  author_title: z.string().max(255).optional().nullable(),
  author_photo: z.string().url().optional().nullable(),
  author_bio: z.string().max(500).optional().nullable(),
  author_linkedin: z.string().url().optional().nullable(),
});

export const PostImageSchema = z.object({
  cover_url: z.string().url().optional().nullable(),
  cover_url_alt: z.string().max(255, "Alt text: máx 255 caracteres").optional().nullable(),
  cover_url_caption: z.string().max(500).optional().nullable(),
  og_image: z.string().url().optional().nullable(),
  og_title: z.string().max(200).optional().nullable(),
  og_description: z.string().max(500).optional().nullable(),
});

export const PostRelatedSchema = z.object({
  related_post_ids: z.array(z.string().uuid()).optional().nullable(),
});

// Schema completo para criar/atualizar post
export const CreatePostSchema = PostContentSchema.merge(PostSeoSchema).merge(PostPublicationSchema).merge(PostAuthorSchema).merge(PostImageSchema).merge(PostRelatedSchema);

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type PostContent = z.infer<typeof PostContentSchema>;
export type PostSeo = z.infer<typeof PostSeoSchema>;
export type PostPublication = z.infer<typeof PostPublicationSchema>;
export type PostAuthor = z.infer<typeof PostAuthorSchema>;
export type PostImage = z.infer<typeof PostImageSchema>;
export type PostRelated = z.infer<typeof PostRelatedSchema>;
