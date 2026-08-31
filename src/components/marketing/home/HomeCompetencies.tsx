import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { HOME_COMPETENCIES, HOME_CTAS } from "@/lib/content/home";

export function HomeCompetencies() {
  return (
    <section id="competencias" className="bg-rc2-bg rc2-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionLabel className="rc2-rule block mb-5">O que a RC2 faz</SectionLabel>
          <h2 className="rc2-h2 text-rc2-heading mb-12 max-w-2xl">
            Quatro competências para a operação voltar a funcionar.
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {HOME_COMPETENCIES.map((competency, index) => (
            <ScrollReveal
              key={competency.title}
              delay={index * 70}
              className="rc2-card rc2-card-hover relative flex flex-col overflow-hidden p-6 pt-7"
            >
              <span
                className="absolute left-0 top-0 h-1 w-14 bg-rc2-brand"
                aria-hidden
              />
              <h3 className="text-lg font-semibold text-rc2-heading mb-3 leading-snug">
                {competency.title}
              </h3>
              <p className="text-sm font-medium text-rc2-text mb-2">
                {competency.problem}
              </p>
              <p className="text-sm text-rc2-text/70 leading-relaxed flex-1">
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
                className="rc2-action-link mt-6"
              >
                {competency.linkLabel}
                <ArrowRight size={14} />
              </TrackedLink>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300} className="mt-10">
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
