"use client";

import Link from "next/link";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4">
      <div className="text-center max-w-lg">
        <SectionLabel className="block mb-4">Erro 500</SectionLabel>
        <p className="rc2-display text-7xl md:text-9xl text-rc2-ebony leading-none mb-4">
          500
        </p>
        <p className="text-xl font-semibold text-rc2-ebony mb-2">
          Algo deu errado
        </p>
        <p className="text-rc2-ebony/60 mb-8">
          Ocorreu um erro inesperado. Nossa equipe já foi notificada.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className={cn(
              buttonVariants({ variant: "default" }),
              "font-semibold px-8 bg-rc2-orange text-rc2-heading hover:bg-rc2-orange/90"
            )}
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="text-sm font-medium text-rc2-ebony/60 underline underline-offset-4 hover:text-rc2-ebony transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
