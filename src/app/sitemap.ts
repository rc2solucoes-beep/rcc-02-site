import type { MetadataRoute } from "next";
import { services } from "@/lib/content/services";
import { solutions } from "@/lib/content/solutions";
import { createPublicClient } from "@/lib/supabase/server";

const BASE_URL = "https://rc2solucoes.com.br";

export const revalidate = 60;

type SitemapEntry = MetadataRoute.Sitemap[number];

const staticPages = [
  {
    path: "",
    lastModified: "2026-05-18",
    changeFrequency: "weekly",
    priority: 1.0,
  },
  {
    path: "/servicos",
    lastModified: "2026-05-18",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/solucoes-com-ia",
    lastModified: "2026-05-18",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/solucoes",
    lastModified: "2026-05-20",
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
    path: "/privacidade",
    lastModified: "2026-05-18",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/termos",
    lastModified: "2026-05-18",
    changeFrequency: "yearly",
    priority: 0.3,
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
] as const;

function getStaticRoutes(): SitemapEntry[] {
  return staticPages.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: new Date(page.lastModified),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}

function getServiceRoutes(): SitemapEntry[] {
  const serviceLastModified = new Date("2026-05-20");
  return services.map((service) => ({
    url: `${BASE_URL}/servicos/${service.slug}`,
    lastModified: serviceLastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
}

function getSolutionRoutes(): SitemapEntry[] {
  const solutionLastModified = new Date("2026-05-20");
  return solutions.map((solution) => ({
    url: `${BASE_URL}/solucoes/${solution.slug}`,
    lastModified: solutionLastModified,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));
}

async function getBlogRoutes(): Promise<SitemapEntry[]> {
  try {
    const supabase = createPublicClient();
    const { data: posts, error } = await supabase
      .from("posts")
      .select("slug,updated_at")
      .eq("status", "published");

    if (error) {
      console.error("[sitemap] Error loading published blog posts:", error);
      return [];
    }

    return (posts ?? []).map((post: { slug: string; updated_at: string }) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[sitemap] Unexpected error loading published blog posts:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogRoutes = await getBlogRoutes();
  return [...getStaticRoutes(), ...getServiceRoutes(), ...getSolutionRoutes(), ...blogRoutes];
}
