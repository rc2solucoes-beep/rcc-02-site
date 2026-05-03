import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { CTABlock } from "@/components/marketing/CTABlock";
import { services } from "@/lib/content/services";
import { SectionLabel } from "@/components/ui/SectionLabel";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Automações com IA, agentes inteligentes, integrações com n8n, e-commerce e sites para PMEs. Conheça as soluções da RC2 Soluções.",
  alternates: { canonical: "https://rc2solucoes.com.br/servicos" },
  openGraph: { url: "https://rc2solucoes.com.br/servicos" },
};

export default function ServicosPage() {
  return (
    <>
      <PageHero
        label="Serviços"
        title="Cinco soluções para transformar sua operação digital."
        description="Da automação de atendimento à estruturação de e-commerce — a RC2 atua em toda a cadeia da transformação digital para PMEs."
      />

      <section className="bg-rc2-sand py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {services.map((service, index) => (
              <article
                key={service.slug}
                id={service.slug}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 pb-16 border-b border-border last:border-b-0 last:pb-0"
              >
                {/* Content */}
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <SectionLabel className="block mb-3">
                    {String(index + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
                  </SectionLabel>
                  <h2 className="text-2xl md:text-3xl font-semibold text-rc2-ebony mb-4 leading-snug">
                    {service.title}
                  </h2>
                  <p className="text-rc2-ebony/70 leading-relaxed mb-6">
                    {service.description}
                  </p>
                  <p className="text-sm font-medium text-rc2-ebony/50 italic border-l-2 border-rc2-orange pl-4">
                    {service.cta}
                  </p>
                  <Link
                    href={`/servicos/${service.slug}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rc2-orange hover:gap-4 transition-all duration-200"
                  >
                    Ver detalhes completos
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Lists */}
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="mb-6">
                    <h3 className="rc2-label text-rc2-ebony/40 mb-3">O que pode ser implantado</h3>
                    <ul className="space-y-2">
                      {service.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check size={14} className="text-rc2-orange shrink-0 mt-0.5" strokeWidth={2.5} />
                          <span className="text-sm text-rc2-ebony/80">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="rc2-label text-rc2-ebony/40 mb-3">Benefícios</h3>
                    <ul className="space-y-2">
                      {service.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="text-rc2-orange mt-0.5 text-xs">→</span>
                          <span className="text-sm text-rc2-ebony/80">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
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
