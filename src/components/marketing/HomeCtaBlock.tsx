import { CTABlockBase } from "./CTABlockBase";

export function HomeCtaBlock() {
  return (
    <CTABlockBase
      title="Quer descobrir onde a IA pode gerar resultado na sua empresa?"
      description="Comece por uma conversa de 20 a 30 minutos, sem compromisso, para entender o cenário e definir o próximo passo."
      primaryLabel="Falar sobre minha operação"
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
    />
  );
}
