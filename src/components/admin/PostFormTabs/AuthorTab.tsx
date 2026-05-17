"use client";

import { useMemo, useState } from "react";
import { AuthorModal } from "@/components/admin/AuthorModal";
import {
  hasAuthorSnapshotChanged,
  mapAuthorToPostSnapshot,
} from "@/lib/authors/mappers";
import type { Author } from "@/lib/types/author";

interface FormData {
  [key: string]: string;
}

interface AuthorTabProps {
  authors: Author[];
  formData: FormData;
  onChange: (field: string, value: string) => void;
}

type ModalMode = "create" | "edit";

const inputBase =
  "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors";

export function AuthorTab({ authors, formData, onChange }: AuthorTabProps) {
  const [authorOptions, setAuthorOptions] = useState(authors);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedAuthor = useMemo(
    () => authorOptions.find((author) => author.id === formData.author_id) ?? null,
    [authorOptions, formData.author_id]
  );

  const snapshotChanged = selectedAuthor
    ? hasAuthorSnapshotChanged(selectedAuthor, {
        author_name: formData.author_name,
        author_title: formData.author_title,
        author_photo: formData.author_photo,
        author_bio: formData.author_bio,
        author_linkedin: formData.author_linkedin,
      })
    : false;

  const modalInitialValues =
    modalMode === "edit" && selectedAuthor
      ? mapAuthorToPostSnapshot(selectedAuthor)
      : {
          author_id: "",
          author_name: formData.author_name,
          author_title: formData.author_title,
          author_photo: formData.author_photo,
          author_bio: formData.author_bio,
          author_linkedin: formData.author_linkedin,
        };

  const updateSnapshotField = (field: string, value: string) => {
    onChange(field, value);
  };

  const applySnapshot = (snapshot: {
    author_id: string;
    author_name: string;
    author_title: string;
    author_photo: string;
    author_bio: string;
    author_linkedin: string;
  }) => {
    onChange("author_id", snapshot.author_id);
    onChange("author_name", snapshot.author_name);
    onChange("author_title", snapshot.author_title);
    onChange("author_photo", snapshot.author_photo);
    onChange("author_bio", snapshot.author_bio);
    onChange("author_linkedin", snapshot.author_linkedin);
    onChange("sync_author_global", "false");
  };

  const upsertAuthorOption = (nextAuthor: Author) => {
    setAuthorOptions((current) =>
      [...current.filter((author) => author.id !== nextAuthor.id), nextAuthor].sort(
        (left, right) => left.name.localeCompare(right.name, "pt-BR")
      )
    );
  };

  const handleAuthorSelect = (authorId: string) => {
    if (!authorId) {
      onChange("author_id", "");
      onChange("sync_author_global", "false");
      return;
    }

    const author = authorOptions.find((item) => item.id === authorId);
    if (!author) {
      return;
    }

    applySnapshot(mapAuthorToPostSnapshot(author));
  };

  const handleSnapshotFieldChange = (field: string, value: string) => {
    updateSnapshotField(field, value);

    if (!selectedAuthor) {
      onChange("sync_author_global", "false");
      return;
    }

    const nextSnapshot = {
      author_name:
        field === "author_name" ? value : formData.author_name,
      author_title:
        field === "author_title" ? value : formData.author_title,
      author_photo:
        field === "author_photo" ? value : formData.author_photo,
      author_bio:
        field === "author_bio" ? value : formData.author_bio,
      author_linkedin:
        field === "author_linkedin" ? value : formData.author_linkedin,
    };

    if (!hasAuthorSnapshotChanged(selectedAuthor, nextSnapshot)) {
      onChange("sync_author_global", "false");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="rounded border border-border/70 bg-rc2-sand/40 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <label
                className="mb-1.5 block text-sm font-medium text-rc2-ebony"
                htmlFor="author_selector"
              >
                Autor Cadastrado
              </label>
              <select
                id="author_selector"
                value={formData.author_id}
                onChange={(event) => handleAuthorSelect(event.target.value)}
                className={inputBase}
              >
                <option value="">Sem autor vinculado</option>
                {authorOptions.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Selecione um autor existente para preencher os dados do artigo.
              </p>
              {authorOptions.length === 0 && (
                <p className="mt-2 text-xs text-rc2-ebony/70">
                  Nenhum autor cadastrado ainda. Use &quot;Novo autor&quot; para
                  criar o primeiro.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalMode("create");
                  setIsModalOpen(true);
                }}
                className="rounded border border-border px-4 py-2 text-sm font-medium text-rc2-ebony transition-colors hover:bg-zinc-100"
              >
                Novo autor
              </button>
              <button
                type="button"
                disabled={!selectedAuthor}
                onClick={() => {
                  setModalMode("edit");
                  setIsModalOpen(true);
                }}
                className="rounded border border-border px-4 py-2 text-sm font-medium text-rc2-ebony transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Editar autor
              </button>
            </div>
          </div>
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-rc2-ebony"
            htmlFor="author_name"
          >
            Nome do Autor
          </label>
          <input
            id="author_name"
            name="author_name"
            type="text"
            value={formData.author_name}
            onChange={(event) =>
              handleSnapshotFieldChange("author_name", event.target.value)
            }
            className={inputBase}
            placeholder="Nome completo do autor"
          />
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-rc2-ebony"
            htmlFor="author_title"
          >
            Cargo do Autor
          </label>
          <input
            id="author_title"
            name="author_title"
            type="text"
            value={formData.author_title}
            onChange={(event) =>
              handleSnapshotFieldChange("author_title", event.target.value)
            }
            className={inputBase}
            placeholder="Ex: Especialista em RPA, Consultor de Automação"
          />
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-rc2-ebony"
            htmlFor="author_photo"
          >
            Foto do Autor (URL)
          </label>
          <input
            id="author_photo"
            name="author_photo"
            type="url"
            value={formData.author_photo}
            onChange={(event) =>
              handleSnapshotFieldChange("author_photo", event.target.value)
            }
            className={inputBase}
            placeholder="https://..."
          />
          {formData.author_photo && (
            <div className="mt-2">
              <img
                src={formData.author_photo}
                alt={formData.author_name || "Autor"}
                className="h-20 w-20 rounded-full object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-rc2-ebony"
            htmlFor="author_bio"
          >
            Mini Bio
          </label>
          <textarea
            id="author_bio"
            name="author_bio"
            rows={3}
            value={formData.author_bio}
            onChange={(event) =>
              handleSnapshotFieldChange("author_bio", event.target.value)
            }
            className={`${inputBase} resize-none`}
            placeholder="Breve biografia do autor (máx 500 caracteres)"
            maxLength={500}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Máximo 500 caracteres
          </p>
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-rc2-ebony"
            htmlFor="author_linkedin"
          >
            LinkedIn (URL)
          </label>
          <input
            id="author_linkedin"
            name="author_linkedin"
            type="url"
            value={formData.author_linkedin}
            onChange={(event) =>
              handleSnapshotFieldChange("author_linkedin", event.target.value)
            }
            className={inputBase}
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        {selectedAuthor && snapshotChanged && (
          <div className="rounded border border-amber-200 bg-amber-50 p-4">
            <label className="flex items-start gap-3 text-sm text-amber-950">
              <input
                type="checkbox"
                checked={formData.sync_author_global === "true"}
                onChange={(event) =>
                  onChange(
                    "sync_author_global",
                    event.target.checked ? "true" : "false"
                  )
                }
                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-rc2-orange focus:ring-rc2-orange"
              />
              <span>
                Também atualizar o cadastro global deste autor com estes dados.
              </span>
            </label>
          </div>
        )}

        <input
          id="author_id"
          name="author_id"
          type="hidden"
          value={formData.author_id}
          onChange={(event) => onChange("author_id", event.target.value)}
        />

        <div className="rounded border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            Preencha estes campos para exibir o autor do artigo na página
            pública, aumentando a confiança e autoridade do conteúdo.
          </p>
        </div>
      </div>

      <AuthorModal
        key={`${modalMode}-${selectedAuthor?.id ?? "new"}-${isModalOpen ? "open" : "closed"}`}
        isOpen={isModalOpen}
        mode={modalMode}
        authorId={selectedAuthor?.id}
        initialValues={{
          author_name: modalInitialValues.author_name,
          author_title: modalInitialValues.author_title,
          author_photo: modalInitialValues.author_photo,
          author_bio: modalInitialValues.author_bio,
          author_linkedin: modalInitialValues.author_linkedin,
        }}
        onClose={() => setIsModalOpen(false)}
        onSaved={(result) => {
          upsertAuthorOption(result.author);
          applySnapshot(result.snapshot);
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
