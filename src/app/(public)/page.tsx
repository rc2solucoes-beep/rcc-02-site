import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ServiceCard } from "@/components/marketing/ServiceCard";
import { CTABlock } from "@/components/marketing/CTABlock";
import { buttonVariants } from "@/components/ui/button";
import { services } from "@/lib/content/services";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "RC2 Soluções — IA, Automações e Operações Digitais para PMEs",
  description:
    "Consultoria especializada em IA, automações e operações digitais para pequenas e médias empresas. Automatize atendimento, integre sistemas e escale sua operação.",
  alternates: { canonical: "https://rc2solucoes.com.br" },
  openGraph: {
    url: "https://rc2solucoes.com.br",
    title: "RC2 Soluções — IA, Automações e Operações Digitais para PMEs",
    description: "Consultoria especializada em IA, automações e operações digitais para PMEs. Diagnóstico gratuito.",
  },
};

const forWhomItems = [
  "Recebe muitos contatos pelo WhatsApp e perde oportunidades.",
  "Tem equipe sobrecarregada com tarefas repetitivas.",
  "Usa muitas planilhas e sistemas que não conversam entre si.",
  "Quer usar IA, mas não sabe por onde começar.",
  "Tem atendimento lento, desorganizado ou sem padronização.",
  "Quer vender online com uma estrutura mais profissional.",
  "Precisa modernizar site, landing pages ou canais digitais.",
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-rc2-sand py-20 md:py-28 lg:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel className="block mb-5">
            Consultoria em IA e Automações para PMEs
          </SectionLabel>
          <h1 className="rc2-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-rc2-ebony max-w-4xl leading-none">
            IA, automações e operações digitais para empresas que querem ganhar
            eficiência e vender mais.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-rc2-ebony/70 max-w-2xl leading-relaxed">
            A RC2 Soluções ajuda empresas a automatizar atendimentos, criar
            agentes de IA, integrar sistemas, estruturar processos digitais e
            vender melhor pela internet.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/contato"
              className={cn(
                buttonVariants({ variant: "default" }),
                "font-semibold tracking-wide uppercase text-xs px-8 h-12 bg-rc2-orange text-rc2-sand hover:bg-rc2-orange/90"
              )}
            >
              Solicitar diagnóstico
            </Link>
            <Link
              href="/servicos"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "font-semibold tracking-wide uppercase text-xs px-8 h-12 border-rc2-ebony text-rc2-ebony hover:bg-rc2-ebony hover:text-rc2-sand"
              )}
            >
              Conhecer soluções
            </Link>
          </div>
          <p className="mt-8 rc2-caption text-rc2-ebony/40 italic">
            "Tecnologia que funciona. Operação que entrega."
          </p>
        </div>
      </section>

      {/* ── Para quem é ── */}
      <section className="bg-rc2-ink py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel className="block mb-4 text-rc2-orange">Para quem é</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-semibold text-rc2-sand mb-8 max-w-lg">
            Sua empresa precisa da RC2 se você:
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
            {forWhomItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check
                  size={16}
                  className="text-rc2-orange shrink-0 mt-0.5"
                  strokeWidth={2.5}
                />
                <span className="text-sm text-rc2-sand/80 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── O que entregamos ── */}
      <section id="servicos" className="bg-rc2-sand py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel className="block mb-4">O que entregamos</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-semibold text-rc2-ebony mb-10 max-w-lg">
            Cinco serviços para transformar sua operação digital.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {services.map((service) => (
              <ServiceCard
                key={service.slug}
                service={service}
                className="bg-rc2-sand"
              />
            ))}
            {/* 6º card — CTA */}
            <Link
              href="/contato"
              className="group flex flex-col justify-between p-6 bg-rc2-orange hover:bg-rc2-orange/90 transition-colors duration-200"
            >
              <div>
                <span className="block text-xs font-medium uppercase tracking-widest text-rc2-sand/70 mb-3">
                  Próximo passo
                </span>
                <h3 className="text-lg font-semibold text-rc2-sand mb-3 leading-snug">
                  Não sabe por onde começar?
                </h3>
                <p className="text-sm text-rc2-sand/80 leading-relaxed">
                  Diagnóstico gratuito para mapear gargalos e oportunidades de automação na sua operação.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-rc2-sand group-hover:gap-3 transition-all duration-200">
                Solicitar diagnóstico
                <ArrowRight size={14} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Diferencial ── */}
      <section className="bg-rc2-forest py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 max-w-3xl">
          <SectionLabel className="block mb-5 text-rc2-orange">Diferencial</SectionLabel>
          <h2 className="rc2-display text-3xl md:text-5xl text-rc2-sand mb-6">
            Tecnologia com visão de operação.
          </h2>
          <p className="text-rc2-sand/80 text-lg leading-relaxed mb-6">
            A RC2 não entrega apenas ferramentas. Entregamos processos
            funcionando. Com experiência em TI, e-commerce, automação,
            atendimento omnichannel, marketing digital, integração de sistemas e
            liderança de operações digitais, a RC2 atua do diagnóstico à
            implantação.
          </p>
          <p className="text-rc2-sand/50 italic text-sm border-l-2 border-rc2-orange pl-4">
            &ldquo;A IA não substitui uma operação mal estruturada. Primeiro
            organizamos o processo. Depois automatizamos o que faz sentido.&rdquo;
          </p>
          <p className="mt-8 rc2-caption text-rc2-sand/40">
            Mais de 20 anos de experiência em tecnologia, operações digitais,
            e-commerce, automações e gestão de equipes.
          </p>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <CTABlock
        title="Quer descobrir onde a IA pode gerar resultado na sua empresa?"
        description="Solicite um diagnóstico inicial e receba um mapa de oportunidades para automatizar atendimento, vendas e processos."
      />
    </>
  );
}
