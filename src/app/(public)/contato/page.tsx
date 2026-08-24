import type { Metadata } from "next";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";
import { ContactForm } from "@/components/marketing/ContactForm";
import { CTABlock } from "@/components/marketing/CTABlock";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

const CONTACT_WHATSAPP_MESSAGE = "Olá, quero solicitar um diagnóstico para minha empresa.";
const CONTACT_WHATSAPP_URL = `https://wa.me/5511988028550?text=${encodeURIComponent(CONTACT_WHATSAPP_MESSAGE)}`;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: "Contato — Solicite um Diagnóstico",
    description:
      "Solicite um diagnóstico e receba um plano inicial para organizar atendimento, reduzir retrabalho e priorizar automações.",
    alternates: { canonical: `${BASE_URL}/contato` },
    openGraph: buildOg({
      url: `${BASE_URL}/contato`,
      title: "Contato — Solicite um Diagnóstico | RC2 Soluções",
      description: "Solicite um diagnóstico e receba um plano inicial para organizar atendimento, reduzir retrabalho e priorizar automações.",
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
        title: "Contato — Solicite um Diagnóstico",
        description:
          "Solicite um diagnóstico e receba um plano inicial para organizar atendimento, reduzir retrabalho e priorizar automações.",
        url: `${BASE_URL}/contato`,
        keywords: "contato, diagnóstico gratuito, consultoria, IA, automação, oportunidades",
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
            <SectionLabel className="block mb-4">Diagnóstico gratuito</SectionLabel>
            <h1 className="rc2-display text-4xl md:text-5xl text-rc2-heading mb-6 leading-tight">
              Solicite um diagnóstico para sua empresa
            </h1>
            <p className="text-rc2-text/70 leading-relaxed mb-8">
              Se sua empresa está com atendimento lento, leads sem resposta,
              tarefas manuais ou sistemas desconectados, este diagnóstico ajuda
              a priorizar o que resolver primeiro.
            </p>
            <p className="text-rc2-text/70 leading-relaxed mb-8">
              Em poucos passos, mapeamos seu cenário atual, identificamos
              gargalos e sugerimos um plano inicial de execução com IA,
              automações e integrações.
            </p>

            {/* What you get */}
            <div className="p-6 border border-rc2-surface-2 bg-rc2-bg-alt rounded-lg">
              <h2 className="text-sm font-semibold text-rc2-heading mb-4 uppercase tracking-wide">
                O que você recebe
              </h2>
              <ul className="space-y-3 text-sm text-rc2-text/70">
                {[
                  "Mapeamento inicial da operação",
                  "Identificação de gargalos",
                  "Sugestão de automações possíveis",
                  "Priorização por impacto e complexidade",
                  "Roadmap de implantação",
                  "Proposta para execução",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rc2-brand-text mt-0.5 text-xs shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
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

      <CTABlock
        title="Não consegue preencher agora?"
        description="Chame a gente pelo WhatsApp e vamos agendar um diagnóstico em tempo real."
        primaryLabel="Falar pelo WhatsApp"
        primaryHref={CONTACT_WHATSAPP_URL}
        hideSecondary={true}
        variant="dark"
      />
    </>
  );
}
