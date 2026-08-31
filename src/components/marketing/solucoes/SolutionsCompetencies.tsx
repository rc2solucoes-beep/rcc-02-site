import { ArrowUpRight, CheckCircle2, Circle } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SOLUCOES_COMPETENCIES } from "@/lib/content/solucoesPage";

/**
 * As quatro competências da RC2, cada uma ancorada por um id público
 * (docs/14 §6). A composição varia entre elas de propósito: a página não pode
 * ler-se como quatro produtos independentes em quatro cards iguais.
 *
 * O `<h2>` fica dentro da `<section id=…>` para que o leitor de tela anuncie o
 * título ao chegar pela âncora.
 */

function Signals({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-rc2-text/75 leading-relaxed">
          <Circle size={7} className="mt-2 shrink-0 text-rc2-brand" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Interventions({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-rc2-text leading-relaxed">
          <CheckCircle2 size={16} className="mt-1 shrink-0 text-rc2-heading" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Limit({ children }: { children: string }) {
  return (
    <p className="mt-8 border-l-2 border-rc2-border pl-4 text-sm text-rc2-text-secondary leading-relaxed max-w-2xl">
      {children}
    </p>
  );
}

export function SolutionsCompetencies() {
  const [automacao, integracao, ia, commerce] = SOLUCOES_COMPETENCIES;

  return (
    <>
      {/* ── 01 · Automação de Processos — sinais à esquerda, execução à direita ── */}
      <section id={automacao.id} className="bg-rc2-bg-alt rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-4">{automacao.eyebrow}</SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading mb-5">{automacao.title}</h2>
            <p className="rc2-body-lg text-rc2-text/80 max-w-3xl">{automacao.lead}</p>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <ScrollReveal delay={80}>
              <h3 className="rc2-label text-rc2-brand-text mb-5">Sinais na operação</h3>
              <Signals items={automacao.signals} />
            </ScrollReveal>
            <ScrollReveal delay={140} className="rc2-card p-6 md:p-8">
              <h3 className="rc2-label text-rc2-heading mb-5">O que a RC2 faz</h3>
              <Interventions items={automacao.interventions} />
            </ScrollReveal>
          </div>

          {automacao.limit && <Limit>{automacao.limit}</Limit>}
        </div>
      </section>

      {/* ── 02 · Integração de Sistemas — duas colunas de peso igual ── */}
      <section id={integracao.id} className="bg-rc2-bg rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-4">{integracao.eyebrow}</SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading mb-5">{integracao.title}</h2>
            <p className="rc2-body-lg text-rc2-text/80 max-w-3xl">{integracao.lead}</p>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            <ScrollReveal delay={80} className="rc2-card p-6 md:p-7">
              <h3 className="rc2-label text-rc2-brand-text mb-5">Onde a ponte é humana hoje</h3>
              <Signals items={integracao.signals} />
            </ScrollReveal>
            <ScrollReveal delay={140} className="rc2-card p-6 md:p-7">
              <h3 className="rc2-label text-rc2-heading mb-5">O que passa a ser automático</h3>
              <Interventions items={integracao.interventions} />
            </ScrollReveal>
          </div>

          {integracao.limit && <Limit>{integracao.limit}</Limit>}
        </div>
      </section>

      {/* ── 03 · IA para Operações — navy, com a fronteira Zapbox destacada ── */}
      <section
        id={ia.id}
        className="rc2-grain relative overflow-hidden bg-rc2-dark-2 rc2-section"
      >
        <div className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-4 text-rc2-brand">
              {ia.eyebrow}
            </SectionLabel>
            <h2 className="rc2-h2 text-rc2-dark-text mb-5">{ia.title}</h2>
            <p className="rc2-body-lg text-rc2-dark-text-secondary max-w-3xl">{ia.lead}</p>
          </ScrollReveal>

          <ScrollReveal delay={80} className="mt-10">
            <h3 className="rc2-label text-rc2-brand mb-4">Quando esse é o problema</h3>
            <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {ia.signals.map((signal) => (
                <li
                  key={signal}
                  className="flex items-start gap-2.5 text-rc2-dark-text-secondary leading-relaxed"
                >
                  <Circle size={7} className="mt-2 shrink-0 text-rc2-brand" aria-hidden="true" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal
            delay={140}
            className="mt-10 rounded-xl border border-rc2-dark-border bg-rc2-dark-elevated p-6 md:p-8"
          >
            <h3 className="rc2-label text-rc2-dark-text mb-5">Como a IA entra no processo</h3>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {ia.interventions.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-rc2-dark-text-secondary leading-relaxed"
                >
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-rc2-brand" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          {ia.boundary && (
            <ScrollReveal
              delay={200}
              className="mt-8 rounded-xl border border-rc2-dark-border bg-rc2-dark-card p-6 md:p-7 max-w-3xl"
            >
              <h3 className="rc2-label text-rc2-brand mb-3">Onde termina esta competência</h3>
              <p className="text-sm text-rc2-dark-text-secondary leading-relaxed">
                {ia.boundary}
              </p>
              <a
                href="https://zapbox.cloud/"
                target="_blank"
                rel="noopener noreferrer"
                className="ui-focus-ring mt-4 inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-rc2-dark-text underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Conhecer Zapbox
                <ArrowUpRight size={14} />
              </a>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* ── 04 · Operações Digitais & Commerce — jornada do pedido, numerada ── */}
      <section id={commerce.id} className="bg-rc2-bg rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-4">{commerce.eyebrow}</SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading mb-5">{commerce.title}</h2>
            <p className="rc2-body-lg text-rc2-text/80 max-w-3xl">{commerce.lead}</p>
          </ScrollReveal>

          <ScrollReveal delay={80} className="mt-10 max-w-3xl">
            <h3 className="rc2-label text-rc2-brand-text mb-4">O que aparece na operação</h3>
            <Signals items={commerce.signals} />
          </ScrollReveal>

          <ScrollReveal delay={140} className="mt-12">
            <h3 className="rc2-label text-rc2-heading mb-6">Como a RC2 conecta as pontas</h3>
            <ol className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {commerce.interventions.map((item, index) => (
                <li key={item} className="rc2-card p-5">
                  <span className="rc2-label text-rc2-brand-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-3 text-sm text-rc2-text leading-relaxed">{item}</p>
                </li>
              ))}
            </ol>
          </ScrollReveal>

          {commerce.limit && <Limit>{commerce.limit}</Limit>}
        </div>
      </section>
    </>
  );
}
