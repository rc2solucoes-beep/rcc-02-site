"use client";

import { useState, useEffect } from "react";

interface Post {
  id: string;
  title: string;
  category?: string;
  published_at?: string;
}

interface FormData {
  [key: string]: string;
}

interface RelatedTabProps {
  formData: FormData;
  onChange: (field: string, value: string) => void;
  currentPostId?: string;
}

const inputBase = "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors";

export function RelatedTab({ formData, onChange, currentPostId }: RelatedTabProps) {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse selected posts from formData.related_post_ids (comma-separated string)
  const selectedPosts = formData.related_post_ids
    ? formData.related_post_ids.split(",").filter(id => id.trim())
    : [];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/posts");
        if (response.ok) {
          const data = await response.json();
          // Filtra posts excluindo o atual
          const filtered = data.filter(
            (p: Post) => currentPostId ? p.id !== currentPostId : true
          );
          setAllPosts(filtered);
        }
      } catch (error) {
        console.error("Erro ao carregar posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPostId]);

  const handleToggle = (postId: string) => {
    const newSelected = selectedPosts.includes(postId)
      ? selectedPosts.filter((id) => id !== postId)
      : [...selectedPosts, postId];

    // Convert array back to comma-separated string for formData
    onChange("related_post_ids", newSelected.join(","));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-3">
          Posts Relacionados
        </label>
        <p className="text-xs text-rc2-ebony/60 mb-4">
          Selecione até 3 posts relacionados que serão exibidos ao final deste artigo
        </p>

        {loading ? (
          <p className="text-sm text-[#5A4E42]">Carregando posts...</p>
        ) : allPosts.length === 0 ? (
          <p className="text-sm text-[#5A4E42]">Nenhum outro post disponível</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto border border-border rounded p-3 bg-rc2-sand">
            {allPosts.map((p) => (
              <label
                key={p.id}
                className="flex items-start gap-3 p-2 rounded hover:bg-rc2-ebony/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPosts.includes(p.id)}
                  onChange={() => handleToggle(p.id)}
                  disabled={selectedPosts.length >= 3 && !selectedPosts.includes(p.id)}
                  className="mt-1 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-rc2-ebony truncate">
                    {p.title}
                  </p>
                  <p className="text-xs text-[#5A4E42]">
                    {p.category && <span>{p.category} • </span>}
                    {p.published_at && new Date(p.published_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        {selectedPosts.length > 0 && (
          <div className="mt-3 text-xs text-rc2-ebony/60">
            {selectedPosts.length} post(s) selecionado(s)
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-sm text-blue-900">
          💡 Posts relacionados aparecem ao final do artigo, melhorando a navegação e tempo na página.
        </p>
      </div>
    </div>
  );
}
