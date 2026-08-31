import type { Metadata } from "next";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { solutions } from "@/lib/content/solutions";
import { SOLUCOES_METADATA } from "@/lib/content/solucoesPage";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SOLUCOES_METADATA.title,
    description: SOLUCOES_METADATA.description,
    alternates: {
      canonical: `${BASE_URL}/solucoes`,
    },
    openGraph: buildOg({
      title: SOLUCOES_METADATA.title,
      description: SOLUCOES_METADATA.ogDescription,
      url: `${BASE_URL}/solucoes`,
    }),
  };
}

export default function SolucoesPage() {
  const schemaWebPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: SOLUCOES_METADATA.title,
    description: SOLUCOES_METADATA.description,
    url: `${BASE_URL}/solucoes`,
    isPartOf: {
      "@type": "WebSite",
      url: BASE_URL,
      name: "RC2 Soluções",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebPage) }}
      />
      <PageHero
        label="Soluções"
        title="Soluções por problema: da dor real à execução"
        description="Identifique a dor mais urgente da sua operação e veja o caminho recomendado com serviços conectados à realidade da sua empresa."
      />

      <section className="bg-rc2-bg rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal distance="18px">
            <SectionLabel className="rc2-rule block mb-4">Mapeamento por dor</SectionLabel>
            <p className="max-w-3xl text-rc2-text/75 leading-relaxed mb-10">
              Estas páginas partem do problema percebido no dia a dia e conectam sintomas,
              impacto e ações práticas para estruturar atendimento, vendas e operação.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {solutions.map((solution, index) => (
              <ScrollReveal
                key={solution.slug}
                as="article"
                delay={(index % 2) * 90 + Math.floor(index / 2) * 50}
                distance="24px"
                className="group rc2-card rc2-card-hover relative flex flex-col overflow-hidden p-6 pt-7 md:p-7 md:pt-8"
              >
                {/* Acento estrutural — aba laranja no topo */}
                <span
                  className="absolute left-0 top-0 h-1 w-14 origin-left scale-x-[0.72] bg-rc2-brand transition-[opacity,transform] duration-200 group-hover:scale-x-100 group-hover:opacity-90"
                  aria-hidden
                />
                <h2 className="rc2-h4 text-rc2-heading mb-3">{solution.shortTitle}</h2>
                <p className="text-rc2-text/75 leading-relaxed mb-4">{solution.summary}</p>

                <ul className="space-y-2 mb-6">
                  {solution.symptoms.slice(0, 3).map((symptom) => (
                    <li key={symptom} className="flex items-start gap-2.5 text-sm text-rc2-text/75">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-rc2-brand" aria-hidden="true" />
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>

                <TrackedLink
                  href={`/solucoes/${solution.slug}`}
                  tracking={{
                    kind: "solution_link",
                    location: "solution_hub_card",
                    label: solution.shortTitle,
                    destination: `/solucoes/${solution.slug}`,
                    source_page: "/solucoes",
                    source_type: "solutions_hub",
                  }}
                  className="rc2-action-link"
                >
                  Ver solução completa
                  <ArrowRight size={14} />
                </TrackedLink>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Operação Gerenciada ── */}
      <section id="operacao-gerenciada" className="rc2-grain relative overflow-hidden bg-rc2-dark rc2-section">
        <div className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-5 text-rc2-brand">
              Depois da implantação
            </SectionLabel>
            <h2 className="rc2-h2 text-rc2-dark-text mb-6 max-w-2xl">
              Operação Gerenciada
            </h2>
            <p className="text-rc2-dark-text-secondary text-lg leading-relaxed max-w-2xl mb-4">
              Automação implantada não é automação resolvida. Integrações mudam,
              sistemas são atualizados e workflows deixam de refletir a operação.
              A Operação Gerenciada é o acompanhamento técnico contínuo do que já
              está rodando.
            </p>
            <p className="text-rc2-dark-text-secondary leading-relaxed max-w-2xl">
              A RC2 gerencia a tecnologia da operação; não substitui a operação
              do cliente.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ScrollReveal
              delay={80}
              className="rounded-xl border border-rc2-dark-border bg-rc2-dark-elevated p-6 md:p-7"
            >
              <h3 className="text-lg font-semibold text-rc2-dark-text mb-4">
                O que fica sob responsabilidade da RC2
              </h3>
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {[
                  "Monitoramento",
                  "Alertas",
                  "Correções",
                  "Backups",
                  "Observabilidade",
                  "Revisão de workflows",
                  "Manutenção de integrações",
                  "Análise de consumo",
                  "Evolução",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-rc2-dark-text-secondary"
                  >
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-rc2-brand" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-rc2-dark-text-secondary leading-relaxed">
                O escopo define quais automações, integrações e workflows ficam
                sob acompanhamento. Backups se aplicam ao que está no escopo
                gerenciado.
              </p>
            </ScrollReveal>

            <ScrollReveal
              delay={140}
              className="rounded-xl border border-rc2-dark-border bg-rc2-dark-card p-6 md:p-7"
            >
              <h3 className="text-lg font-semibold text-rc2-dark-text mb-4">
                O que continua com a sua equipe
              </h3>
              <p className="text-sm text-rc2-dark-text-secondary leading-relaxed mb-4">
                A operação do negócio permanece com o cliente: atendimento,
                vendas, financeiro, logística e aprovações.
              </p>
              <p className="text-sm text-rc2-dark-text-secondary leading-relaxed mb-4">
                A Operação Gerenciada não é terceirização nem BPO, e não cobre a
                gestão cotidiana de conversas de WhatsApp, a operação comercial
                dentro do CRM nem equipe de atendimento — esse território é do{" "}
                <a
                  href="https://zapbox.cloud/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-rc2-brand underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  Zapbox
                </a>
                , produto da própria RC2.
              </p>
              <p className="text-sm text-rc2-dark-text-secondary leading-relaxed mb-4">
                Quando fazem parte do escopo contratado, as integrações entre o
                Zapbox e os demais sistemas da operação podem entrar no
                acompanhamento técnico da RC2 — o fluxo entre as plataformas,
                não o atendimento que roda dentro delas.
              </p>
              <p className="text-sm text-rc2-dark-text-secondary leading-relaxed">
                Projetos novos e mudanças estruturais de arquitetura saem do
                escopo recorrente e voltam a ser tratados como projeto.
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={200} className="mt-8 max-w-2xl">
            <p className="text-rc2-dark-text-secondary leading-relaxed">
              Contratação mensal, com escopo e valor definidos conforme a
              operação que será acompanhada. Se a RC2 implantou a solução, a
              Operação Gerenciada começa sem novo levantamento; para ambientes
              construídos por terceiros e sem documentação, há antes uma etapa
              paga de avaliação técnica.
            </p>
            <TrackedLink
              href="/contato"
              tracking={{
                kind: "cta",
                location: "solutions_managed_ops",
                label: "operacao_gerenciada",
                destination: "/contato",
              }}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rc2-dark-text hover:underline transition-[color,text-decoration-color] duration-200 underline-offset-4"
            >
              Falar sobre minha operação
              <ArrowRight size={14} />
            </TrackedLink>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
