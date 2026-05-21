import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { buildOg } from "@/lib/siteMetadata";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageHero } from "@/components/marketing/PageHero";
import { PageAnchorNav } from "@/components/marketing/PageAnchorNav";
import { CTABlock } from "@/components/marketing/CTABlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { getSolutionBySlug, solutions } from "@/lib/content/solutions";

const BASE_URL = "https://rc2solucoes.com.br";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return solutions.map((solution) => ({ slug: solution.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolutionBySlug(slug);

  if (!solution) return {};

  const title = solution.seoTitle || solution.title;
  const url = `${BASE_URL}/solucoes/${slug}`;

  return {
    title,
    description: solution.summary,
    alternates: {
      canonical: url,
    },
    openGraph: buildOg({
      title,
      description: solution.summary,
      url,
    }),
  };
}

export default async function SolucaoPage({ params }: Props) {
  const { slug } = await params;
  const solution = getSolutionBySlug(slug);

  if (!solution) notFound();

  const schemaWebPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: solution.title,
    description: solution.summary,
    url: `${BASE_URL}/solucoes/${slug}`,
    keywords: solution.keywords,
    isPartOf: {
      "@type": "WebSite",
      url: BASE_URL,
      name: "RC2 Soluções",
    },
    publisher: {
      "@type": "Organization",
      name: "RC2 Soluções",
      url: BASE_URL,
      logo: `${BASE_URL}/images/logo-base.png`,
    },
  };

  const schemaFaq =
    solution.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: solution.faq.map((item) => ({
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
      {schemaFaq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaq) }}
        />
      )}

      <Breadcrumb
        items={[
          { label: "Soluções", href: "/solucoes" },
          { label: solution.shortTitle },
        ]}
      />

      <PageHero label="Soluções por problema" title={solution.title} description={solution.description} />

      <section className="bg-rc2-sand py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
          <div id="publico">
            <SectionLabel className="block mb-4">Para quem é esta solução</SectionLabel>
            <ul className="space-y-3">
              {solution.targetAudience.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-rc2-orange font-bold text-sm mt-0.5" aria-hidden="true">•</span>
                  <span className="text-rc2-ebony/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="sinais">
            <SectionLabel className="block mb-4">Sinais do problema</SectionLabel>
            <ul className="space-y-3">
              {solution.symptoms.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check size={16} className="text-rc2-orange shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden="true" />
                  <span className="text-rc2-ebony/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="impacto">
            <SectionLabel className="block mb-4">Impacto no negócio</SectionLabel>
            <ul className="space-y-3">
              {solution.businessImpact.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-rc2-orange font-bold text-sm mt-0.5" aria-hidden="true">→</span>
                  <span className="text-rc2-ebony/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="causas">
            <SectionLabel className="block mb-4">Causas comuns</SectionLabel>
            <ul className="space-y-3">
              {solution.rootCauses.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-rc2-orange font-bold text-sm mt-0.5" aria-hidden="true">•</span>
                  <span className="text-rc2-ebony/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="abordagem">
            <SectionLabel className="block mb-4">Caminho recomendado</SectionLabel>
            <ol className="space-y-3">
              {solution.recommendedApproach.map((item, index) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-rc2-orange text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{index + 1}</span>
                  <span className="text-rc2-ebony/80">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div id="servicos-relacionados">
            <SectionLabel className="block mb-4">Serviços relacionados</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solution.relatedServices.map((service) => (
                <article key={service.href} className="rounded-lg border border-border bg-white p-5">
                  <h3 className="font-semibold text-rc2-ebony mb-2">{service.label}</h3>
                  <p className="text-sm text-rc2-ebony/75 leading-relaxed mb-3">{service.description}</p>
                  <Link href={service.href} className="text-sm text-rc2-orange hover:underline underline-offset-4">
                    Ver serviço
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <div id="indicadores">
            <SectionLabel className="block mb-4">Indicadores para acompanhar</SectionLabel>
            <ul className="space-y-3">
              {solution.metrics.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-rc2-orange font-bold text-sm mt-0.5" aria-hidden="true">→</span>
                  <span className="text-rc2-ebony/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="faq">
            <SectionLabel className="block mb-4">Perguntas frequentes</SectionLabel>
            <div className="space-y-2">
              {solution.faq.map((item) => (
                <details key={item.question} className="group border border-border rounded-lg overflow-hidden bg-white">
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
              {solution.relatedLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-rc2-orange hover:underline underline-offset-4">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <nav
            aria-label="Navegação de retorno"
            className="pt-8 border-t border-border"
          >
            <Link href="/solucoes" className="inline-flex items-center gap-2 text-sm text-rc2-ebony/70 hover:text-rc2-ebony transition-colors">
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Todas as soluções</span>
            </Link>
          </nav>
        </div>
      </section>

      <PageAnchorNav
        items={[
          { id: "publico", label: "Público" },
          { id: "sinais", label: "Sinais" },
          { id: "impacto", label: "Impacto" },
          { id: "causas", label: "Causas" },
          { id: "abordagem", label: "Abordagem" },
          { id: "faq", label: "FAQ" },
        ]}
      />

      <CTABlock title={solution.ctaTitle} description={solution.ctaDescription} />
    </>
  );
}
