import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/siteMetadata";
import { services } from "@/lib/content/services";
import { solutions } from "@/lib/content/solutions";
import {
  MIGRATED_SERVICE_SLUGS,
  MIGRATED_SOLUTION_SLUGS,
} from "@/lib/content/migratedRoutes";
import { createPublicClient } from "@/lib/supabase/server";

export const revalidate = 60;

type StaticSitemapEntry = {
  path: string;
  lastModified: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

type PostRouteRow = {
  slug: string;
  updated_at: string;
  seo_index_status?: string | null;
};

function absoluteUrl(path = "") {
  if (!path) return BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
}

/**
 * `/solucoes-com-ia` saiu junto ao encerrar o `SPLIT_INTENT`: passou a
 * redirecionar para `/solucoes`.
 *
 * Fase 3 (`docs/24` §3): `/servicos` saiu daqui ao passar a redirecionar para
 * `/solucoes`. URL que redireciona não pode continuar publicada como destino.
 * Os slugs sob `/servicos` saem sozinhos, via `MIGRATED_SERVICE_SLUGS`.
 */
const staticPages = [
  {
    path: "",
    lastModified: "2026-05-18",
    changeFrequency: "weekly",
    priority: 1.0,
  },
  {
    path: "/solucoes",
    lastModified: "2026-05-20",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    // Fase 6: rota criada; deixou de ser DEFER_ROUTE.
    path: "/solucoes/agenda-confirmada",
    lastModified: "2026-09-03",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/zapbox",
    lastModified: "2026-09-02",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/sobre",
    lastModified: "2026-05-18",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/contato",
    lastModified: "2026-05-18",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog",
    lastModified: "2026-05-18",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/avaliacoes",
    lastModified: "2026-05-18",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/llms.txt",
    lastModified: "2026-05-20",
    changeFrequency: "weekly",
    priority: 0.3,
  },
  {
    path: "/llms-full.txt",
    lastModified: "2026-05-20",
    changeFrequency: "weekly",
    priority: 0.3,
  },
] satisfies StaticSitemapEntry[];

function mapStaticRoutes(routes: readonly StaticSitemapEntry[]): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

const serviceRoutes: MetadataRoute.Sitemap = services
  .filter((service) => !MIGRATED_SERVICE_SLUGS.has(service.slug))
  .map((service) => ({
    url: absoluteUrl(`/servicos/${service.slug}`),
    lastModified: new Date("2026-05-20"),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

const solutionRoutes: MetadataRoute.Sitemap = solutions
  .filter((solution) => !MIGRATED_SOLUTION_SLUGS.has(solution.slug))
  .map((solution) => ({
    url: absoluteUrl(`/solucoes/${solution.slug}`),
    lastModified: new Date("2026-05-20"),
    changeFrequency: "monthly",
    priority: 0.75,
  }));

function dedupeRoutes(routes: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  return routes.filter((route) => {
    if (seen.has(route.url)) return false;
    seen.add(route.url);
    return true;
  });
}

function sortRoutes(routes: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return [...routes].sort((a, b) => {
    const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.url.localeCompare(b.url);
  });
}

function mapPostRoutes(rows: PostRouteRow[]): MetadataRoute.Sitemap {
  return rows
    .filter((post) => post.seo_index_status !== "noindex")
    .map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
}

async function getBlogRoutes(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  const { data: postsWithSeo, error: seoError } = await supabase
    .from("posts")
    .select("slug,updated_at,seo_index_status")
    .eq("status", "published");

  if (!seoError) {
    return mapPostRoutes((postsWithSeo ?? []) as PostRouteRow[]);
  }

  console.error("[sitemap] Failed SEO-aware posts query, trying fallback:", seoError);

  const { data: fallbackPosts, error: fallbackError } = await supabase
    .from("posts")
    .select("slug,updated_at")
    .eq("status", "published");

  if (fallbackError) {
    console.error("[sitemap] Fallback posts query failed:", fallbackError);
    return [];
  }

  return (fallbackPosts ?? []).map((post: { slug: string; updated_at: string }) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.updated_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let postRoutes: MetadataRoute.Sitemap = [];

  try {
    postRoutes = await getBlogRoutes();
  } catch (error) {
    console.error("[sitemap] Unexpected error loading published blog posts:", error);
  }

  return sortRoutes(
    dedupeRoutes([
      ...mapStaticRoutes(staticPages),
      ...serviceRoutes,
      ...solutionRoutes,
      ...postRoutes,
    ])
  );
}
