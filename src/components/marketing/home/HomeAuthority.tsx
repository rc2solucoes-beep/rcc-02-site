import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { HomeReviews } from "@/components/marketing/HomeReviews";
import { StatCounter } from "@/components/ui/StatCounter";
import { HOME_AUTHORITY, HOME_AUTHORITY_STATS, HOME_CTAS } from "@/lib/content/home";

export function HomeAuthority() {
  const statsWithContext = HOME_AUTHORITY_STATS.map((stat, index) => ({
    ...stat,
    context: index < 2 ? "Uno Healthcare · trajetória do fundador" : "Trajetória do fundador",
  }));

  return (
    // Segundo momento de assinatura da página (§9 Home): prova quantificada
    // recebe o respiro reservado a acontecimentos, não o ritmo de rotina.
    <section className="bg-rc2-bg rc2-section--signature">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionLabel className="rc2-rule block mb-5">
            {HOME_AUTHORITY.proofLabel}
          </SectionLabel>
          <h2 className="rc2-h2 text-rc2-heading mb-6 max-w-2xl">
            Experiência de operação, não só de ferramenta.
          </h2>
          <p className="text-rc2-text-secondary text-lg leading-relaxed max-w-2xl mb-10">
            {HOME_AUTHORITY.intro}
          </p>
        </ScrollReveal>

        {/* Os números do case Uno Healthcare saem da prosa e viram o
            componente Stat/Counter (§8, §9). São os mesmos valores. */}
        <ScrollReveal delay={60} className="mb-14">
          <StatCounter stats={statsWithContext} />
        </ScrollReveal>

        {/* Experiências do fundador: lista editorial, distinta das avaliações
            de clientes abaixo (Proximity — grupos distintos, espaçamento
            distinto). */}
        <h3 className="rc2-h3 text-rc2-heading text-xl mb-4">
          Trajetória do fundador
        </h3>
        <dl className="border-b border-rc2-border">
          {HOME_AUTHORITY.facts.map((item, index) => (
            <ScrollReveal
              key={item.org}
              delay={index * 80}
              className="grid grid-cols-1 gap-2 border-t border-rc2-border py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-6 md:py-6"
            >
              <dt className="text-xl font-semibold text-rc2-heading">
                {item.org}
              </dt>
              <dd className="text-base leading-[1.75] text-rc2-text-secondary">
                {item.fact}
              </dd>
            </ScrollReveal>
          ))}
        </dl>

        <div className="mt-12">
          <ScrollReveal>
            <h3 className="rc2-h3 text-rc2-heading mb-8">
              O que os clientes dizem
            </h3>
          </ScrollReveal>
          <HomeReviews />
        </div>

        <ScrollReveal delay={140} className="mt-10">
          <TrackedLink
            href={HOME_CTAS.authority.href}
            tracking={{
              kind: "cta",
              location: "home_proof",
              label: HOME_CTAS.authority.analyticsLabel,
              destination: HOME_CTAS.authority.href,
            }}
            className="rc2-action-link text-base min-h-11 min-w-11 py-2 max-w-full"
          >
            {HOME_CTAS.authority.label}
            <ArrowRight size={14} aria-hidden="true" />
          </TrackedLink>
        </ScrollReveal>
      </div>
    </section>
  );
}
