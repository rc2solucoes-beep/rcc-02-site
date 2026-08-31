import { describe, expect, it } from "vitest";

const { generateMetadata } = await import("@/app/(public)/solucoes/page");

describe("/solucoes — metadata", () => {
  it("usa o title aprovado", async () => {
    const meta = await generateMetadata();
    expect(meta.title).toBe(
      "Soluções — Automação, Integrações e IA para Operações"
    );
  });

  it("posiciona a description nas quatro competências", async () => {
    const meta = await generateMetadata();
    expect(meta.description).toBe(
      "Automação de processos, integração de sistemas, IA para operações e operações digitais & commerce. As quatro competências da RC2 para a operação da sua empresa funcionar melhor."
    );
  });

  it("preserva o canonical em www", async () => {
    const meta = await generateMetadata();
    expect(meta.alternates?.canonical).toBe(
      "https://www.rc2solucoes.com.br/solucoes"
    );
  });

  it("usa og:url em www", async () => {
    const meta = await generateMetadata();
    expect(meta.openGraph?.url).toBe("https://www.rc2solucoes.com.br/solucoes");
  });

  it("deixa de posicionar a página no território Zapbox", async () => {
    const meta = await generateMetadata();
    const haystack = `${meta.title} ${meta.description}`.toLowerCase();
    for (const termo of [
      "atendimento lento",
      "leads sem resposta",
      "whatsapp",
      "chatbot",
    ]) {
      expect(haystack).not.toContain(termo);
    }
  });

  it("abandona o enquadramento por dor", async () => {
    const meta = await generateMetadata();
    expect(meta.title).not.toContain("por Problema");
  });
});
