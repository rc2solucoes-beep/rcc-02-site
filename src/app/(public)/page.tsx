import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { buildOg, BASE_URL } from "@/lib/siteMetadata";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { HomeCtaBlock } from "@/components/marketing/HomeCtaBlock";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { HeroActions } from "@/components/marketing/HeroActions";
import { KineticHeadline } from "@/components/marketing/home/KineticHeadline";
import { HomeProblems } from "@/components/marketing/home/HomeProblems";
import { HomeCompetencies } from "@/components/marketing/home/HomeCompetencies";
import { HomeProducts } from "@/components/marketing/home/HomeProducts";
import { HomeMethod } from "@/components/marketing/home/HomeMethod";
import { HomeAuthority } from "@/components/marketing/home/HomeAuthority";
import { HomeContent } from "@/components/marketing/home/HomeContent";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  HOME_COPY,
  HOME_DEMOS,
  HOME_PHILOSOPHY,
  HOME_HERO_KINETIC,
} from "@/lib/content/home";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

const HOME_TITLE = "RC2 Soluções — Automação, Integrações e IA para Operações";
const HOME_DESCRIPTION =
  "Consultoria e implementação de automação de processos, integração de sistemas e IA para operações de PMEs que cresceram e precisam funcionar melhor.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    alternates: { canonical: `${BASE_URL}/` },
    openGraph: buildOg({
      url: BASE_URL,
      title: HOME_TITLE,
      description:
        "Automação de processos, integração de sistemas e IA para operações. Para PMEs cuja operação cresceu e precisa funcionar melhor.",
      imageUrl: settings.og_image_url,
    }),
  };
}

/**
 * O H1 aprovado é a fonte: o prefixo e o sufixo são fatiados dele em torno da
 * palavra cinética, de modo que mudar `HOME_COPY.h1` mude a frase renderizada e
 * nunca exista uma segunda cópia da copy para divergir.
 */
const kineticAt = HOME_COPY.h1.indexOf(HOME_HERO_KINETIC.word);
const heroPrefix = HOME_COPY.h1.slice(0, kineticAt);
const heroSuffix = HOME_COPY.h1.slice(kineticAt + HOME_HERO_KINETIC.word.length);

export default async function HomePage() {
  let schemaWebPage;

  try {
    const settings = await getOrgSettings();
    schemaWebPage = getWebPageSchema(
      settings,
      {
        title: HOME_TITLE,
        description: HOME_DESCRIPTION,
        url: BASE_URL,
        keywords:
          "automação de processos, integração de sistemas, IA para operações, operações digitais e commerce, consultoria de operação, PME",
        image: `${BASE_URL}/og-image.png`,
      },
      BASE_URL
    );
  } catch (error) {
    console.error("Error loading schema:", error);
    schemaWebPage = { "@context": "https://schema.org", "@type": "WebPage" };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebPage) }}
      />

      {/* ── 1. Hero ── */}
      {/* Hero sem grid: a v2.2 pede base clara e silenciosa — a textura
          competia com a headline em vez de sustentá-la. */}
      {/* Momento de assinatura: o hero é o primeiro pico de peso visual da
          página, com o respiro que a §6 reserva para acontecimentos. */}
      <section className="rc2-grain rc2-hero-stage relative overflow-hidden bg-rc2-bg rc2-section--signature">
        {/* O módulo diagramático saiu (§8 Sections): fluxograma e nó-e-seta no
            hero estão na lista de "evitar" da §11. O hero passa a ser um gesto
            único — headline, subtexto e CTAs — e a evidência técnica desce para
            as seções que a sustentam. */}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="rc2-hero-enter rc2-hero-enter--1">
              <SectionLabel className="rc2-rule block mb-5">
                {HOME_COPY.eyebrow}
              </SectionLabel>
            </div>
            <KineticHeadline
              className="rc2-hero-signature rc2-hero-shift rc2-hero-enter--2 text-rc2-heading text-balance"
              prefix={heroPrefix}
              word={HOME_HERO_KINETIC.word}
              suffix={heroSuffix}
              alternates={HOME_HERO_KINETIC.alternates}
              fullText={HOME_COPY.h1}
            />
            <p className="rc2-body-lg rc2-hero-shift rc2-hero-enter--3 mt-8 text-rc2-text/75 max-w-2xl">
              {HOME_COPY.subheadline}
            </p>

            <div className="rc2-hero-enter rc2-hero-enter--4 mt-10">
              <HeroActions />
            </div>

            <p className="rc2-hero-enter rc2-hero-enter--6 mt-8 text-xs italic text-rc2-text/60">
              &ldquo;{HOME_COPY.signature}&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. Problemas ── */}
      <HomeProblems />

      {/* ── 3. Competências ── */}
      <HomeCompetencies />

      {/* ── 4. Produtos ── */}
      <HomeProducts />

      {/* ── 5. Método ── */}
      <HomeMethod />

      {/* ── 6. Autoridade e prova ── */}
      <HomeAuthority />

      {/* ── 7. Demonstrações ── */}
      <section className="rc2-grain relative overflow-hidden bg-rc2-dark-2 rc2-section">
        <div className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-5 text-rc2-brand">
              Demonstrações
            </SectionLabel>
            <h2 className="rc2-h2 text-rc2-dark-text mb-12 max-w-2xl">
              Tecnologia que você pode ver funcionando.
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {HOME_DEMOS.map((demo, index) => (
              <ScrollReveal
                key={demo.title}
                delay={index * 90}
                className="rounded-xl border border-rc2-dark-border bg-rc2-dark-elevated p-6 md:p-7"
              >
                <h3 className="text-lg font-semibold text-rc2-dark-text mb-3">
                  {demo.title}
                </h3>
                <p className="text-sm text-rc2-dark-text-secondary leading-relaxed">
                  {demo.description}
                </p>
                {/*
                  Dois demos com link: o Zapbox, interno (`/zapbox`), e a
                  Valéria, que atende no WhatsApp e portanto sai do domínio —
                  o caso que o comentário anterior deixou previsto.
                */}
                {demo.href && demo.ctaLabel && demo.analyticsLabel && (
                  <TrackedLink
                    href={demo.href}
                    {...(demo.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    tracking={{
                      kind: demo.external ? "whatsapp" : "cta",
                      location: "home_demos",
                      label: demo.analyticsLabel,
                      destination: demo.href,
                    }}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rc2-dark-text hover:underline transition-[color,text-decoration-color] duration-200 underline-offset-4"
                  >
                    {demo.ctaLabel}
                    {demo.external && <ArrowUpRight size={14} aria-hidden />}
                  </TrackedLink>
                )}
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Filosofia ── */}
      {/* Base, não alt: a seção seguinte já é alt e as duas juntas criavam
          1700px de tom idêntico. O passo tonal recria o ritmo antes do CTA. */}
      <section className="bg-rc2-bg rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-5">Como pensamos</SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading mb-8 max-w-3xl">
              {HOME_PHILOSOPHY.thesis}
            </h2>
            <ul className="space-y-3 max-w-2xl">
              {HOME_PHILOSOPHY.points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-rc2-text/80 leading-relaxed"
                >
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-rc2-brand" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xl md:text-2xl font-semibold text-rc2-heading leading-snug max-w-3xl">
              {HOME_PHILOSOPHY.closing}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 9. Conteúdo ── */}
      <HomeContent />

      {/* ── 10. CTA final ── */}
      <HomeCtaBlock />
    </>
  );
}
