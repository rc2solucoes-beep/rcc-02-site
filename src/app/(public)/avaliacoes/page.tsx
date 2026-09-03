import type { Metadata } from "next";
import { GoogleReviews } from "@/components/GoogleReviews";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";
import { buildOg, BASE_URL } from "@/lib/siteMetadata";
import type { WebPageInfo } from "@/lib/types/schema";

const pageInfo: WebPageInfo = {
  title: "Avaliações e Cases",
  description: "Veja as avaliações de clientes e cases de sucesso com nossas soluções de IA e automação.",
  url: `${BASE_URL}/avaliacoes`,
  keywords: "avaliações, cases de sucesso, depoimentos, clientes satisfeitos, resultados, IA, automação",
};

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
        <section className="rc2-grain relative overflow-hidden bg-rc2-bg py-16 md:py-24">
          <div className="rc2-blueprint pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="mb-12" distance="18px">
              <SectionLabel className="block mb-5">Avaliações & Cases</SectionLabel>
              <h1 className="text-4xl md:text-5xl font-bold text-rc2-heading mb-4">
                O que nossos clientes estão dizendo
              </h1>
              <p className="text-lg text-rc2-text/70 max-w-2xl">
                Resultados reais de empresas que modernizaram atendimento, vendas e operação com a RC2.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={120} distance="26px">
              <GoogleReviews columns={2} />
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-rc2-bg py-10 md:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal direction="none" className="max-w-3xl">
              <div className="rounded-xl border border-rc2-border bg-rc2-bg-alt p-5 shadow-[var(--shadow-soft)] md:p-6">
                <SectionLabel className="block mb-4">Cases de Sucesso</SectionLabel>
                <div className="border-t border-rc2-border-soft pt-4">
                  <h3 className="text-lg font-semibold text-rc2-heading mb-3">
                    Construído com IA na prática
                  </h3>
                  <p className="text-sm text-rc2-text-secondary leading-relaxed">
                    Este site foi desenvolvido aplicando vibecode, engenharia de prompt e ferramentas modernas de IA. A mesma lógica usada aqui — clareza, velocidade, automação e execução prática — é aplicada nos projetos da RC2 para empresas que querem modernizar atendimento, vendas e operação.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </>
  );
}
