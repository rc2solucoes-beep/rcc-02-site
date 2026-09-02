import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { services, getServiceBySlug } from "@/lib/content/services";
import { solutions } from "@/lib/content/solutions";
import {
  MIGRATED_SERVICE_SLUGS,
  MIGRATED_SOLUTION_SLUGS,
} from "@/lib/content/migratedRoutes";
import { PageHero } from "@/components/marketing/PageHero";
import { CTABlock } from "@/components/marketing/CTABlock";
import { PageAnchorNav } from "@/components/marketing/PageAnchorNav";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

type Props = { params: Promise<{ slug: string }> };

/** Slugs migrados para âncoras de /solucoes — ver docs/16 §10. */

export async function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  const settings = await getOrgSettings();
  const title = service.seoTitle || service.title;

  return {
    title,
    description: service.summary,
    openGraph: buildOg({
      title,
      description: service.summary,
      url: `${BASE_URL}/servicos/${slug}`,
      imageUrl: settings.og_image_url,
    }),
    alternates: { canonical: `${BASE_URL}/servicos/${slug}` },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) notFound();

  // Serviços cuja URL passou a redirecionar saem da navegação sequencial:
  // prev/next não pode oferecer um destino que redireciona (docs/16 §10).
  const navigableServices = services.filter(
    (s) => !MIGRATED_SERVICE_SLUGS.has(s.slug)
  );
  const currentIndex = navigableServices.findIndex((s) => s.slug === slug);
  const next = currentIndex >= 0 ? navigableServices[currentIndex + 1] : undefined;
  const prev = currentIndex >= 0 ? navigableServices[currentIndex - 1] : undefined;
  // O lookup reverso usa `href` como chave. Uma solução que redireciona não
  // pode ser oferecida como destino aqui (docs/22 §12).
  const relatedSolution = solutions.find(
    (solution) =>
      !MIGRATED_SOLUTION_SLUGS.has(solution.slug) &&
      solution.relatedServices.some(
        (relatedService) => relatedService.href === `/servicos/${slug}`
      )
  );
  const topPainPoints = service.painPoints.slice(0, 3);
  const topUseCases = service.useCases.slice(0, 5);
  const topItems = service.items.slice(0, 6);
  const topIntegrations = service.integrations.slice(0, 8);
  const topMetrics = service.metrics.slice(0, 5);
  const topBenefits = service.benefits.slice(0, 5);
  const topFaq = service.faq.slice(0, 5);
  const serviceWhatsappMessage = `Olá, quero avaliar ${service.shortTitle} para minha empresa.`;
  const serviceWhatsappUrl = `https://wa.me/5511988028550?text=${encodeURIComponent(serviceWhatsappMessage)}`;

  let schemaWebPage;

  try {
    const settings = await getOrgSettings();
    schemaWebPage = getWebPageSchema(
      settings,
      {
        title: service.seoTitle || service.title,
        description: service.summary,
        url: `${BASE_URL}/servicos/${slug}`,
        keywords: service.keywords,
        image: `${BASE_URL}/og-image.png`,
      },
      BASE_URL
    );
  } catch (error) {
    console.error("Error loading schema:", error);
    schemaWebPage = { "@context": "https://schema.org", "@type": "WebPage" };
  }

  const schemaService = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    alternateName: service.shortTitle,
    serviceType: service.shortTitle,
    description: service.summary,
    provider: {
      "@type": "Organization",
      name: "RC2 Soluções",
      url: BASE_URL,
    },
    url: `${BASE_URL}/servicos/${slug}`,
    areaServed: { "@type": "Country", name: "Brazil" },
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Pequenas e médias empresas",
    },
    keywords: service.keywords,
  };

  const schemaFaq =
    service.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: service.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaService) }}
      />
      {schemaFaq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaq) }}
        />
      )}
      <Breadcrumb
        items={[
          { label: "Serviços", href: "/servicos" },
          { label: service.shortTitle },
        ]}
      />

      <PageHero
        label="Serviços"
        title={service.title}
        description={service.description}
      />

      <section className="bg-rc2-bg py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
          <ScrollReveal className="rounded-lg border border-border bg-white p-5 md:p-6">
            <SectionLabel className="block mb-3">Resumo rápido</SectionLabel>
            <h2 className="text-lg font-semibold text-rc2-heading mb-3">
              Este serviço é indicado quando sua operação enfrenta:
            </h2>
            <ul className="space-y-2">
              {topPainPoints.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-rc2-text/80">
                  <span className="text-rc2-brand-text mt-0.5 text-xs shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-rc2-text/75 leading-relaxed">
              <span className="font-semibold text-rc2-heading">Quando contratar:</span> quando essas dores já afetam atendimento, vendas ou rotina da equipe.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80} className="rounded-lg border border-rc2-brand/25 bg-white p-5 md:p-6">
            <SectionLabel className="block mb-3">Atalho rápido</SectionLabel>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-rc2-text/75">
                Se este cenário já descreve sua operação, você pode acelerar o próximo passo.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <TrackedLink
                  href={serviceWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  tracking={{
                    kind: "whatsapp",
                    location: "service_detail_midpoint",
                    label: "falar_pelo_whatsapp",
                    destination: serviceWhatsappUrl,
                  }}
                  className="text-sm font-semibold text-rc2-brand-text hover:underline underline-offset-4"
                >
                  Falar pelo WhatsApp
                </TrackedLink>
                {relatedSolution && (
                  <TrackedLink
                    href={`/solucoes/${relatedSolution.slug}`}
                    tracking={{
                      kind: "solution_link",
                      location: "service_detail_midpoint",
                      label: relatedSolution.shortTitle,
                      destination: `/solucoes/${relatedSolution.slug}`,
                      source_page: `/servicos/${slug}`,
                      source_type: "service_page",
                    }}
                    className="text-sm text-rc2-text/75 hover:text-rc2-text hover:underline underline-offset-4"
                  >
                    Ver solução por problema relacionada
                  </TrackedLink>
                )}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal id="problemas" direction="left" distance="22px">
            <SectionLabel className="block mb-4">Problemas que resolvemos</SectionLabel>
            <ul className="space-y-3">
              {service.painPoints.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-rc2-brand-text font-bold text-sm mt-0.5" aria-hidden="true">•</span>
                  <span className="text-rc2-text/80">{item}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal id="casos-de-uso" direction="right" distance="22px">
            <SectionLabel className="block mb-4">Casos de uso</SectionLabel>
            <ul className="space-y-3">
              {topUseCases.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check size={16} className="text-rc2-brand-text shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden="true" />
                  <span className="text-rc2-text/80">{item}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal id="items" direction="left" distance="22px">
            <SectionLabel className="block mb-4">O que pode ser implantado</SectionLabel>
            <ul className="space-y-3">
              {topItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check size={16} className="text-rc2-brand-text shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden="true" />
                  <span className="text-rc2-text/80">{item}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal id="implantacao" direction="right" distance="22px">
            <SectionLabel className="block mb-4">Como funciona a implantação</SectionLabel>
            <ol className="space-y-3">
              {service.implementationSteps.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-rc2-brand text-rc2-heading text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-rc2-text/80">{item}</span>
                </li>
              ))}
            </ol>
          </ScrollReveal>

          <ScrollReveal id="integracoes">
            <SectionLabel className="block mb-4">Integrações possíveis</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {topIntegrations.map((integration) => (
                <span key={integration} className="px-3 py-1.5 rounded bg-white border border-border text-sm text-rc2-text/80">
                  {integration}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal id="indicadores" direction="left" distance="22px">
            <SectionLabel className="block mb-4">Indicadores que podem ser acompanhados</SectionLabel>
            <ul className="space-y-3">
              {topMetrics.map((metric, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-rc2-brand-text font-bold text-sm mt-0.5" aria-hidden="true">→</span>
                  <span className="text-rc2-text/80">{metric}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal id="benefits" direction="right" distance="22px">
            <SectionLabel className="block mb-4">Benefícios</SectionLabel>
            <ul className="space-y-3 mb-8">
              {topBenefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-rc2-brand-text font-bold text-sm mt-0.5" aria-hidden="true">→</span>
                  <span className="text-rc2-text/80">{benefit}</span>
                </li>
              ))}
            </ul>
            <blockquote className="rc2-quote-card text-sm">
              {service.cta}
            </blockquote>
            <div className="mt-8">
              <TrackedLink
                href="/contato"
                tracking={{ kind: "cta", location: "service_detail_benefits", label: "solicitar_diagnostico", destination: "/contato" }}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "font-semibold tracking-wide uppercase text-xs px-8 h-11 bg-rc2-brand text-rc2-heading hover:bg-rc2-brand/90"
                )}
              >
                Ver se serve para o meu caso
              </TrackedLink>
            </div>
          </ScrollReveal>

          <ScrollReveal id="faq" direction="none">
            <SectionLabel className="block mb-4">Perguntas frequentes</SectionLabel>
            <div className="space-y-2">
              {topFaq.map((item, idx) => (
                <details key={idx} className="group border border-border rounded-lg overflow-hidden bg-white">
                  <summary className="px-4 py-3 cursor-pointer list-none text-rc2-heading font-medium hover:bg-rc2-text/[0.02]">
                    {item.question}
                  </summary>
                  <div className="px-4 pb-4 text-sm text-rc2-text/75 leading-relaxed border-t border-border">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal id="links-relacionados">
            <SectionLabel className="block mb-4">Links relacionados</SectionLabel>
            <div className="flex flex-wrap gap-3">
              {service.relatedLinks.map((link) => (
                <TrackedLink
                  key={link.href}
                  href={link.href}
                  tracking={{
                    kind: "related_link",
                    location: "service_related_links",
                    label: link.label,
                    destination: link.href,
                    source_page: `/servicos/${slug}`,
                    source_type: "service_page",
                  }}
                  className="text-sm text-rc2-brand-text hover:underline underline-offset-4"
                >
                  {link.label}
                </TrackedLink>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal
            as="div"
            direction="none"
          >
          <nav
            id="navigation"
            aria-label="Navegação entre serviços"
            className="pt-8 border-t border-border flex flex-col sm:flex-row items-start justify-between gap-6"
          >
            <div>
              {prev && (
                <TrackedLink
                  href={`/servicos/${prev.slug}`}
                  tracking={{
                    kind: "service_link",
                    location: "service_navigation_prev",
                    label: prev.shortTitle,
                    destination: `/servicos/${prev.slug}`,
                    source_page: `/servicos/${slug}`,
                    source_type: "service_page",
                  }}
                  className="flex items-center gap-2 text-sm text-rc2-text/70 hover:text-rc2-text transition-colors"
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  <span>{prev.shortTitle}</span>
                </TrackedLink>
              )}
            </div>
            <Link
              href="/servicos"
              className="text-sm text-rc2-text/70 hover:text-rc2-text transition-colors"
            >
              ← Todos os serviços
            </Link>
            <div>
              {next && (
                <TrackedLink
                  href={`/servicos/${next.slug}`}
                  tracking={{
                    kind: "service_link",
                    location: "service_navigation_next",
                    label: next.shortTitle,
                    destination: `/servicos/${next.slug}`,
                    source_page: `/servicos/${slug}`,
                    source_type: "service_page",
                  }}
                  className="flex items-center gap-2 text-sm text-rc2-text/70 hover:text-rc2-text transition-colors"
                >
                  <span>{next.shortTitle}</span>
                  <ArrowLeft size={14} className="rotate-180" aria-hidden="true" />
                </TrackedLink>
              )}
            </div>
          </nav>
          </ScrollReveal>
        </div>
      </section>

      <PageAnchorNav
        items={[
          { id: "problemas", label: "Problemas" },
          { id: "casos-de-uso", label: "Casos de uso" },
          { id: "implantacao", label: "Implantação" },
          { id: "integracoes", label: "Integrações" },
          { id: "indicadores", label: "Indicadores" },
          { id: "faq", label: "FAQ" },
        ]}
      />

      <CTABlock
        title="Esse serviço faz sentido para você?"
        description="Fale com a RC2 sobre sua operação e veja como podemos ajudar."
        primaryLabel="Aplicar isso na minha operação"
        secondaryHref={serviceWhatsappUrl}
      />
    </>
  );
}
