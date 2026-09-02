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

  async redirects() {
    return [
      // Force apex domain to canonical www domain.
      {
        source: "/:path*",
        has: [{ type: "host", value: "rc2solucoes.com.br" }],
        destination: "https://www.rc2solucoes.com.br/:path*",
        permanent: true,
      },
      // Legacy/invalid URLs found by Search Console.
      { source: "/index.htm", destination: "/", permanent: true },
      { source: "/about", destination: "/sobre", permanent: true },
      { source: "/about/", destination: "/sobre", permanent: true },
      { source: "/services", destination: "/solucoes", permanent: true },
      { source: "/services/", destination: "/servicos", permanent: true },
      // Fase 6F — território integralmente Zapbox consolidado na ponte
      // (docs/22 §1). O alias vem primeiro e aponta direto para `/zapbox`:
      // passar pelo slug antigo criaria uma chain de dois saltos.
      {
        source: "/servicos/automacao-de-atendimento",
        destination: "/zapbox",
        permanent: true,
      },
      {
        source: "/servicos/automacoes-com-ia",
        destination: "/zapbox",
        permanent: true,
      },
      {
        source: "/solucoes/atendimento-lento",
        destination: "/zapbox",
        permanent: true,
      },
      {
        source: "/solucoes/leads-sem-resposta",
        destination: "/zapbox",
        permanent: true,
      },
      {
        source: "/solucoes/whatsapp-desorganizado",
        destination: "/zapbox",
        permanent: true,
      },
      {
        source: "/servicos/integracao-de-sistemas",
        destination: "/solucoes#integracao-de-sistemas",
        permanent: true,
      },
      // Migração SEO pós-Fase 5 — docs/16 §13. A intenção destas duas páginas
      // foi absorvida pelas competências da nova /solucoes.
      {
        source: "/servicos/agentes-de-ia",
        destination: "/solucoes#ia-para-operacoes",
        permanent: true,
      },
      {
        source: "/servicos/automacao-de-processos",
        destination: "/solucoes#automacao-de-processos",
        permanent: true,
      },
      {
        source: "/servicos/operacoes-digitais",
        destination: "/solucoes#operacoes-digitais-commerce",
        permanent: true,
      },
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
