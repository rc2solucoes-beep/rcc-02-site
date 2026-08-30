import { CTABlockBase } from "./CTABlockBase";

export function HomeCtaBlock() {
  return (
    <CTABlockBase
      title="Quer descobrir onde a IA pode gerar resultado na sua empresa?"
      description="Solicite um diagnóstico inicial e receba um mapa de oportunidades para automatizar atendimento, vendas e processos."
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
