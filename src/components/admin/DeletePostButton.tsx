"use client";

import { useState } from "react";

interface DeletePostButtonProps {
  postId: string;
  deleteAction: (id: string) => Promise<void>;
}

export function DeletePostButton({ postId, deleteAction }: DeletePostButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!confirm("Excluir este post permanentemente? Esta ação não pode ser desfeita.")) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteAction(postId);
    } catch (error) {
      console.error("Erro ao deletar post:", error);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Deletando..." : "Excluir"}
    </button>
  );
}
