import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";
import { buildOg } from "@/lib/siteMetadata";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ServiceCard } from "@/components/marketing/ServiceCard";
import { CTABlock } from "@/components/marketing/CTABlock";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { HomeReviews } from "@/components/marketing/HomeReviews";
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
    alternates: { canonical: "https://rc2solucoes.com.br" },
    openGraph: buildOg({
      url: "https://rc2solucoes.com.br",
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

const BASE_URL = "https://rc2solucoes.com.br";
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
      <section className="rc2-grain relative overflow-hidden bg-rc2-sand rc2-section md:py-28 lg:py-32">
        {/* Atmosfera: grid blueprint + brilho laranja difuso */}
        <div className="rc2-blueprint pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[460px] w-[460px] rounded-full bg-rc2-orange/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel className="rc2-rule block mb-5">
            Consultoria em IA e Automações para PMEs
          </SectionLabel>
          <h1 className="rc2-h1 text-rc2-ebony max-w-4xl">
            Nenhum lead esperando. Nenhuma tarefa repetida duas vezes.
          </h1>
          <p className="rc2-body-lg mt-6 text-rc2-ebony/75 max-w-2xl">
            A RC2 implanta atendimento automático no WhatsApp, integra seus
            sistemas e coloca a operação para rodar sozinha. Primeira resposta ao
            lead em menos de 2 minutos, 24h por dia — no ar em 30 dias, sem
            contratar mais ninguém.
          </p>

          {heroVariant === "b" && (
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-2xl">
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
          <p className="mt-6 text-xs italic text-rc2-ebony/75">
            &ldquo;Tecnologia que funciona. Operação que entrega.&rdquo;
          </p>
        </div>
      </section>

      {/* ── Para quem é ── */}
      <section className="rc2-grain relative overflow-hidden bg-rc2-ink rc2-section">
        <div className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel className="rc2-rule block mb-5 text-rc2-orange">Para quem é</SectionLabel>
          <h2 className="rc2-h2 text-rc2-sand mb-10 max-w-lg">
            Sua empresa precisa da RC2 se você:
          </h2>
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-rc2-sand/15 bg-rc2-sand/15 sm:grid-cols-2 lg:grid-cols-3">
            {forWhomItems.map((item, i) => (
              <li
                key={i}
                className="group relative flex items-start gap-3 bg-rc2-ink px-5 py-6 transition-colors hover:bg-rc2-sand/[0.04]"
              >
                {/* acento estrutural laranja no hover */}
                <span
                  className="absolute inset-y-0 left-0 w-0.5 bg-rc2-orange opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
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

      {/* ── Escolha pela dor ── */}
      <section className="bg-rc2-sand pt-10 pb-14 md:pt-14 md:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-rc2-ebony/15 bg-white p-6 sm:p-8 md:p-10 shadow-[0_16px_45px_-36px_rgba(17,24,39,0.55)]">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-8 lg:gap-10">
              <div className="max-w-xl">
                <SectionLabel className="rc2-rule block mb-4">Escolha pela sua dor</SectionLabel>
                <h2 className="rc2-h3 text-rc2-ebony mb-3">
                  Se sua empresa tem esse cenário, já existe um próximo passo.
                </h2>
                <p className="text-sm text-rc2-ebony/72 leading-relaxed">
                  Não precisa decorar nome técnico. Compare a dor com a rota recomendada e siga para a solução mais aderente.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-rc2-ebony/15 bg-rc2-sand px-3 py-1 text-xs font-medium text-rc2-ebony/80">
                    Se sua empresa tem...
                  </span>
                  <span className="inline-flex items-center rounded-full border border-rc2-orange/25 bg-rc2-orange/10 px-3 py-1 text-xs font-medium text-rc2-ebony/85">
                    Comece por...
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-rc2-ebony/12 bg-rc2-sand/35 divide-y divide-rc2-ebony/10 overflow-hidden">
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
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rc2-ebony/20 bg-white text-[11px] font-semibold text-rc2-ebony/80">
                        {index + 1}
                      </span>
                      <p className="text-sm text-rc2-ebony/82 leading-relaxed">{item.pain}</p>
                    </div>
                    <TrackedLink
                      href={item.href}
                      tracking={{
                        kind: "cta",
                        location: "home_choose_by_pain",
                        label: item.label,
                        destination: item.href,
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-rc2-orange md:justify-self-end group-hover:gap-2 transition-all"
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

      {/* ── O que entregamos ── */}
      <section id="servicos" className="bg-rc2-sand pt-0 pb-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel className="rc2-rule block mb-5">O que entregamos</SectionLabel>
          <h2 className="rc2-h2 text-rc2-ebony mb-12 max-w-2xl">
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
              className="group rc2-card-hover flex flex-col justify-between rounded-xl border border-rc2-dark-border bg-rc2-dark-elevated p-6 transition-all duration-200 md:p-7 shadow-[0_16px_36px_-24px_rgba(11,45,34,0.78)]"
            >
              <div>
                <span className="inline-flex rounded-full border border-rc2-sand/45 bg-rc2-sand/14 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-rc2-dark-text mb-4">
                  Próximo passo
                </span>
                <h3 className="text-xl font-semibold text-rc2-dark-text mb-3 leading-tight">
                  Não sabe por onde começar?
                </h3>
                <p className="text-sm text-rc2-dark-text-secondary leading-relaxed max-w-[30ch]">
                  Diagnóstico gratuito para mapear gargalos e oportunidades de automação na sua operação.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rc2-dark-text group-hover:gap-3 transition-all duration-200">
                Solicitar diagnóstico
                <ArrowRight size={14} />
              </span>
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* ── Diferencial ── */}
      <section className="rc2-grain relative overflow-hidden bg-rc2-dark-2 rc2-section">
        <div className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 max-w-3xl">
          <SectionLabel className="rc2-rule block mb-5 text-rc2-orange">Diferencial</SectionLabel>
          <h2 className="rc2-h2 rc2-display text-rc2-dark-text mb-6">
            Tecnologia com visão de operação.
          </h2>
          <p className="text-rc2-dark-text-secondary text-lg leading-relaxed mb-6">
            A RC2 não entrega só ferramenta. Entrega processo funcionando no dia
            a dia da empresa. Atuamos do diagnóstico à implantação para
            organizar atendimento, conectar sistemas e dar previsibilidade à
            operação comercial.
          </p>
          <p className="text-rc2-dark-text-secondary italic text-sm border-l-2 border-rc2-orange pl-4">
            &ldquo;A IA não substitui uma operação mal estruturada. Primeiro
            organizamos o processo. Depois automatizamos o que faz sentido.&rdquo;
          </p>
          <p className="mt-8 text-xs text-rc2-dark-text-secondary">
            Mais de 20 anos de experiência em tecnologia, operações digitais,
            e-commerce, automações e gestão de equipes.
          </p>
        </div>
      </section>

      {/* ── Avaliações ── */}
      <section className="bg-rc2-sand rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel className="rc2-rule block mb-5">O que os clientes dizem</SectionLabel>
          <h2 className="rc2-h2 text-rc2-ebony mb-12">
            Avaliações de clientes satisfeitos
          </h2>
          <HomeReviews />
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
