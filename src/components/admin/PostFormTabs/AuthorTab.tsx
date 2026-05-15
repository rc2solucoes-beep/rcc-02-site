"use client";

interface FormData {
  [key: string]: string;
}

interface AuthorTabProps {
  formData: FormData;
  onChange: (field: string, value: string) => void;
}

const inputBase = "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors";

export function AuthorTab({ formData, onChange }: AuthorTabProps) {
  return (
    <div className="space-y-6">
      {/* Autor */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="author_name">
          Nome do Autor
        </label>
        <input
          id="author_name"
          name="author_name"
          type="text"
          value={formData.author_name}
          onChange={(e) => onChange("author_name", e.target.value)}
          className={inputBase}
          placeholder="Nome completo do autor"
        />
      </div>

      {/* Cargo do Autor */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="author_title">
          Cargo do Autor
        </label>
        <input
          id="author_title"
          name="author_title"
          type="text"
          value={formData.author_title}
          onChange={(e) => onChange("author_title", e.target.value)}
          className={inputBase}
          placeholder="Ex: Especialista em RPA, Consultor de Automação"
        />
      </div>

      {/* Foto do Autor (URL) */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="author_photo">
          Foto do Autor (URL)
        </label>
        <input
          id="author_photo"
          name="author_photo"
          type="url"
          value={formData.author_photo}
          onChange={(e) => onChange("author_photo", e.target.value)}
          className={inputBase}
          placeholder="https://..."
        />
        {formData.author_photo && (
          <div className="mt-2">
            <img
              src={formData.author_photo}
              alt={formData.author_name || "Autor"}
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Mini Bio */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="author_bio">
          Mini Bio
        </label>
        <textarea
          id="author_bio"
          name="author_bio"
          rows={3}
          value={formData.author_bio}
          onChange={(e) => onChange("author_bio", e.target.value)}
          className={`${inputBase} resize-none`}
          placeholder="Breve biografia do autor (máx 500 caracteres)"
          maxLength={500}
        />
        <p className="text-xs text-rc2-ebony/50 mt-1">Máximo 500 caracteres</p>
      </div>

      {/* LinkedIn */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="author_linkedin">
          LinkedIn (URL)
        </label>
        <input
          id="author_linkedin"
          name="author_linkedin"
          type="url"
          value={formData.author_linkedin}
          onChange={(e) => onChange("author_linkedin", e.target.value)}
          className={inputBase}
          placeholder="https://linkedin.com/in/..."
        />
      </div>

      {/* Author ID (hidden) */}
      <input
        id="author_id"
        name="author_id"
        type="hidden"
        value={formData.author_id}
        onChange={(e) => onChange("author_id", e.target.value)}
      />

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-sm text-blue-900">
          💡 Preencha estes campos para exibir o autor do artigo na página pública, aumentando a confiança e autoridade do conteúdo.
        </p>
      </div>
    </div>
  );
}
