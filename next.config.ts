import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP directivies — allow Turnstile, Supabase, Google Tag Manager, Google Fonts
const cspDirectives = [
  "default-src 'self'",
  // Scripts: self + Turnstile + GTM + inline scripts (Next.js hydration)
  // unsafe-eval is required: Cloudflare Turnstile uses eval() internally in its challenge scripts
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com https://connect.facebook.net`,
  // Styles: self + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts CDN
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data URIs + Supabase storage + any HTTPS (for OG images from posts)
  "img-src 'self' data: blob: https:",
  // Frames: Turnstile widget + Google Maps embed
  "frame-src https://challenges.cloudflare.com https://www.google.com",
  // Connections: self + Supabase + Cloudflare Turnstile + GTM + Google Places
  // GA4 sends beacons to google.com/g/collect (not google-analytics.com)
  "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://places.googleapis.com",
  // Workers: Turnstile uses web workers for its challenge processing
  "worker-src blob: https://challenges.cloudflare.com",
  // Base URI restriction
  "base-uri 'self'",
  // Form action: self only
  "form-action 'self'",
  // No embedding in iframes
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  // XSS protection (legacy browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No referrer to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not used
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // Clickjacking protection
  { key: "X-Frame-Options", value: "DENY" },
  // HSTS — 1 year, include subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // CSP
  { key: "Content-Security-Policy", value: cspDirectives },
];

const nextConfig: NextConfig = {
  // Remove the `X-Powered-By: Next.js` header (avoids disclosing the framework).
  poweredByHeader: false,

  /**
   * Normalização de barra final desligada (§21: "evitar cadeia de redirects").
   *
   * Por padrão o Next redireciona `/about/` → `/about` ANTES de avaliar
   * `redirects()`, e só então a regra leva a `/sobre` — dois saltos para toda
   * URL legada com barra. Com a normalização desligada, cada variante com
   * barra é gerada abaixo junto da sua e chega ao destino final em um salto.
   *
   * O preço é ter de normalizar à mão o resto do site; é o que faz a última
   * regra de `redirects()`, o catch-all `/:path+/`.
   */
  skipTrailingSlashRedirect: true,

  async redirects() {
    /**
     * Consolidações de URL. Cada entrada gera duas regras: a própria e a
     * variante com barra final, apontando ambas para o destino final.
     */
    const MIGRACOES = [
      // Legado encontrado pelo Search Console.
      { source: "/index.htm", destination: "/" },
      { source: "/about", destination: "/sobre" },
      { source: "/services", destination: "/solucoes" },
      // Fase 6F — território integralmente Zapbox consolidado na ponte
      // (docs/22 §1). O alias aponta direto para `/zapbox`: passar pelo slug
      // antigo criaria uma chain.
      { source: "/servicos/automacao-de-atendimento", destination: "/zapbox" },
      { source: "/servicos/automacoes-com-ia", destination: "/zapbox" },
      { source: "/solucoes/atendimento-lento", destination: "/zapbox" },
      { source: "/solucoes/leads-sem-resposta", destination: "/zapbox" },
      { source: "/solucoes/whatsapp-desorganizado", destination: "/zapbox" },
      // Migração SEO pós-Fase 5 — docs/16 §13.
      { source: "/servicos/integracao-de-sistemas", destination: "/solucoes#integracao-de-sistemas" },
      { source: "/servicos/agentes-de-ia", destination: "/solucoes#ia-para-operacoes" },
      { source: "/servicos/automacao-de-processos", destination: "/solucoes#automacao-de-processos" },
      { source: "/servicos/operacoes-digitais", destination: "/solucoes#operacoes-digitais-commerce" },
      // Fase 3 — consolidação de `/servicos` em `/solucoes` (§12).
      { source: "/servicos", destination: "/solucoes" },
      { source: "/servicos/e-commerce", destination: "/solucoes#operacoes-digitais-commerce" },
      { source: "/servicos/sites-e-landing-pages", destination: "/solucoes" },
      // Fase 3B — fecha o §20.
      { source: "/solucoes/processos-manuais", destination: "/solucoes" },
      { source: "/solucoes/sistemas-desconectados", destination: "/solucoes" },
      // Encerra o `SPLIT_INTENT`. A página era metade RC2, metade Zapbox, e
      // por isso ficou fora de todas as migrações anteriores — sem destino
      // decidido, continuava 200 e órfã de link interno. Decisão tomada: a
      // metade RC2 vive em `/solucoes`, direto, sem página intermediária.
      { source: "/solucoes-com-ia", destination: "/solucoes" },
      // Slug corrompido de um post do blog: duas slugificações foram fundidas
      // e a URL de 103 caracteres chegou a ser publicada e indexada. O slug
      // no banco é corrigido à parte (`docs/sql/30-...`); este redirect
      // preserva quem já tenha a URL quebrada salva ou indexada.
      {
        source:
          "/blog/solucosolucoes-automatizadas-avaliar-fornecedoreses-automatizadas-7-criterios-para-avaliar-fornecedores",
        destination:
          "/blog/solucoes-automatizadas-7-criterios-para-avaliar-fornecedores",
      },
    ];

    return [
      // Apex para o domínio canônico com www.
      {
        source: "/:path*",
        has: [{ type: "host", value: "rc2solucoes.com.br" }],
        destination: "https://www.rc2solucoes.com.br/:path*",
        permanent: true,
      },

      // Cada consolidação, com e sem barra final, direto ao destino.
      ...MIGRACOES.flatMap(({ source, destination }) => [
        { source, destination, permanent: true },
        { source: `${source}/`, destination, permanent: true },
      ]),

      // Catch-all de barra final. Vem por último: as regras acima já cobrem as
      // URLs consolidadas, então aqui só chega o que continua respondendo 200.
      { source: "/:path+/", destination: "/:path+", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      // Supabase Storage (cover images for posts)
      { protocol: "https", hostname: "*.supabase.co" },
      // Vercel Blob Storage (uploads via admin)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Already using Turbopack in dev; enable server-side source maps in prod for Sentry
  productionBrowserSourceMaps: false,
};

export default nextConfig;
