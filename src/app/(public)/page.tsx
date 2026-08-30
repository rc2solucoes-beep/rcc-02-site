import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";
import { buildOg, BASE_URL } from "@/lib/siteMetadata";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ServiceCard } from "@/components/marketing/ServiceCard";
import { HomeCtaBlock } from "@/components/marketing/HomeCtaBlock";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { HomeReviews } from "@/components/marketing/HomeReviews";
import { HeroActions } from "@/components/marketing/HeroActions";
import { buttonVariants } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { FadeIn } from "@/components/ui/FadeIn";
import { services } from "@/lib/content/services";
import { cn } from "@/lib/utils";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: "RC2 Soluções — IA, Automações e Operações Digitais para PMEs",
    description:
      "Consultoria para PMEs que precisam responder mais rápido, perder menos leads e reduzir tarefas manuais com IA, automações e integrações.",
    alternates: { canonical: `${BASE_URL}/` },
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
      {/* ── Hero ── */}
      <section className="rc2-grain rc2-hero-stage relative overflow-hidden bg-rc2-bg rc2-section md:py-28 lg:py-32">
        {/* Atmosfera: grid blueprint + brilho laranja difuso */}
        <div className="rc2-blueprint pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="rc2-hero-orbit hidden md:block" aria-hidden />
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-rc2-brand/15 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rc2-hero-enter rc2-hero-enter--1">
            <SectionLabel className="rc2-rule block mb-5">
              Consultoria em IA e Automações para PMEs
            </SectionLabel>
          </div>
          <h1 className="rc2-h1 rc2-hero-shift rc2-hero-enter--2 text-rc2-heading max-w-4xl text-balance">
            <span className="rc2-hero-kicker">Nenhum lead esperando.</span>{" "}
            Nenhuma tarefa repetida duas vezes.
          </h1>
          <p className="rc2-body-lg rc2-hero-shift rc2-hero-enter--3 mt-6 text-rc2-text/75 max-w-2xl">
            A RC2 implanta atendimento automático no WhatsApp, integra seus
            sistemas e coloca a operação para rodar sozinha. Primeira resposta ao
            lead em menos de 2 minutos, 24h por dia — no ar em 30 dias, sem
            contratar mais ninguém.
          </p>

          {heroVariant === "b" && (
            <div className="rc2-hero-enter rc2-hero-enter--4 mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-2xl">
              {socialProofItems.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-rc2-border bg-rc2-bg-alt px-4 py-3 text-sm text-rc2-text/85 shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          )}

          <div className="rc2-hero-enter rc2-hero-enter--4">
            <HeroActions variant={heroVariant} />
          </div>

          <div className="rc2-hero-enter rc2-hero-enter--5 mt-5 text-sm text-rc2-text/70 max-w-2xl">
            <p className="font-semibold text-rc2-text">
              A RC2 usa no próprio comercial o que implementa nos clientes: um
              agente de IA filtra, e quem conversa com você é o Robson.
            </p>
            <p className="mt-1">
              20+ anos em TI, e-commerce e operação digital.
            </p>
          </div>
          <p className="rc2-hero-enter rc2-hero-enter--6 mt-6 text-xs italic text-rc2-text/75">
            &ldquo;Tecnologia que funciona. Operação que entrega.&rdquo;
          </p>
        </div>
      </section>

      {/* ── Para quem é ── */}
      <section className="rc2-grain relative overflow-hidden bg-rc2-dark rc2-section">
        <div className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-5 text-rc2-brand">Para quem é</SectionLabel>
            <h2 className="rc2-h2 text-rc2-dark-text mb-10 max-w-lg">
              Sua empresa precisa da RC2 se você:
            </h2>
          </ScrollReveal>
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-rc2-dark-border bg-rc2-dark-border sm:grid-cols-2 lg:grid-cols-3">
            {forWhomItems.map((item, i) => (
              <li
                key={i}
                className="group relative flex items-start gap-3 bg-rc2-dark px-5 py-6 transition-colors hover:bg-rc2-dark-text/[0.04]"
              >
                {/* acento estrutural laranja no hover */}
                <span
                  className="absolute inset-y-0 left-0 w-0.5 bg-rc2-brand opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
                <Check
                  size={16}
                  className="text-rc2-brand shrink-0 mt-0.5"
                  strokeWidth={2.5}
                />
                <FadeIn delay={i * 60} className="text-sm text-rc2-dark-text-secondary leading-relaxed">
                  {item}
                </FadeIn>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Escolha pela dor ── */}
      <section className="bg-rc2-bg pt-10 pb-14 md:pt-14 md:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-rc2-border bg-rc2-surface p-6 shadow-[var(--shadow-soft)] sm:p-8 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-8 lg:gap-10">
              <ScrollReveal direction="left" className="max-w-xl">
                <SectionLabel className="rc2-rule block mb-4">Escolha pela sua dor</SectionLabel>
                <h2 className="rc2-h3 text-rc2-heading mb-3">
                  Se sua empresa tem esse cenário, já existe um próximo passo.
                </h2>
                <p className="text-sm text-rc2-text/72 leading-relaxed">
                  Não precisa decorar nome técnico. Compare a dor com a rota recomendada e siga para a solução mais aderente.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-rc2-border bg-rc2-bg px-3 py-1 text-xs font-medium text-rc2-text/80">
                    Se sua empresa tem...
                  </span>
                  <span className="inline-flex items-center rounded-full border border-rc2-brand/25 bg-rc2-brand/10 px-3 py-1 text-xs font-medium text-rc2-text/85">
                    Comece por...
                  </span>
                </div>
              </ScrollReveal>

              <div className="rounded-xl border border-rc2-border bg-rc2-bg/35 divide-y divide-rc2-border overflow-hidden">
                {[
                  {
                    pain: "Muitos contatos no WhatsApp e demora para responder clientes.",
                    href: "/solucoes/atendimento-lento",
                    label: "Atendimento lento",
                  },
                  {
                    pain: "Leads chegam, mas se perdem antes de virar oportunidade.",
                    href: "/solucoes/leads-sem-resposta",
                    label: "Leads sem resposta",
                  },
                  {
                    pain: "Equipe copia dados manualmente entre planilhas e sistemas.",
                    href: "/solucoes/processos-manuais",
                    label: "Processos manuais",
                  },
                  {
                    pain: "Sistemas não conversam e o retrabalho aumenta.",
                    href: "/solucoes/sistemas-desconectados",
                    label: "Sistemas desconectados",
                  },
                  {
                    pain: "Você ainda não sabe por onde começar com IA e automação.",
                    href: "/contato",
                    label: "Diagnóstico inicial",
                  },
                ].map((item, index) => (
                  <article
                    key={item.href + item.pain}
                    className="group grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 md:gap-5 px-4 py-4 sm:px-5 sm:py-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rc2-border bg-rc2-surface text-[11px] font-semibold text-rc2-text/80">
                        {index + 1}
                      </span>
                      <FadeIn delay={index * 60} className="text-sm text-rc2-text/82 leading-relaxed">
                        {item.pain}
                      </FadeIn>
                    </div>
                    <TrackedLink
                      href={item.href}
                      tracking={{
                        kind: "cta",
                        location: "home_choose_by_pain",
                        label: item.label,
                        destination: item.href,
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-rc2-brand-text md:justify-self-end hover:underline transition-[color,text-decoration-color] duration-200 underline-offset-4"
                    >
                      {item.href === "/contato" ? "Falar sobre minha operação" : `Comece por ${item.label}`}
                      <ArrowRight size={14} />
                    </TrackedLink>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── O que entregamos ── */}
      <section id="servicos" className="bg-rc2-bg pt-0 pb-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-5">O que entregamos</SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading mb-12 max-w-2xl">
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
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service, index) => (
              <ScrollReveal key={service.slug} delay={(index % 3) * 90 + Math.floor(index / 3) * 50}>
                <ServiceCard
                  service={service}
                  className="h-full"
                />
              </ScrollReveal>
            ))}
            {/* 6º card — CTA */}
            <ScrollReveal delay={220}>
              <TrackedLink
                href="/contato"
                tracking={{ kind: "cta", location: "home_services_grid", label: "solicitar_diagnostico", destination: "/contato" }}
                className="group rc2-card-hover flex h-full flex-col justify-between rounded-xl border border-rc2-dark-border bg-rc2-dark-elevated p-6 transition-[border-color,box-shadow,transform] duration-200 md:p-7 shadow-[var(--shadow-lift)]"
              >
                <div>
                  <span className="inline-flex rounded-full border border-rc2-dark-border bg-rc2-dark-text/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-rc2-dark-text mb-4">
                    Próximo passo
                  </span>
                  <h3 className="text-xl font-semibold text-rc2-dark-text mb-3 leading-tight">
                    Não sabe por onde começar?
                  </h3>
                  <p className="text-sm text-rc2-dark-text-secondary leading-relaxed max-w-[30ch]">
                    Conversa de 20 a 30 minutos para entender o cenário e indicar o próximo passo.
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rc2-dark-text group-hover:underline transition-[color,text-decoration-color] duration-200 underline-offset-4">
                  Falar sobre minha operação
                  <ArrowRight size={14} />
                </span>
              </TrackedLink>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Posicionamento ── */}
      <section className="bg-rc2-bg-alt rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="none">
            <SectionLabel className="rc2-rule block mb-5">Posicionamento</SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading mb-10">
              O que a RC2 não é
            </h2>
          </ScrollReveal>
          <div className="space-y-5 max-w-4xl">
            {[
              'Não é agência de marketing que também "faz automação".',
              "Não é revenda de ferramenta com treinamento incluso.",
              "Não é entusiasta de IA que nunca operou um negócio de verdade.",
            ].map((item, index) => (
              <ScrollReveal key={item} delay={index * 90} direction="left">
                <p className="rc2-rule text-lg text-rc2-text leading-relaxed">
                  {item}
                </p>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={280} distance="18px">
            <p className="mt-10 text-xl md:text-2xl font-semibold text-rc2-heading leading-snug max-w-3xl">
              A RC2 implementa. Do diagnóstico ao processo rodando — e fica até
              funcionar.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Diferencial ── */}
      <section className="rc2-grain relative overflow-hidden bg-rc2-dark-2 rc2-section">
        <div className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 max-w-3xl">
          <ScrollReveal direction="right" distance="32px">
            <SectionLabel className="rc2-rule block mb-5 text-rc2-brand">Diferencial</SectionLabel>
            <h2 className="rc2-h2 text-rc2-dark-text mb-6">
              Tecnologia com visão de operação.
            </h2>
            <p className="text-rc2-dark-text-secondary text-lg leading-relaxed mb-6">
              A RC2 não entrega só ferramenta. Entrega processo funcionando no dia
              a dia da empresa. Atuamos do diagnóstico à implantação para
              organizar atendimento, conectar sistemas e dar previsibilidade à
              operação comercial.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={180} direction="left" distance="20px">
            <p className="rc2-quote-card rc2-quote-card--dark text-sm">
              &ldquo;A IA não substitui uma operação mal estruturada. Primeiro
              organizamos o processo. Depois automatizamos o que faz sentido.&rdquo;
            </p>
          </ScrollReveal>
          <ScrollReveal delay={260} direction="none">
            <p className="mt-8 text-xs text-rc2-dark-text-secondary">
              Mais de 20 anos de experiência em tecnologia, operações digitais,
              e-commerce, automações e gestão de equipes.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Avaliações ── */}
      <section className="bg-rc2-bg rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-5">O que os clientes dizem</SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading mb-12">
              Avaliações de clientes satisfeitos
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={120} distance="32px">
            <HomeReviews />
          </ScrollReveal>
          <ScrollReveal delay={220} direction="none">
            <div className="mt-8 text-center">
              <TrackedLink
                href="/avaliacoes"
                tracking={{ kind: "cta", location: "home_reviews", label: "ver_avaliacoes_cases", destination: "/avaliacoes" }}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "font-semibold tracking-wide uppercase text-xs px-8 h-12 border-rc2-text text-rc2-text hover:bg-rc2-text hover:text-rc2-dark-text"
                )}
              >
                Ver mais avaliações e cases
              </TrackedLink>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <HomeCtaBlock />
    </>
  );
}
