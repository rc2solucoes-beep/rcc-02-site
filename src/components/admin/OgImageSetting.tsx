"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";

const inputBase =
  "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors rounded";

interface OgImageSettingProps {
  defaultValue?: string;
}

export function OgImageSetting({ defaultValue = "" }: OgImageSettingProps) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}&folder=og`,
        {
          method: "POST",
          body: file,
          headers: { "Content-Type": file.type },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro no upload");
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden input — lido pelo Server Action ao submeter o form */}
      <input type="hidden" name="og_image_url" value={url} />

      {/* URL + botão de upload */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://... ou faça upload →"
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
            e.target.value = "";
          }}
        />
      </div>

      {/* Erro de upload */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <X size={12} />
          {error}
        </div>
      )}

      {/* Preview */}
      {url && (
        <div className="rounded border border-border overflow-hidden bg-rc2-ebony/5 relative group max-w-sm">
          <img
            src={url}
            alt="Preview OG Image"
            className="w-full aspect-[1.91/1] object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remover imagem"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <p className="text-xs text-[#5A4E42]">
        Ideal: 1200×630 px · proporção 1.91:1 · JPEG, PNG ou WebP · Máx 10 MB
      </p>
    </div>
  );
}
