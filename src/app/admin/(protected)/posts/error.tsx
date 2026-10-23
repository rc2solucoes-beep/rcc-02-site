"use client";

import { useEffect } from "react";

// Boundary para EXCEÇÕES inesperadas da rota /admin/posts. A falha esperada da consulta
// (listAdminPosts devolve ok:false) é tratada inline na página, com link "Tentar novamente".
export default function PostsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // error.message de Server Components é genérico; o digest liga ao log do servidor.
    console.error("[admin/posts] erro inesperado", { digest: error.digest });
  }, [error]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div role="alert" className="bg-rc2-surface border border-rc2-border p-8 text-center text-sm text-rc2-text">
        <p className="font-medium text-rc2-error">Algo deu errado ao abrir os posts.</p>
        <p className="mt-1 text-rc2-text-secondary">Isto não significa que a lista esteja vazia.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-4 px-4 py-2 bg-rc2-brand text-rc2-heading text-sm font-medium hover:bg-rc2-brand-hover transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
