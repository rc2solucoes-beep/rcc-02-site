import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { Post } from "@/lib/types/post";

export const metadata: Metadata = {
  title: "Blog",
  description: "Conteúdo sobre automação, IA e operações digitais para pequenas e médias empresas.",
  alternates: { canonical: "https://rc2solucoes.com.br/blog" },
  openGraph: {
    url: "https://rc2solucoes.com.br/blog",
    title: "Blog — RC2 Soluções",
    description: "Conteúdo sobre automação, IA e operações digitais para pequenas e médias empresas.",
  },
};

export const revalidate = 60;

async function getPosts(): Promise<Post[]> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("posts")
      .select("id,slug,title,summary,cover_url,published_at,created_at,updated_at,content,status")
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

  return (
    <>
      <PageHero
        label="Blog"
        title="Insights sobre automação e IA"
        description="Conteúdo prático sobre como tecnologia pode transformar a operação da sua empresa."
        variant="light"
      />

      <section className="bg-rc2-sand py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-block rounded-full bg-surface-2 p-4 mb-6">
                <span className="text-3xl">📚</span>
              </div>
              <SectionLabel className="mb-3">Em breve</SectionLabel>
              <h2 className="text-2xl font-semibold text-rc2-ebony mb-3">Conteúdo em desenvolvimento</h2>
              <p className="text-text-secondary text-lg mb-8 max-w-md mx-auto">Estamos preparando insights práticos sobre automação, IA e operações digitais. Novos artigos chegando em breve.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/servicos" className="inline-flex items-center gap-2 px-6 h-11 bg-rc2-orange text-rc2-sand font-semibold text-sm rounded-md hover:bg-rc2-orange/90 transition-colors">
                  Explorar serviços
                </Link>
                <Link href="/contato" className="inline-flex items-center gap-2 px-6 h-11 border border-border text-rc2-ebony font-medium text-sm rounded-md hover:bg-surface-1 transition-colors">
                  Solicitar diagnóstico
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {posts.map((post, index) => (
                <article
                  key={post.id}
                  className={index === 0 && posts.length > 1 ? "md:col-span-2" : ""}
                >
                  <Link href={`/blog/${post.slug}`} className="group block">
                    {post.cover_url && (
                      <div className="relative aspect-video w-full overflow-hidden mb-5">
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
                      <div className="aspect-video w-full bg-rc2-forest/10 mb-5 flex items-center justify-center">
                        <span className="text-rc2-forest/30 text-4xl font-bold font-condensed uppercase tracking-widest">RC2</span>
                      </div>
                    )}
                    <time className="text-xs text-rc2-ebony/70 uppercase tracking-wider">
                      {formatDate(post.published_at)}
                    </time>
                    <h2 className={`font-semibold text-rc2-ebony mt-1.5 group-hover:text-rc2-orange transition-colors leading-snug ${index === 0 ? "text-2xl" : "text-lg"}`}>
                      {post.title}
                    </h2>
                    <p className="text-rc2-ebony/70 text-sm mt-2 line-clamp-3">{post.summary}</p>
                    <span className="inline-block mt-3 text-sm font-medium text-rc2-orange group-hover:underline underline-offset-4">
                      Ler artigo →
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
