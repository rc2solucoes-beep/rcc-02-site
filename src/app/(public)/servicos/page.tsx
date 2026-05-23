import type { Metadata } from "next";
import { buildOg } from "@/lib/siteMetadata";
import { Check } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { CTABlock } from "@/components/marketing/CTABlock";
import { services } from "@/lib/content/services";
import { SectionLabel } from "@/components/ui/SectionLabel";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

const BASE_URL = "https://rc2solucoes.com.br";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: "Serviços",
    description:
      "Serviços para PMEs que precisam responder mais rápido, perder menos leads e reduzir retrabalho com IA, automações e integrações.",
    alternates: { canonical: "https://rc2solucoes.com.br/servicos" },
    openGraph: buildOg({
      url: "https://rc2solucoes.com.br/servicos",
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
      />

      <section className="bg-rc2-sand rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 rounded-xl border border-[var(--surface-2)] bg-[var(--surface-1)] p-6 md:p-8">
            <SectionLabel className="block mb-3">Soluções por problema</SectionLabel>
            <h2 className="rc2-h4 mb-3 text-rc2-ebony">
              Comece pela dor real da sua operação.
            </h2>
            <p className="text-sm leading-relaxed text-rc2-ebony/75">
              Explore cenários como atendimento lento, leads sem resposta, processos manuais e WhatsApp desorganizado,
              com direcionamento direto para o serviço mais adequado.
            </p>
            <Link href="/solucoes" className="rc2-action-link mt-5">
              Explorar soluções por problema
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-16">
            {services.map((service, index) => {
              const isDark = index % 2 === 1;
              return (
              <article
                key={service.slug}
                id={service.slug}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 p-8 md:p-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 last:border-b-0 last:pb-0 rounded-xl border ${isDark ? "bg-rc2-forest border-rc2-forest/80" : "bg-[var(--surface-1)] border-[var(--surface-2)]"}`}
              >
                {/* Content */}
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <SectionLabel className={`block mb-3 ${isDark ? "text-rc2-orange" : ""}`}>
                    {String(index + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
                  </SectionLabel>
                  <h2 className={`rc2-h3 mb-4 ${isDark ? "text-rc2-sand" : "text-rc2-ebony"}`}>
                    {service.title}
                  </h2>
                  <p className={`leading-relaxed mb-6 ${isDark ? "text-rc2-sand/80" : "text-rc2-ebony/70"}`}>
                    {service.description}
                  </p>
                  <p className={`text-sm font-medium italic border-l-2 border-rc2-orange pl-4 ${isDark ? "text-rc2-sand/85" : "text-rc2-ebony/80"}`}>
                    {service.cta}
                  </p>
                  <Link
                    href={`/servicos/${service.slug}`}
                    className="rc2-action-link mt-6"
                  >
                    Ver serviço
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Lists */}
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="mb-6">
                    <h3 className={`rc2-label mb-3 ${isDark ? "text-rc2-sand/90" : "text-rc2-ebony/80"}`}>O que pode ser implantado</h3>
                    <ul className="space-y-2">
                      {service.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check size={14} className={`shrink-0 mt-0.5 ${isDark ? "text-rc2-orange" : "text-rc2-orange"}`} strokeWidth={2.5} />
                          <span className={`text-sm ${isDark ? "text-rc2-sand/80" : "text-rc2-ebony/80"}`}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className={`rc2-label mb-3 ${isDark ? "text-rc2-sand/90" : "text-rc2-ebony/80"}`}>Benefícios</h3>
                    <ul className="space-y-2">
                      {service.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className={`mt-0.5 text-xs ${isDark ? "text-rc2-orange" : "text-rc2-orange"}`}>→</span>
                          <span className={`text-sm ${isDark ? "text-rc2-sand/80" : "text-rc2-ebony/80"}`}>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
            })}
          </div>
        </div>
      </section>

      <CTABlock
        title="Pronto para transformar sua operação?"
        description="Solicite um diagnóstico gratuito e descubra por onde começar."
      />
    </>
  );
}
