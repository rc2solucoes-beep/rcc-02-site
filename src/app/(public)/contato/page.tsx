import type { Metadata } from "next";
import { buildOg } from "@/lib/siteMetadata";
import { ContactForm } from "@/components/marketing/ContactForm";
import { CTABlock } from "@/components/marketing/CTABlock";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

const BASE_URL = "https://rc2solucoes.com.br";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: "Contato — Solicite um Diagnóstico",
    description:
      "Solicite um diagnóstico e receba um plano inicial para organizar atendimento, reduzir retrabalho e priorizar automações.",
    alternates: { canonical: "https://rc2solucoes.com.br/contato" },
    openGraph: buildOg({
      url: "https://rc2solucoes.com.br/contato",
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
    <section className="bg-rc2-sand py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Sidebar */}
          <div>
            <SectionLabel className="block mb-4">Diagnóstico gratuito</SectionLabel>
            <h1 className="rc2-display text-4xl md:text-5xl text-rc2-ebony mb-6 leading-tight">
              Solicite um diagnóstico para sua empresa
            </h1>
            <p className="text-rc2-ebony/70 leading-relaxed mb-8">
              Se sua empresa está com atendimento lento, leads sem resposta,
              tarefas manuais ou sistemas desconectados, este diagnóstico ajuda
              a priorizar o que resolver primeiro.
            </p>
            <p className="text-rc2-ebony/70 leading-relaxed mb-8">
              Em poucos passos, mapeamos seu cenário atual, identificamos
              gargalos e sugerimos um plano inicial de execução com IA,
              automações e integrações.
            </p>

            {/* What you get */}
            <div className="p-6 border border-[var(--surface-2)] bg-[var(--surface-1)] rounded-lg">
              <h2 className="text-sm font-semibold text-rc2-ebony mb-4 uppercase tracking-wide">
                O que você recebe
              </h2>
              <ul className="space-y-3 text-sm text-rc2-ebony/70">
                {[
                  "Mapeamento inicial da operação",
                  "Identificação de gargalos",
                  "Sugestão de automações possíveis",
                  "Priorização por impacto e complexidade",
                  "Roadmap de implantação",
                  "Proposta para execução",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rc2-orange mt-0.5 text-xs shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <p className="text-xs text-rc2-ebony/70 mb-2">Prefere falar diretamente?</p>
              <TrackedLink
                href="https://wa.me/5511988028550"
                target="_blank"
                rel="noopener noreferrer"
                tracking={{
                  kind: "whatsapp",
                  location: "contact_page_sidebar",
                  label: "falar_pelo_whatsapp",
                  destination: "https://wa.me/5511988028550",
                }}
                className="text-sm font-semibold text-rc2-orange underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                Falar pelo WhatsApp →
              </TrackedLink>
            </div>
          </div>

          {/* Form */}
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>

      <CTABlock
        title="Não consegue preencher agora?"
        description="Chame a gente pelo WhatsApp e vamos agendar um diagnóstico em tempo real."
        primaryLabel="Falar pelo WhatsApp"
        primaryHref="https://wa.me/5511988028550"
        hideSecondary={true}
        variant="dark"
      />
    </>
  );
}
