import { AlertCircle, CheckCircle2 } from "lucide-react";
import { IconBadge } from "@/components/ui/IconBadge";
import { cn } from "@/lib/utils";

/**
 * Lista de sinais e intervenções — o par "o que dói na operação" / "o que a RC2
 * faz" que estrutura `/solucoes`.
 *
 * Existiam quatro implementações desta mesma lista em `SolutionsCompetencies`
 * (duas em superfície clara, duas reescritas à mão para a seção navy) e elas já
 * haviam divergido: o mesmo ícone aparecia a 15px e a 16px, e o texto ora em
 * `text-sm`, ora no corpo padrão. Um ponto só.
 *
 * `tone` diz o que a lista afirma, não como ela se pinta:
 * - `signal` — o sintoma. Ícone de atenção, texto em peso secundário.
 * - `intervention` — a resposta da RC2. Ícone de confirmação, texto cheio.
 *
 * Os dois blocos usam ícone (§9), no mesmo traço de 1.5px. Antes o sinal era um
 * `Circle` de 7px — um bullet disfarçado de ícone, que deixava o par
 * sinal/intervenção visualmente desequilibrado.
 *
 * Desde a §6 atualizada, o ícone vive dentro de `IconBadge` em vez de solto ao
 * lado do texto.
 */
interface SignalListProps {
  items: readonly string[];
  tone: "signal" | "intervention";
  variant?: "light" | "dark";
  /** Duas colunas a partir de `md`. Padrão: coluna única. */
  columns?: 1 | 2;
  className?: string;
}

export function SignalList({
  items,
  tone,
  variant = "light",
  columns = 1,
  className,
}: SignalListProps) {
  const isDark = variant === "dark";
  const isSignal = tone === "signal";

  return (
    <ul
      className={cn(
        columns === 2
          ? "grid grid-cols-1 gap-3 md:grid-cols-2"
          : isSignal
            ? "space-y-2.5"
            : "space-y-3",
        className
      )}
    >
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "flex items-start gap-3 leading-relaxed",
            isDark
              ? "text-rc2-dark-text-secondary"
              : isSignal
                ? "text-rc2-text/75"
                : "text-rc2-text"
          )}
        >
          <IconBadge
            icon={isSignal ? AlertCircle : CheckCircle2}
            size="sm"
            variant={isDark ? "dark" : "light"}
            className="mt-0.5"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
