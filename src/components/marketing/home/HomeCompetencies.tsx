import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { HOME_COMPETENCIES, HOME_CTAS } from "@/lib/content/home";

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
          <h2 className="rc2-h2 text-rc2-heading mb-16 max-w-2xl">
            Quatro competências para a operação voltar a funcionar.
          </h2>
        </ScrollReveal>

        <div className="border-t border-rc2-border">
          {HOME_COMPETENCIES.map((competency, index) => (
            <ScrollReveal
              key={competency.title}
              delay={index * 70}
              className="group grid grid-cols-1 gap-x-12 gap-y-5 border-b border-rc2-border py-10 md:grid-cols-12 md:py-12"
            >
              {/* Índice — a anotação técnica que ordena a leitura. */}
              <div className="flex items-center gap-3 md:col-span-2 md:block">
                <span className="rc2-label text-rc2-brand-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="h-px w-8 bg-rc2-border md:mt-4 md:block md:w-10"
                  aria-hidden
                />
              </div>

              <div className="md:col-span-5">
                <h3 className="text-xl font-semibold leading-snug text-rc2-heading md:text-2xl">
                  {competency.title}
                </h3>
                <p className="mt-3 text-sm font-medium text-rc2-text">
                  {competency.problem}
                </p>
              </div>

              <div className="md:col-span-5">
                <p className="text-sm leading-relaxed text-rc2-text/70">
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
                  className="rc2-action-link mt-5"
                >
                  {competency.linkLabel}
                  <ArrowRight size={14} />
                </TrackedLink>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300} className="mt-12">
          <TrackedLink
            href={HOME_CTAS.competencies.href}
            tracking={{
              kind: "cta",
              location: "home_solutions",
              label: HOME_CTAS.competencies.analyticsLabel,
              destination: HOME_CTAS.competencies.href,
            }}
            className="rc2-action-link"
          >
            {HOME_CTAS.competencies.label}
            <ArrowRight size={14} />
          </TrackedLink>
        </ScrollReveal>
      </div>
    </section>
  );
}
