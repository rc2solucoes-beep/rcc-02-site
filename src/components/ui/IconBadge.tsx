import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Container de ícone — §6 Iconografia da direção de arte.
 *
 * O ícone que acompanha título de card ou item de lista (Sintomas,
 * Competências, Sinais) deixa de ficar solto ao lado do texto e passa a viver
 * num container fixo: fundo Accent Soft, radius 8px, borda hairline. O objetivo
 * é ler como indicador/instrumento, não como ícone de lista SaaS genérica.
 *
 * **O container não muda de cor por estado.** Isso competiria com o Princípio 1,
 * que reserva o Safety Orange ao instante em que algo realmente muda de estado.
 * Ele é moldura permanente, não sinal.
 *
 * Em área navy o Accent Soft não existe como superfície: `variant="dark"` usa a
 * borda escura do sistema com um véu translúcido, mantendo a mesma silhueta.
 */
interface IconBadgeProps {
  icon: LucideIcon;
  /** `sm` ~32px para item de lista, `md` ~36px para título de card. */
  size?: "sm" | "md";
  variant?: "light" | "dark";
  className?: string;
}

export function IconBadge({
  icon: Icon,
  size = "md",
  variant = "light",
  className,
}: IconBadgeProps) {
  const isDark = variant === "dark";
  const box = size === "sm" ? "size-8" : "size-9";
  const glyph = size === "sm" ? 16 : 18;

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg border",
        box,
        isDark
          ? "border-rc2-dark-border bg-rc2-dark-elevated text-rc2-dark-text"
          : "border-rc2-border bg-rc2-accent-soft text-rc2-heading",
        className
      )}
    >
      <Icon size={glyph} strokeWidth={1.5} />
    </span>
  );
}
