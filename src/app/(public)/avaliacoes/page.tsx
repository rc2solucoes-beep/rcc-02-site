import { GoogleReviews } from "@/components/GoogleReviews";
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
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-rc2-ebony mb-4">
                Avaliações & Cases
              </h1>
              <p className="text-lg text-rc2-ebony/70 max-w-2xl mx-auto">
                Veja o que nossos clientes estão dizendo e conheça os resultados reais que alcançamos com nossas soluções de IA e automação.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-rc2-ebony mb-12 text-center">
              Avaliações dos Clientes
            </h2>
            <div className="flex justify-center">
              <GoogleReviews />
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-rc2-sand">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-rc2-ebony mb-12 text-center">
              Cases de Sucesso
            </h2>
            <p className="text-center text-rc2-ebony/70 max-w-2xl mx-auto">
              Em breve, compartilharemos detalhes de projetos que transformaram operações e impulsionaram crescimento para nossos clientes.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
