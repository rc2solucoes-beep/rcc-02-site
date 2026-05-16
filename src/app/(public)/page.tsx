import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";
import { buildOg } from "@/lib/siteMetadata";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ServiceCard } from "@/components/marketing/ServiceCard";
import { CTABlock } from "@/components/marketing/CTABlock";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { GoogleReviews } from "@/components/GoogleReviews";
import { HeroActions } from "@/components/marketing/HeroActions";
import { buttonVariants } from "@/components/ui/button";
import { services } from "@/lib/content/services";
import { cn } from "@/lib/utils";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: "RC2 Soluções — IA, Automações e Operações Digitais para PMEs",
    description:
      "Consultoria especializada em IA, automações e operações digitais para pequenas e médias empresas. Automatize atendimento, integre sistemas e escale sua operação.",
    alternates: { canonical: "https://rc2solucoes.com.br" },
    openGraph: buildOg({
      url: "https://rc2solucoes.com.br",
      title: "RC2 Soluções — IA, Automações e Operações Digitais para PMEs",
      description: "Consultoria especializada em IA, automações e operações digitais para PMEs. Diagnóstico gratuito.",
      imageUrl: settings.og_image_url,
    }),
  };
}

const forWhomItems = [
  "Muitos contatos no WhatsApp e pouca conversão em vendas.",
  "Equipe presa em tarefas repetitivas e manuais.",
  "Planilhas e sistemas desconectados gerando retrabalho.",
  "Quero aplicar IA, mas preciso de um plano claro.",
  "Atendimento lento, sem padrão e sem previsibilidade.",
  "Operação digital precisa escalar com mais controle.",
];

const socialProofItems = [
  "+20 anos em tecnologia e operações digitais",
  "Especialistas em IA, automações e integração de sistemas",
  "Diagnóstico prático com próximos passos acionáveis",
];

const BASE_URL = "https://rc2solucoes.com.br";

type Props = {
  searchParams: Promise<{ hero?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { hero } = await searchParams;
  const heroVariant = hero === "b" ? "b" : "a";
  let schemaWebPage;

  try {
    const settings = await getOrgSettings();
    schemaWebPage = getWebPageSchema(
      settings,
      {
        title: "RC2 Soluções — IA, Automações e Operações Digitais para PMEs",
        description:
          "Consultoria especializada em IA, automações e operações digitais para pequenas e médias empresas. Automatize atendimento, integre sistemas e escale sua operação.",
        url: BASE_URL,
        keywords: "IA, automação, consultoria digital, PME, n8n, agentes de IA, e-commerce, atendimento automático, integrações",
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
      {/* ── Hero ── */}
      <section className="bg-rc2-sand rc2-section md:py-28 lg:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel className="block mb-5">
            Consultoria em IA e Automações para PMEs
          </SectionLabel>
          <h1 className="rc2-h1 text-rc2-ebony max-w-4xl">
            IA, automações e operações digitais para empresas que querem ganhar
            eficiência e vender mais.
          </h1>
          <p className="rc2-body-lg mt-6 text-rc2-ebony/75 max-w-2xl">
            A RC2 Soluções ajuda empresas a automatizar atendimentos, criar
            agentes de IA, integrar sistemas, estruturar processos digitais e
            vender melhor pela internet.
          </p>

          {heroVariant === "b" && (
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl">
              {socialProofItems.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-rc2-ebony/10 bg-[var(--surface-1)] px-4 py-3 text-sm text-rc2-ebony/85 shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          )}

          <HeroActions variant={heroVariant} />

          <p className="mt-5 text-sm text-rc2-ebony/70">
            {heroVariant === "b"
              ? "Diagnóstico inicial com mapa de oportunidades."
              : "Sem compromisso. Retorno em até 1 dia útil."}
          </p>
          <p className="mt-6 text-xs text-rc2-ebony/75 italic">
            &ldquo;Tecnologia que funciona. Operação que entrega.&rdquo;
          </p>
        </div>
      </section>

      {/* ── Para quem é ── */}
      <section className="bg-rc2-ink rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel className="block mb-5 text-rc2-orange">Para quem é</SectionLabel>
          <h2 className="rc2-h2 text-rc2-sand mb-10 max-w-lg">
            Sua empresa precisa da RC2 se você:
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {forWhomItems.map((item, i) => (
              <li key={i} className="rc2-card flex items-start gap-3 !border-rc2-sand/30 !bg-rc2-sand/12 px-4 py-3">
                <Check
                  size={16}
                  className="text-rc2-orange shrink-0 mt-0.5"
                  strokeWidth={2.5}
                />
                <span className="text-sm text-rc2-sand leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── O que entregamos ── */}
      <section id="servicos" className="bg-rc2-sand rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel className="block mb-5">O que entregamos</SectionLabel>
          <h2 className="rc2-h2 text-rc2-ebony mb-12 max-w-2xl">
            Cinco serviços para transformar sua operação digital.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <ServiceCard
                key={service.slug}
                service={service}
              />
            ))}
            {/* 6º card — CTA */}
            <TrackedLink
              href="/contato"
              tracking={{ kind: "cta", location: "home_services_grid", label: "solicitar_diagnostico", destination: "/contato" }}
              className="group rc2-card rc2-card-hover flex flex-col justify-between p-6 bg-rc2-orange border-rc2-orange"
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
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* ── Diferencial ── */}
      <section className="bg-rc2-forest rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 max-w-3xl">
          <SectionLabel className="block mb-5 text-rc2-orange">Diferencial</SectionLabel>
          <h2 className="rc2-h2 rc2-display text-rc2-sand mb-6">
            Tecnologia com visão de operação.
          </h2>
          <p className="text-rc2-sand/90 text-lg leading-relaxed mb-6">
            A RC2 não entrega apenas ferramentas. Entregamos processos
            funcionando. Com experiência em TI, e-commerce, automação,
            atendimento omnichannel, marketing digital, integração de sistemas e
            liderança de operações digitais, a RC2 atua do diagnóstico à
            implantação.
          </p>
          <p className="text-rc2-sand/85 italic text-sm border-l-2 border-rc2-orange pl-4">
            &ldquo;A IA não substitui uma operação mal estruturada. Primeiro
            organizamos o processo. Depois automatizamos o que faz sentido.&rdquo;
          </p>
          <p className="mt-8 text-xs text-rc2-sand/85">
            Mais de 20 anos de experiência em tecnologia, operações digitais,
            e-commerce, automações e gestão de equipes.
          </p>
        </div>
      </section>

      {/* ── Avaliações ── */}
      <section className="bg-rc2-sand rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel className="block mb-5">O que os clientes dizem</SectionLabel>
          <h2 className="rc2-h2 text-rc2-ebony mb-12">
            Avaliações de clientes satisfeitos
          </h2>
          <GoogleReviews maxReviews={4} showGoogleLink={false} columns={2} />
          <div className="mt-8 text-center">
            <TrackedLink
              href="/avaliacoes"
              tracking={{ kind: "cta", location: "home_reviews", label: "ver_avaliacoes_cases", destination: "/avaliacoes" }}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "font-semibold tracking-wide uppercase text-xs px-8 h-12 border-rc2-ebony text-rc2-ebony hover:bg-rc2-ebony hover:text-rc2-sand"
              )}
            >
              Ver mais avaliações e cases
            </TrackedLink>
          </div>
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
