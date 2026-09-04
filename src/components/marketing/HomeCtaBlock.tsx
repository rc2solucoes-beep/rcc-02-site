import { CTABlockBase } from "./CTABlockBase";

interface HomeCtaBlockProps {
  /** Modificador de ritmo da página que consome o bloco (ex.: `rc2-section--closing`). */
  className?: string;
  /**
   * CTA contextual da página que consome o bloco.
   *
   * O CTA principal da marca é o padrão, não um texto obrigatório em toda
   * página — a tabela aprovada no AGENTS.md dá "Conversar com a RC2" para
   * `/sobre`, por exemplo. O destino é sempre `/contato`.
   */
  primaryLabel?: string;
}

export function HomeCtaBlock({
  className,
  primaryLabel = "Falar sobre minha operação",
}: HomeCtaBlockProps = {}) {
  return (
    <CTABlockBase
      title="Tem um processo que ainda depende demais de planilha, copiar e colar ou memória?"
      description="Comece por uma conversa de 20 a 30 minutos, sem compromisso, para entender o cenário e definir qual é o próximo passo."
      primaryLabel={primaryLabel}
      primaryHref="/contato"
      primaryTracking={{
        kind: "cta",
        location: "home_cta_block",
        label: "comenzar_diagnostico",
        destination: "/contato",
      }}
      secondaryLabel="Falar pelo WhatsApp"
      secondaryHref="https://wa.me/5511988028550?text=Olá, quero entender onde a IA e automações podem ajudar minha empresa."
      secondaryTracking={{
        kind: "whatsapp",
        location: "home_cta_block",
        label: "whatsapp",
      }}
      variant="dark"
      className={className}
    />
  );
}
