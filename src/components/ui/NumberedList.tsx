import { cn } from "@/lib/utils";

export type NumberedItem = {
  title: string;
  description: string;
};

/**
 * Numerado (01–05) — dispositivo de ritmo do sistema visual (§8 Composites).
 *
 * Era o `StepList`, usado só em "Como trabalhamos". A direção de arte pede que
 * ele seja formalizado como componente reutilizável, disponível também para
 * sintomas e competências.
 *
 * **O numeral é navy/muted, nunca Safety Orange.** É uma anotação de ordem, não
 * um instante de mudança de estado — o laranja aqui gastaria a cor mais escassa
 * do sistema em algo que só numera. O `StepList` usava `--rc2-brand-text/20`;
 * esta versão corrige.
 */
interface NumberedListProps {
  items: readonly NumberedItem[];
  variant?: "light" | "dark";
  /** Começa em 01 por padrão. */
  start?: number;
  className?: string;
}

export function NumberedList({
  items,
  variant = "light",
  start = 1,
  className,
}: NumberedListProps) {
  const isDark = variant === "dark";

  return (
    <ol
      className={cn(
        "space-y-0 divide-y",
        isDark ? "divide-rc2-dark-border" : "divide-rc2-border",
        className
      )}
    >
      {items.map((item, index) => (
        <li key={item.title} className="flex gap-6 py-6 first:pt-0 last:pb-0">
          <span
            className={cn(
              "rc2-bold shrink-0 w-10 text-right text-4xl leading-none md:text-5xl",
              isDark ? "text-rc2-dark-text-muted" : "text-rc2-text-muted"
            )}
            aria-hidden
          >
            {String(index + start).padStart(2, "0")}
          </span>
          <div>
            <h3
              className={cn(
                "mb-1 font-semibold",
                isDark ? "text-rc2-dark-text" : "text-rc2-heading"
              )}
            >
              {item.title}
            </h3>
            <p
              className={cn(
                "text-sm leading-relaxed",
                isDark ? "text-rc2-dark-text-secondary" : "text-rc2-text/75"
              )}
            >
              {item.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
