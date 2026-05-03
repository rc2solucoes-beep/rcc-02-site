import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { CTABlock } from "@/components/marketing/CTABlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StepList, type Step } from "@/components/marketing/StepList";

export const metadata: Metadata = {
  title: "Sobre a RC2",
  description:
    "Fundada por Robson Azevedo, com mais de 20 anos de experiência em TI, e-commerce e transformação digital. Conheça a RC2 Soluções.",
  alternates: { canonical: "https://rc2solucoes.com.br/sobre" },
  openGraph: { url: "https://rc2solucoes.com.br/sobre" },
};

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

export default function SobrePage() {
  return (
    <>
      <PageHero
        label="Sobre a RC2"
        title="Tecnologia que funciona. Operação que entrega."
        description="Consultoria especializada em IA, automações e operações digitais — com foco em resultado real para PMEs."
      />

      <section className="bg-rc2-sand py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Institucional */}
            <div>
              <SectionLabel className="block mb-5">A empresa</SectionLabel>
              <div className="prose prose-neutral max-w-none text-rc2-ebony/80 leading-relaxed space-y-4">
                <p>
                  A RC2 Soluções é uma consultoria especializada em tecnologia,
                  automações, inteligência artificial, e-commerce e operações
                  digitais.
                </p>
                <p>
                  Fundada por <strong className="text-rc2-ebony">Robson Azevedo</strong>, profissional com mais
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

              <blockquote className="mt-8 border-l-2 border-rc2-orange pl-5 text-rc2-ebony/50 italic text-sm leading-relaxed">
                &ldquo;A IA não substitui uma operação mal estruturada. Primeiro
                organizamos o processo. Depois automatizamos o que faz
                sentido.&rdquo;
                <cite className="block mt-2 not-italic font-medium text-rc2-ebony/40 text-xs">
                  — Robson Azevedo, fundador
                </cite>
              </blockquote>
            </div>

            {/* Método */}
            <div>
              <SectionLabel className="block mb-5">Nossa forma de trabalhar</SectionLabel>
              <StepList steps={steps} />
            </div>
          </div>
        </div>
      </section>

      <CTABlock
        title="Quer conhecer melhor a RC2?"
        description="Solicite um diagnóstico gratuito e veja como trabalhamos na prática."
      />
    </>
  );
}
