import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { HomeReviews } from "@/components/marketing/HomeReviews";
import { HOME_AUTHORITY, HOME_CTAS } from "@/lib/content/home";

export function HomeAuthority() {
  return (
    <section className="bg-rc2-bg rc2-section">
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

        <dl className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
