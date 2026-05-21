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

function countText(value: string | undefined) {
  return value?.trim().length ?? 0;
}

export function SeoTab({ formData, onChange }: SeoTabProps) {
  const metaTitleLength = countText(formData.seo_meta_title);
  const metaDescriptionLength = countText(formData.seo_meta_description);
  const ogTitleLength = countText(formData.og_title);
  const ogDescriptionLength = countText(formData.og_description);
  const titleLength = countText(formData.title);
  const summaryLength = countText(formData.summary);

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
          {metaTitleLength}/60 caracteres recomendados. Acima disso pode cortar no Google.
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
          {metaDescriptionLength} caracteres — ideal entre 120 e 160.
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
          Use noindex apenas quando este post não deve aparecer nos buscadores.
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

      <div className="rounded border border-border/70 bg-rc2-sand/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
        <p>Título do post: {titleLength} caracteres (ideal 35–70).</p>
        <p>Resumo: {summaryLength} caracteres (ideal 120–220).</p>
        <p>OG title: {ogTitleLength}/200 caracteres.</p>
        <p>OG description: {ogDescriptionLength}/500 caracteres.</p>
      </div>
    </div>
  );
}
