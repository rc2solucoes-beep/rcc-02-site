import type { Metadata } from "next";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";
import { PageHero } from "@/components/marketing/PageHero";
import { HomeCtaBlock } from "@/components/marketing/HomeCtaBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { StepList, type Step } from "@/components/marketing/StepList";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: "Sobre a RC2",
    description:
      "Fundada por Robson Azevedo, com mais de 20 anos de experiência em TI, e-commerce e transformação digital. Conheça a RC2 Soluções.",
    alternates: { canonical: `${BASE_URL}/sobre` },
    openGraph: buildOg({
      url: `${BASE_URL}/sobre`,
      title: "Sobre a RC2 Soluções — IA, Automações e Operações Digitais",
      description: "Fundada por Robson Azevedo, com mais de 20 anos de experiência em TI, e-commerce e transformação digital. Conheça a RC2 Soluções.",
      imageUrl: settings.og_image_url,
    }),
  };
}

const steps: Step[] = [
  {
    title: "Diagnóstico",
    description:
      "Entendemos o momento da empresa, os gargalos, os processos e as oportunidades de melhoria.",
  },
  {
    title: "Desenho da solução",
    description:
      "Definimos quais ferramentas, automações, integrações ou agentes fazem sentido para o negócio.",
  },
  {
    title: "Implantação",
    description:
      "Construímos e configuramos a solução com foco em funcionamento real, não apenas demonstração.",
  },
  {
    title: "Treinamento",
    description:
      "Orientamos a equipe para usar, acompanhar e evoluir a solução implantada.",
  },
  {
    title: "Evolução",
    description:
      "Medimos resultados, ajustamos fluxos e identificamos novas oportunidades de automação.",
  },
];

export default async function SobrePage() {
  let schemaWebPage;

  try {
    const settings = await getOrgSettings();
    schemaWebPage = getWebPageSchema(
      settings,
      {
        title: "Sobre a RC2",
        description:
          "Fundada por Robson Azevedo, com mais de 20 anos de experiência em TI, e-commerce e transformação digital. Conheça a RC2 Soluções.",
        url: `${BASE_URL}/sobre`,
        keywords: "sobre RC2, consultoria, IA, automação, transformação digital, Robson Azevedo, time",
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
        label="Sobre a RC2"
        title="Tecnologia que funciona. Operação que entrega."
        description="Consultoria especializada em IA, automações e operações digitais — com foco em resultado real para PMEs."
        className="rc2-section--opening"
      />

      <section className="bg-rc2-bg rc2-section rc2-section--argument">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Institucional */}
            <ScrollReveal direction="left" distance="24px">
              <SectionLabel className="block mb-5">A empresa</SectionLabel>
              <div className="prose prose-neutral max-w-none text-rc2-text/80 leading-relaxed space-y-4">
                <p>
                  A RC2 Soluções é uma consultoria especializada em tecnologia,
                  automações, inteligência artificial, e-commerce e operações
                  digitais.
                </p>
                <p>
                  Fundada por <strong className="text-rc2-text">Robson Azevedo</strong>, profissional com mais
                  de 20 anos de experiência em TI, gestão de equipes e
                  transformação digital, a RC2 nasceu para ajudar empresas a
                  usarem tecnologia de forma prática, estratégica e orientada a
                  resultado.
                </p>
                <p>
                  Ao longo da carreira, Robson liderou projetos de e-commerce,
                  implantação de canais D2C, automações com IA, atendimento
                  omnichannel, infraestrutura, marketing digital, integração de
                  sistemas e gestão de operações em empresas dos setores
                  farmacêutico, varejo, logística e serviços.
                </p>
                <p>
                  A proposta da RC2 é simples:{" "}
                  <em>transformar tecnologia em operação funcionando.</em>
                </p>
              </div>

              <blockquote className="rc2-quote-card mt-8 text-sm">
                &ldquo;A IA não substitui uma operação mal estruturada. Primeiro
                organizamos o processo. Depois automatizamos o que faz
                sentido.&rdquo;
                <cite className="block mt-2 not-italic font-medium text-rc2-text/70 text-xs">
                  — Robson Azevedo, fundador
                </cite>
              </blockquote>
            </ScrollReveal>

            {/* Método */}
            <ScrollReveal delay={120} direction="right" distance="24px">
              <SectionLabel className="block mb-5">Nossa forma de trabalhar</SectionLabel>
              <StepList steps={steps} />
            </ScrollReveal>
          </div>
        </div>
      </section>

      <HomeCtaBlock
        title="Quer conhecer melhor a RC2?"
        description="Solicite um diagnóstico gratuito e veja como trabalhamos na prática."
        className="rc2-section--closing"
      />
    </>
  );
}
