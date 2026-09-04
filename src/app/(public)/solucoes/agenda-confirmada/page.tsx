import type { Metadata } from "next";
import { XCircle } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { CTABlock } from "@/components/marketing/CTABlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SignalList } from "@/components/ui/SignalList";
import { NumberedList } from "@/components/ui/NumberedList";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { buttonVariants } from "@/components/ui/button";
import {
  AGENDA_CONFIRMADA as C,
  AGENDA_CONFIRMADA_METADATA as META,
  AGENDA_CONFIRMADA_ROUTE as ROUTE,
} from "@/lib/content/agendaConfirmada";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";

/**
 * Agenda Confirmada — Fase 6.
 *
 * Tratamento visual do template "landing por problema" (§9 da direção de arte):
 * hero tipográfico → sinais do problema → sequência numerada → CTA final.
 *
 * Duas decisões que valem registro:
 *
 * 1. **O "Como funciona" não é fluxograma.** O §6 das Correções desenha nós e
 *    setas; aqui vira `NumberedList`, a mesma sequência lida como etapas. O
 *    Princípio 5 escopa a proibição de fluxograma ao hero, mas a disciplina
 *    contra clichê visual vale para a página inteira.
 * 2. **Nenhuma afirmação de base técnica.** A lacuna U-4 (`docs/18` §12.2)
 *    segue aberta: nada aqui diz sobre o que a solução roda.
 */

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: META.title,
    description: META.description,
    keywords: META.keywords,
    alternates: { canonical: `${BASE_URL}${ROUTE}` },
    openGraph: buildOg({
      title: META.title,
      description: META.description,
      url: `${BASE_URL}${ROUTE}`,
    }),
  };
}

export default function AgendaConfirmadaPage() {
  // Só WebPage. Sem Product/Offer: não há preço, disponibilidade nem escopo
  // por versão aprovado em nenhuma fonte.
  const schemaWebPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: META.title,
    description: META.description,
    url: `${BASE_URL}${ROUTE}`,
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
      <main id="main-content">
        <PageHero
          label={C.eyebrow}
          title={C.h1}
          description={C.lead}
          className="rc2-section--opening"
          action={
            <TrackedLink
              href={C.heroCta.href}
              tracking={{
                kind: "cta",
                location: "agenda_confirmada_hero",
                label: C.heroCta.analyticsLabel,
                destination: C.heroCta.href,
              }}
              className={buttonVariants({ variant: "brand", size: "brand-lg" })}
            >
              {C.heroCta.label}
            </TrackedLink>
          }
        />

        {/* ── Problema ── */}
        <section className="bg-rc2-bg-alt rc2-section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <SectionLabel className="rc2-rule block mb-5">
                {C.problemLabel}
              </SectionLabel>
              <h2 className="rc2-h2 text-rc2-heading mb-8 max-w-2xl">
                {C.problemTitle}
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={80} className="max-w-3xl">
              <SignalList items={C.problems} tone="signal" columns={2} />
            </ScrollReveal>
          </div>
        </section>

        {/* ── Como funciona ── */}
        <section className="bg-rc2-bg rc2-section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <SectionLabel className="rc2-rule block mb-5">
                {C.howLabel}
              </SectionLabel>
              <h2 className="rc2-h2 text-rc2-heading mb-10 max-w-2xl">
                {C.howTitle}
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={80} className="max-w-3xl">
              <NumberedList items={C.how} />
            </ScrollReveal>
          </div>
        </section>

        {/* ── Versões ── */}
        <section className="bg-rc2-bg-alt rc2-section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <SectionLabel className="rc2-rule block mb-5">
                {C.versionsLabel}
              </SectionLabel>
              <h2 className="rc2-h2 text-rc2-heading mb-4 max-w-2xl">
                {C.versionsTitle}
              </h2>
              <p className="rc2-body text-rc2-text/75 mb-10 max-w-2xl">
                {C.versionsNote}
              </p>
            </ScrollReveal>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {C.versions.map((version, index) => (
                <ScrollReveal
                  as="li"
                  key={version}
                  delay={index * 70}
                  className="rc2-card p-5"
                >
                  <span className="rc2-label text-rc2-text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-3 font-semibold text-rc2-heading">
                    {version}
                  </p>
                </ScrollReveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ── O que não faz ── */}
        <section className="bg-rc2-bg rc2-section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="max-w-3xl">
              <SectionLabel className="rc2-rule block mb-5">
                {C.boundaryLabel}
              </SectionLabel>
              <h2 className="rc2-h2 text-rc2-heading mb-4">
                {C.boundaryTitle}
              </h2>
              <p className="rc2-body text-rc2-text/75 mb-8">
                {C.boundaryIntro}
              </p>
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {C.boundaries.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 leading-relaxed text-rc2-text/75"
                  >
                    <XCircle
                      size={16}
                      strokeWidth={1.5}
                      className="mt-1 shrink-0 text-rc2-text-secondary"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </section>

        <CTABlock
          title={C.finalCta.title}
          description={C.finalCta.description}
          primaryLabel={C.finalCta.label}
          primaryHref={C.finalCta.href}
          className="rc2-section--closing"
        />
      </main>
    </>
  );
}
