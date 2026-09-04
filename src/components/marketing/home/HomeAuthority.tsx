import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { HomeReviews } from "@/components/marketing/HomeReviews";
import { StatCounter } from "@/components/ui/StatCounter";
import { HOME_AUTHORITY, HOME_AUTHORITY_STATS, HOME_CTAS } from "@/lib/content/home";

export function HomeAuthority() {
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
          <p className="text-rc2-text/75 text-lg leading-relaxed max-w-2xl mb-10">
            {HOME_AUTHORITY.intro}
          </p>
        </ScrollReveal>

        {/* Os números do case Uno Healthcare saem da prosa e viram o
            componente Stat/Counter (§8, §9). São os mesmos valores. */}
        <ScrollReveal delay={60} className="mb-14">
          <StatCounter stats={HOME_AUTHORITY_STATS} />
        </ScrollReveal>

        {/* §8 Card Case: "espaçamento maior entre cards (seção de
            assinatura)". O gap de rotina achatava a prova social contra as
            demais grades da página. */}
        <dl className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          {HOME_AUTHORITY.facts.map((item, index) => (
            <ScrollReveal
              key={item.org}
              delay={index * 80}
              className="rc2-card p-6"
            >
              <dt className="rc2-label text-rc2-brand-text mb-3">{item.org}</dt>
              <dd className="text-sm text-rc2-text/75 leading-relaxed">
                {item.fact}
              </dd>
            </ScrollReveal>
          ))}
        </dl>

        <div className="mt-16">
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
            className="rc2-action-link"
          >
            {HOME_CTAS.authority.label}
            <ArrowRight size={14} />
          </TrackedLink>
        </ScrollReveal>
      </div>
    </section>
  );
}
