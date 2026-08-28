import type { Metadata } from "next";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";
import { createPublicClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/marketing/PageHero";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { BlogCard } from "@/components/blog/BlogCard";
import type { Post } from "@/lib/types/post";
import { getOrgSettings, getWebPageSchema } from "@/lib/schema";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrgSettings();
  return {
    title: "Blog",
    description: "Conteúdo sobre automação, IA e operações digitais para pequenas e médias empresas.",
    alternates: { canonical: `${BASE_URL}/blog` },
    openGraph: buildOg({
      url: `${BASE_URL}/blog`,
      title: "Blog — RC2 Soluções",
      description: "Conteúdo sobre automação, IA e operações digitais para pequenas e médias empresas.",
      imageUrl: settings.og_image_url,
    }),
  };
}

export const revalidate = 60;

async function getPosts(): Promise<Post[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("posts")
      .select("id,slug,title,summary,cover_url,cover_url_alt,published_at,created_at,updated_at,status,category,reading_time_minutes")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    return (data as Post[]) ?? [];
  } catch {
    return [];
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default async function BlogPage() {
  const posts = await getPosts();
  let schemaWebPage;

  try {
    const settings = await getOrgSettings();
    schemaWebPage = getWebPageSchema(
      settings,
      {
        title: "Blog",
        description: "Conteúdo sobre automação, IA e operações digitais para pequenas e médias empresas.",
        url: `${BASE_URL}/blog`,
        keywords: "blog, artigos, IA, automação, tendências, operações digitais, tecnologia, PME",
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
        label="Blog"
        title="Insights sobre automação e IA"
        description="Conteúdo prático sobre como tecnologia pode transformar a operação da sua empresa."
        variant="light"
      />

      <section className="bg-rc2-bg py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {posts.length === 0 ? (
            <ScrollReveal className="text-center py-16" direction="none">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-rc2-border bg-rc2-bg-alt text-rc2-heading">
                <span className="font-condensed text-xl font-bold tracking-widest" aria-hidden>
                  RC2
                </span>
              </div>
              <SectionLabel className="mb-3">Em breve</SectionLabel>
              <h2 className="text-2xl font-semibold text-rc2-heading mb-3">Ainda não há artigos publicados</h2>
              <p className="text-rc2-text-secondary text-lg mb-8 max-w-md mx-auto">
                Enquanto isso, veja nossas soluções ou solicite um diagnóstico para sua operação.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <TrackedLink
                  href="/servicos"
                  tracking={{ kind: "cta", location: "blog_empty_state", label: "explorar_servicos", destination: "/servicos" }}
                  className="inline-flex items-center gap-2 px-6 h-11 bg-rc2-brand text-rc2-heading font-semibold text-sm rounded-md hover:bg-rc2-brand/90 transition-colors"
                >
                  Explorar serviços
                </TrackedLink>
                <TrackedLink
                  href="/contato"
                  tracking={{ kind: "cta", location: "blog_empty_state", label: "solicitar_diagnostico", destination: "/contato" }}
                  className="inline-flex items-center gap-2 px-6 h-11 border border-border text-rc2-text font-medium text-sm rounded-md hover:bg-rc2-bg-alt transition-colors"
                >
                  Solicitar diagnóstico
                </TrackedLink>
              </div>
            </ScrollReveal>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <BlogCard
                  key={post.id}
                  image={post.cover_url}
                  title={post.title}
                  summary={post.summary}
                  slug={post.slug}
                  author={post.author_name}
                  publishedAt={post.published_at}
                  readingTimeMinutes={post.reading_time_minutes}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
