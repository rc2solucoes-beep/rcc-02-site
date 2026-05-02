import Link from "next/link";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4">
      <div className="text-center max-w-lg">
        <SectionLabel className="block mb-4">Erro 404</SectionLabel>
        <p className="rc2-display text-8xl md:text-[10rem] text-rc2-ebony leading-none mb-4">
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
            "font-semibold px-8 bg-rc2-orange text-rc2-sand hover:bg-rc2-orange/90"
          )}
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
