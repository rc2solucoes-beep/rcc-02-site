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

        <ol className="flex flex-col divide-y divide-rc2-dark-border overflow-hidden rounded-xl border border-rc2-dark-border">
          {HOME_METHOD.steps.map((step, index) => (
            <li
              key={step.name}
              className="flex flex-col gap-3 p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-8 lg:p-8"
            >
              <div className="flex min-w-0 items-baseline gap-3">
                {/* Numeral é dispositivo de ritmo, não estado mudando: navy
                    muted, nunca Safety Orange (§11 Do/Don't). */}
                <span className="rc2-label text-rc2-dark-text-muted shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="min-w-0 text-xl font-semibold leading-snug text-rc2-dark-text">
                  {step.name}
                </h3>
              </div>
              <p className="min-w-0 text-base leading-[1.75] text-rc2-dark-text-secondary">
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
            className="rc2-action-link text-rc2-brand min-h-11 max-w-full py-2 text-base"
          >
            {HOME_METHOD.managedOpsLabel}
            <ArrowRight size={14} aria-hidden="true" />
          </TrackedLink>
        </ScrollReveal>
      </div>
    </section>
  );
}
