"use client";

import { SeoPreviewCard } from "@/components/admin/SeoPreviewCard";

interface FormData {
  [key: string]: string;
}

interface SeoTabProps {
  formData: FormData;
  onChange: (field: string, value: string) => void;
}

const inputBase = "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors";

export function SeoTab({ formData, onChange }: SeoTabProps) {
  return (
    <div className="space-y-6">
      {/* Preview Google */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-3">Preview nos resultados de busca</label>
        <SeoPreviewCard
          metaTitle={formData.seo_meta_title}
          metaDescription={formData.seo_meta_description}
          slug={formData.slug}
        />
      </div>

      {/* Palavra-chave principal */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="seo_keyword_primary">
          Palavra-chave principal
        </label>
        <input
          id="seo_keyword_primary"
          name="seo_keyword_primary"
          type="text"
          maxLength={60}
          value={formData.seo_keyword_primary}
          onChange={(e) => onChange("seo_keyword_primary", e.target.value)}
          className={inputBase}
          placeholder="Ex: automação de processos"
        />
        <p className="text-xs text-muted-foreground mt-1">
          A palavra-chave mais importante para o seu artigo (máx 60 caracteres)
        </p>
      </div>

      {/* Meta Title */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="seo_meta_title">
          Meta Title
        </label>
        <input
          id="seo_meta_title"
          name="seo_meta_title"
          type="text"
          maxLength={60}
          value={formData.seo_meta_title}
          onChange={(e) => onChange("seo_meta_title", e.target.value)}
          className={inputBase}
          placeholder="Título para os motores de busca"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Aparece como título nos resultados do Google (máx 60 caracteres)
        </p>
      </div>

      {/* Meta Description */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="seo_meta_description">
          Meta Description
        </label>
        <textarea
          id="seo_meta_description"
          name="seo_meta_description"
          rows={2}
          maxLength={160}
          value={formData.seo_meta_description}
          onChange={(e) => onChange("seo_meta_description", e.target.value)}
          className={`${inputBase} resize-none`}
          placeholder="Descrição que aparece nos resultados de busca"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Aparece como descrição nos resultados do Google (máx 160 caracteres)
        </p>
      </div>

      {/* Index Status */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="seo_index_status">
          Status de Indexação
        </label>
        <select
          id="seo_index_status"
          name="seo_index_status"
          value={formData.seo_index_status}
          onChange={(e) => onChange("seo_index_status", e.target.value)}
          className={inputBase}
        >
          <option value="index">Index (permitir indexação)</option>
          <option value="noindex">Noindex (não indexar)</option>
          <option value="nofollow">Nofollow (não seguir links)</option>
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Controla como os motores de busca tratam esta página
        </p>
      </div>

      {/* Palavras-chave secundárias */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="seo_keyword_secondary">
          Palavras-chave secundárias
        </label>
        <input
          id="seo_keyword_secondary"
          name="seo_keyword_secondary"
          type="text"
          value={formData.seo_keyword_secondary}
          onChange={(e) => onChange("seo_keyword_secondary", e.target.value)}
          className={inputBase}
          placeholder="Separadas por vírgula. Ex: RPA, otimização, processos"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Outras palavras-chave relacionadas (separadas por vírgula)
        </p>
      </div>
    </div>
  );
}
