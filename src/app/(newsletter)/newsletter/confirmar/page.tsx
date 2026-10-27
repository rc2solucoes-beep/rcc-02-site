import type { Metadata } from "next";
import { TokenActionPanel } from "@/components/newsletter/TokenActionPanel";

// Página de confirmação (RF-NL-02, RF-NL-15). O token vem no fragmento `#t=` (nunca no servidor).
// noindex, sem Referer e sem cache; o grupo (newsletter) não carrega rastreadores (DEC-27).
export const metadata: Metadata = {
  title: "Confirmar inscrição na newsletter",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  alternates: { canonical: null },
  openGraph: null,
};

export default function ConfirmarNewsletterPage() {
  return <TokenActionPanel mode="confirm" />;
}
