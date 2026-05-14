"use client";

interface FormData {
  [key: string]: string;
}

interface ImageTabProps {
  formData: FormData;
  onChange: (field: string, value: string) => void;
}

const inputBase = "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-ebony/40 outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors";

export function ImageTab({ formData, onChange }: ImageTabProps) {
  return (
    <div className="space-y-6">
      {/* Cover URL */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="cover_url">
          URL da Imagem de Capa
        </label>
        <input
          id="cover_url"
          name="cover_url"
          type="url"
          value={formData.cover_url}
          onChange={(e) => onChange("cover_url", e.target.value)}
          className={inputBase}
          placeholder="https://..."
        />
        {formData.cover_url && (
          <div className="mt-3">
            <img
              src={formData.cover_url}
              alt={formData.cover_url_alt || "Imagem de capa"}
              className="w-full h-40 object-cover rounded border border-border"
            />
          </div>
        )}
        <p className="text-xs text-rc2-ebony/50 mt-1">
          Para upload em breve: Vercel Blob
        </p>
      </div>

      {/* Cover Alt Text */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="cover_url_alt">
          Alt Text da Imagem
        </label>
        <input
          id="cover_url_alt"
          name="cover_url_alt"
          type="text"
          maxLength={255}
          value={formData.cover_url_alt}
          onChange={(e) => onChange("cover_url_alt", e.target.value)}
          className={inputBase}
          placeholder="Descrição da imagem para acessibilidade e SEO"
        />
        <p className="text-xs text-rc2-ebony/50 mt-1">
          Importante para acessibilidade (a11y) e SEO
        </p>
      </div>

      {/* Cover Caption */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="cover_url_caption">
          Legenda da Imagem
        </label>
        <input
          id="cover_url_caption"
          name="cover_url_caption"
          type="text"
          value={formData.cover_url_caption}
          onChange={(e) => onChange("cover_url_caption", e.target.value)}
          className={inputBase}
          placeholder="Crédito ou fonte da imagem"
        />
      </div>

      {/* Divisor */}
      <hr className="border-border" />

      {/* OG Image */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="og_image">
          Imagem Open Graph (Compartilhamento)
        </label>
        <input
          id="og_image"
          name="og_image"
          type="url"
          value={formData.og_image}
          onChange={(e) => onChange("og_image", e.target.value)}
          className={inputBase}
          placeholder="https://... (ideal: 1200x630px)"
        />
        <p className="text-xs text-rc2-ebony/50 mt-1">
          Imagem usada ao compartilhar no LinkedIn, WhatsApp, X. Se vazio, usa cover_url.
        </p>
      </div>

      {/* OG Title */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="og_title">
          Título Open Graph
        </label>
        <input
          id="og_title"
          name="og_title"
          type="text"
          maxLength={200}
          value={formData.og_title}
          onChange={(e) => onChange("og_title", e.target.value)}
          className={inputBase}
          placeholder="Deixe vazio para usar meta_title"
        />
      </div>

      {/* OG Description */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="og_description">
          Descrição Open Graph
        </label>
        <textarea
          id="og_description"
          name="og_description"
          rows={2}
          maxLength={500}
          value={formData.og_description}
          onChange={(e) => onChange("og_description", e.target.value)}
          className={`${inputBase} resize-none`}
          placeholder="Deixe vazio para usar meta_description"
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-sm text-blue-900">
          💡 <strong>Open Graph</strong> controla como seu artigo aparece ao ser compartilhado em redes sociais. Deixe vazio para usar valores de SEO automaticamente.
        </p>
      </div>
    </div>
  );
}
