import { CTABlockBase } from "./CTABlockBase";

export function ServicesCtaBlock() {
  return (
    <CTABlockBase
      title="Pronto para modernizar sua operação?"
      description="Escolha o serviço que mais se alinha com seu desafio. Começamos pelo diagnóstico e entregamos resultado."
      primaryLabel="Ver todas as soluções"
      primaryHref="/solucoes"
      primaryTracking={{
        kind: "cta",
        location: "services_cta_block",
        label: "ver_solucoes",
        destination: "/solucoes",
      }}
      secondaryLabel="Agendar conversa"
      secondaryHref="/contato"
      secondaryTracking={{
        kind: "cta",
        location: "services_cta_block",
        label: "agendar_conversa",
        destination: "/contato",
      }}
      variant="dark"
    />
  );
}
