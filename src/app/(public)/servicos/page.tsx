import type { Metadata } from "next";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";
import { Check } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { ServicesCtaBlock } from "@/components/marketing/ServicesCtaBlock";
import { services } from "@/lib/content/services";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: "Serviços",
    description:
      "Serviços para PMEs que precisam responder mais rápido, perder menos leads e reduzir retrabalho com IA, automações e integrações.",
    alternates: { canonical: `${BASE_URL}/servicos` },
    openGraph: buildOg({
      url: `${BASE_URL}/servicos`,
      title: "Serviços — RC2 Soluções",
      description: "Serviços para organizar atendimento, conectar sistemas e melhorar vendas com IA e automações.",
      imageUrl: settings.og_image_url,
    }),
  };
}

export default async function ServicosPage() {
  let schemaWebPage;

  try {
    const settings = await getOrgSettings();
    schemaWebPage = getWebPageSchema(
      settings,
      {
        title: "Serviços",
        description:
          "Serviços para PMEs que precisam responder mais rápido, perder menos leads e reduzir retrabalho com IA, automações e integrações.",
        url: `${BASE_URL}/servicos`,
        keywords: "serviços, automação, IA, integrações, e-commerce, sites, consultoria, PME, n8n, agentes inteligentes",
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
      <PageHero
        label="Serviços"
        title="Cinco serviços para resolver gargalos reais da sua operação."
        description="Da organização do atendimento à integração entre sistemas, a RC2 conecta tecnologia ao que trava vendas, atendimento e produtividade no dia a dia."
        className="rc2-section--opening"
      />

      <section className="bg-rc2-bg rc2-section rc2-section--proof">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal distance="20px">
            <div className="relative mb-10 overflow-hidden rounded-xl border border-rc2-surface-2 bg-rc2-bg-alt p-6 pt-7 md:p-8 md:pt-9">
              <span className="absolute left-0 top-0 h-1 w-10 bg-rc2-brand" aria-hidden />
              <SectionLabel className="rc2-rule block mb-3">Soluções por problema</SectionLabel>
              <h2 className="rc2-h4 mb-3 text-rc2-heading">
                Comece pela dor real da sua operação.
              </h2>
              <p className="text-sm leading-relaxed text-rc2-text/75">
                Explore cenários como atendimento lento, leads sem resposta, processos manuais e WhatsApp desorganizado,
                com direcionamento direto para o serviço mais adequado.
              </p>
              <Link href="/solucoes" className="rc2-action-link mt-5">
                Explorar soluções por problema
                <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>

          <div className="space-y-16">
            {services.map((service, index) => {
              const isDark = index % 2 === 1;
              return (
              <ScrollReveal
                key={service.slug}
                as="article"
                id={service.slug}
                delay={(index % 3) * 80}
                direction={index % 2 === 1 ? "right" : "left"}
                distance="28px"
                className={`relative overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 p-8 md:p-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 last:border-b-0 last:pb-0 rounded-xl border ${isDark ? "rc2-grain bg-rc2-dark-2 border-y border-rc2-dark-border" : "bg-rc2-bg-alt border-rc2-surface-2"}`}
              >
                {isDark && (
                  <div className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
                )}
                {/* Content */}
                <div className={`relative z-10 ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                  <SectionLabel className={`block mb-3 ${isDark ? "text-rc2-brand" : ""}`}>
                    {String(index + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
                  </SectionLabel>
                  <h2 className={`rc2-h3 mb-4 ${isDark ? "text-rc2-dark-text" : "text-rc2-heading"}`}>
                    {service.title}
                  </h2>
                  <p className={`leading-relaxed mb-6 ${isDark ? "text-rc2-dark-text-secondary" : "text-rc2-text/70"}`}>
                    {service.description}
                  </p>
                  <p className={`rc2-quote-card text-sm font-medium ${isDark ? "rc2-quote-card--dark" : ""}`}>
                    {service.cta}
                  </p>
                  <Link
                    href={`/servicos/${service.slug}`}
                    className={`rc2-action-link mt-6 ${isDark ? "text-rc2-brand hover:text-rc2-brand" : ""}`}
                  >
                    Ver serviço
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Lists */}
                <div className={`relative z-10 ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className="mb-6">
                    <h3 className={`rc2-label mb-3 ${isDark ? "text-rc2-dark-text" : "text-rc2-heading/80"}`}>O que pode ser implantado</h3>
                    <ul className="space-y-2">
                      {service.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check size={14} className={`shrink-0 mt-0.5 ${isDark ? "text-rc2-brand" : "text-rc2-brand-text"}`} strokeWidth={2.5} />
                          <span className={`text-sm ${isDark ? "text-rc2-dark-text-secondary" : "text-rc2-text/80"}`}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className={`rc2-label mb-3 ${isDark ? "text-rc2-dark-text" : "text-rc2-heading/80"}`}>Benefícios</h3>
                    <ul className="space-y-2">
                      {service.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className={`mt-0.5 text-xs ${isDark ? "text-rc2-brand" : "text-rc2-brand-text"}`}>→</span>
                          <span className={`text-sm ${isDark ? "text-rc2-dark-text-secondary" : "text-rc2-text/80"}`}>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            );
            })}
          </div>
        </div>
      </section>

      <ServicesCtaBlock />
    </>
  );
}
