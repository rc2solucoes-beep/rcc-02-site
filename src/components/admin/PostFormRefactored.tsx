"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { RichEditor } from "@/components/admin/RichEditor";
import { SeoTab } from "@/components/admin/PostFormTabs/SeoTab";
import { PublicationTab } from "@/components/admin/PostFormTabs/PublicationTab";
import { AuthorTab } from "@/components/admin/PostFormTabs/AuthorTab";
import { ImageTab } from "@/components/admin/PostFormTabs/ImageTab";
import { RelatedTab } from "@/components/admin/PostFormTabs/RelatedTab";
import { FaqTab } from "@/components/admin/PostFormTabs/FaqTab";
import { CtaTab } from "@/components/admin/PostFormTabs/CtaTab";
import type { Post, FaqItem, CtaBlock } from "@/lib/types/post";
import type { PostFormState } from "@/app/admin/(protected)/posts/actions";
import { slugify } from "@/lib/utils";

interface PostFormProps {
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

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msgs[0]}</p>;
}

export function PostFormRefactored({ post, action }: PostFormProps) {
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
    published_at: post?.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : "",
    updated_at: post?.updated_at ? new Date(post.updated_at).toISOString().slice(0, 16) : "",
    scheduled_publish_at: post?.scheduled_publish_at ? new Date(post.scheduled_publish_at).toISOString().slice(0, 16) : "",
    reading_time_minutes: post?.reading_time_minutes?.toString() ?? "",
    // Autor
    author_id: post?.author_id ?? "",
    author_name: post?.author_name ?? "",
    author_title: post?.author_title ?? "",
    author_photo: post?.author_photo ?? "",
    author_bio: post?.author_bio ?? "",
    author_linkedin: post?.author_linkedin ?? "",
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
  const handleSubmit = async (formDataSubmit: FormData) => {
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

  return (
    <form action={handleSubmit} className="p-8 space-y-6 max-w-5xl">
      {state.message && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded">
          {state.message}
        </p>
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
              <FieldError errors={state.errors} field="summary" />
            </div>

            {/* Rich Editor */}
            <div>
              <label className="block text-sm font-medium text-rc2-ebony mb-1.5">Conteúdo do Artigo</label>
              <RichEditor
                content={formData.content}
                onChange={(html) => handleFieldChange("content", html)}
              />
              <FieldError errors={state.errors} field="content" />
            </div>
          </div>
        )}

        {activeTab === "seo" && <SeoTab formData={formData} onChange={handleFieldChange} />}
        {activeTab === "publicacao" && <PublicationTab formData={formData} onChange={handleFieldChange} />}
        {activeTab === "autor" && <AuthorTab formData={formData} onChange={handleFieldChange} />}
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
          className="px-6 py-2.5 bg-rc2-orange text-white text-sm font-medium rounded hover:bg-rc2-orange/90 disabled:opacity-50 transition-colors"
        >
          {pending ? "Salvando..." : post ? "Atualizar Post" : "Criar Post"}
        </button>
      </div>
    </form>
  );
}
