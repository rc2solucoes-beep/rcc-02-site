import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "RC2 Soluções — IA, Automações e Operações Digitais",
    template: "%s | RC2 Soluções",
  },
  description:
    "Consultoria especializada em IA, automações e operações digitais para pequenas e médias empresas. Automatize atendimento, integre sistemas e escale sua operação.",
  metadataBase: new URL("https://rc2solucoes.com.br"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://rc2solucoes.com.br",
    siteName: "RC2 Soluções",
    title: "RC2 Soluções — IA, Automações e Operações Digitais",
    description:
      "Consultoria especializada em IA, automações e operações digitais para PMEs. Diagnóstico gratuito.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
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
    >
      <body className="min-h-full flex flex-col bg-rc2-sand text-rc2-ebony antialiased">
        {children}
      </body>
    </html>
  );
}
