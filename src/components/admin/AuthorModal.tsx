"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import {
  createAuthor,
  updateAuthor,
} from "@/app/admin/(protected)/authors/actions";
import type {
  Author,
  AuthorPostSnapshot,
  AuthorSnapshotComparableFields,
} from "@/lib/types/author";
import { AuthorSchema } from "@/lib/validations/author";

interface AuthorModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialValues: AuthorSnapshotComparableFields;
  authorId?: string;
  onClose: () => void;
  onSaved: (result: {
    author: Author;
    snapshot: AuthorPostSnapshot;
  }) => void;
}

const inputBase =
  "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors";

const emptyValues: AuthorSnapshotComparableFields = {
  author_name: "",
  author_title: "",
  author_photo: "",
  author_bio: "",
  author_linkedin: "",
};

export function AuthorModal({
  isOpen,
  mode,
  initialValues,
  authorId,
  onClose,
  onSaved,
}: AuthorModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<AuthorSnapshotComparableFields>(
    initialValues ?? emptyValues
  );
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      firstInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) {
    return null;
  }

  const setField = (
    field: keyof AuthorSnapshotComparableFields,
    value: string
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    setError("");

    if (mode === "edit" && !authorId) {
      setError("Selecione um autor válido para editar.");
      return;
    }

    const parsed = AuthorSchema.safeParse({
      name: values.author_name,
      title: values.author_title,
      photo_url: values.author_photo,
      bio: values.author_bio,
      linkedin_url: values.author_linkedin,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setError(firstIssue?.message ?? "Revise os dados do autor.");
      return;
    }

    startTransition(async () => {
      try {
        const result =
          mode === "create"
            ? await createAuthor(values)
            : await updateAuthor(authorId ?? "", values);

        onSaved(result);
      } catch (submissionError) {
        const message =
          submissionError instanceof Error
            ? submissionError.message
            : "Não foi possível salvar o autor.";

        setError(message);
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      <div
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-rc2-ebony">
              {mode === "create" ? "Novo autor" : "Editar autor"}
            </h2>
            <p className="mt-1 text-sm text-rc2-ebony/70">
              {mode === "create"
                ? "Cadastre um autor para reaproveitar em novos artigos."
                : "Atualize o cadastro global deste autor."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded p-1 transition-colors hover:bg-zinc-100 disabled:opacity-50"
          >
            <X size={20} className="text-rc2-ebony/60" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-rc2-ebony"
              htmlFor="author-modal-name"
            >
              Nome do Autor
            </label>
            <input
              ref={firstInputRef}
              id="author-modal-name"
              type="text"
              value={values.author_name}
              onChange={(event) => setField("author_name", event.target.value)}
              className={inputBase}
              placeholder="Nome completo do autor"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-rc2-ebony"
              htmlFor="author-modal-title"
            >
              Cargo do Autor
            </label>
            <input
              id="author-modal-title"
              type="text"
              value={values.author_title}
              onChange={(event) => setField("author_title", event.target.value)}
              className={inputBase}
              placeholder="Ex: Especialista em RPA"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-rc2-ebony"
              htmlFor="author-modal-photo"
            >
              Foto do Autor (URL)
            </label>
            <input
              id="author-modal-photo"
              type="url"
              value={values.author_photo}
              onChange={(event) => setField("author_photo", event.target.value)}
              className={inputBase}
              placeholder="https://..."
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-rc2-ebony"
              htmlFor="author-modal-bio"
            >
              Mini Bio
            </label>
            <textarea
              id="author-modal-bio"
              rows={4}
              maxLength={500}
              value={values.author_bio}
              onChange={(event) => setField("author_bio", event.target.value)}
              className={`${inputBase} resize-none`}
              placeholder="Breve biografia do autor (máx 500 caracteres)"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Máximo 500 caracteres
            </p>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-rc2-ebony"
              htmlFor="author-modal-linkedin"
            >
              LinkedIn (URL)
            </label>
            <input
              id="author-modal-linkedin"
              type="url"
              value={values.author_linkedin}
              onChange={(event) =>
                setField("author_linkedin", event.target.value)
              }
              className={inputBase}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-rc2-ebony/70 transition-colors hover:text-rc2-ebony disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded bg-rc2-orange px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-rc2-orange/90 disabled:opacity-50"
          >
            {isPending
              ? "Salvando..."
              : mode === "create"
                ? "Criar autor"
                : "Salvar autor"}
          </button>
        </div>
      </div>
    </>
  );
}
