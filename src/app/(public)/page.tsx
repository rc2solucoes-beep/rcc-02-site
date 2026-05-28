import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";
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
      "Consultoria para PMEs que precisam responder mais rápido, perder menos leads e reduzir tarefas manuais com IA, automações e integrações.",
    alternates: { canonical: BASE_URL },
    openGraph: buildOg({
      url: BASE_URL,
      title: "RC2 Soluções — IA, Automações e Operações Digitais para PMEs",
      description: "Para PMEs que querem responder mais rápido, perder menos leads e reduzir retrabalho com IA e automação.",
      imageUrl: settings.og_image_url,
    }),
  };
}

const forWhomItems = [
  "Sua equipe responde as mesmas perguntas todos os dias.",
  "Leads chegam pelo WhatsApp, mas se perdem no processo.",
  "Dados ficam espalhados entre planilhas, sistemas e conversas.",
  "Você quer usar IA, mas ainda não sabe por onde começar com segurança.",
  "O atendimento está lento e sem padrão entre os canais.",
  "A operação cresce, mas o controle não acompanha.",
];

const socialProofItems = [
  "+20 anos em tecnologia e operações digitais",
  "Especialistas em IA, automações e integração de sistemas",
  "Diagnóstico prático com próximos passos acionáveis",
];

const HOME_WHATSAPP_MESSAGE =
  "Olá, quero entender onde a IA e automações podem ajudar minha empresa.";
const HOME_WHATSAPP_URL = `https://wa.me/5511988028550?text=${encodeURIComponent(HOME_WHATSAPP_MESSAGE)}`;

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
          "Consultoria para PMEs que precisam responder mais rápido, perder menos leads e reduzir tarefas manuais com IA, automações e integrações.",
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
      <section className="editorial-grid angled-divider bg-rc2-sand rc2-section md:pt-28 md:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="hero-kicker mb-5">Consultoria em IA e Automações para PMEs</p>
              <h1 className="rc2-h1 max-w-4xl text-rc2-ebony">
                IA, automações e integrações para empresas que querem responder mais rápido, vender melhor e reduzir retrabalho.
              </h1>
              <p className="rc2-body-lg mt-7 max-w-2xl text-rc2-ebony/76">
                A RC2 organiza atendimento, elimina gargalos e conecta sistemas antes da automação.
                Depois, aplica IA no ponto de maior retorno operacional.
              </p>
              <HeroActions variant={heroVariant} />
              <p className="mt-6 text-xs uppercase tracking-[0.14em] text-rc2-ebony/62">
                {heroVariant === "b" ? "Diagnóstico com mapa de oportunidades" : "Sem compromisso • retorno em até 1 dia útil"}
              </p>
            </div>
            <aside className="cut-panel self-end border border-border bg-[#f7f7f5] p-6">
              <p className="hero-kicker mb-4">Base operacional</p>
              <ul className="space-y-3">
                {socialProofItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-rc2-ebony/88">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rc2-orange" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-rc2-ink rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="hero-kicker mb-4">Para quem é</p>
          <h2 className="rc2-h2 mb-10 max-w-xl text-rc2-sand">Sua empresa precisa da RC2 se você:</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {forWhomItems.map((item, i) => (
              <li key={i} className="cut-panel-soft border border-rc2-sand/22 bg-rc2-sand/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Check size={16} className="mt-0.5 shrink-0 text-rc2-orange" strokeWidth={2.5} />
                  <span className="text-sm leading-relaxed text-rc2-sand">{item}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-rc2-sand pb-16 pt-12 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="cut-panel border border-border bg-[#f7f7f5] p-6 sm:p-8 md:p-10 shadow-[0_28px_70px_-54px_rgba(0,0,0,0.72)]">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.35fr]">
              <div>
                <p className="hero-kicker mb-4">Escolha pela dor</p>
                <h2 className="rc2-h3 mb-3 text-rc2-ebony">Se sua empresa tem esse cenário, já existe um próximo passo.</h2>
                <p className="text-sm leading-relaxed text-rc2-ebony/75">
                  Compare sintomas e vá direto para a solução mais aderente, sem precisar navegar por termos técnicos.
                </p>
              </div>
              <div className="divide-y divide-rc2-ebony/10 overflow-hidden rounded-xl border border-border bg-white/65">
                {[
                  { pain: "Muitos contatos no WhatsApp e demora para responder clientes.", href: "/solucoes/atendimento-lento", label: "Atendimento lento" },
                  { pain: "Leads chegam, mas se perdem antes de virar oportunidade.", href: "/solucoes/leads-sem-resposta", label: "Leads sem resposta" },
                  { pain: "Equipe copia dados manualmente entre planilhas e sistemas.", href: "/solucoes/processos-manuais", label: "Processos manuais" },
                  { pain: "Sistemas não conversam e o retrabalho aumenta.", href: "/solucoes/sistemas-desconectados", label: "Sistemas desconectados" },
                  { pain: "Você ainda não sabe por onde começar com IA e automação.", href: "/contato", label: "Diagnóstico inicial" },
                ].map((item, index) => (
                  <article key={item.href + item.pain} className="group grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-[1fr_auto] md:gap-5 sm:px-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rc2-ebony/20 bg-white text-[11px] font-semibold text-rc2-ebony/80">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-rc2-ebony/82">{item.pain}</p>
                    </div>
                    <TrackedLink
                      href={item.href}
                      tracking={{ kind: "cta", location: "home_choose_by_pain", label: item.label, destination: item.href }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-rc2-orange transition-all group-hover:gap-2 md:justify-self-end"
                    >
                      Comece por {item.label}
                      <ArrowRight size={14} />
                    </TrackedLink>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="servicos" className="bg-rc2-sand pb-20 pt-2 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="hero-kicker mb-4">O que entregamos</p>
          <h2 className="rc2-h2 mb-12 max-w-2xl text-rc2-ebony">
            Cinco serviços para transformar sua operação digital.
          </h2>
          <TrackedLink
            href="/solucoes"
            tracking={{ kind: "cta", location: "home_services_intro", label: "solucoes_por_problema", destination: "/solucoes" }}
            className="rc2-action-link mb-10"
          >
            Ver soluções por problema
            <ArrowRight size={14} />
          </TrackedLink>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {services.map((service, index) => (
              <ServiceCard
                key={service.slug}
                service={service}
                className={cn(
                  "lg:col-span-4",
                  index === 0 && "lg:col-span-7",
                  index === 1 && "lg:col-span-5",
                  index === 2 && "lg:col-span-5",
                  index === 3 && "lg:col-span-7",
                  index === 4 && "lg:col-span-8"
                )}
              />
            ))}
            {/* 6º card — CTA */}
            <TrackedLink
              href="/contato"
              tracking={{ kind: "cta", location: "home_services_grid", label: "solicitar_diagnostico", destination: "/contato" }}
              className="group cut-panel lg:col-span-4 border border-rc2-forest bg-rc2-forest p-6 md:p-7 shadow-[0_16px_36px_-24px_rgba(11,45,34,0.78)]"
            >
              <div>
                <span className="inline-flex rounded-full border border-rc2-sand/45 bg-rc2-sand/14 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-rc2-sand mb-4">
                  Próximo passo
                </span>
                <h3 className="text-xl font-semibold text-rc2-sand mb-3 leading-tight">
                  Não sabe por onde começar?
                </h3>
                <p className="text-sm text-rc2-sand/95 leading-relaxed max-w-[30ch]">
                  Diagnóstico gratuito para mapear gargalos e oportunidades de automação na sua operação.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rc2-sand group-hover:gap-3 transition-all duration-200">
                Solicitar diagnóstico
                <ArrowRight size={14} />
              </span>
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* ── Diferencial ── */}
      <section className="relative overflow-hidden bg-rc2-forest rc2-section">
        <div className="pointer-events-none absolute inset-0 opacity-35 [background:radial-gradient(circle_at_12%_86%,rgba(80,70,228,0.22),transparent_44%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 max-w-3xl">
          <SectionLabel className="block mb-5 text-rc2-orange">Diferencial</SectionLabel>
          <h2 className="rc2-h2 rc2-display text-rc2-sand mb-6">
            Tecnologia com visão de operação.
          </h2>
          <p className="text-rc2-sand/90 text-lg leading-relaxed mb-6">
            A RC2 não entrega só ferramenta. Entrega processo funcionando no dia
            a dia da empresa. Atuamos do diagnóstico à implantação para
            organizar atendimento, conectar sistemas e dar previsibilidade à
            operação comercial.
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
        secondaryHref={HOME_WHATSAPP_URL}
      />
    </>
  );
}
