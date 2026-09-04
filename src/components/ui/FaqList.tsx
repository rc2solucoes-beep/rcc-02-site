import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqEntry = {
  question: string;
  answer: string;
};

/**
 * FAQ item — extraído de `BlogPostArticle`, onde era ad-hoc.
 *
 * A direção de arte não especifica FAQ nas §§8 e 9; o tratamento vem das
 * regras gerais do sistema: card branco, borda hairline, radius de card, ícone
 * fino Lucide, transição de 200ms. O `<details>` nativo é mantido de propósito
 * — abre sem JS e já é acessível por teclado.
 */
interface FaqListProps {
  items: readonly FaqEntry[];
  className?: string;
}

export function FaqList({ items, className }: FaqListProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <details
          key={item.question}
          className="group overflow-hidden rounded-lg border border-rc2-card-border bg-rc2-surface"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 transition-colors duration-200 hover:bg-rc2-surface-2">
            <span className="text-base font-medium leading-snug text-rc2-heading">
              {item.question}
            </span>
            <ChevronDown
              size={18}
              strokeWidth={1.5}
              className="shrink-0 text-rc2-text-secondary transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="border-t border-rc2-border-soft px-5 pt-4 pb-5 text-sm leading-relaxed text-rc2-text/75">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
