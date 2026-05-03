import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";

const BASE_URL = "https://rc2solucoes.com.br";

const staticRoutes: MetadataRoute.Sitemap = [
  { url: BASE_URL,                          lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
  { url: `${BASE_URL}/servicos`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
  { url: `${BASE_URL}/servicos/automacoes-com-ia`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/servicos/agentes-de-ia`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/servicos/automacao-de-processos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/servicos/e-commerce`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/servicos/sites-e-landing-pages`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/solucoes-com-ia`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/sobre`,               lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/blog`,                lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
  { url: `${BASE_URL}/contato`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let postRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createServiceClient();
    const { data: posts } = await supabase
      .from("posts")
      .select("slug,updated_at")
      .eq("status", "published");

    postRoutes = (posts ?? []).map((post: { slug: string; updated_at: string }) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Supabase unavailable at build time — posts omitted
  }

  return [...staticRoutes, ...postRoutes];
}
