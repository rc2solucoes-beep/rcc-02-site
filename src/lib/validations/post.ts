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

const SlugSchema = z
  .string()
  .min(1, "Slug é obrigatório")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use apenas letras minúsculas, números e hífens. Não use acentos, espaços ou caracteres especiais."
  );

// Inputs <input type="datetime-local"> emitem "YYYY-MM-DDTHH:mm" (sem segundos
// nem fuso), formato que z.string().datetime() rejeita. Coagimos para ISO 8601
// completo antes da validação, preservando null/valores já em ISO.
function datetimeLocalOptional() {
  return z.preprocess((value) => {
    if (typeof value !== "string" || value.trim() === "") return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }, z.string().datetime());
}

export const PostContentSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  slug: SlugSchema,
  summary: z.string().max(500),
  content: z.string(),
});

export const PostSeoSchema = z.object({
  seo_keyword_primary: z.string().optional().nullable(),
  seo_keyword_secondary: z.array(z.string()).optional().nullable(),
  seo_meta_title: z.string().optional().nullable(),
  seo_meta_description: z.string().optional().nullable(),
  seo_index_status: SeoIndexStatusEnum.default("index"),
});

export const PostPublicationSchema = z.object({
  category: PostCategoryEnum.optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  content_type: ContentTypeEnum.optional().nullable(),
  status: PostStatusEnum.default("draft"),
  published_at: datetimeLocalOptional().optional().nullable(),
  updated_at: datetimeLocalOptional().optional(),
  scheduled_publish_at: datetimeLocalOptional().optional().nullable(),
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

export const FaqItemSchema = z.object({
  question: z.string().min(1, "Pergunta é obrigatória"),
  answer: z.string().min(1, "Resposta é obrigatória"),
});

export const CtaButtonSchema = z.object({
  text: z.string().min(1),
  url: z.string().min(1),
});

export const CtaBlockSchema = z.object({
  type: z.enum(["service", "contact", "next_steps"]),
  title: z.string().min(1, "Título do CTA é obrigatório"),
  description: z.string().optional(),
  primaryButton: CtaButtonSchema.optional(),
  secondaryButton: CtaButtonSchema.optional(),
  items: z.array(z.string()).optional(),
});

export const PostFaqSchema = z.object({
  faq_items: z.array(FaqItemSchema).optional().nullable(),
  cta_block: CtaBlockSchema.optional().nullable(),
});

// Schema completo para criar/atualizar post
export const CreatePostSchema = PostContentSchema.merge(PostSeoSchema).merge(PostPublicationSchema).merge(PostAuthorSchema).merge(PostImageSchema).merge(PostRelatedSchema).merge(PostFaqSchema);

export const PublishedPostSchema = CreatePostSchema.superRefine((post, ctx) => {
  if (post.title.trim().length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["title"],
      message: "Título deve ter pelo menos 3 caracteres",
    });
  }

  if (post.summary.trim().length < 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["summary"],
      message: "Resumo deve ter pelo menos 10 caracteres",
    });
  }

  if (post.content.trim().length < 20) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["content"],
      message: "Conteúdo deve ter pelo menos 20 caracteres",
    });
  }

  if (post.seo_meta_title && post.seo_meta_title.trim().length > 60) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["seo_meta_title"],
      message: "Meta title: máx 60 caracteres",
    });
  }

  if (post.seo_meta_description && post.seo_meta_description.trim().length > 160) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["seo_meta_description"],
      message: "Meta description: máx 160 caracteres",
    });
  }
});

export function validatePostInputByStatus(input: unknown) {
  const baseParsed = CreatePostSchema.safeParse(input);
  if (!baseParsed.success) {
    return baseParsed;
  }

  const post = baseParsed.data;
  if (post.status === "draft") {
    return baseParsed;
  }

  return PublishedPostSchema.safeParse(post);
}

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type PostContent = z.infer<typeof PostContentSchema>;
export type PostSeo = z.infer<typeof PostSeoSchema>;
export type PostPublication = z.infer<typeof PostPublicationSchema>;
export type PostAuthor = z.infer<typeof PostAuthorSchema>;
export type PostImage = z.infer<typeof PostImageSchema>;
export type PostRelated = z.infer<typeof PostRelatedSchema>;
