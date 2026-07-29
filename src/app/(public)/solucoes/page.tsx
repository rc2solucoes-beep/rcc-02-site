import type { Metadata } from "next";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { solutions } from "@/lib/content/solutions";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Soluções por Problema",
    description:
      "Encontre soluções para atendimento lento, leads sem resposta, processos manuais, sistemas desconectados e WhatsApp desorganizado.",
    alternates: {
      canonical: `${BASE_URL}/solucoes`,
    },
    openGraph: buildOg({
      title: "Soluções por Problema",
      description:
        "Encontre soluções para atendimento lento, leads sem resposta, processos manuais, sistemas desconectados e WhatsApp desorganizado.",
      url: `${BASE_URL}/solucoes`,
    }),
  };
}

export default function SolucoesPage() {
  const schemaWebPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Soluções por Problema",
    description:
      "Encontre soluções para atendimento lento, leads sem resposta, processos manuais, sistemas desconectados e WhatsApp desorganizado.",
    url: `${BASE_URL}/solucoes`,
    isPartOf: {
      "@type": "WebSite",
      url: BASE_URL,
      name: "RC2 Soluções",
    },
  };

  const schemaCollectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Soluções por Problema",
    description:
      "Hub comercial da RC2 com soluções orientadas às dores reais de atendimento, vendas e operação.",
    url: `${BASE_URL}/solucoes`,
    hasPart: solutions.map((solution) => ({
      "@type": "WebPage",
      name: solution.shortTitle,
      url: `${BASE_URL}/solucoes/${solution.slug}`,
      description: solution.summary,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaCollectionPage) }}
      />

      <PageHero
        label="Soluções"
        title="Soluções por problema: da dor real à execução"
        description="Identifique a dor mais urgente da sua operação e veja o caminho recomendado com serviços conectados à realidade da sua empresa."
      />

      <section className="bg-rc2-sand rc2-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel className="rc2-rule block mb-4">Mapeamento por dor</SectionLabel>
          <p className="max-w-3xl text-rc2-ebony/75 leading-relaxed mb-10">
            Estas páginas partem do problema percebido no dia a dia e conectam sintomas,
            impacto e ações práticas para estruturar atendimento, vendas e operação.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {solutions.map((solution) => (
              <article
                key={solution.slug}
                className="group rc2-card rc2-card-hover relative flex flex-col overflow-hidden p-6 pt-7 md:p-7 md:pt-8"
              >
                {/* Acento estrutural — aba laranja no topo */}
                <span
                  className="absolute left-0 top-0 h-1 w-10 bg-rc2-orange transition-all duration-200 group-hover:w-full group-hover:opacity-90"
                  aria-hidden
                />
                <h2 className="rc2-h4 text-rc2-ebony mb-3">{solution.shortTitle}</h2>
                <p className="text-rc2-ebony/75 leading-relaxed mb-4">{solution.summary}</p>

                <ul className="space-y-2 mb-6">
                  {solution.symptoms.slice(0, 3).map((symptom) => (
                    <li key={symptom} className="flex items-start gap-2.5 text-sm text-rc2-ebony/75">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-rc2-orange" aria-hidden="true" />
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>

                <TrackedLink
                  href={`/solucoes/${solution.slug}`}
                  tracking={{
                    kind: "solution_link",
                    location: "solution_hub_card",
                    label: solution.shortTitle,
                    destination: `/solucoes/${solution.slug}`,
                    source_page: "/solucoes",
                    source_type: "solutions_hub",
                  }}
                  className="rc2-action-link"
                >
                  Ver solução completa
                  <ArrowRight size={14} />
                </TrackedLink>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
