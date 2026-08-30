import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/schema", () => ({
  getOrgSettings: vi.fn(async () => ({ og_image_url: "" })),
  getWebPageSchema: vi.fn(() => ({ "@context": "https://schema.org", "@type": "WebPage" })),
}));

const { generateMetadata } = await import("@/app/(public)/page");

describe("Home — metadata", () => {
  it("usa o title aprovado", async () => {
    const meta = await generateMetadata();
    expect(meta.title).toBe(
      "RC2 Soluções — Automação, Integrações e IA para Operações"
    );
  });

  it("posiciona a description em operação", async () => {
    const meta = await generateMetadata();
    expect(meta.description).toBe(
      "Consultoria e implementação de automação de processos, integração de sistemas e IA para operações de PMEs que cresceram e precisam funcionar melhor."
    );
  });

  it("preserva o canonical em www com barra final", async () => {
    const meta = await generateMetadata();
    expect(meta.alternates?.canonical).toBe("https://www.rc2solucoes.com.br/");
  });

  it("usa og:url em www", async () => {
    const meta = await generateMetadata();
    expect(meta.openGraph?.url).toBe("https://www.rc2solucoes.com.br");
  });

  it("não posiciona a Home em território Zapbox", async () => {
    const meta = await generateMetadata();
    const haystack = `${meta.title} ${meta.description}`.toLowerCase();
    for (const term of ["lead", "chatbot", "whatsapp", "atendimento automático"]) {
      expect(haystack).not.toContain(term);
    }
  });
});
