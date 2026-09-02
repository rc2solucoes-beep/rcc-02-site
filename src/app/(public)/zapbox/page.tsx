import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, CheckCircle2, Circle } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ZAPBOX_BRIDGE_BRAND,
  ZAPBOX_BRIDGE_CLOSING,
  ZAPBOX_BRIDGE_COPY,
  ZAPBOX_BRIDGE_CTA,
  ZAPBOX_BRIDGE_INTERNAL_LINKS,
  ZAPBOX_BRIDGE_LOCATION,
  ZAPBOX_BRIDGE_METADATA,
  ZAPBOX_BRIDGE_ROUTES,
  ZAPBOX_SHARED_BOUNDARY,
  ZAPBOX_TERRITORY,
  RC2_TERRITORY,
} from "@/lib/content/zapboxBridge";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";

/**
 * Ponte RC2 → Zapbox — Fase 6D (`docs/19`, `docs/20`).
 *
 * Página curta e indexável, cuja única função é explicar a relação entre a RC2
 * e o produto e encaminhar ao destino certo. **Não** duplica a landing externa:
 * sem preços, sem lista completa de recursos, sem captura de tela do produto,
 * sem formulário, sem `Product`/`Offer` schema.
 */

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: ZAPBOX_BRIDGE_METADATA.title,
    description: ZAPBOX_BRIDGE_METADATA.description,
    alternates: {
      canonical: `${BASE_URL}/zapbox`,
    },
    openGraph: buildOg({
      title: ZAPBOX_BRIDGE_METADATA.title,
      description: ZAPBOX_BRIDGE_METADATA.ogDescription,
      url: `${BASE_URL}/zapbox`,
    }),
  };
}

export default function ZapboxBridgePage() {
  // Apenas WebPage. Product/Offer/SoftwareApplication ficariam de fora por
  // decisão: preço e disponibilidade do produto vivem em www.zapbox.cloud.
  const schemaWebPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: ZAPBOX_BRIDGE_METADATA.title,
    description: ZAPBOX_BRIDGE_METADATA.description,
    url: `${BASE_URL}/zapbox`,
    isPartOf: {
      "@type": "WebSite",
      url: BASE_URL,
      name: "RC2 Soluções",
    },
  };

  const [verSolucoes, verIntegracao] = ZAPBOX_BRIDGE_INTERNAL_LINKS;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebPage) }}
      />

      {/* ── 1. Hero ── */}
      <PageHero
        label={ZAPBOX_BRIDGE_COPY.eyebrow}
        title={ZAPBOX_BRIDGE_COPY.h1}
        description={ZAPBOX_BRIDGE_COPY.subheadline}
        action={
          <TrackedLink
            href={ZAPBOX_BRIDGE_CTA.href}
            target="_blank"
            rel="noopener noreferrer"
            tracking={{
              kind: "cta",
              location: ZAPBOX_BRIDGE_LOCATION,
              label: ZAPBOX_BRIDGE_CTA.analyticsLabel,
              destination: ZAPBOX_BRIDGE_CTA.href,
            }}
            className={cn(
              buttonVariants({ variant: "default" }),
              "font-semibold tracking-wide uppercase text-xs px-8 h-12 bg-rc2-brand text-rc2-heading hover:bg-rc2-brand/90"
            )}
          >
            {ZAPBOX_BRIDGE_CTA.label}
            <ArrowUpRight size={16} aria-hidden="true" />
          </TrackedLink>
        }
      />

      {/* ── 2. Contexto de marca ── */}
      <section className="bg-rc2-bg rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal distance="18px">
            <SectionLabel className="rc2-rule block mb-4">
              {ZAPBOX_BRIDGE_BRAND.eyebrow}
            </SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading mb-6 max-w-3xl">
              {ZAPBOX_BRIDGE_BRAND.title}
            </h2>
            <div className="max-w-2xl space-y-4">
              {ZAPBOX_BRIDGE_BRAND.paragraphs.map((paragrafo) => (
                <p key={paragrafo} className="text-rc2-text/80 leading-relaxed">
                  {paragrafo}
                </p>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 3. Território do produto ── */}
      <section className="rc2-grain relative overflow-hidden bg-rc2-dark-2 rc2-section">
        <div
          className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-60"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-4 text-rc2-brand">
              Território do produto
            </SectionLabel>
            <h2 className="rc2-h2 text-rc2-dark-text mb-5 max-w-3xl">
              {ZAPBOX_TERRITORY.title}
            </h2>
            <p className="rc2-body-lg text-rc2-dark-text-secondary max-w-3xl">
              {ZAPBOX_TERRITORY.lead}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80} className="mt-10">
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {ZAPBOX_TERRITORY.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-rc2-dark-text-secondary leading-relaxed"
                >
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-rc2-brand"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={140} className="mt-10">
            <h3 className="rc2-label text-rc2-dark-text mb-4">
              Ir direto ao ponto no site do produto
            </h3>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {ZAPBOX_BRIDGE_ROUTES.map((rota) => (
                <li key={rota.href}>
                  <TrackedLink
                    href={rota.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    tracking={{
                      kind: "cta",
                      location: ZAPBOX_BRIDGE_LOCATION,
                      label: rota.analyticsLabel,
                      destination: rota.href,
                    }}
                    className="ui-focus-ring flex h-full items-center justify-between gap-3 rounded-xl border border-rc2-dark-border bg-rc2-dark-elevated p-5 text-sm font-semibold text-rc2-dark-text transition-[border-color,opacity] duration-200 hover:opacity-90"
                  >
                    {rota.intent}
                    <ArrowUpRight size={15} className="shrink-0" aria-hidden="true" />
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 4. Território da RC2 ── */}
      <section className="bg-rc2-bg-alt rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-4">
              Território da RC2
            </SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading mb-5 max-w-3xl">
              {RC2_TERRITORY.title}
            </h2>
            <p className="rc2-body-lg text-rc2-text/80 max-w-3xl">
              {RC2_TERRITORY.lead}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80} className="mt-10 max-w-3xl">
            <ul className="space-y-2.5">
              {RC2_TERRITORY.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-rc2-text/75 leading-relaxed"
                >
                  <Circle
                    size={7}
                    className="mt-2 shrink-0 text-rc2-brand"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={140} className="mt-8">
            <TrackedLink
              href={verSolucoes.href}
              tracking={{
                kind: "cta",
                location: ZAPBOX_BRIDGE_LOCATION,
                label: verSolucoes.analyticsLabel,
                destination: verSolucoes.href,
              }}
              className="rc2-action-link"
            >
              {verSolucoes.label}
              <ArrowRight size={14} aria-hidden="true" />
            </TrackedLink>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 5. Fronteira compartilhada ── */}
      <section className="bg-rc2-bg rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-4">
              Onde os dois se encontram
            </SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading mb-6 max-w-3xl">
              {ZAPBOX_SHARED_BOUNDARY.title}
            </h2>
            <div className="max-w-2xl space-y-4">
              {ZAPBOX_SHARED_BOUNDARY.paragraphs.map((paragrafo) => (
                <p key={paragrafo} className="text-rc2-text/80 leading-relaxed">
                  {paragrafo}
                </p>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100} className="mt-8">
            <TrackedLink
              href={verIntegracao.href}
              tracking={{
                kind: "cta",
                location: ZAPBOX_BRIDGE_LOCATION,
                label: verIntegracao.analyticsLabel,
                destination: verIntegracao.href,
              }}
              className="rc2-action-link"
            >
              {verIntegracao.label}
              <ArrowRight size={14} aria-hidden="true" />
            </TrackedLink>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 6. CTA final ── */}
      <section className="rc2-grain relative overflow-hidden bg-rc2-dark rc2-section">
        <div
          className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-60"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="rc2-h2 text-rc2-dark-text mb-4 max-w-2xl">
              {ZAPBOX_BRIDGE_CLOSING.title}
            </h2>
            <p className="text-rc2-dark-text-secondary leading-relaxed max-w-2xl mb-8">
              {ZAPBOX_BRIDGE_CLOSING.paragraph}
            </p>
            <TrackedLink
              href={ZAPBOX_BRIDGE_CTA.href}
              target="_blank"
              rel="noopener noreferrer"
              tracking={{
                kind: "cta",
                location: ZAPBOX_BRIDGE_LOCATION,
                label: ZAPBOX_BRIDGE_CTA.analyticsLabel,
                destination: ZAPBOX_BRIDGE_CTA.href,
              }}
              className={cn(
                buttonVariants({ variant: "default" }),
                "font-semibold tracking-wide uppercase text-xs px-8 h-12 bg-rc2-brand text-rc2-heading hover:bg-rc2-brand/90"
              )}
            >
              {ZAPBOX_BRIDGE_CTA.label}
              <ArrowUpRight size={16} aria-hidden="true" />
            </TrackedLink>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
