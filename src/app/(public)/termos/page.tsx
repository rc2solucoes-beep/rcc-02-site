import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

const BASE_URL = "https://rc2solucoes.com.br";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Termos de Uso do site RC2 Soluções — condições de acesso e utilização.",
  robots: { index: false, follow: false },
};

export default async function TermosPage() {
  let schemaWebPage;

  try {
    const settings = await getOrgSettings();
    schemaWebPage = getWebPageSchema(
      settings,
      {
        title: "Termos de Uso",
        description:
          "Termos de Uso do site RC2 Soluções — condições de acesso e utilização.",
        url: `${BASE_URL}/termos`,
        keywords: "termos de uso, condições, acesso, site, políticas",
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
      <PageHero
        label="Legal"
        title="Termos de Uso"
        description="Última atualização: maio de 2026"
      />

      <section className="bg-rc2-sand py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-neutral max-w-none text-rc2-ebony/80 leading-relaxed space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">1. Aceitação dos termos</h2>
              <p>
                Ao acessar e utilizar este site, você concorda com estes Termos de Uso. Caso não concorde, por favor, não utilize o site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">2. Sobre a RC2 Soluções</h2>
              <p>
                RC2 Soluções, CNPJ: 10.604.725/0001-42, sediada em Avenida Nova América, 202, Jardim Santa Cecília, Guarulhos/SP, prestadora de serviços de consultoria em tecnologia, IA, automações e operações digitais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">3. Uso permitido</h2>
              <p>Este site destina-se exclusivamente a:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Obter informações sobre os serviços da RC2 Soluções</li>
                <li>Entrar em contato para solicitação de diagnóstico ou orçamento</li>
                <li>Leitura de conteúdo do blog (quando disponível)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">4. Propriedade intelectual</h2>
              <p>
                Todo o conteúdo deste site — textos, logotipos, imagens, layout e código — é de propriedade da RC2 Soluções ou licenciado pela mesma, protegido pela legislação de direitos autorais brasileira. É proibida a reprodução sem autorização prévia e por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">5. Limitação de responsabilidade</h2>
              <p>
                As informações neste site são fornecidas &ldquo;como estão&rdquo; para fins informativos. A RC2 Soluções não garante resultados específicos decorrentes do uso das informações publicadas. Propostas comerciais são formalizadas em contratos separados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">6. Links externos</h2>
              <p>
                Este site pode conter links para sites de terceiros. A RC2 Soluções não se responsabiliza pelo conteúdo, políticas ou práticas desses sites.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">7. Privacidade</h2>
              <p>
                O tratamento de dados pessoais é regido pela nossa{" "}
                <a href="/privacidade" className="text-rc2-orange-text underline">Política de Privacidade</a>, em conformidade com a LGPD (Lei nº 13.709/2018) e o Marco Civil da Internet (Lei nº 12.965/2014).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">8. Lei aplicável e foro</h2>
              <p>
                Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de Guarulhos/SP para dirimir eventuais controvérsias.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">9. Contato</h2>
              <p>
                Para dúvidas sobre estes termos:{" "}
                <a href="mailto:contato@rc2solucoes.com.br" className="text-rc2-orange-text underline">contato@rc2solucoes.com.br</a>
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
