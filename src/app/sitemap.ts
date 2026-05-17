import type { MetadataRoute } from "next";
import { services } from "@/lib/content/services";
import { createPublicClient } from "@/lib/supabase/server";

const BASE_URL = "https://rc2solucoes.com.br";

export const revalidate = 60;

type SitemapEntry = MetadataRoute.Sitemap[number];

const now = new Date();

const staticRoutes: SitemapEntry[] = [
  {
    url: BASE_URL,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    url: `${BASE_URL}/avaliacoes`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/blog`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/contato`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${BASE_URL}/privacidade`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${BASE_URL}/servicos`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/sobre`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/solucoes-com-ia`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/termos`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

function getServiceRoutes(): SitemapEntry[] {
  return services.map((service) => ({
    url: `${BASE_URL}/servicos/${service.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
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
  return [...staticRoutes, ...getServiceRoutes(), ...blogRoutes];
}
