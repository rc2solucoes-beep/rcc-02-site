import { CTABlockBase } from "./CTABlockBase";

export function ContactCtaBlock() {
  return (
    <CTABlockBase
      title="Já enviou sua demanda?"
      description="Nos próximos dias, você receberá um diagnóstico detalhado com um mapa de oportunidades e próximos passos acionáveis."
      primaryLabel="Voltar para home"
      primaryHref="/"
      primaryTracking={{
        kind: "cta",
        location: "contact_cta_block",
        label: "voltar_home",
        destination: "/",
      }}
      secondaryLabel="Falar direto com Robson"
      secondaryHref="https://wa.me/5511988028550?text=Já enviei a demanda e estou aguardando o diagnóstico."
      secondaryTracking={{
        kind: "whatsapp",
        location: "contact_cta_block",
        label: "whatsapp_robson",
      }}
      variant="orange"
    />
  );
}
