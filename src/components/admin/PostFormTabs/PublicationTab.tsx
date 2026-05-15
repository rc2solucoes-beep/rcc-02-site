"use client";

interface FormData {
  [key: string]: string;
}

interface PublicationTabProps {
  formData: FormData;
  onChange: (field: string, value: string) => void;
}

const inputBase = "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors";

const categories = [
  "Tecnologia",
  "Automação",
  "Gestão Empresarial",
  "Segurança",
  "Produtividade",
  "Transformação Digital",
  "Infraestrutura",
  "Sistemas e Processos",
];

const contentTypes = [
  { value: "artigo", label: "Artigo" },
  { value: "guia", label: "Guia" },
  { value: "tutorial", label: "Tutorial" },
  { value: "case", label: "Case" },
  { value: "notícia", label: "Notícia" },
];

export function PublicationTab({ formData, onChange }: PublicationTabProps) {
  return (
    <div className="space-y-6">
      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={(e) => onChange("status", e.target.value)}
          className={inputBase}
        >
          <option value="draft">Rascunho</option>
          <option value="scheduled">Agendado</option>
          <option value="published">Publicado</option>
        </select>
      </div>

      {/* Data de Publicação */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="published_at">
          Data de Publicação
        </label>
        <input
          id="published_at"
          name="published_at"
          type="datetime-local"
          value={formData.published_at}
          onChange={(e) => onChange("published_at", e.target.value)}
          className={inputBase}
        />
      </div>

      {/* Data de Atualização */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="updated_at">
          Data de Atualização
        </label>
        <input
          id="updated_at"
          name="updated_at"
          type="datetime-local"
          value={formData.updated_at}
          onChange={(e) => onChange("updated_at", e.target.value)}
          className={inputBase}
        />
        <p className="text-xs text-muted-foreground mt-1">Atualizada automaticamente ao salvar</p>
      </div>

      {/* Agendamento de Publicação */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="scheduled_publish_at">
          Agendar Publicação Para
        </label>
        <input
          id="scheduled_publish_at"
          name="scheduled_publish_at"
          type="datetime-local"
          value={formData.scheduled_publish_at}
          onChange={(e) => onChange("scheduled_publish_at", e.target.value)}
          className={inputBase}
        />
        <p className="text-xs text-muted-foreground mt-1">Deixe vazio para publicar manualmente</p>
      </div>

      {/* Categoria Principal */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="category">
          Categoria Principal
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={(e) => onChange("category", e.target.value)}
          className={inputBase}
        >
          <option value="">Selecione uma categoria</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Tipo de Conteúdo */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="content_type">
          Tipo de Conteúdo
        </label>
        <select
          id="content_type"
          name="content_type"
          value={formData.content_type}
          onChange={(e) => onChange("content_type", e.target.value)}
          className={inputBase}
        >
          <option value="">Selecione um tipo</option>
          {contentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="tags">
          Tags
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          value={formData.tags}
          onChange={(e) => onChange("tags", e.target.value)}
          className={inputBase}
          placeholder="Separadas por vírgula. Ex: RPA, automação, processos"
        />
        <p className="text-xs text-muted-foreground mt-1">Tags para melhor organização e descoberta</p>
      </div>

      {/* Tempo de Leitura */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="reading_time_minutes">
          Tempo de Leitura (minutos)
        </label>
        <input
          id="reading_time_minutes"
          name="reading_time_minutes"
          type="number"
          min={1}
          value={formData.reading_time_minutes}
          onChange={(e) => onChange("reading_time_minutes", e.target.value)}
          className={inputBase}
          placeholder="Ex: 5"
        />
        <p className="text-xs text-muted-foreground mt-1">Deixe vazio para calcular automaticamente</p>
      </div>
    </div>
  );
}
