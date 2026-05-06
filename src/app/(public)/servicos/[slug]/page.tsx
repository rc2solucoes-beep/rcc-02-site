import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { services, getServiceBySlug } from "@/lib/content/services";
import { PageHero } from "@/components/marketing/PageHero";
import { CTABlock } from "@/components/marketing/CTABlock";
import { PageAnchorNav } from "@/components/marketing/PageAnchorNav";
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
  return {
    title: service.title,
    description: service.summary,
    openGraph: {
      title: service.title,
      description: service.summary,
      url: `${BASE_URL}/servicos/${slug}`,
    },
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
        title: service.title,
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
    description: service.summary,
    provider: {
      "@type": "Organization",
      name: "RC2 Soluções",
      url: BASE_URL,
    },
    url: `${BASE_URL}/servicos/${slug}`,
    areaServed: { "@type": "Country", name: "Brazil" },
  };

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
      <Breadcrumb items={[
        { label: "Serviços", href: "/servicos" },
        { label: service.shortTitle },
      ]} />

      <PageHero
        label="Serviços"
        title={service.title}
        description={service.description}
      />

      <section className="bg-rc2-sand py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* O que pode ser implantado */}
            <div id="items">
              <SectionLabel className="block mb-4">O que pode ser implantado</SectionLabel>
              <ul className="space-y-3">
                {service.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check
                      size={16}
                      className="text-rc2-orange shrink-0 mt-0.5"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    <span className="text-rc2-ebony/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefícios */}
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
                <Link
                  href="/contato"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "font-semibold tracking-wide uppercase text-xs px-8 h-11 bg-rc2-orange text-rc2-sand hover:bg-rc2-orange/90"
                  )}
                >
                  Solicitar diagnóstico
                </Link>
              </div>
            </div>
          </div>

          {/* Repeated CTA before navigation */}
          <div className="mt-12 mb-8 md:hidden">
            <Link
              href="/contato"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full font-semibold tracking-wide uppercase text-xs h-12 bg-rc2-orange text-rc2-sand hover:bg-rc2-orange/90"
              )}
            >
              Solicitar diagnóstico
            </Link>
          </div>

          {/* Navigation between services */}
          <nav
            id="navigation"
            aria-label="Navegação entre serviços"
            className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-start justify-between gap-6"
          >
            <div>
              {prev && (
                <Link
                  href={`/servicos/${prev.slug}`}
                  className="flex items-center gap-2 text-sm text-rc2-ebony/70 hover:text-rc2-ebony transition-colors"
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  <span>{prev.shortTitle}</span>
                </Link>
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
                <Link
                  href={`/servicos/${next.slug}`}
                  className="flex items-center gap-2 text-sm text-rc2-ebony/70 hover:text-rc2-ebony transition-colors"
                >
                  <span>{next.shortTitle}</span>
                  <ArrowLeft size={14} className="rotate-180" aria-hidden="true" />
                </Link>
              )}
            </div>
          </nav>
        </div>
      </section>

      <PageAnchorNav
        items={[
          { id: "items", label: "O que pode ser implantado" },
          { id: "benefits", label: "Benefícios" },
          { id: "navigation", label: "Navegação" },
        ]}
      />

      <CTABlock
        title="Esse serviço faz sentido para você?"
        description="Solicite um diagnóstico gratuito e descubra como podemos ajudar sua operação."
      />
    </>
  );
}
