"use client";

import { useState } from "react";

interface DeletePostButtonProps {
  postId: string;
  /** Redireciona em caso de sucesso; devolve `{ ok: false, message }` quando a exclusão não ocorreu. */
  deleteAction: (id: string) => Promise<{ ok: false; message: string } | void>;
}

export function DeletePostButton({ postId, deleteAction }: DeletePostButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (!confirm("Excluir este post permanentemente? Esta ação não pode ser desfeita.")) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await deleteAction(postId);
      if (result && result.ok === false) {
        setErrorMessage(result.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro ao deletar post:", error);
      setErrorMessage("Erro ao excluir o post. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Deletando..." : "Excluir"}
      </button>
      <p role="alert" className="max-w-xs text-right text-xs text-red-600">
        {errorMessage}
      </p>
    </div>
  );
}
