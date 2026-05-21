import type { MetadataRoute } from "next";

const disallowedRoutes = ["/admin", "/admin/", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowedRoutes,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: disallowedRoutes,
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: disallowedRoutes,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: disallowedRoutes,
      },
    ],
    sitemap: "https://rc2solucoes.com.br/sitemap.xml",
  };
}
