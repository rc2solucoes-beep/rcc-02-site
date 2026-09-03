import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { HOME_METHOD } from "@/lib/content/home";

/**
 * Momento navy da Home: quebra a corrida de quatro seções claras e dá
 * autoridade ao método, que é onde a RC2 explica como trabalha.
 */
export function HomeMethod() {
  return (
    <section className="bg-rc2-dark-2 rc2-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionLabel className="rc2-rule block mb-5 text-rc2-brand">Como trabalhamos</SectionLabel>
          <h2 className="rc2-h2 text-rc2-dark-text mb-14 max-w-2xl">
            Do entendimento à evolução contínua.
          </h2>
        </ScrollReveal>

        <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-rc2-dark-border bg-rc2-dark-border md:grid-cols-2 lg:grid-cols-5">
          {HOME_METHOD.steps.map((step, index) => (
            <li key={step.name} className="bg-rc2-dark-2 px-5 py-7">
              <span className="rc2-label text-rc2-brand mb-3 block">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-base font-semibold text-rc2-dark-text mb-2">
                {step.name}
              </h3>
              <p className="text-sm text-rc2-dark-text-secondary leading-relaxed">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <ScrollReveal delay={160} className="mt-8">
          <TrackedLink
            href={HOME_METHOD.managedOpsHref}
            tracking={{
              kind: "cta",
              location: "home_method",
              label: HOME_METHOD.managedOpsAnalyticsLabel,
              destination: HOME_METHOD.managedOpsHref,
            }}
            className="rc2-action-link text-rc2-brand"
          >
            {HOME_METHOD.managedOpsLabel}
            <ArrowRight size={14} />
          </TrackedLink>
        </ScrollReveal>
      </div>
    </section>
  );
}
