import { CTABlockBase } from "./CTABlockBase";

export function ContactCtaBlock() {
  return (
    <CTABlockBase
      title="Já enviou sua demanda?"
      description="Vamos analisar o que você enviou e retornar para marcar a conversa inicial."
      primaryLabel="Voltar para home"
      primaryHref="/"
      primaryTracking={{
        kind: "cta",
        location: "contact_cta_block",
        label: "voltar_home",
        destination: "/",
      }}
      secondaryLabel="Falar direto com Robson"
      secondaryHref="https://wa.me/5511988028550?text=Já enviei a demanda pelo site e quero falar sobre a minha operação."
      secondaryTracking={{
        kind: "whatsapp",
        location: "contact_cta_block",
        label: "whatsapp_robson",
      }}
      variant="orange"
    />
  );
}
