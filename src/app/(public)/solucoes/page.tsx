import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { CTABlockBase } from "@/components/marketing/CTABlockBase";
import { SolutionsCompetencies } from "@/components/marketing/solucoes/SolutionsCompetencies";
import { SolutionsManagedOps } from "@/components/marketing/solucoes/SolutionsManagedOps";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import {
  SOLUCOES_COPY,
  SOLUCOES_CTAS,
  SOLUCOES_METADATA,
  SOLUCOES_METHOD,
  SOLUCOES_ORIENTATION,
} from "@/lib/content/solucoesPage";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SOLUCOES_METADATA.title,
    description: SOLUCOES_METADATA.description,
    alternates: {
      canonical: `${BASE_URL}/solucoes`,
    },
    openGraph: buildOg({
      title: SOLUCOES_METADATA.title,
      description: SOLUCOES_METADATA.ogDescription,
      url: `${BASE_URL}/solucoes`,
    }),
  };
}

export default function SolucoesPage() {
  const schemaWebPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: SOLUCOES_METADATA.title,
    description: SOLUCOES_METADATA.description,
    url: `${BASE_URL}/solucoes`,
    isPartOf: {
      "@type": "WebSite",
      url: BASE_URL,
      name: "RC2 Soluções",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebPage) }}
      />
      <PageHero
        label={SOLUCOES_COPY.eyebrow}
        title={SOLUCOES_COPY.h1}
        description={SOLUCOES_COPY.subheadline}
        action={
          <TrackedLink
            href={SOLUCOES_CTAS.hero.href}
            tracking={{
              kind: "cta",
              location: "solutions_hero",
              label: SOLUCOES_CTAS.hero.analyticsLabel,
              destination: SOLUCOES_CTAS.hero.href,
            }}
            className={cn(
              buttonVariants({ variant: "default" }),
              "font-semibold tracking-wide uppercase text-xs px-8 h-12 bg-rc2-brand text-rc2-heading hover:bg-rc2-brand/90"
            )}
          >
            {SOLUCOES_CTAS.hero.label}
          </TrackedLink>
        }
      />

      {/* ── Orientação — como escolher ── */}
      <section className="bg-rc2-bg rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal distance="18px">
            <SectionLabel className="rc2-rule block mb-4">Por onde começar</SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading max-w-3xl mb-4">
              {SOLUCOES_ORIENTATION.title}
            </h2>
            <p className="max-w-2xl text-rc2-text/75 leading-relaxed mb-10">
              {SOLUCOES_ORIENTATION.lead}
            </p>
          </ScrollReveal>

          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {SOLUCOES_ORIENTATION.items.map((item, index) => (
              <ScrollReveal
                key={item.href}
                as="li"
                delay={index * 70}
                distance="20px"
                className="rc2-card rc2-card-hover flex items-center justify-between gap-4 p-5"
              >
                <span className="text-rc2-text leading-relaxed">
                  &ldquo;{item.symptom}&rdquo;
                </span>
                <TrackedLink
                  href={item.href}
                  tracking={{
                    kind: "cta",
                    location: "solutions_orientation",
                    label: item.analyticsLabel,
                    destination: item.href,
                  }}
                  className="rc2-action-link shrink-0"
                >
                  {item.competency}
                  <ArrowRight size={14} />
                </TrackedLink>
              </ScrollReveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Competências ── */}
      <SolutionsCompetencies />

      {/* ── Como a RC2 trabalha ── */}
      <section className="bg-rc2-bg-alt rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-4">Engajamento</SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading mb-4 max-w-3xl">
              {SOLUCOES_METHOD.title}
            </h2>
            <p className="max-w-2xl text-rc2-text/75 leading-relaxed">
              {SOLUCOES_METHOD.lead}
            </p>
          </ScrollReveal>

          <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {SOLUCOES_METHOD.levels.map((level, index) => (
              <ScrollReveal
                key={level.name}
                as="li"
                delay={index * 80}
                distance="20px"
                className="rc2-card relative flex flex-col overflow-hidden p-6 pt-7"
              >
                <span
                  className="absolute left-0 top-0 h-1 w-14 bg-rc2-brand"
                  aria-hidden
                />
                <span className="rc2-label text-rc2-brand-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="rc2-h4 text-rc2-heading mt-3 mb-3">{level.name}</h3>
                <p className="text-sm text-rc2-text/75 leading-relaxed">
                  {level.description}
                </p>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Operação Gerenciada — Fase 3, preservada ── */}
      <SolutionsManagedOps />

      {/* ── CTA final ── */}
      <CTABlockBase
        title={SOLUCOES_CTAS.final.title}
        description={SOLUCOES_CTAS.final.description}
        primaryLabel={SOLUCOES_CTAS.final.label}
        primaryHref={SOLUCOES_CTAS.final.href}
        primaryTracking={{
          kind: "cta",
          location: "solutions_final_cta",
          label: SOLUCOES_CTAS.final.analyticsLabel,
          destination: SOLUCOES_CTAS.final.href,
        }}
        hideSecondary
        variant="dark"
      />
    </>
  );
}
