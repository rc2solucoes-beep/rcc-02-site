import type { Metadata } from "next";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";
import { PageHero } from "@/components/marketing/PageHero";
import { HomeCtaBlock } from "@/components/marketing/HomeCtaBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

const IA_WHATSAPP_MESSAGE =
  "Olá, quero entender quais aplicações de IA fazem sentido para minha empresa.";
const IA_WHATSAPP_URL = `https://wa.me/5511988028550?text=${encodeURIComponent(IA_WHATSAPP_MESSAGE)}`;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: "Soluções com IA",
    description:
      "Veja aplicações práticas de IA para PMEs: responder clientes, qualificar leads, organizar operação e integrar sistemas.",
    alternates: { canonical: `${BASE_URL}/solucoes-com-ia` },
    openGraph: buildOg({
      url: `${BASE_URL}/solucoes-com-ia`,
      title: "Soluções com IA — RC2 Soluções",
      description: "Aplicações práticas de IA para responder mais rápido, reduzir retrabalho e organizar operação.",
      imageUrl: settings.og_image_url,
    }),
  };
}

const blocks = [
  {
    label: "Bloco 01",
    title: "IA para atendimento",
    items: [
      "Responder perguntas frequentes",
      "Atender pelo WhatsApp",
      "Captar dados do cliente",
      "Direcionar para o setor correto",
      "Consultar informações básicas",
      "Abrir chamados",
      "Enviar segunda via, status ou instruções",
      "Atender fora do horário comercial",
    ],
  },
  {
    label: "Bloco 02",
    title: "IA para vendas",
    items: [
      "Qualificar leads",
      "Entender a necessidade do cliente",
      "Enviar informações de produtos ou serviços",
      "Agendar reuniões",
      "Encaminhar oportunidades para vendedores",
      "Criar mensagens comerciais",
      "Fazer follow-up automático",
      "Recuperar contatos parados",
    ],
  },
  {
    label: "Bloco 03",
    title: "IA para operação",
    items: [
      "Organizar solicitações internas",
      "Gerar relatórios",
      "Resumir conversas",
      "Classificar chamados",
      "Criar tarefas",
      "Consultar documentos",
      "Apoiar decisões com base em dados",
      "Reduzir tarefas administrativas",
    ],
  },
  {
    label: "Bloco 04",
    title: "IA integrada aos seus sistemas",
    subtitle: "Exemplos de integrações:",
    items: [
      "WhatsApp",
      "Site",
      "CRM",
      "ERP",
      "E-mail",
      "Google Sheets",
      "ClickUp",
      "Plataformas de e-commerce",
      "Bancos de dados",
      "APIs externas",
    ],
  },
];

export default async function SolucoesComIAPage() {
  let schemaWebPage;

  try {
    const settings = await getOrgSettings();
    schemaWebPage = getWebPageSchema(
      settings,
      {
        title: "Soluções com IA",
        description:
          "Veja aplicações práticas de IA para PMEs: responder clientes, qualificar leads, organizar operação e integrar sistemas.",
        url: `${BASE_URL}/solucoes-com-ia`,
        keywords: "soluções com IA, casos de uso, RPA, automação, inteligência artificial prática, IA para empresas",
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
        label="Soluções com IA"
        title="Como a IA pode ajudar sua empresa na prática"
        description="A RC2 aplica IA em problemas reais do dia a dia: atendimento lento, perda de leads, retrabalho e falta de integração entre sistemas."
      />

      <section className="bg-rc2-bg py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="mb-10 rounded-lg border border-rc2-surface-2 bg-white p-6 md:p-8">
            <SectionLabel className="block mb-3">Exemplos práticos</SectionLabel>
            <div className="space-y-3 text-sm text-rc2-text/80">
              <p><span className="font-semibold text-rc2-heading">Atendimento:</span> dúvidas frequentes chegam pelo WhatsApp; a IA responde o básico e encaminha casos complexos para a equipe, reduzindo fila de resposta.</p>
              <p><span className="font-semibold text-rc2-heading">Leads:</span> novos contatos entram sem contexto; a IA faz perguntas iniciais e envia oportunidades mais qualificadas para o vendedor certo.</p>
              <p><span className="font-semibold text-rc2-heading">Equipe interna:</span> informações ficam espalhadas; a IA consulta documentos e entrega respostas rápidas sem busca manual em várias ferramentas.</p>
              <p><span className="font-semibold text-rc2-heading">Pós-venda:</span> solicitações chegam misturadas; a IA classifica demandas e organiza o fluxo antes da análise humana, melhorando previsibilidade operacional.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blocks.map((block, index) => (
              <ScrollReveal
                key={block.label}
                delay={(index % 2) * 90 + Math.floor(index / 2) * 50}
                className="bg-rc2-bg-alt border border-rc2-surface-2 rounded-lg p-8 md:p-10"
              >
                <SectionLabel className="block mb-3">{block.label}</SectionLabel>
                <h2 className="text-xl md:text-2xl font-semibold text-rc2-heading mb-2">
                  {block.title}
                </h2>
                {block.subtitle && (
                  <p className="text-sm text-rc2-text/70 mb-4">{block.subtitle}</p>
                )}
                <ul className="mt-4 space-y-2">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-rc2-brand-text text-xs mt-1 shrink-0">→</span>
                      <span className="text-sm text-rc2-text/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            ))}
          </div>

          {/* Bridge text */}
          <ScrollReveal className="mt-16 max-w-2xl" direction="none">
            <p className="rc2-quote-card text-lg">
              Você não precisa chegar com a solução pronta. A RC2 ajuda a
              identificar por onde começar, priorizando o que gera impacto real
              com menor complexidade.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <HomeCtaBlock />
    </>
  );
}
