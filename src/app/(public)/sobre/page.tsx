import type { Metadata } from "next";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";
import { PageHero } from "@/components/marketing/PageHero";
import { SignalList } from "@/components/ui/SignalList";
import { HomeCtaBlock } from "@/components/marketing/HomeCtaBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { NumberedList, type NumberedItem } from "@/components/ui/NumberedList";
import { HOME_METHOD } from "@/lib/content/home";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: "Sobre a RC2",
    description:
      "Fundada por Robson Azevedo, com mais de 20 anos de experiência em TI, e-commerce e transformação digital. Conheça a RC2 Soluções.",
    alternates: { canonical: `${BASE_URL}/sobre` },
    openGraph: buildOg({
      url: `${BASE_URL}/sobre`,
      title: "Sobre a RC2 Soluções — IA, Automações e Operações Digitais",
      description: "Fundada por Robson Azevedo, com mais de 20 anos de experiência em TI, e-commerce e transformação digital. Conheça a RC2 Soluções.",
      imageUrl: settings.og_image_url,
    }),
  };
}

/**
 * O método vem de `HOME_METHOD`, a mesma fonte que a Home usa.
 *
 * `/sobre` mantinha uma segunda lista — "Diagnóstico, Desenho da solução,
 * Implantação, Treinamento, Evolução" — que divergia do método vigente:
 * `Treinamento` não existe mais como etapa e `Medir` não estava lá. Eram dois
 * métodos diferentes descritos como se fossem o mesmo.
 *
 * Ler da fonte única impede a divergência de voltar: mudar o método passa a
 * mudar as duas páginas de uma vez.
 */
const steps: NumberedItem[] = HOME_METHOD.steps.map((step) => ({
  title: step.name,
  description: step.description,
}));

export default async function SobrePage() {
  let schemaWebPage;

  try {
    const settings = await getOrgSettings();
    schemaWebPage = getWebPageSchema(
      settings,
      {
        title: "Sobre a RC2",
        description:
          "Fundada por Robson Azevedo, com mais de 20 anos de experiência em TI, e-commerce e transformação digital. Conheça a RC2 Soluções.",
        url: `${BASE_URL}/sobre`,
        keywords: "sobre RC2, consultoria, IA, automação, transformação digital, Robson Azevedo, time",
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
        label="Sobre a RC2"
        title="Tecnologia que funciona. Operação que entrega."
        description="A RC2 é especializada em automação de processos, integração de sistemas e inteligência artificial aplicada à operação."
        className="rc2-section--opening"
      />

      <section className="bg-rc2-bg rc2-section rc2-section--argument">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Institucional */}
            <ScrollReveal direction="left" distance="24px">
              <SectionLabel className="block mb-5">A empresa</SectionLabel>
              <div className="prose prose-neutral max-w-none text-rc2-text/80 leading-relaxed space-y-4">
                <p>
                  Entramos em empresas onde ainda existe muito trabalho manual,
                  sistemas desconectados ou processos que cresceram sem uma
                  arquitetura clara.
                </p>
                <p>
                  Nosso trabalho começa entendendo como a operação funciona
                  hoje. Depois desenhamos, implantamos, medimos e evoluímos a
                  solução.
                </p>
              </div>

              {/* §9 — a experiência de operação que antecede a automação. */}
              <SectionLabel className="mt-10 block mb-5">
                Experiência de operação antes da automação
              </SectionLabel>
              <p className="text-rc2-text/80 leading-relaxed">
                A RC2 é liderada por{" "}
                <strong className="text-rc2-text">Robson Azevedo</strong>,
                profissional com mais de 20 anos de experiência em tecnologia,
                operações digitais, e-commerce, integração de sistemas e
                liderança de equipes. Sua trajetória inclui:
              </p>
              <SignalList
                className="mt-5"
                tone="signal"
                items={[
                  "Operação 24×7 em ambiente corporativo",
                  "Liderança de equipes",
                  "Atuação em operações internacionais",
                  "Criação e escala de canal D2C nos Estados Unidos",
                  "Integração de ERP, CRM, e-commerce e logística",
                  "Implantação de atendimento omnichannel",
                  "Automação e IA aplicada a operações reais",
                ]}
              />

              <blockquote className="rc2-quote-card mt-8 text-sm">
                &ldquo;Tecnologia só faz sentido quando melhora um processo real
                e continua funcionando depois da implantação.&rdquo;
                <cite className="block mt-2 not-italic font-medium text-rc2-text/70 text-xs">
                  — Robson Azevedo, fundador
                </cite>
              </blockquote>
            </ScrollReveal>

            {/* Método */}
            <ScrollReveal delay={120} direction="right" distance="24px">
              <SectionLabel className="block mb-5">Nossa forma de trabalhar</SectionLabel>
              <NumberedList items={steps} />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA contextual de /sobre na tabela aprovada do AGENTS.md. */}
      <HomeCtaBlock
        className="rc2-section--closing"
        primaryLabel="Conversar com a RC2"
      />
    </>
  );
}
