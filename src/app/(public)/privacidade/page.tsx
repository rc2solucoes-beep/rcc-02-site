import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

const BASE_URL = "https://rc2solucoes.com.br";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade da RC2 Soluções — como coletamos, usamos e protegemos seus dados pessoais, em conformidade com a LGPD.",
  robots: { index: false, follow: false },
};

export default async function PrivacidadePage() {
  let schemaWebPage;

  try {
    const settings = await getOrgSettings();
    schemaWebPage = getWebPageSchema(
      settings,
      {
        title: "Política de Privacidade",
        description:
          "Política de Privacidade da RC2 Soluções — como coletamos, usamos e protegemos seus dados pessoais, em conformidade com a LGPD.",
        url: `${BASE_URL}/privacidade`,
        keywords: "privacidade, LGPD, dados pessoais, proteção de dados",
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
        title="Política de Privacidade"
        description="Última atualização: maio de 2025"
      />

      <section className="bg-rc2-sand py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-neutral max-w-none text-rc2-ebony/80 leading-relaxed space-y-8">
            <div className="p-4 border-l-2 border-rc2-orange bg-rc2-orange/5 text-sm text-rc2-ebony/60">
              <strong>Aviso:</strong> Os campos de CNPJ e endereço serão preenchidos antes da publicação em produção.
            </div>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">1. Quem somos</h2>
              <p>
                A RC2 Soluções (CNPJ: <span className="text-rc2-orange">[PREENCHER]</span>, endereço: <span className="text-rc2-orange">[PREENCHER]</span>) é controladora dos dados pessoais tratados por meio deste site.
              </p>
              <p>
                Contato do responsável: <a href="mailto:contato@rc2solucoes.com.br" className="text-rc2-orange underline">contato@rc2solucoes.com.br</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">2. Dados coletados</h2>
              <p>Coletamos os seguintes dados quando você preenche o formulário de contato:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nome completo</li>
                <li>Nome da empresa</li>
                <li>Endereço de e-mail</li>
                <li>Número de WhatsApp</li>
                <li>Segmento da empresa e porte</li>
                <li>Descrição do desafio</li>
              </ul>
              <p>
                Também coletamos dados de navegação de forma automática (endereço IP, tipo de dispositivo, páginas visitadas) por meio de ferramentas de analytics.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">3. Finalidade e base legal</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Diagnóstico e proposta comercial</strong> — execução de etapas pré-contratuais (art. 7º, V, LGPD)</li>
                <li><strong>Comunicação e atendimento</strong> — legítimo interesse (art. 7º, IX, LGPD)</li>
                <li><strong>Analytics e melhoria do site</strong> — legítimo interesse</li>
                <li><strong>Cumprimento de obrigação legal</strong> — quando aplicável (art. 7º, II, LGPD)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">4. Retenção dos dados</h2>
              <p>
                Os dados são retidos pelo período necessário ao atendimento das finalidades descritas ou pelo prazo exigido por lei. Leads não convertidos são excluídos em até 24 meses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">5. Compartilhamento</h2>
              <p>
                Não vendemos, alugamos ou compartilhamos dados com terceiros para fins comerciais. Podemos compartilhar com prestadores de serviço essenciais (hospedagem, e-mail, analytics) sob obrigação de confidencialidade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">6. Seus direitos (LGPD)</h2>
              <p>Você pode, a qualquer momento:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Confirmar a existência de tratamento dos seus dados</li>
                <li>Acessar seus dados</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar anonimização, bloqueio ou eliminação</li>
                <li>Revogar consentimento</li>
                <li>Apresentar reclamação à ANPD</li>
              </ul>
              <p>
                Para exercer seus direitos: <a href="mailto:contato@rc2solucoes.com.br" className="text-rc2-orange underline">contato@rc2solucoes.com.br</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">7. Cookies</h2>
              <p>
                Utilizamos cookies para funcionamento do site e analytics de privacidade (Umami — sem cookies de rastreamento individual). Você pode desativar cookies no seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">8. Segurança</h2>
              <p>
                Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, perda ou divulgação indevida.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">9. Alterações</h2>
              <p>
                Esta política pode ser atualizada periodicamente. Alterações relevantes serão comunicadas nesta página.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-rc2-ebony mb-3">10. Contato do Encarregado (DPO)</h2>
              <p>
                <a href="mailto:contato@rc2solucoes.com.br" className="text-rc2-orange underline">contato@rc2solucoes.com.br</a>
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
