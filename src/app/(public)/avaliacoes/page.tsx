import { GoogleReviews } from "@/components/GoogleReviews";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";
import type { WebPageInfo } from "@/lib/types/schema";

const BASE_URL = "https://rc2solucoes.com.br";

const pageInfo: WebPageInfo = {
  title: "Avaliações e Cases — RC2 Soluções",
  description: "Veja as avaliações de clientes e cases de sucesso com nossas soluções de IA e automação.",
  url: `${BASE_URL}/avaliacoes`,
  keywords: "avaliações, cases de sucesso, depoimentos, clientes satisfeitos, resultados, IA, automação",
};

export const metadata = {
  title: pageInfo.title,
  description: pageInfo.description,
  openGraph: {
    title: pageInfo.title,
    description: pageInfo.description,
    url: pageInfo.url,
    type: "website",
  },
};

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
        <section className="bg-rc2-sand py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <SectionLabel className="block mb-5">Avaliações & Cases</SectionLabel>
              <h1 className="text-4xl md:text-5xl font-bold text-rc2-ebony mb-4">
                O que nossos clientes estão dizendo
              </h1>
              <p className="text-lg text-rc2-ebony/70 max-w-2xl">
                Resultados reais de empresas que modernizaram atendimento, vendas e operação com a RC2.
              </p>
            </div>
            <GoogleReviews columns={2} />
          </div>
        </section>

        <section className="py-16 md:py-24 bg-rc2-ink">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionLabel className="block mb-5 text-rc2-orange">Cases de Sucesso</SectionLabel>
            <div className="max-w-2xl border-l-2 border-rc2-orange pl-8">
              <h3 className="text-xl font-semibold text-rc2-sand mb-4">
                Construído com IA na prática
              </h3>
              <p className="text-rc2-sand/70 leading-relaxed">
                Este site foi desenvolvido aplicando vibecode, engenharia de prompt e ferramentas modernas de IA. A mesma lógica usada aqui — clareza, velocidade, automação e execução prática — é aplicada nos projetos da RC2 para empresas que querem modernizar atendimento, vendas e operação.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
