import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// O layout raiz declara `index, follow` (inclusive para o Googlebot), canonical
// e og:url da Home para as páginas reais. Sem sobrescrever aqui, todo 404 herda
// isso ao lado do `noindex` que o Next injeta. O merge é raso: `robots` e
// `openGraph` daqui substituem os do layout inteiros, `googleBot` incluído.
export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  openGraph: null,
};

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4">
      <div className="text-center max-w-lg">
        <SectionLabel className="block mb-4">Erro 404</SectionLabel>
        <p className="rc2-bold text-8xl md:text-[10rem] text-rc2-heading leading-none mb-4">
          404
        </p>
        <p className="text-xl font-semibold text-rc2-ebony mb-2">
          Página não encontrada
        </p>
        <p className="text-rc2-ebony/60 mb-8">
          O endereço que você acessou não existe ou foi movido.
        </p>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "default" }),
            "font-semibold px-8 bg-rc2-orange text-rc2-heading hover:bg-rc2-orange/90"
          )}
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
