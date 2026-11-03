import type { Metadata } from "next";
import { serializeJsonLd } from "@/lib/jsonLd";
import { buildOg, BASE_URL } from "@/lib/siteMetadata";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { HomeCtaBlock } from "@/components/marketing/HomeCtaBlock";
import { HeroActions } from "@/components/marketing/HeroActions";
import { HomeProblems } from "@/components/marketing/home/HomeProblems";
import { HomeCompetencies } from "@/components/marketing/home/HomeCompetencies";
import { HomeProducts } from "@/components/marketing/home/HomeProducts";
import { HomeMethod } from "@/components/marketing/home/HomeMethod";
import { HomeAuthority } from "@/components/marketing/home/HomeAuthority";
import { HomeContent } from "@/components/marketing/home/HomeContent";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { HOME_COPY, HOME_PHILOSOPHY } from "@/lib/content/home";
import { getOrgSettings, getOrgSettingsOrNull, getWebPageSchema } from "@/lib/schema";

const HOME_TITLE = "Automação, Integração e IA para PMEs";
const HOME_DESCRIPTION =
  "Sua operação cresceu, mas o processo não acompanhou? A RC2 automatiza tarefas, conecta sistemas e aplica IA pra reduzir retrabalho. Fale 20 min, grátis.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    alternates: { canonical: `${BASE_URL}/` },
    openGraph: buildOg({
      url: BASE_URL,
      title: `${HOME_TITLE} — RC2 Soluções`,
      description: HOME_DESCRIPTION,
      imageUrl: settings.og_image_url,
    }),
  };
}

/**
 * O H1 e a frase institucional aprovados são a fonte: a primeira frase e o
 * restante são fatiados de `HOME_COPY` no primeiro ponto final seguido de
 * espaço, de modo que mudar a copy mude o que é renderizado e nunca exista uma
 * segunda cópia para divergir.
 */
function splitAfterFirstSentence(text: string): [string, string] {
  const cut = text.indexOf(". ") + 1;
  return cut > 0 ? [text.slice(0, cut), text.slice(cut).trim()] : [text, ""];
}

const [heroLead, heroResolve] = splitAfterFirstSentence(HOME_COPY.h1);
const [signatureFirst, signatureRest] = splitAfterFirstSentence(HOME_COPY.signature);

export default async function HomePage() {
  const schemaWebPage = getWebPageSchema(
    await getOrgSettingsOrNull(),
    {
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      url: BASE_URL,
      keywords:
        "automação de processos, integração de sistemas, IA para operações, operações digitais e commerce, consultoria de operação, PME",
      image: `${BASE_URL}/og-image.png`,
    },
    BASE_URL
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemaWebPage) }}
      />

      {/* ── 1. Hero ── */}
      {/* Hero sem grid nem grão: a v2.2 pede base clara e silenciosa. Um único
          eixo de leitura à esquerda — eyebrow → headline → apoio → ação
          (docs/proposta-visual-hero-v2.md). Sem régua entre as frases do h1: a
          diferença de escala é o único destaque. */}
      <section className="rc2-hero-stage relative overflow-hidden bg-rc2-bg pb-10 pt-8 md:pb-16 md:pt-14">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rc2-hero-measure max-w-[68.75rem]">
            <SectionLabel className="rc2-rule mb-5 block text-sm">
              {HOME_COPY.eyebrow}
            </SectionLabel>
            <h1 className="rc2-hero-signature rc2-hero-title text-rc2-heading">
              <span className="rc2-hero-title__lead">{heroLead}</span>{" "}
              <span className="rc2-hero-title__resolve">{heroResolve}</span>
            </h1>
            <p className="rc2-body-lg mt-6 max-w-[38rem] text-rc2-text">
              {HOME_COPY.subheadline}
            </p>
            <div className="mt-5">
              <HeroActions />
            </div>
          </div>
        </div>
      </section>

      {/* Faixa institucional: fecha o hero. Tem o mesmo tom da seção de
          problemas logo abaixo, por isso a borda dark-border separa as duas. */}
      <div className="rc2-hero-closing border-b border-rc2-dark-border bg-rc2-dark py-7 text-rc2-dark-text md:py-9">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-[1.375rem] font-semibold leading-[1.3] tracking-[-0.01em] md:text-[1.75rem]">
            <span>{signatureFirst}</span>
            {signatureRest && (
              <>
                {" "}
                <span>{signatureRest}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── 2. Problemas ── */}
      <HomeProblems />

      {/* ── 3. Competências ── */}
      <HomeCompetencies />

      {/* ── 4. Produtos ── */}
      <HomeProducts />

      {/* ── 5. Método ── */}
      <HomeMethod />

      {/* ── 6. Autoridade e prova ── */}
      <HomeAuthority />

      {/* ── 8. Filosofia ── */}
      {/* Pausa editorial compacta, em fundo base: a seção seguinte já é alt,
          e o passo tonal recria o ritmo antes do CTA. */}
      <section className="bg-rc2-bg py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel className="rc2-rule block mb-5">Como pensamos</SectionLabel>
            <h2 className="rc2-h2 text-rc2-heading mb-5 max-w-3xl">
              {HOME_PHILOSOPHY.thesis}
            </h2>
            <p className="text-xl md:text-2xl font-semibold text-rc2-heading leading-snug max-w-3xl">
              {HOME_PHILOSOPHY.closing}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 9. Conteúdo ── */}
      <HomeContent />

      {/* ── 10. CTA final ── */}
      <HomeCtaBlock presentation="home" />
    </>
  );
}
