import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP directivies — allow Turnstile, Supabase, Google Tag Manager, Google Fonts
const cspDirectives = [
  "default-src 'self'",
  // Scripts: self + Turnstile + GTM + inline scripts (Next.js hydration)
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com https://connect.facebook.net`,
  // Styles: self + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts CDN
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data URIs + Supabase storage + any HTTPS (for OG images from posts)
  "img-src 'self' data: blob: https:",
  // Frames: Turnstile widget + Google Maps embed
  "frame-src https://challenges.cloudflare.com https://www.google.com",
  // Connections: self + Supabase + Cloudflare Turnstile + GTM
  "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com",
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
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Already using Turbopack in dev; enable server-side source maps in prod for Sentry
  productionBrowserSourceMaps: false,
};

export default nextConfig;
