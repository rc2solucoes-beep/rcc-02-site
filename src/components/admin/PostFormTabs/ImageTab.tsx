"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";

interface FormData {
  [key: string]: string;
}

interface ImageTabProps {
  formData: FormData;
  onChange: (field: string, value: string) => void;
}

const inputBase =
  "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-ebony/40 outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors rounded";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CharCount({ value, max }: { value: string; max: number }) {
  const len = (value ?? "").length;
  const pct = len / max;
  return (
    <span
      className={`text-xs tabular-nums ${
        pct > 0.9
          ? "text-red-500 font-medium"
          : pct > 0.75
          ? "text-yellow-600"
          : "text-rc2-ebony/35"
      }`}
    >
      {len}/{max}
    </span>
  );
}

function FallbackBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-rc2-ebony/50 bg-rc2-ebony/[0.06] px-2 py-0.5 rounded">
      Usa: <code className="font-mono text-rc2-ebony/65">{label}</code>
    </span>
  );
}

// ─── Upload field ──────────────────────────────────────────────────────────────

interface ImageFieldProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  folder?: string;
  hint?: React.ReactNode;
  fallback?: React.ReactNode;
  charCount?: { max: number };
  showPreviewThumb?: boolean;
  altValue?: string;
}

function ImageField({
  id,
  label,
  required,
  value,
  onChange,
  placeholder = "https://...",
  folder = "blog",
  hint,
  fallback,
  charCount,
  showPreviewThumb,
  altValue,
}: ImageFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}&folder=${folder}`,
        {
          method: "POST",
          body: file,
          headers: { "Content-Type": file.type },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro no upload");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-rc2-ebony" htmlFor={id}>
          {label}
          {required && <span className="text-rc2-orange ml-1 text-xs">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {fallback}
          {charCount && <CharCount value={value} max={charCount.max} />}
        </div>
      </div>

      {/* URL + botão de upload */}
      <div className="flex gap-2">
        <input
          id={id}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputBase} flex-1 min-w-0`}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Fazer upload de imagem"
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-border bg-white text-rc2-ebony/70 rounded hover:border-rc2-orange hover:text-rc2-orange transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Upload size={15} />
          )}
          <span className="hidden sm:inline">
            {uploading ? "Enviando…" : "Upload"}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = ""; // reset para permitir re-selecionar o mesmo arquivo
          }}
        />
      </div>

      {/* Erro de upload */}
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <X size={12} />
          {error}
        </div>
      )}

      {/* Preview thumbnail */}
      {showPreviewThumb && value && (
        <div className="mt-3 rounded-lg border border-border overflow-hidden bg-rc2-ebony/5 relative group">
          <img
            src={value}
            alt={altValue || label}
            className="w-full aspect-video object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remover imagem"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {hint && <p className="text-xs text-rc2-ebony/50 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Tab principal ─────────────────────────────────────────────────────────────

export function ImageTab({ formData, onChange }: ImageTabProps) {
  // Valores efetivos com fallback (para o preview de compartilhamento)
  const effectiveImage = formData.og_image || formData.cover_url || "";
  const effectiveTitle =
    formData.og_title || formData.seo_meta_title || formData.title || "";
  const effectiveDescription =
    formData.og_description ||
    formData.seo_meta_description ||
    formData.summary ||
    "";

  const showPreview = !!(effectiveImage || effectiveTitle);

  return (
    <div className="space-y-8">

      {/* ═══ Imagem de Capa ══════════════════════════════════════════ */}
      <section className="space-y-5">
        <div className="pb-1 border-b border-border">
          <h3 className="text-xs font-semibold text-rc2-ebony/50 uppercase tracking-widest">
            Imagem de Capa
          </h3>
          <p className="text-xs text-rc2-ebony/40 mt-0.5">
            Exibida no topo do artigo e nos cards do blog
          </p>
        </div>

        <ImageField
          id="cover_url"
          label="URL da Imagem"
          value={formData.cover_url}
          onChange={(v) => onChange("cover_url", v)}
          placeholder="https://... ou faça upload →"
          folder="blog/covers"
          showPreviewThumb
          altValue={formData.cover_url_alt}
          hint="Formatos aceitos: JPEG, PNG, WebP, GIF · Máx 10 MB"
        />

        {/* Alt Text */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-rc2-ebony" htmlFor="cover_url_alt">
              Alt Text <span className="text-rc2-orange text-xs">*</span>
            </label>
            <CharCount value={formData.cover_url_alt} max={255} />
          </div>
          <input
            id="cover_url_alt"
            type="text"
            maxLength={255}
            value={formData.cover_url_alt}
            onChange={(e) => onChange("cover_url_alt", e.target.value)}
            className={inputBase}
            placeholder="Descreva a imagem: o que está sendo mostrado?"
          />
          <p className="text-xs text-rc2-ebony/50 mt-1">
            Obrigatório para acessibilidade (WCAG) e indexação no Google Images
          </p>
        </div>

        {/* Legenda */}
        <div>
          <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="cover_url_caption">
            Legenda
          </label>
          <input
            id="cover_url_caption"
            type="text"
            value={formData.cover_url_caption}
            onChange={(e) => onChange("cover_url_caption", e.target.value)}
            className={inputBase}
            placeholder="Crédito ou fonte  (ex: Foto: Unsplash / Nome do fotógrafo)"
          />
        </div>
      </section>

      {/* ═══ Open Graph ══════════════════════════════════════════════ */}
      <section className="space-y-5">
        <div className="pb-1 border-b border-border">
          <h3 className="text-xs font-semibold text-rc2-ebony/50 uppercase tracking-widest">
            Open Graph — Compartilhamento
          </h3>
          <p className="text-xs text-rc2-ebony/40 mt-0.5">
            Como o artigo aparece ao ser compartilhado. Campos vazios usam os valores de SEO automaticamente.
          </p>
        </div>

        <ImageField
          id="og_image"
          label="Imagem OG"
          value={formData.og_image}
          onChange={(v) => onChange("og_image", v)}
          placeholder="https://... (ideal: 1200×630px, proporção 1.91:1)"
          folder="blog/og"
          fallback={
            !formData.og_image ? (
              <FallbackBadge label={formData.cover_url ? "cover_url" : "—"} />
            ) : undefined
          }
        />

        {/* OG Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-rc2-ebony" htmlFor="og_title">
              Título OG
            </label>
            <div className="flex items-center gap-2">
              {!formData.og_title && (
                <FallbackBadge
                  label={formData.seo_meta_title ? "seo_meta_title" : "title"}
                />
              )}
              <CharCount value={formData.og_title} max={200} />
            </div>
          </div>
          <input
            id="og_title"
            type="text"
            maxLength={200}
            value={formData.og_title}
            onChange={(e) => onChange("og_title", e.target.value)}
            className={inputBase}
            placeholder="Deixe vazio para usar o meta title"
          />
        </div>

        {/* OG Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-rc2-ebony" htmlFor="og_description">
              Descrição OG
            </label>
            <div className="flex items-center gap-2">
              {!formData.og_description && (
                <FallbackBadge
                  label={
                    formData.seo_meta_description ? "meta_description" : "summary"
                  }
                />
              )}
              <CharCount value={formData.og_description} max={500} />
            </div>
          </div>
          <textarea
            id="og_description"
            rows={2}
            maxLength={500}
            value={formData.og_description}
            onChange={(e) => onChange("og_description", e.target.value)}
            className={`${inputBase} resize-none`}
            placeholder="Deixe vazio para usar a meta description"
          />
        </div>

        {/* Preview de compartilhamento */}
        {showPreview && (
          <div>
            <p className="text-xs font-semibold text-rc2-ebony/50 uppercase tracking-widest mb-3">
              Preview de compartilhamento
            </p>
            <div className="bg-[#F0F2F5] rounded-xl p-5">
              <div className="bg-white rounded-lg overflow-hidden border border-black/10 shadow-sm max-w-sm">
                <div className="aspect-[1.91/1] bg-rc2-ebony/8 overflow-hidden">
                  {effectiveImage ? (
                    <img
                      src={effectiveImage}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-rc2-ebony/25">Sem imagem</span>
                    </div>
                  )}
                </div>
                <div className="px-3 pt-2.5 pb-3 border-t border-black/8">
                  <p className="text-[10px] text-[#65676B] uppercase tracking-wide mb-1 font-medium">
                    rc2solucoes.com.br
                  </p>
                  <p className="text-sm font-semibold text-[#1C1E21] leading-snug line-clamp-2">
                    {effectiveTitle || "Título do artigo"}
                  </p>
                  {effectiveDescription && (
                    <p className="text-xs text-[#65676B] mt-1 line-clamp-2 leading-snug">
                      {effectiveDescription}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-rc2-ebony/35 mt-2.5 text-center">
                Preview aproximado — LinkedIn / Facebook
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
