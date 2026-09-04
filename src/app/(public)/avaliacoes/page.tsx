import type { Metadata } from "next";
import { GoogleReviews } from "@/components/GoogleReviews";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { HOME_PRODUCTS, HOME_DEMOS } from "@/lib/content/home";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";
import { buildOg, BASE_URL } from "@/lib/siteMetadata";
import type { WebPageInfo } from "@/lib/types/schema";

/**
 * Avaliações e Projetos — §10 das Correções.
 *
 * A página chamava-se "Avaliações e Cases" e trazia uma seção "Cases de
 * Sucesso" cujo único conteúdo era o próprio site — laboratório apresentado
 * como case. A regra é explícita: laboratório não é cliente, demonstração não é
 * case comercial, e "Cases de Sucesso" não pode ser usado enquanto não houver
 * case documentado.
 *
 * A estrutura agora separa o que é depoimento real, o que é produto, o que é
 * demonstração e o que é laboratório — cada um rotulado pelo que é.
 */
const pageInfo: WebPageInfo = {
  title: "Avaliações e Projetos",
  description:
    "Avaliações de clientes, produtos próprios da RC2, demonstrações que você pode testar e projetos de laboratório.",
  url: `${BASE_URL}/avaliacoes`,
  keywords:
    "avaliações, depoimentos, projetos, demonstrações, produtos próprios, IA, automação",
};

const products = [HOME_PRODUCTS.zapbox, HOME_PRODUCTS.agendaConfirmada];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: pageInfo.title,
    description: pageInfo.description,
    alternates: { canonical: pageInfo.url },
    openGraph: buildOg({
      title: pageInfo.title,
      description: pageInfo.description,
      url: pageInfo.url,
      imageUrl: settings.og_image_url,
    }),
  };
}

export default async function AvaliacoesPage() {
  const settings = await getOrgSettings();
  const schemaWebPage = getWebPageSchema(settings, pageInfo, BASE_URL);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebPage) }}
      />
      <main id="main-content">
        {/* ── Avaliações de clientes ── */}
        <section className="rc2-grain relative overflow-hidden bg-rc2-bg rc2-section rc2-section--opening">
          <div
            className="rc2-blueprint pointer-events-none absolute inset-0 opacity-50"
            aria-hidden
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="mb-12" distance="18px">
              <SectionLabel className="rc2-rule block mb-5">
                Avaliações e Projetos
              </SectionLabel>
              <h1 className="rc2-h1 text-rc2-heading mb-4">
                Veja antes de acreditar.
              </h1>
              <p className="rc2-body-lg text-rc2-text/75 max-w-2xl">
                Avaliações de quem já trabalhou com a RC2, produtos que estão no
                ar e demonstrações que você pode testar agora.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={120} distance="26px">
              <GoogleReviews columns={2} />
            </ScrollReveal>
          </div>
        </section>

        {/* ── Produtos próprios ── */}
        <section className="bg-rc2-bg-alt rc2-section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <SectionLabel className="rc2-rule block mb-5">
                Produtos próprios
              </SectionLabel>
              <h2 className="rc2-h2 text-rc2-heading mb-10 max-w-2xl">
                Construídos pela RC2 e em operação.
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {products.map((product, index) => (
                <ScrollReveal
                  key={product.name}
                  delay={index * 90}
                  className="rc2-card flex flex-col p-6 md:p-7"
                >
                  <SectionLabel className="block mb-3">
                    {product.category}
                  </SectionLabel>
                  <h3 className="text-xl font-semibold text-rc2-heading mb-1">
                    {product.name}
                  </h3>
                  <p className="mb-3 text-sm font-medium text-rc2-text">
                    {product.tagline}
                  </p>
                  <p className="text-sm text-rc2-text/70 leading-relaxed flex-1">
                    {product.description}
                  </p>
                  <TrackedLink
                    href={product.href}
                    tracking={{
                      kind: "cta",
                      location: "avaliacoes_produtos",
                      label: product.analyticsLabel,
                      destination: product.href,
                    }}
                    className="rc2-action-link mt-6"
                  >
                    {product.ctaLabel}
                  </TrackedLink>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Demonstrações ── */}
        <section className="bg-rc2-bg rc2-section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <SectionLabel className="rc2-rule block mb-5">
                Demonstrações
              </SectionLabel>
              <h2 className="rc2-h2 text-rc2-heading mb-10 max-w-2xl">
                Tecnologia que você pode ver funcionando.
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {HOME_DEMOS.map((demo, index) => (
                <ScrollReveal
                  key={demo.title}
                  delay={index * 90}
                  className="rc2-card flex flex-col p-6 md:p-7"
                >
                  <h3 className="text-lg font-semibold text-rc2-heading mb-3">
                    {demo.title}
                  </h3>
                  <p className="text-sm text-rc2-text/70 leading-relaxed flex-1">
                    {demo.description}
                  </p>
                  {demo.href && demo.ctaLabel && demo.analyticsLabel && (
                    <TrackedLink
                      href={demo.href}
                      {...(demo.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      tracking={{
                        kind: demo.external ? "whatsapp" : "cta",
                        location: "avaliacoes_demos",
                        label: demo.analyticsLabel,
                        destination: demo.href,
                      }}
                      className="rc2-action-link mt-6"
                    >
                      {demo.ctaLabel}
                    </TrackedLink>
                  )}
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Projetos de laboratório ── */}
        <section className="bg-rc2-bg-alt rc2-section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal direction="none" className="max-w-3xl">
              <SectionLabel className="rc2-rule block mb-5">
                Projetos de laboratório
              </SectionLabel>
              <h2 className="rc2-h2 text-rc2-heading mb-4">
                O que construímos para testar o método.
              </h2>
              <p className="rc2-body text-rc2-text/75 mb-8">
                Laboratório e protótipo, identificados como tal. Não são
                projetos de cliente nem case comercial.
              </p>

              <div className="rc2-card p-6 md:p-7">
                <SectionLabel className="block mb-3">
                  Laboratório interno
                </SectionLabel>
                <h3 className="text-lg font-semibold text-rc2-heading mb-3">
                  Este site, construído com IA na prática
                </h3>
                <p className="text-sm text-rc2-text/70 leading-relaxed">
                  Desenvolvido aplicando vibecode, engenharia de prompt e
                  ferramentas modernas de IA. A mesma lógica usada aqui —
                  clareza, velocidade, automação e execução prática — é aplicada
                  nos projetos que a RC2 implementa em operações de clientes.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </>
  );
}
