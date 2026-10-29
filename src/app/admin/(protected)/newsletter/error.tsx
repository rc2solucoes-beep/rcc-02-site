"use client";

import { useEffect } from "react";

export default function NewsletterError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[admin/newsletter] erro inesperado", { digest: error.digest }); }, [error]);
  return <div role="alert" className="p-6 text-rc2-text">
    <p className="text-rc2-error">Não foi possível carregar a administração da newsletter.</p>
    <button type="button" className="mt-3 px-4 py-2 bg-rc2-brand text-rc2-heading" onClick={reset}>Tentar novamente</button>
  </div>;
}
