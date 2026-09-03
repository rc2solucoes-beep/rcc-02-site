"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { PostContentEditor } from "@/components/admin/PostContentEditor";
import { SeoTab } from "@/components/admin/PostFormTabs/SeoTab";
import { PublicationTab } from "@/components/admin/PostFormTabs/PublicationTab";
import { AuthorTab } from "@/components/admin/PostFormTabs/AuthorTab";
import { ImageTab } from "@/components/admin/PostFormTabs/ImageTab";
import { RelatedTab } from "@/components/admin/PostFormTabs/RelatedTab";
import { FaqTab } from "@/components/admin/PostFormTabs/FaqTab";
import { CtaTab } from "@/components/admin/PostFormTabs/CtaTab";
import type { Author } from "@/lib/types/author";
import type { Post, FaqItem, CtaBlock } from "@/lib/types/post";
import type { PostFormState } from "@/app/admin/(protected)/posts/actions";
import { slugify } from "@/lib/utils";
import { utcIsoToSaoPauloInput } from "@/lib/datetime";

interface PostFormProps {
  authors: Author[];
  post?: Post;
  action: (prevState: PostFormState, formData: FormData) => Promise<PostFormState>;
}

const initialState: PostFormState = {};

const inputBase = "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors";

type TabKey = "conteudo" | "seo" | "publicacao" | "autor" | "imagem" | "relacionados" | "faq" | "cta";

interface PostFormData {
  [key: string]: string;
  // Conteúdo
  title: string;
  slug: string;
  summary: string;
  content: string;
  // SEO
  seo_keyword_primary: string;
  seo_keyword_secondary: string;
  seo_meta_title: string;
  seo_meta_description: string;
  seo_index_status: string;
  // Publicação
  category: string;
  tags: string;
  content_type: string;
  status: string;
  published_at: string;
  updated_at: string;
  scheduled_publish_at: string;
  reading_time_minutes: string;
  // Autor
  author_id: string;
  author_name: string;
  author_title: string;
  author_photo: string;
  author_bio: string;
  author_linkedin: string;
  sync_author_global: string;
  // Imagem
  cover_url: string;
  cover_url_alt: string;
  cover_url_caption: string;
  og_image: string;
  og_title: string;
  og_description: string;
  // Relacionamento
  related_post_ids: string;
}

function getEditorialWarnings(
  formData: PostFormData,
  faqItems: FaqItem[],
  ctaBlock: CtaBlock | null
): string[] {
  const warnings: string[] = [];
  const isPublished = formData.status === "published";
  const titleLength = formData.title.trim().length;
  const summaryLength = formData.summary.trim().length;
  const slug = formData.slug.trim();
  const isValidSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const metaTitleLength = formData.seo_meta_title.trim().length;
  const metaDescriptionLength = formData.seo_meta_description.trim().length;
  const hasCoverImage = formData.cover_url.trim().length > 0;
  const hasAltText = formData.cover_url_alt.trim().length > 0;
  const hasPrimaryKeyword = formData.seo_keyword_primary.trim().length > 0;
  const hasCtaBlock = !!ctaBlock?.title?.trim();
  const validFaqCount = faqItems.filter(
    (item) => item.question.trim() && item.answer.trim()
  ).length;
  const relatedCount = formData.related_post_ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean).length;
  const isLongForm = formData.content_type === "guia" || formData.content_type === "tutorial";

  if (slug && !isValidSlug) {
    warnings.push("Slug fora do padrão recomendado: use minúsculas, números e hífens simples.");
  }
  if (titleLength > 0 && (titleLength < 35 || titleLength > 70)) {
    warnings.push("Título do post ideal entre 35 e 70 caracteres para SEO.");
  }
  if (summaryLength > 0 && (summaryLength < 120 || summaryLength > 220)) {
    warnings.push("Resumo ideal entre 120 e 220 caracteres para card e contexto de busca.");
  }
  if (metaTitleLength > 0 && metaTitleLength > 60) {
    warnings.push("Meta title acima de 60 caracteres pode reduzir performance nos resultados.");
  }
  if (metaDescriptionLength > 0 && (metaDescriptionLength < 120 || metaDescriptionLength > 160)) {
    warnings.push("Meta description ideal entre 120 e 160 caracteres.");
  }
  if (hasCoverImage && !hasAltText) {
    warnings.push("Imagem de capa com ALT vazio reduz acessibilidade e SEO de imagem.");
  }
  if (isLongForm && validFaqCount > 0 && validFaqCount < 3) {
    warnings.push("Guias e tutoriais têm melhor resultado com pelo menos 3 FAQs úteis.");
  }
  if (relatedCount > 0 && relatedCount < 2) {
    warnings.push("Considere incluir ao menos 2 posts relacionados para fortalecer interlinking.");
  }

  if (isPublished) {
    if (!hasPrimaryKeyword) {
      warnings.push("Post publicado sem palavra-chave primária preenchida.");
    }
    if (!formData.seo_meta_title.trim()) {
      warnings.push("Post publicado sem meta title definido.");
    }
    if (!formData.seo_meta_description.trim()) {
      warnings.push("Post publicado sem meta description definida.");
    }
    if (!hasAltText && hasCoverImage) {
      warnings.push("Post publicado com imagem de capa sem ALT text.");
    }
    if (isLongForm && validFaqCount < 3) {
      warnings.push("Para guia/tutorial publicado, considere pelo menos 3 FAQs úteis.");
    }
    if (!hasCtaBlock) {
      warnings.push("Post publicado sem CTA configurado.");
    }
    if (relatedCount === 0) {
      warnings.push("Post publicado sem relacionados. Considere adicionar links internos.");
    }
  }

  return warnings;
}

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msgs[0]}</p>;
}

// Mapeia cada campo validado para a aba onde ele aparece e um rótulo legível,
// para que erros de validação sejam sempre visíveis — mesmo quando o campo com
// erro está numa aba que não está ativa.
const FIELD_LOCATION: Record<string, { tab: TabKey; label: string }> = {
  title: { tab: "conteudo", label: "Título" },
  slug: { tab: "conteudo", label: "Slug" },
  summary: { tab: "conteudo", label: "Resumo" },
  content: { tab: "conteudo", label: "Conteúdo do artigo" },
  seo_keyword_primary: { tab: "seo", label: "Palavra-chave primária" },
  seo_keyword_secondary: { tab: "seo", label: "Palavras-chave secundárias" },
  seo_meta_title: { tab: "seo", label: "Meta title" },
  seo_meta_description: { tab: "seo", label: "Meta description" },
  seo_index_status: { tab: "seo", label: "Status de indexação" },
  category: { tab: "publicacao", label: "Categoria" },
  tags: { tab: "publicacao", label: "Tags" },
  content_type: { tab: "publicacao", label: "Tipo de conteúdo" },
  status: { tab: "publicacao", label: "Status" },
  published_at: { tab: "publicacao", label: "Data de publicação" },
  updated_at: { tab: "publicacao", label: "Data de atualização" },
  scheduled_publish_at: { tab: "publicacao", label: "Agendamento de publicação" },
  reading_time_minutes: { tab: "publicacao", label: "Tempo de leitura" },
  author_id: { tab: "autor", label: "Autor" },
  author_name: { tab: "autor", label: "Nome do autor" },
  author_title: { tab: "autor", label: "Cargo do autor" },
  author_photo: { tab: "autor", label: "Foto do autor" },
  author_bio: { tab: "autor", label: "Bio do autor" },
  author_linkedin: { tab: "autor", label: "LinkedIn do autor" },
  cover_url: { tab: "imagem", label: "URL da imagem de capa" },
  cover_url_alt: { tab: "imagem", label: "ALT da imagem de capa" },
  cover_url_caption: { tab: "imagem", label: "Legenda da imagem de capa" },
  og_image: { tab: "imagem", label: "Imagem Open Graph" },
  og_title: { tab: "imagem", label: "Título Open Graph" },
  og_description: { tab: "imagem", label: "Descrição Open Graph" },
  related_post_ids: { tab: "relacionados", label: "Posts relacionados" },
  faq_items: { tab: "faq", label: "FAQ" },
  cta_block: { tab: "cta", label: "CTA" },
};

const TAB_LABEL: Record<TabKey, string> = {
  conteudo: "Conteúdo",
  seo: "SEO",
  publicacao: "Publicação",
  autor: "Autor",
  imagem: "Imagem & Social",
  relacionados: "Posts Relacionados",
  faq: "FAQ",
  cta: "CTA",
};

export function PostFormRefactored({ authors, post, action }: PostFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [activeTab, setActiveTab] = useState<TabKey>("conteudo");

  // Estado consolidado de todos os campos
  const [formData, setFormData] = useState<PostFormData>({
    // Conteúdo
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    summary: post?.summary ?? "",
    content: post?.content ?? "",
    // SEO
    seo_keyword_primary: post?.seo_keyword_primary ?? "",
    seo_keyword_secondary: post?.seo_keyword_secondary?.join(", ") ?? "",
    seo_meta_title: post?.seo_meta_title ?? "",
    seo_meta_description: post?.seo_meta_description ?? "",
    seo_index_status: post?.seo_index_status ?? "index",
    // Publicação
    category: post?.category ?? "",
    tags: post?.tags?.join(", ") ?? "",
    content_type: post?.content_type ?? "",
    status: post?.status ?? "draft",
    published_at: post?.published_at ? utcIsoToSaoPauloInput(post.published_at) : "",
    updated_at: post?.updated_at ? utcIsoToSaoPauloInput(post.updated_at) : "",
    scheduled_publish_at: post?.scheduled_publish_at ? utcIsoToSaoPauloInput(post.scheduled_publish_at) : "",
    reading_time_minutes: post?.reading_time_minutes?.toString() ?? "",
    // Autor
    author_id: post?.author_id ?? "",
    author_name: post?.author_name ?? "",
    author_title: post?.author_title ?? "",
    author_photo: post?.author_photo ?? "",
    author_bio: post?.author_bio ?? "",
    author_linkedin: post?.author_linkedin ?? "",
    sync_author_global: "false",
    // Imagem
    cover_url: post?.cover_url ?? "",
    cover_url_alt: post?.cover_url_alt ?? "",
    cover_url_caption: post?.cover_url_caption ?? "",
    og_image: post?.og_image ?? "",
    og_title: post?.og_title ?? "",
    og_description: post?.og_description ?? "",
    // Relacionamento
    related_post_ids: post?.related_post_ids?.join(",") ?? "",
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!post);

  // FAQ items — gerenciado separadamente por ser estrutura complexa
  const [faqItems, setFaqItems] = useState<FaqItem[]>(() => {
    const raw = post?.faq_items;
    if (!raw) return [];
    // post.faq_items pode vir como string JSON (sanitização do servidor)
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return []; }
    }
    if (Array.isArray(raw)) {
      return raw.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item
      );
    }
    return [];
  });

  // CTA block — gerenciado separadamente por ser estrutura complexa
  const [ctaBlock, setCtaBlock] = useState<CtaBlock | null>(() => {
    const raw = post?.cta_block;
    if (!raw) return null;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return raw as CtaBlock;
  });

  // Handler para atualizar qualquer campo
  const handleFieldChange = (field: keyof PostFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handler especial para título (auto-gera slug)
  const handleTitleChange = (value: string) => {
    handleFieldChange("title", value);
    if (!slugManuallyEdited) {
      handleFieldChange("slug", slugify(value));
    }
  };

  // Wrapper do formAction que popula FormData no FormData
  const handleSubmit = async () => {
    const fd = new FormData();
    // Popula FormData com os valores do estado
    Object.entries(formData).forEach(([key, value]) => {
      fd.append(key, value);
    });
    // FAQ: serializa como JSON, filtrando itens sem conteúdo
    const validFaqItems = faqItems.filter(
      (item) => item.question.trim() && item.answer.trim()
    );
    fd.append("faq_items", JSON.stringify(validFaqItems.length ? validFaqItems : null));
    // CTA: serializa como JSON
    fd.append("cta_block", JSON.stringify(ctaBlock ?? null));
    return formAction(fd);
  };

  const tabs = [
    { key: "conteudo" as TabKey, label: "Conteúdo" },
    { key: "seo" as TabKey, label: "SEO" },
    { key: "publicacao" as TabKey, label: "Publicação" },
    { key: "autor" as TabKey, label: "Autor" },
    { key: "imagem" as TabKey, label: "Imagem & Social" },
    { key: "relacionados" as TabKey, label: "Posts Relacionados" },
    { key: "faq" as TabKey, label: faqItems.length > 0 ? `FAQ (${faqItems.length})` : "FAQ" },
    { key: "cta" as TabKey, label: ctaBlock ? "CTA ✓" : "CTA" },
  ];
  const editorialWarnings = getEditorialWarnings(formData, faqItems, ctaBlock);

  const errorEntries = Object.entries(state.errors ?? {}).filter(
    ([, msgs]) => Array.isArray(msgs) && msgs.length > 0
  );

  return (
    <form action={handleSubmit} className="p-8 space-y-6 max-w-5xl">
      {state.message && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded">
          {state.message}
        </p>
      )}

      {errorEntries.length > 0 && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">
            Não foi possível salvar. Corrija os campos abaixo:
          </p>
          <ul className="mt-2 list-disc pl-5 text-xs text-red-800/90 space-y-1">
            {errorEntries.map(([field, msgs]) => {
              const location = FIELD_LOCATION[field];
              const label = location?.label ?? field;
              const tabLabel = location ? TAB_LABEL[location.tab] : null;
              return (
                <li key={field}>
                  {location ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab(location.tab)}
                      className="text-left underline hover:text-red-900"
                    >
                      {tabLabel ? `${tabLabel} — ` : ""}
                      {label}: {msgs[0]}
                    </button>
                  ) : (
                    <span>
                      {label}: {msgs[0]}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {editorialWarnings.length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            Recomendações editoriais de SEO
          </p>
          <ul className="mt-2 list-disc pl-5 text-xs text-amber-900/90 space-y-1">
            {editorialWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-900/80">
            Esses alertas não bloqueiam rascunhos nem publicação.
          </p>
        </div>
      )}

      {/* Abas de Navegação */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-rc2-orange text-rc2-orange"
                  : "border-transparent text-rc2-ebony/60 hover:text-rc2-ebony"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div className="bg-white rounded p-6 border border-border/50">
        {activeTab === "conteudo" && (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="title">
                Título
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={inputBase}
                placeholder="Título do post"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.title.trim().length} caracteres — ideal entre 35 e 70 para SEO editorial.
              </p>
              <FieldError errors={state.errors} field="title" />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="slug">
                Slug
              </label>
              <div className="flex items-center gap-0">
                <span className="border border-r-0 border-border bg-zinc-100 px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                  /blog/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => {
                    handleFieldChange("slug", e.target.value);
                    setSlugManuallyEdited(true);
                  }}
                  className={`${inputBase} flex-1`}
                  placeholder="meu-post"
                />
              </div>
              <FieldError errors={state.errors} field="slug" />
              <p className="text-xs text-muted-foreground mt-1">
                Use versão curta, sem acentos, em minúsculas e com hífens.
              </p>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="summary">
                Resumo
              </label>
              <textarea
                id="summary"
                name="summary"
                required
                rows={2}
                value={formData.summary}
                onChange={(e) => handleFieldChange("summary", e.target.value)}
                className={`${inputBase} resize-none`}
                placeholder="Breve descrição para listagem do blog"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este resumo aparece no card do blog, não confundir com meta description
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.summary.trim().length} caracteres — ideal entre 120 e 220.
              </p>
              <FieldError errors={state.errors} field="summary" />
            </div>

            <PostContentEditor
              content={formData.content}
              onChange={(html) => handleFieldChange("content", html)}
              error={state.errors?.content?.[0]}
            />
          </div>
        )}

        {activeTab === "seo" && <SeoTab formData={formData} onChange={handleFieldChange} />}
        {activeTab === "publicacao" && <PublicationTab formData={formData} onChange={handleFieldChange} />}
        {activeTab === "autor" && (
          <AuthorTab
            authors={authors}
            formData={formData}
            onChange={handleFieldChange}
          />
        )}
        {activeTab === "imagem" && <ImageTab formData={formData} onChange={handleFieldChange} />}
        {activeTab === "relacionados" && <RelatedTab formData={formData} onChange={handleFieldChange} currentPostId={post?.id} />}
        {activeTab === "faq" && (
          <FaqTab faqItems={faqItems} onChange={setFaqItems} />
        )}
        {activeTab === "cta" && (
          <CtaTab ctaBlock={ctaBlock} onChange={setCtaBlock} />
        )}
      </div>

      {/* Ações do Formulário */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/posts"
          className="text-sm text-rc2-orange hover:text-rc2-orange/80 underline"
        >
          ← Voltar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-rc2-orange text-rc2-heading text-sm font-medium rounded hover:bg-rc2-orange/90 disabled:opacity-50 transition-colors"
        >
          {pending ? "Salvando..." : post ? "Atualizar Post" : "Criar Post"}
        </button>
      </div>
    </form>
  );
}
