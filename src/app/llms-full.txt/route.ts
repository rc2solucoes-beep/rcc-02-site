import { services } from "@/lib/content/services";
import { solutions } from "@/lib/content/solutions";
import { createPublicClient } from "@/lib/supabase/server";
import type { FaqItem, Post } from "@/lib/types/post";

export const revalidate = 3600;

const BASE_URL = "https://rc2solucoes.com.br";

type LlmPost = Pick<
  Post,
  "slug" | "title" | "summary" | "category" | "seo_keyword_primary" | "faq_items" | "status" | "seo_index_status"
>;

function parseFaqItems(faqItems: Post["faq_items"] | string | null | undefined): FaqItem[] {
  if (!faqItems) {
    return [];
  }

  if (typeof faqItems === "string") {
    try {
      const parsed = JSON.parse(faqItems);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(
        (item): item is FaqItem =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as FaqItem).question === "string" &&
          typeof (item as FaqItem).answer === "string"
      );
    } catch {
      return [];
    }
  }

  if (!Array.isArray(faqItems)) {
    return [];
  }

  return faqItems.filter(
    (item): item is FaqItem =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof item.question === "string" &&
      typeof item.answer === "string"
  );
}

async function getPublishedPosts(): Promise<LlmPost[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("posts")
      .select("slug,title,summary,category,seo_keyword_primary,faq_items,status,seo_index_status,published_at")
      .eq("status", "published")
      .not("seo_index_status", "eq", "noindex")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("[llms-full] Failed to load posts:", error.message);
      return [];
    }

    return ((data ?? []) as LlmPost[]).filter((post) => post.status === "published");
  } catch (error) {
    console.error("[llms-full] Unexpected error while loading posts:", error);
    return [];
  }
}

function buildInstitutionalSection(): string {
  return `# RC2 Soluções — Conteúdo Completo para LLMs

## Sobre

A RC2 Soluções é uma consultoria brasileira especializada em inteligência artificial aplicada, automações operacionais, integrações de sistemas, e-commerce e modernização de presença digital para pequenas e médias empresas.

Nosso foco é transformar operações manuais e fluxos desconectados em processos digitais mais eficientes, com pragmatismo técnico e resultados de negócio.`;
}

function buildServicesSection(): string {
  const lines: string[] = ["", "## Serviços"];

  for (const service of services) {
    lines.push("");
    lines.push(`### ${service.title}`);
    lines.push("");
    lines.push(`URL: ${BASE_URL}/servicos/${service.slug}`);
    lines.push("");
    lines.push("Resumo:");
    lines.push(service.summary);
    lines.push("");
    lines.push("O que pode ser implantado:");
    for (const item of service.items) {
      lines.push(`- ${item}`);
    }
    lines.push("");
    lines.push("Benefícios:");
    for (const benefit of service.benefits) {
      lines.push(`- ${benefit}`);
    }
    lines.push("");
    lines.push("Problemas que resolvemos:");
    for (const point of service.painPoints) {
      lines.push(`- ${point}`);
    }
    lines.push("");
    lines.push("Casos de uso:");
    for (const useCase of service.useCases) {
      lines.push(`- ${useCase}`);
    }
    lines.push("");
    lines.push("Como funciona a implantação:");
    for (const step of service.implementationSteps) {
      lines.push(`- ${step}`);
    }
    lines.push("");
    lines.push("Integrações possíveis:");
    for (const integration of service.integrations) {
      lines.push(`- ${integration}`);
    }
    lines.push("");
    lines.push("Indicadores que podem ser acompanhados:");
    for (const metric of service.metrics) {
      lines.push(`- ${metric}`);
    }
    lines.push("");
    lines.push("Perguntas frequentes:");
    for (const faq of service.faq) {
      lines.push(`- Pergunta: ${faq.question}`);
      lines.push(`  Resposta: ${faq.answer}`);
    }
  }

  return lines.join("\n");
}

function buildBlogSection(posts: LlmPost[]): string {
  const lines: string[] = ["", "## Blog"];

  if (posts.length === 0) {
    lines.push("");
    lines.push("No momento, não há posts elegíveis para listagem nesta saída.");
    return lines.join("\n");
  }

  for (const post of posts) {
    const faqItems = parseFaqItems(post.faq_items);
    lines.push("");
    lines.push(`### ${post.title}`);
    lines.push("");
    lines.push(`URL: ${BASE_URL}/blog/${post.slug}`);
    lines.push("");
    lines.push("Resumo:");
    lines.push(post.summary);
    lines.push("");
    lines.push("Categoria:");
    lines.push(post.category ?? "—");
    lines.push("");
    lines.push("Palavra-chave principal:");
    lines.push(post.seo_keyword_primary ?? "—");
    lines.push("");
    lines.push("Perguntas frequentes:");
    if (faqItems.length === 0) {
      lines.push("- —");
    } else {
      for (const faq of faqItems) {
        lines.push(`- Pergunta: ${faq.question}`);
        lines.push(`  Resposta: ${faq.answer}`);
      }
    }
  }

  return lines.join("\n");
}

function buildSolutionsSection(): string {
  const lines: string[] = ["", "## Soluções por Problema"];

  for (const solution of solutions) {
    lines.push("");
    lines.push(`### ${solution.title}`);
    lines.push("");
    lines.push(`URL: ${BASE_URL}/solucoes/${solution.slug}`);
    lines.push("");
    lines.push("Resumo:");
    lines.push(solution.summary);
    lines.push("");
    lines.push("Sinais do problema:");
    for (const symptom of solution.symptoms) {
      lines.push(`- ${symptom}`);
    }
    lines.push("");
    lines.push("Impacto no negócio:");
    for (const impact of solution.businessImpact) {
      lines.push(`- ${impact}`);
    }
    lines.push("");
    lines.push("Causas comuns:");
    for (const cause of solution.rootCauses) {
      lines.push(`- ${cause}`);
    }
    lines.push("");
    lines.push("Caminho recomendado:");
    for (const step of solution.recommendedApproach) {
      lines.push(`- ${step}`);
    }
    lines.push("");
    lines.push("Serviços relacionados:");
    for (const service of solution.relatedServices) {
      lines.push(`- ${service.label} (${BASE_URL}${service.href}): ${service.description}`);
    }
    lines.push("");
    lines.push("Indicadores:");
    for (const metric of solution.metrics) {
      lines.push(`- ${metric}`);
    }
    lines.push("");
    lines.push("Perguntas frequentes:");
    for (const faq of solution.faq) {
      lines.push(`- Pergunta: ${faq.question}`);
      lines.push(`  Resposta: ${faq.answer}`);
    }
  }

  return lines.join("\n");
}

export async function GET() {
  const posts = await getPublishedPosts();
  const markdown = [
    buildInstitutionalSection(),
    buildServicesSection(),
    buildSolutionsSection(),
    buildBlogSection(posts),
    "",
  ].join("\n");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
