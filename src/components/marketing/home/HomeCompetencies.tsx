import {
  ArrowRight,
  Workflow,
  Share2,
  Gauge,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { IconBadge } from "@/components/ui/IconBadge";
import { HOME_COMPETENCIES, HOME_CTAS } from "@/lib/content/home";

/** Ícone fino por competência (§8 Composites). Mapeado por título. */
const COMPETENCY_ICONS: Record<string, LucideIcon> = {
  "Automação de Processos": Workflow,
  "Integração de Sistemas": Share2,
  // Nada de cérebro, robô ou chip (AGENTS.md §11): IA aqui é
  // instrumentação de operação, não iconografia de "inteligência".
  "IA para Operações": Gauge,
  "Operações Digitais & Commerce": ShoppingCart,
};

/**
 * As quatro competências como especificação, não como grade de cards.
 *
 * Quatro caixas iguais em 2×2 achatam a hierarquia: tudo pesa o mesmo e a
 * seção lê como catálogo. Aqui cada competência é uma linha indexada, com
 * divisória hairline, título na coluna principal e entrega na lateral — a
 * leitura passa a ser sequencial e a composição fica assimétrica de propósito.
 *
 * Copy, destinos e identificadores de analytics são os mesmos.
 */
export function HomeCompetencies() {
  return (
    <section id="competencias" className="bg-rc2-bg rc2-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionLabel className="rc2-rule block mb-5">O que a RC2 faz</SectionLabel>
          <h2 className="rc2-h2 text-rc2-heading mb-10 max-w-2xl md:mb-14">
            Quatro competências para a operação voltar a funcionar.
          </h2>
        </ScrollReveal>

        <div className="border-t border-rc2-border">
          {HOME_COMPETENCIES.map((competency, index) => (
            <ScrollReveal
              key={competency.title}
              delay={index * 70}
              className="group grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 gap-y-4 border-b border-rc2-border py-8 sm:gap-x-4 lg:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-8 lg:py-12"
            >
              {/* Índice — a anotação técnica que ordena a leitura. */}
              <div className="row-span-2 pt-1 lg:row-span-1">
                {/* Numeral navy/muted (§11 Do/Don't). */}
                <span className="rc2-label text-rc2-text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="mt-4 hidden h-px w-8 bg-rc2-border lg:block"
                  aria-hidden
                />
              </div>

              <div className="min-w-0">
                <h3 className="flex items-center gap-3 text-xl font-semibold leading-snug text-rc2-heading md:text-2xl">
                  {(() => {
                    const Icon = COMPETENCY_ICONS[competency.title];
                    return Icon ? <IconBadge icon={Icon} /> : null;
                  })()}
                  {competency.title}
                </h3>
                <p className="mt-3 text-base font-medium leading-[1.75] text-rc2-text">
                  {competency.problem}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-base leading-[1.75] text-rc2-text-secondary">
                  {competency.delivery}
                </p>
                <TrackedLink
                  href={competency.href}
                  tracking={{
                    kind: "cta",
                    location: "home_solutions",
                    label: competency.analyticsLabel,
                    destination: competency.href,
                  }}
                  className="rc2-action-link mt-2 min-h-11 py-2 text-base"
                >
                  {competency.linkLabel}
                  <ArrowRight size={14} aria-hidden="true" />
                </TrackedLink>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300} className="mt-8 md:mt-12">
          <TrackedLink
            href={HOME_CTAS.competencies.href}
            tracking={{
              kind: "cta",
              location: "home_solutions",
              label: HOME_CTAS.competencies.analyticsLabel,
              destination: HOME_CTAS.competencies.href,
            }}
            className="rc2-action-link min-h-11 py-2 text-base"
          >
            {HOME_CTAS.competencies.label}
            <ArrowRight size={14} aria-hidden="true" />
          </TrackedLink>
        </ScrollReveal>
      </div>
    </section>
  );
}
