import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { PageViewTracker } from "@/components/tracking/PageViewTracker";
import { getOrgSettings, getOrganizationSchema, getLocalBusinessSchema } from "@/lib/schema";
import { SITE_NAME, BASE_URL as SITE_BASE_URL } from "@/lib/siteMetadata";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
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
        "Consultoria especializada em IA, automações e operações digitais para PMEs. Diagnóstico gratuito.",
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

const schemaWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RC2 Soluções",
  url: BASE_URL,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let schemaOrganization, schemaLocalBusiness;

  try {
    const settings = await getOrgSettings();
    schemaOrganization = getOrganizationSchema(settings, BASE_URL);
    schemaLocalBusiness = getLocalBusinessSchema(settings, BASE_URL);
  } catch (error) {
    console.error("Error loading organization settings:", error);
    schemaOrganization = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "RC2 Soluções",
      url: BASE_URL,
      logo: `${BASE_URL}/images/logo-base-transparente-preto.png`,
    };
    schemaLocalBusiness = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "RC2 Soluções",
      url: BASE_URL,
      logo: `${BASE_URL}/images/logo-base-transparente-preto.png`,
    };
  }

  return (
    <html
      lang="pt-BR"
      className={`h-full ${barlow.variable} ${barlowCondensed.variable}`}
    >
      <head>
        {/* next/font/google handles font loading automatically */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaLocalBusiness) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebSite) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-rc2-sand text-rc2-ebony antialiased">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
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
