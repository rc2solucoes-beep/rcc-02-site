"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
}

interface LinkEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, openInNewTab: boolean) => void;
  onRemove?: () => void;
  onDelete?: () => void;
  initialUrl?: string;
  selectedText?: string;
}

export function LinkEditorDialog({
  isOpen,
  onClose,
  onSave,
  onRemove,
  onDelete,
  initialUrl = "",
  selectedText = "",
}: LinkEditorDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const [openInNewTab, setOpenInNewTab] = useState(initialUrl?.includes("http"));
  const [linkType, setLinkType] = useState<"external" | "internal">(
    initialUrl?.startsWith("http") ? "external" : "internal"
  );
  const [selectedPostSlug, setSelectedPostSlug] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState<string>("");

  // Fetch posts for internal link picker
  useEffect(() => {
    if (linkType === "internal" && posts.length === 0) {
      const fetchPosts = async () => {
        try {
          setLoading(true);
          const response = await fetch("/api/posts");
          if (response.ok) {
            const data = await response.json();
            setPosts(data);
          }
        } catch (error) {
          console.error("Error fetching posts:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchPosts();
    }
  }, [linkType, posts.length]);

  // Update URL when link type changes
  useEffect(() => {
    if (linkType === "internal" && selectedPostSlug) {
      setUrl(`/blog/${selectedPostSlug}`);
    }
  }, [linkType, selectedPostSlug]);

  const validateUrl = (testUrl: string): boolean => {
    setUrlError("");

    if (!testUrl.trim()) {
      setUrlError("URL é obrigatória");
      return false;
    }

    if (linkType === "external") {
      try {
        // Add protocol if missing
        const urlToValidate = testUrl.startsWith("http")
          ? testUrl
          : `https://${testUrl}`;
        new URL(urlToValidate);
        return true;
      } catch {
        setUrlError("URL inválida. Use: https://exemplo.com");
        return false;
      }
    }

    if (linkType === "internal" && !selectedPostSlug) {
      setUrlError("Selecione um post");
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateUrl(url)) return;

    let finalUrl = url;
    if (linkType === "external" && !url.startsWith("http")) {
      finalUrl = `https://${url}`;
    }

    onSave(finalUrl, openInNewTab);
    onClose();
  };

  const handleRemoveLink = () => {
    if (onRemove) {
      onRemove();
      onClose();
    }
  };

  const handleDeleteAll = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  if (!isOpen) return null;

  const previewUrl = linkType === "external" && !url.startsWith("http") ? `https://${url}` : url;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg z-50 w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-rc2-ebony">
            {initialUrl ? "Editar Link" : "Adicionar Link"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-rc2-ebony/60" />
          </button>
        </div>

        {/* Text being linked */}
        {selectedText && (
          <div className="mb-4 p-3 bg-rc2-sand/50 rounded border border-border/50">
            <p className="text-xs text-rc2-ebony/60 mb-1">Texto:</p>
            <p className="text-sm font-medium text-rc2-ebony line-clamp-2">
              "{selectedText}"
            </p>
          </div>
        )}

        {/* Link Type Toggle */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-rc2-ebony/60 uppercase tracking-widest mb-2">
            Tipo de Link
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setLinkType("external");
                setSelectedPostSlug("");
              }}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                linkType === "external"
                  ? "bg-rc2-orange text-white"
                  : "bg-gray-100 text-rc2-ebony/70 hover:bg-gray-200"
              }`}
            >
              Externo
            </button>
            <button
              onClick={() => setLinkType("internal")}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                linkType === "internal"
                  ? "bg-rc2-orange text-white"
                  : "bg-gray-100 text-rc2-ebony/70 hover:bg-gray-200"
              }`}
            >
              Interno (Blog)
            </button>
          </div>
        </div>

        {/* URL Input (External) */}
        {linkType === "external" && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-rc2-ebony/60 uppercase tracking-widest mb-1.5">
              URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError("");
              }}
              placeholder="https://exemplo.com"
              className="w-full border border-border bg-white px-3 py-2.5 text-sm rounded outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors"
            />
            {urlError && <p className="mt-1 text-xs text-red-600">{urlError}</p>}
          </div>
        )}

        {/* Post Picker (Internal) */}
        {linkType === "internal" && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-rc2-ebony/60 uppercase tracking-widest mb-1.5">
              Selecione um Post
            </label>
            {loading ? (
              <p className="text-sm text-rc2-ebony/60">Carregando posts...</p>
            ) : posts.length > 0 ? (
              <select
                value={selectedPostSlug}
                onChange={(e) => setSelectedPostSlug(e.target.value)}
                className="w-full border border-border bg-white px-3 py-2.5 text-sm rounded outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors"
              >
                <option value="">-- Selecione um post --</option>
                {posts.map((post) => (
                  <option key={post.id} value={post.slug}>
                    {post.title}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-rc2-ebony/60">Nenhum post disponível</p>
            )}
            {urlError && <p className="mt-1 text-xs text-red-600">{urlError}</p>}
          </div>
        )}

        {/* Preview */}
        {url && !urlError && (
          <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-900/70 mb-1">Preview:</p>
            <p className="text-sm font-mono text-blue-900 break-all">
              {previewUrl}
            </p>
          </div>
        )}

        {/* Open in New Tab */}
        <div className="mb-6 flex items-center gap-2">
          <input
            type="checkbox"
            id="openInNewTab"
            checked={openInNewTab}
            onChange={(e) => setOpenInNewTab(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <label htmlFor="openInNewTab" className="text-sm text-rc2-ebony/70 cursor-pointer">
            Abrir em nova aba
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {initialUrl && onRemove && (
            <button
              onClick={handleRemoveLink}
              className="px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors"
            >
              Remover Link
            </button>
          )}
          {initialUrl && onDelete && (
            <button
              onClick={handleDeleteAll}
              className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
            >
              Deletar Tudo
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-rc2-ebony/70 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-rc2-orange rounded hover:bg-rc2-orange/90 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </>
  );
}
