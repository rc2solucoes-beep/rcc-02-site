import { describe, expect, it } from "vitest";

const { generateMetadata } = await import("@/app/(public)/zapbox/page");

/**
 * Fase 6D — metadata da ponte (docs/20 §6 e §7).
 *
 * O título é **relacional** — nomeia RC2 e Zapbox juntos —, e não de produto.
 * É isso que coloca a ponte numa intenção de busca diferente da landing do
 * produto, evitando competição orgânica.
 */

describe("Ponte Zapbox — metadata", () => {
  it("usa o title aprovado", async () => {
    const meta = await generateMetadata();
    expect(meta.title).toBe(
      "Zapbox — o produto da RC2 para WhatsApp, atendimento e vendas"
    );
  });

  it("usa a description aprovada", async () => {
    const meta = await generateMetadata();
    expect(meta.description).toBe(
      "O Zapbox é o produto próprio da RC2 para atendimento e vendas pelo WhatsApp. Entenda o que pertence ao produto, o que continua sendo trabalho de automação e integração da RC2, e como os dois se conectam."
    );
  });

  it("tem canonical própria em www", async () => {
    const meta = await generateMetadata();
    expect(meta.alternates?.canonical).toBe(
      "https://www.rc2solucoes.com.br/zapbox"
    );
  });

  it("usa og:url coerente com a canonical", async () => {
    const meta = await generateMetadata();
    expect(meta.openGraph?.url).toBe("https://www.rc2solucoes.com.br/zapbox");
  });

  it("não duplica o title da landing do produto", async () => {
    const meta = await generateMetadata();
    expect(meta.title).not.toBe("Zapbox | Atendimento em equipe pelo WhatsApp");
    expect(String(meta.title)).toContain("RC2");
  });

  it("não publica preço, plano nem termo descontinuado na metadata", async () => {
    const meta = await generateMetadata();
    const haystack = `${meta.title} ${meta.description}`.toLowerCase();
    for (const termo of ["chatbot", "plano", "preço", "r$", "grátis"]) {
      expect(haystack).not.toContain(termo);
    }
  });
});
