import type { Metadata } from "next";
import { BASE_URL, buildOg } from "@/lib/siteMetadata";
import Link from "next/link";
import Image from "next/image";
import { createPublicClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/marketing/PageHero";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
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
  const hasFewPosts = posts.length > 0 && posts.length <= 2;
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
          ) : hasFewPosts ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
              <div className="space-y-6">
                {posts.map((post, index) => (
                  <ScrollReveal
                    key={post.id}
                    as="article"
                    delay={index * 90}
                    distance="22px"
                    className="max-w-3xl"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group grid gap-5 rounded-xl border border-rc2-border bg-rc2-surface p-4 shadow-[var(--shadow-soft)] transition-[border-color,box-shadow] duration-200 hover:border-rc2-brand/35 hover:shadow-[var(--shadow-lift)] md:grid-cols-[minmax(0,18rem)_1fr] md:p-5"
                    >
                      {post.cover_url && (
                        <div className="rc2-blog-cover relative aspect-video w-full overflow-hidden md:aspect-[4/3]">
                          <Image
                            src={post.cover_url}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            sizes="(min-width: 768px) 18rem, 100vw"
                          />
                        </div>
                      )}
                      {!post.cover_url && (
                        <div className="rc2-blog-cover aspect-video w-full bg-rc2-surface-2 flex items-center justify-center md:aspect-[4/3]">
                          <span className="text-rc2-heading/30 text-4xl font-bold font-condensed uppercase tracking-widest">RC2</span>
                        </div>
                      )}
                      <div className="flex min-w-0 flex-col justify-center">
                        <time className="text-xs text-rc2-text-secondary uppercase tracking-wider">
                          {formatDate(post.published_at)}
                        </time>
                        <h2 className="mt-1.5 text-xl font-semibold leading-snug text-rc2-heading transition-colors group-hover:text-rc2-brand-text">
                          {post.title}
                        </h2>
                        <p className="mt-2 line-clamp-3 text-sm text-rc2-text-secondary">{post.summary}</p>
                        <span className="mt-4 inline-block text-sm font-medium text-rc2-brand-text underline-offset-4 group-hover:underline">
                          Ler artigo →
                        </span>
                      </div>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
              <ScrollReveal delay={140} direction="none">
                <aside className="rounded-xl border border-rc2-border bg-rc2-bg-alt p-5 shadow-[var(--shadow-soft)]">
                  <SectionLabel className="mb-3 block">Comece por aqui</SectionLabel>
                  <div className="space-y-3 text-sm">
                    <Link className="ui-focus-ring block rounded-md text-rc2-text hover:text-rc2-brand-text hover:underline underline-offset-4 transition-[color,text-decoration-color]" href="/servicos">
                      Serviços
                    </Link>
                    <Link className="ui-focus-ring block rounded-md text-rc2-text hover:text-rc2-brand-text hover:underline underline-offset-4 transition-[color,text-decoration-color]" href="/solucoes">
                      Soluções
                    </Link>
                    <Link className="ui-focus-ring block rounded-md text-rc2-text hover:text-rc2-brand-text hover:underline underline-offset-4 transition-[color,text-decoration-color]" href="/contato">
                      Solicitar diagnóstico
                    </Link>
                  </div>
                </aside>
              </ScrollReveal>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {posts.map((post, index) => (
                <ScrollReveal
                  key={post.id}
                  as="article"
                  delay={(index % 2) * 90 + Math.floor(index / 2) * 50}
                  distance={index === 0 ? "30px" : "22px"}
                  className={index === 0 && posts.length > 1 ? "md:col-span-2" : ""}
                >
                  <Link href={`/blog/${post.slug}`} className="group block">
                    {post.cover_url && (
                      <div className="rc2-blog-cover relative aspect-video w-full overflow-hidden mb-5">
                        <Image
                          src={post.cover_url}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes={index === 0 ? "100vw" : "50vw"}
                        />
                      </div>
                    )}
                    {!post.cover_url && (
                      <div className="rc2-blog-cover aspect-video w-full bg-rc2-surface-2 mb-5 flex items-center justify-center">
                        <span className="text-rc2-heading/30 text-4xl font-bold font-condensed uppercase tracking-widest">RC2</span>
                      </div>
                    )}
                    <time className="text-xs text-rc2-text/70 uppercase tracking-wider">
                      {formatDate(post.published_at)}
                    </time>
                    <h2 className={`font-semibold text-rc2-heading mt-1.5 group-hover:text-rc2-brand-text transition-colors leading-snug ${index === 0 ? "text-2xl" : "text-lg"}`}>
                      {post.title}
                    </h2>
                    <p className="text-rc2-text/70 text-sm mt-2 line-clamp-3">{post.summary}</p>
                    <span className="inline-block mt-3 text-sm font-medium text-rc2-brand-text group-hover:underline underline-offset-4">
                      Ler artigo →
                    </span>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
