"use client";

interface SeoPreviewCardProps {
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
}

export function SeoPreviewCard({ metaTitle, metaDescription, slug }: SeoPreviewCardProps) {
  const title = metaTitle || "Seu título aparecerá aqui";
  const description = metaDescription || "Sua descrição aparecerá aqui";
  const url = slug ? `/blog/${slug}` : "/blog/seu-slug";

  return (
    <div className="bg-white border border-border rounded p-4 space-y-3">
      <p className="text-xs font-medium text-rc2-ebony/60 uppercase">Preview do Google</p>

      <div className="bg-zinc-50 p-3 space-y-1.5 rounded border border-zinc-200">
        {/* URL */}
        <p className="text-xs text-green-700 truncate">
          rc2-solucoes.com.br {url}
        </p>

        {/* Título */}
        <p className="text-sm font-medium text-blue-800 leading-snug line-clamp-2">
          {title.length > 60 ? `${title.substring(0, 60)}...` : title}
        </p>

        {/* Descrição */}
        <p className="text-sm text-zinc-600 leading-snug line-clamp-3">
          {description.length > 160 ? `${description.substring(0, 160)}...` : description}
        </p>
      </div>

      {/* Indicadores */}
      <div className="flex gap-4 text-xs text-rc2-ebony/60">
        <div>
          <p className="font-medium">Meta Title</p>
          <p className="text-rc2-ebony/40">
            {metaTitle?.length ?? 0}/60
            {metaTitle && metaTitle.length > 60 && <span className="text-red-600 ml-1">⚠️ Muito longo</span>}
          </p>
        </div>
        <div>
          <p className="font-medium">Meta Description</p>
          <p className="text-rc2-ebony/40">
            {metaDescription?.length ?? 0}/160
            {metaDescription && metaDescription.length > 160 && <span className="text-red-600 ml-1">⚠️ Muito longo</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
