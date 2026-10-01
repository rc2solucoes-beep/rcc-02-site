import type { Metadata, Viewport } from "next";
import { serializeJsonLd } from "@/lib/jsonLd";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Suspense } from "react";
import { DelayedGtm } from "@/components/tracking/DelayedGtm";
import { PageViewTracker } from "@/components/tracking/PageViewTracker";
import { ConsentManager } from "@/components/tracking/ConsentManager";
import { getConsentBootstrapScript } from "@/lib/consent";
import {
  getOrgSettings,
  getOrganizationSchema,
  getLogoSchema,
  getWebSiteSchema,
} from "@/lib/schema";
import { SCHEMA_IDS } from "@/lib/schemaIds";
import type { Organization } from "@/lib/types/schema";
import { SITE_NAME, BASE_URL as SITE_BASE_URL } from "@/lib/siteMetadata";
import "./globals.css";

// Escala completa do brand guide. Carregar só o 400 fazia o navegador sintetizar
// os pesos 500/600/700 usados em h2/h3, cards e botões — negrito falso, com
// espessura e métrica diferentes do desenho real da Barlow.
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: "normal",
  variable: "--font-barlow",
  display: "swap",
});

// Condensed tem exatamente dois papéis: 500 no eyebrow/label (.rc2-label) e 800
// no gesto de assinatura do topo da Home (.rc2-hero-signature). Ver a exceção
// documentada em AGENTS.md § Tipografia.
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "800"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const BASE_URL = SITE_BASE_URL;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MQF4K77";

export const viewport: Viewport = {
  themeColor: "#081827",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  // og_image_url vem do banco — admin pode atualizar sem re-deploy
  let ogImageUrl = "/og-image.png";
  try {
    const settings = await getOrgSettings();
    if (settings.og_image_url) ogImageUrl = settings.og_image_url;
  } catch { /* mantém fallback estático */ }

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: `${SITE_NAME} — IA, Automações e Operações Digitais`,
      template: `%s — ${SITE_NAME}`,
    },
    description:
      "Consultoria especializada em IA, automações e operações digitais para pequenas e médias empresas. Automatize atendimento, integre sistemas e escale sua operação.",
    keywords: ["IA", "automação", "n8n", "agentes de IA", "e-commerce", "PME", "consultoria digital"],
    authors: [{ name: SITE_NAME, url: BASE_URL }],
    creator: SITE_NAME,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: BASE_URL,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — IA, Automações e Operações Digitais`,
      description:
        "Consultoria especializada em IA, automações e operações digitais para PMEs.",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${SITE_NAME} — IA e Automações para PMEs` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — IA, Automações e Operações Digitais`,
      description: "Consultoria em IA, automações e operações digitais para PMEs.",
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: `${BASE_URL}/`,
    },
  };
}

const schemaWebSite = getWebSiteSchema(BASE_URL);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A RC2 é representada só por Organization (`#organization`): o LocalBusiness
  // duplicava a mesma empresa e foi removido na Fase 7 (docs/schema/baseline.md).
  let schemaOrganization: Organization;

  try {
    const settings = await getOrgSettings();
    schemaOrganization = getOrganizationSchema(settings, BASE_URL);
  } catch (error) {
    console.error("Error loading organization settings:", error);
    // A identidade (#organization, #logo) não depende do banco: o fallback
    // mantém os mesmos @id que o caminho normal.
    schemaOrganization = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": SCHEMA_IDS.organization,
      name: "RC2 Soluções",
      url: BASE_URL,
      logo: getLogoSchema(),
    };
  }

  return (
    <html
      lang="pt-BR"
      className={`h-full ${barlow.variable} ${barlowCondensed.variable}`}
    >
      <head>
        <script
          id="rc2-consent-bootstrap"
          dangerouslySetInnerHTML={{ __html: getConsentBootstrapScript() }}
        />
        {/* next/font/google handles font loading automatically */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemaOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemaWebSite) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-rc2-sand text-rc2-ebony antialiased">
        <DelayedGtm gtmId={GTM_ID} />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <ConsentManager />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-rc2-orange focus:text-white focus:text-sm focus:font-medium focus:rounded"
        >
          Pular para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  );
}
