import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Script from "next/script";
import { getOrgSettings, getOrganizationSchema, getLocalBusinessSchema } from "@/lib/schema";
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

const BASE_URL = "https://rc2solucoes.com.br";

export const viewport: Viewport = {
  themeColor: "#F5F0E8",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "RC2 Soluções — IA, Automações e Operações Digitais",
    template: "%s — RC2 Soluções",
  },
  description:
    "Consultoria especializada em IA, automações e operações digitais para pequenas e médias empresas. Automatize atendimento, integre sistemas e escale sua operação.",
  keywords: ["IA", "automação", "n8n", "agentes de IA", "e-commerce", "PME", "consultoria digital"],
  authors: [{ name: "RC2 Soluções", url: BASE_URL }],
  creator: "RC2 Soluções",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: BASE_URL,
    siteName: "RC2 Soluções",
    title: "RC2 Soluções — IA, Automações e Operações Digitais",
    description:
      "Consultoria especializada em IA, automações e operações digitais para PMEs. Diagnóstico gratuito.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RC2 Soluções — IA e Automações para PMEs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RC2 Soluções — IA, Automações e Operações Digitais",
    description: "Consultoria em IA, automações e operações digitais para PMEs.",
    images: ["/og-image.png"],
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
    canonical: BASE_URL,
  },
};

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
      logo: `${BASE_URL}/images/logo-base.png`,
    };
    schemaLocalBusiness = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "RC2 Soluções",
      url: BASE_URL,
      logo: `${BASE_URL}/images/logo-base.png`,
    };
  }

  return (
    <html
      lang="pt-BR"
      className={`h-full ${barlow.variable} ${barlowCondensed.variable}`}
    >
      <head>
        {/* Preload critical fonts to reduce render-blocking */}
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/barlow/v12/jizYREVItPoem2CA6dEcVWFBZpxpWc5zCMnN.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/barlow/v12/jizaREVItPoem2CA6dEcVWFBZpxpWc5zCMnN.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
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
            src="https://www.googletagmanager.com/ns.html?id=GTM-MQF4K77"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MQF4K77');`,
          }}
        />
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1517618546639130');fbq('track','PageView');`,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1517618546639130&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
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
