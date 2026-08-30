import type { Metadata } from "next";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";
import { ContactForm } from "@/components/marketing/ContactForm";
import { ContactCtaBlock } from "@/components/marketing/ContactCtaBlock";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

const CONTACT_WHATSAPP_MESSAGE = "Olá, quero falar sobre a operação da minha empresa.";
const CONTACT_WHATSAPP_URL = `https://wa.me/5511988028550?text=${encodeURIComponent(CONTACT_WHATSAPP_MESSAGE)}`;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: "Contato — Falar sobre a sua operação",
    description:
      "Converse com a RC2 sobre automação de processos, integração de sistemas e IA para operações. Conversa inicial de 20 a 30 minutos, sem compromisso.",
    alternates: { canonical: `${BASE_URL}/contato` },
    openGraph: buildOg({
      url: `${BASE_URL}/contato`,
      title: "Contato — Falar sobre a sua operação | RC2 Soluções",
      description: "Converse com a RC2 sobre automação de processos, integração de sistemas e IA para operações. Conversa inicial sem compromisso.",
      imageUrl: settings.og_image_url,
    }),
  };
}

export default async function ContatoPage() {
  let schemaWebPage;

  try {
    const settings = await getOrgSettings();
    schemaWebPage = getWebPageSchema(
      settings,
      {
        title: "Contato — Falar sobre a sua operação",
        description:
          "Converse com a RC2 sobre automação de processos, integração de sistemas e IA para operações. Conversa inicial de 20 a 30 minutos, sem compromisso.",
        url: `${BASE_URL}/contato`,
        keywords: "contato, conversa inicial, discovery operacional, consultoria, automação de processos, integração de sistemas, IA para operações",
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
    <section className="rc2-grain relative overflow-hidden bg-rc2-bg py-16 md:py-20">
      <div className="rc2-blueprint pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-rc2-brand/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Sidebar */}
          <ScrollReveal direction="left" distance="24px">
            <SectionLabel className="block mb-4">Conversa inicial</SectionLabel>
            <h1 className="rc2-display text-4xl md:text-5xl text-rc2-heading mb-6 leading-tight">
              Vamos falar sobre a sua operação
            </h1>
            <p className="text-rc2-text/70 leading-relaxed mb-8">
              Se sua operação tem tarefas manuais, sistemas que não conversam ou
              processos que dependem de pessoas específicas, comece por uma
              conversa. São 20 a 30 minutos, sem compromisso.
            </p>

            {/* Conversa inicial — escopo delimitado */}
            <div className="p-6 border border-rc2-surface-2 bg-rc2-bg-alt rounded-lg">
              <h2 className="text-sm font-semibold text-rc2-heading mb-4 uppercase tracking-wide">
                O que acontece nessa conversa
              </h2>
              <ul className="space-y-3 text-sm text-rc2-text/70">
                {[
                  "Entendemos o cenário da sua operação",
                  "Ouvimos qual é o principal problema hoje",
                  "Verificamos se há aderência com o trabalho da RC2",
                  "Indicamos qual deve ser o próximo passo",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rc2-brand-text mt-0.5 text-xs shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-rc2-text-secondary leading-relaxed">
                A conversa não inclui levantamento completo, mapa de processos,
                arquitetura ou roadmap. Esse trabalho pertence ao Discovery
                Operacional.
              </p>
            </div>

            {/* Discovery Operacional — etapa paga, separada da conversa */}
            <div className="mt-6 rounded-lg border border-rc2-border bg-rc2-surface p-6">
              <SectionLabel className="block mb-3">Próximo passo, quando necessário</SectionLabel>
              <h2 className="text-base font-semibold text-rc2-heading mb-3">
                Discovery Operacional
              </h2>
              <p className="text-sm text-rc2-text/70 leading-relaxed mb-4">
                Quando o problema envolve vários sistemas ou exige decisão de
                arquitetura, o próximo passo é um trabalho estruturado e pago:
                levantamento do processo, sistemas envolvidos, integrações,
                riscos, prioridades, estimativa e roadmap.
              </p>
              <p className="text-sm text-rc2-text/70">
                <span className="font-semibold text-rc2-heading">
                  R$ 1.500 a R$ 5.000
                </span>
                , conforme a complexidade.
              </p>
              <p className="mt-4 text-xs text-rc2-text-secondary leading-relaxed">
                Nem toda demanda precisa de Discovery. Problemas simples e já bem
                definidos seguem direto para proposta.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-xs text-rc2-text/70 mb-2">Prefere falar diretamente?</p>
              <TrackedLink
                href={CONTACT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                tracking={{
                  kind: "whatsapp",
                  location: "contact_page_sidebar",
                  label: "falar_pelo_whatsapp",
                  destination: CONTACT_WHATSAPP_URL,
                }}
                className="text-sm font-semibold text-rc2-brand-text underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                Falar pelo WhatsApp →
              </TrackedLink>
            </div>
          </ScrollReveal>

          {/* Form */}
          <ScrollReveal delay={120} direction="right" distance="24px">
            <ContactForm />
          </ScrollReveal>
        </div>
      </div>
    </section>

      <ContactCtaBlock />
    </>
  );
}
