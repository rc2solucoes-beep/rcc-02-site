import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Script from "next/script";
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

const schemaOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "RC2 Soluções",
  url: BASE_URL,
  logo: `${BASE_URL}/images/logo-base.png`,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "Portuguese",
    url: `${BASE_URL}/contato`,
  },
  sameAs: [],
};

const schemaWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RC2 Soluções",
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE_URL}/blog?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`h-full ${barlow.variable} ${barlowCondensed.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrganization) }}
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
