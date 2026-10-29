import type { Metadata } from "next";
import { TokenActionPanel } from "@/components/newsletter/TokenActionPanel";
import { UnsubscribeRequestForm } from "@/components/newsletter/UnsubscribeRequestForm";

// Descadastro (RF-NL-04, RF-NL-05, RF-NL-15). Com `#t=` mostra o botão de confirmação; sem token
// (ou com link inativo) mostra o pedido de novo link. NÃO depende de NEWSLETTER_SIGNUP_ENABLED
// (§18.5). noindex, sem Referer e sem cache; o grupo (newsletter) não carrega rastreadores.
export const metadata: Metadata = {
  title: "Descadastrar da newsletter",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  alternates: { canonical: null },
  openGraph: null,
};

export default function DescadastroNewsletterPage() {
  return <TokenActionPanel mode="unsubscribe" noTokenSlot={<UnsubscribeRequestForm />} />;
}
