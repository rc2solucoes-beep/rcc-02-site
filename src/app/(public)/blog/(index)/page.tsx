import type { Metadata } from "next";
import { serializeJsonLd } from "@/lib/jsonLd";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";
import { createPublicClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { buttonVariants } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { BlogArchive } from "@/components/blog/BlogArchive";
import { resolveArchive, resolveArchiveSeo, type RawSearchParams } from "@/lib/blogArchive";
import type { Post } from "@/lib/types/post";
import { getOrgSettings, getOrgSettingsOrNull, getWebPageSchema } from "@/lib/schema";

const BLOG_DESCRIPTION = "Conteúdo sobre automação, IA e operações digitais para pequenas e médias empresas.";

/**
 * A página lê `searchParams` e por isso é dinâmica: o `revalidate` de rota não
 * vale mais. O cache de 60s da lista vive aqui, com chave única compartilhada
 * por todos os termos e páginas (a busca e a paginação são em memória).
 * `cacheComponents` não está habilitado no projeto, então o mecanismo
 * documentado é `unstable_cache` (mesmo padrão de `src/lib/schema.ts`).
 * Erros lançam dentro do cache, e o Next não persiste resultado de função que
 * lança; o `catch` externo devolve `[]` apenas para aquela requisição.
 */
const getCachedPosts = unstable_cache(
  async (): Promise<Post[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("posts")
      .select("id,slug,title,summary,cover_url,cover_url_alt,published_at,created_at,updated_at,status,category,reading_time_minutes")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data as Post[]) ?? [];
  },
  ["blog-index-posts"],
  { revalidate: 60 }
);

async function getPosts(): Promise<Post[]> {
  try {
    return await getCachedPosts();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const [settings, posts, params] = await Promise.all([getOrgSettings(), getPosts(), searchParams]);
  const state = resolveArchive(posts, params);
  // Página inválida redireciona na renderização; o metadata cai no estado válido.
  const seo = resolveArchiveSeo(state);
  const url = `${BASE_URL}${seo.canonicalPath}`;
  const title = !seo.noindex && state.page > 1 ? `Blog — Página ${state.page}` : "Blog";
  return {
    title,
    description: BLOG_DESCRIPTION,
    alternates: { canonical: url },
    ...(seo.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: buildOg({
      url,
      title: `${title} — RC2 Soluções`,
      description: BLOG_DESCRIPTION,
      imageUrl: settings.og_image_url,
    }),
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const posts = await getPosts();
  // Busca e paginação em memória sobre a lista já carregada; o estado vive na
  // URL (`?q=`, `?pagina=`). Ver `src/lib/blogArchive.ts`.
  const state = resolveArchive(posts, await searchParams);
  if (state.redirectTo) redirect(state.redirectTo);
  const schemaWebPage = getWebPageSchema(
    await getOrgSettingsOrNull(),
    {
      title: "Blog",
      description: "Conteúdo sobre automação, IA e operações digitais para pequenas e médias empresas.",
      url: `${BASE_URL}/blog`,
      keywords: "blog, artigos, IA, automação, tendências, operações digitais, tecnologia, PME",
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
      {/*
        Abertura compacta, local ao índice: mesma copy do PageHero, no mesmo
        container da listagem (max-w-5xl), sem o respiro de página institucional.
      */}
      <section className="bg-rc2-bg pt-12 pb-8 md:pt-16 md:pb-10">
        <div className="container mx-auto max-w-5xl px-4">
          <SectionLabel className="rc2-rule">Blog</SectionLabel>
          <h1 className="rc2-h1 mt-3 max-w-3xl text-rc2-heading">Insights sobre automação e IA</h1>
          <p className="rc2-body-lg mt-4 max-w-2xl text-rc2-text/80">
            Conteúdo prático sobre como tecnologia pode transformar a operação da sua empresa.
          </p>
        </div>
      </section>

      <section className="bg-rc2-bg pb-16 md:pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {posts.length === 0 ? (
            <ScrollReveal className="text-center py-16" direction="none">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-rc2-border bg-rc2-bg-alt text-rc2-heading">
                <span className="rc2-bold text-xl tracking-widest" aria-hidden>
                  RC2
                </span>
              </div>
              <SectionLabel className="mb-3">Em breve</SectionLabel>
              <h2 className="text-2xl font-semibold text-rc2-heading mb-3">Ainda não há artigos publicados</h2>
              <p className="text-rc2-text-secondary text-lg mb-8 max-w-md mx-auto">
                Enquanto isso, veja nossas soluções ou fale com a RC2 sobre sua operação.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <TrackedLink
                  href="/solucoes"
                  tracking={{ kind: "cta", location: "blog_empty_state", label: "explorar_servicos", destination: "/solucoes" }}
                  className={buttonVariants({ variant: "brand", size: "brand-md" })}
                >
                  Explorar soluções
                </TrackedLink>
                <TrackedLink
                  href="/contato"
                  tracking={{ kind: "cta", location: "blog_empty_state", label: "solicitar_diagnostico", destination: "/contato" }}
                  className="inline-flex items-center gap-2 px-6 h-11 border border-border text-rc2-text font-medium text-sm rounded-md hover:bg-rc2-bg-alt transition-colors"
                >
                  Falar sobre minha operação
                </TrackedLink>
              </div>
            </ScrollReveal>
          ) : (
            <BlogArchive state={state} />
          )}
        </div>
      </section>
    </>
  );
}
