import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { BlogCard } from "@/components/blog/BlogCard";
import { createPublicClient } from "@/lib/supabase/server";
import {
  HOME_BLOG_SLUGS,
  HOME_CTAS,
  homeArticleTracking,
} from "@/lib/content/home";
import type { Post } from "@/lib/types/post";

async function getHomePosts(): Promise<Post[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("posts")
      .select(
        "id,slug,title,summary,cover_url,cover_url_alt,published_at,created_at,updated_at,status,category,reading_time_minutes,author_name"
      )
      .eq("status", "published")
      .in("slug", [...HOME_BLOG_SLUGS]);

    const posts = (data as Post[]) ?? [];
    // Preserva a ordem editorial definida em docs/12, não a do banco.
    return [...HOME_BLOG_SLUGS]
      .map((slug) => posts.find((post) => post.slug === slug))
      .filter((post): post is Post => Boolean(post));
  } catch {
    return [];
  }
}

export async function HomeContent() {
  const posts = await getHomePosts();

  return (
    <section className="bg-rc2-bg-alt rc2-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionLabel className="rc2-rule block mb-5">Conteúdo</SectionLabel>
          <h2 className="rc2-h2 text-rc2-heading mb-8 max-w-2xl">
            Como pensamos automação, integração e IA na prática.
          </h2>
        </ScrollReveal>

        <div className="space-y-4">
          {posts.map((post) => (
            <BlogCard
              key={post.id}
              variant="compact"
              image={post.cover_url}
              title={post.title}
              summary={post.summary}
              slug={post.slug}
              author={post.author_name}
              publishedAt={post.published_at}
              readingTimeMinutes={post.reading_time_minutes}
              tracking={homeArticleTracking(post.slug)}
            />
          ))}
        </div>

        <ScrollReveal delay={120} className="mt-8">
          <TrackedLink
            href={HOME_CTAS.content.href}
            tracking={{
              kind: "cta",
              location: "home_content",
              label: HOME_CTAS.content.analyticsLabel,
              destination: HOME_CTAS.content.href,
            }}
            className="rc2-action-link min-h-11 py-2 text-base"
          >
            {HOME_CTAS.content.label}
            <ArrowRight size={14} aria-hidden="true" />
          </TrackedLink>
        </ScrollReveal>
      </div>
    </section>
  );
}
