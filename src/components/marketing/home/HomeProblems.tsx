import {
  ClipboardList,
  Unplug,
  FolderSearch,
  Network,
  type LucideIcon,
} from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SignalList } from "@/components/ui/SignalList";
import { IconBadge } from "@/components/ui/IconBadge";
import { HOME_PROBLEMS } from "@/lib/content/home";

/**
 * Ícone fino por sintoma (§8 Composites: "Card Sintoma adiciona ícone fino ao
 * lado do título").
 *
 * Mapeado por título e não embutido no conteúdo: ícone é decisão visual, e
 * `HOME_PROBLEMS` é copy aprovada que não deve carregar nome de componente.
 * Nenhum ícone de robô, cérebro ou chip — proibidos pelo AGENTS.md.
 */
const PROBLEM_ICONS: Record<string, LucideIcon> = {
  "Trabalho manual": ClipboardList,
  "Sistemas desconectados": Unplug,
  "Informação espalhada": FolderSearch,
  "Operação digital fragmentada": Network,
};

export function HomeProblems() {
  return (
    <section className="rc2-grain relative overflow-hidden bg-rc2-dark rc2-section">
      <div className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionLabel className="rc2-rule block mb-5 text-rc2-brand">
            Onde a operação trava
          </SectionLabel>
          <h2 className="rc2-h2 text-rc2-dark-text mb-4 max-w-2xl">
            A operação cresceu. O processo não acompanhou.
          </h2>
          <p className="text-rc2-dark-text-secondary text-lg leading-relaxed max-w-2xl mb-12">
            Quatro sintomas aparecem quase sempre juntos — e nenhum deles se
            resolve comprando mais uma ferramenta.
          </p>
        </ScrollReveal>

        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-rc2-dark-border bg-rc2-dark-border md:grid-cols-2">
          {HOME_PROBLEMS.map((problem) => (
            <li key={problem.title} className="bg-rc2-dark px-6 py-7">
              <div className="mb-2 flex items-center gap-3">
                {(() => {
                  const Icon = PROBLEM_ICONS[problem.title];
                  return Icon ? <IconBadge icon={Icon} variant="dark" /> : null;
                })()}
                <h3 className="text-base font-semibold text-rc2-dark-text">
                  {problem.title}
                </h3>
              </div>
              <p className="text-sm text-rc2-dark-text-secondary leading-relaxed mb-4">
                {problem.description}
              </p>
              <SignalList
                items={problem.examples}
                tone="signal"
                variant="dark"
                className="text-sm"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
