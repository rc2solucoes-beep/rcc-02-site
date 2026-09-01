import { describe, expect, it } from "vitest";
import { getServiceBySlug } from "@/lib/content/services";

/**
 * Fase 6B — higiene editorial de `/servicos/sites-e-landing-pages`.
 *
 * `AGENTS.md` proíbe "chatbot"; o termo aprovado é "agente de IA". A URL segue
 * classificada como `KEEP` (200, indexável, self-canonical, publicada no
 * sitemap) e este teste protege **apenas a terminologia** — não o
 * posicionamento do serviço, que continua sendo sites e landing pages.
 *
 * Superfície distinta da protegida por `zapboxTerritoryTerminology.test.ts`:
 * lá o território é Zapbox, aqui é serviço despriorizado.
 */

const service = getServiceBySlug("sites-e-landing-pages");

describe("sites-e-landing-pages — terminologia vigente", () => {
  it("o serviço continua existindo com o mesmo slug", () => {
    expect(service).toBeDefined();
    expect(service?.slug).toBe("sites-e-landing-pages");
  });

  it("nenhum item de oferta usa o termo descontinuado", () => {
    const ofensores = (service?.items ?? []).filter((item) =>
      item.toLowerCase().includes("chatbot")
    );
    expect(ofensores).toEqual([]);
  });

  it("as keywords não usam o termo descontinuado", () => {
    expect(service?.keywords.toLowerCase()).not.toContain("chatbot");
  });

  it("usa o termo aprovado no lugar", () => {
    expect(service?.items).toContain("Agente de IA integrado ao site");
    expect(service?.keywords).toContain("agente de IA para site");
  });

  it("não invade o território Zapbox ao descrever o recurso", () => {
    const recurso = (service?.items ?? []).find((item) =>
      item.includes("Agente de IA")
    );
    expect(recurso).toBeDefined();
    for (const termo of ["WhatsApp", "CRM", "Sales AI", "assistente virtual"]) {
      expect(recurso).not.toContain(termo);
    }
  });

  it("preserva CTA e links relacionados", () => {
    expect(service?.cta).toContain("Transforme seu site em um canal ativo");
    expect(service?.relatedLinks.map((link) => link.href)).toEqual([
      "/servicos/automacoes-com-ia",
      "/servicos/e-commerce",
      "/contato",
    ]);
  });

  it("preserva a estrutura do serviço", () => {
    expect(service?.items).toHaveLength(10);
    expect(service?.keywords.split(",")).toHaveLength(8);
    expect(service?.faq).toHaveLength(5);
  });
});
