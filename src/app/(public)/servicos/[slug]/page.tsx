import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildOg } from "@/lib/siteMetadata";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { services, getServiceBySlug } from "@/lib/content/services";
import { PageHero } from "@/components/marketing/PageHero";
import { CTABlock } from "@/components/marketing/CTABlock";
import { PageAnchorNav } from "@/components/marketing/PageAnchorNav";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

const BASE_URL = "https://rc2solucoes.com.br";

type Props = { params: Promise<{ slug: string }> };

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

  const currentIndex = services.findIndex((s) => s.slug === slug);
  const next = services[currentIndex + 1];
  const prev = services[currentIndex - 1];

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

      <section className="bg-rc2-sand py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
          <div id="problemas">
            <SectionLabel className="block mb-4">Problemas que resolvemos</SectionLabel>
            <ul className="space-y-3">
              {service.painPoints.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-rc2-orange font-bold text-sm mt-0.5" aria-hidden="true">•</span>
                  <span className="text-rc2-ebony/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="casos-de-uso">
            <SectionLabel className="block mb-4">Casos de uso</SectionLabel>
            <ul className="space-y-3">
              {service.useCases.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check size={16} className="text-rc2-orange shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden="true" />
                  <span className="text-rc2-ebony/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="items">
            <SectionLabel className="block mb-4">O que pode ser implantado</SectionLabel>
            <ul className="space-y-3">
              {service.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check size={16} className="text-rc2-orange shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden="true" />
                  <span className="text-rc2-ebony/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="implantacao">
            <SectionLabel className="block mb-4">Como funciona a implantação</SectionLabel>
            <ol className="space-y-3">
              {service.implementationSteps.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-rc2-orange text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-rc2-ebony/80">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div id="integracoes">
            <SectionLabel className="block mb-4">Integrações possíveis</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {service.integrations.map((integration) => (
                <span key={integration} className="px-3 py-1.5 rounded bg-white border border-border text-sm text-rc2-ebony/80">
                  {integration}
                </span>
              ))}
            </div>
          </div>

          <div id="indicadores">
            <SectionLabel className="block mb-4">Indicadores que podem ser acompanhados</SectionLabel>
            <ul className="space-y-3">
              {service.metrics.map((metric, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-rc2-orange font-bold text-sm mt-0.5" aria-hidden="true">→</span>
                  <span className="text-rc2-ebony/80">{metric}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="benefits">
            <SectionLabel className="block mb-4">Benefícios</SectionLabel>
            <ul className="space-y-3 mb-8">
              {service.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-rc2-orange font-bold text-sm mt-0.5" aria-hidden="true">→</span>
                  <span className="text-rc2-ebony/80">{benefit}</span>
                </li>
              ))}
            </ul>
            <blockquote className="border-l-2 border-rc2-orange pl-4 text-rc2-ebony/70 italic text-sm leading-relaxed">
              {service.cta}
            </blockquote>
            <div className="mt-8">
              <TrackedLink
                href="/contato"
                tracking={{ kind: "cta", location: "service_detail_benefits", label: "solicitar_diagnostico", destination: "/contato" }}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "font-semibold tracking-wide uppercase text-xs px-8 h-11 bg-rc2-orange text-rc2-sand hover:bg-rc2-orange/90"
                )}
              >
                Solicitar diagnóstico
              </TrackedLink>
            </div>
          </div>

          <div id="faq">
            <SectionLabel className="block mb-4">Perguntas frequentes</SectionLabel>
            <div className="space-y-2">
              {service.faq.map((item, idx) => (
                <details key={idx} className="group border border-border rounded-lg overflow-hidden bg-white">
                  <summary className="px-4 py-3 cursor-pointer list-none text-rc2-ebony font-medium hover:bg-rc2-ebony/[0.02]">
                    {item.question}
                  </summary>
                  <div className="px-4 pb-4 text-sm text-rc2-ebony/75 leading-relaxed border-t border-border">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div id="links-relacionados">
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
                  className="text-sm text-rc2-orange hover:underline underline-offset-4"
                >
                  {link.label}
                </TrackedLink>
              ))}
            </div>
          </div>

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
                  className="flex items-center gap-2 text-sm text-rc2-ebony/70 hover:text-rc2-ebony transition-colors"
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  <span>{prev.shortTitle}</span>
                </TrackedLink>
              )}
            </div>
            <Link
              href="/servicos"
              className="text-sm text-rc2-ebony/70 hover:text-rc2-ebony transition-colors"
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
                  className="flex items-center gap-2 text-sm text-rc2-ebony/70 hover:text-rc2-ebony transition-colors"
                >
                  <span>{next.shortTitle}</span>
                  <ArrowLeft size={14} className="rotate-180" aria-hidden="true" />
                </TrackedLink>
              )}
            </div>
          </nav>
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
        description="Solicite um diagnóstico gratuito e descubra como podemos ajudar sua operação."
      />
    </>
  );
}
