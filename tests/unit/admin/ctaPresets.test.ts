import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * O preset de CTA de novos posts é um objeto interno de um componente client.
 * Não há export para importar, e criar um só para o teste seria mudar o código
 * por causa do teste. A verificação é feita sobre a fonte — suficiente para o
 * contrato em questão: o destino default não pode voltar a ser `/servicos`.
 *
 * Posts já publicados não são migrados por esta mudança (docs/15, D-2).
 */
const source = readFileSync(
  resolve(process.cwd(), "src/components/admin/PostFormTabs/CtaTab.tsx"),
  "utf-8"
);

describe("Preset de CTA de novos posts", () => {
  it("aponta o botão primário para /solucoes", () => {
    expect(source).toContain(
      'primaryButton: { text: "Conhecer soluções", url: "/solucoes" }'
    );
  });

  it("não cria mais links automáticos para a arquitetura legada", () => {
    expect(source).not.toContain('url: "/servicos"');
  });

  it("preserva o destino de contato dos presets", () => {
    expect(source).toContain('url: "/contato"');
  });
});
