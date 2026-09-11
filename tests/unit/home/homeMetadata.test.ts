import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/schema", () => ({
  getOrgSettings: vi.fn(async () => ({ og_image_url: "" })),
  getWebPageSchema: vi.fn(() => ({ "@context": "https://schema.org", "@type": "WebPage" })),
}));

const { generateMetadata } = await import("@/app/(public)/page");

describe("Home — metadata", () => {
  it("usa o title aprovado", async () => {
    const meta = await generateMetadata();
    expect(meta.title).toBe("Automação, Integração e IA para PMEs");
  });

  it("posiciona a description em operação", async () => {
    const meta = await generateMetadata();
    expect(meta.description).toBe(
      "Sua operação cresceu, mas o processo não acompanhou? A RC2 automatiza tarefas, conecta sistemas e aplica IA pra reduzir retrabalho. Fale 20 min, grátis."
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
