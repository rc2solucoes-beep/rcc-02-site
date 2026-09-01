import { describe, expect, it } from "vitest";
import { getServiceBySlug } from "@/lib/content/services";

/**
 * Fase 6A — higiene editorial do território Zapbox (docs/18 §22).
 *
 * `AGENTS.md` proíbe "chatbot" como vocabulário da RC2: o termo aprovado é
 * "agente de IA". A página continua publicada e o seu destino final ainda
 * depende das decisões comerciais da Fase 6 — este teste protege apenas a
 * terminologia, não o posicionamento.
 */

const service = getServiceBySlug("automacoes-com-ia");

describe("automacoes-com-ia — terminologia vigente", () => {
  it("o serviço continua existindo com o mesmo slug", () => {
    expect(service).toBeDefined();
    expect(service?.slug).toBe("automacoes-com-ia");
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
    expect(service?.items).toContain("Agente de IA para WhatsApp e site");
    expect(service?.keywords).toContain("agente de IA para atendimento");
  });

  it("preserva os links relacionados — esta unidade não decide destino", () => {
    expect(service?.relatedLinks.map((link) => link.href)).toEqual([
      "/solucoes-com-ia",
      "/solucoes#automacao-de-processos",
      "/contato",
    ]);
  });

  it("preserva a quantidade de itens e de keywords", () => {
    expect(service?.items).toHaveLength(9);
    expect(service?.keywords.split(",")).toHaveLength(8);
  });
});
