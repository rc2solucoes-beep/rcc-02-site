import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils";

describe("slugify", () => {
  it("converte para minúsculas", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("remove acentos", () => {
    expect(slugify("Automação com IA")).toBe("automacao-com-ia");
  });

  it("substitui espaços por hífens", () => {
    expect(slugify("title with spaces")).toBe("title-with-spaces");
  });

  it("colapsa múltiplos hífens", () => {
    expect(slugify("a  b  c")).toBe("a-b-c");
  });

  it("remove caracteres especiais", () => {
    expect(slugify("Título: guia #1!")).toBe("titulo-guia-1");
  });

  it("remove pontuação portuguesa", () => {
    expect(slugify("Olá, mundo!")).toBe("ola-mundo");
  });

  it("handle string vazia", () => {
    expect(slugify("")).toBe("");
  });

  it("handle texto só com espaços", () => {
    expect(slugify("   ")).toBe("");
  });
});
