import { describe, expect, it } from "vitest";
import {
  buildListHref,
  buildSearchOrFilter,
  clampPage,
  escapeLikeTerm,
  escapeRegexTerm,
  pageCount,
  pageRange,
  parsePage,
  parseSearchTerm,
  quotePostgrestValue,
} from "@/lib/admin/listParams";

describe("parsePage (T-CMS-U01/U07)", () => {
  it("usa 1 como padrão e para valores inválidos", () => {
    for (const v of [undefined, "", "0", "-3", "abc", "1.5", "1e3", " ", "99999999999"]) {
      expect(parsePage(v), String(v)).toBe(1);
    }
  });
  it("aceita inteiros ≥ 1 e usa o primeiro valor de arrays", () => {
    expect(parsePage("7")).toBe(7);
    expect(parsePage([" 3 ", "9"])).toBe(3);
  });
});

describe("parseSearchTerm (T-CMS-U01)", () => {
  it("ignora termo com menos de 2 caracteres", () => {
    expect(parseSearchTerm("a")).toBe("");
    expect(parseSearchTerm("  a  ")).toBe("");
    expect(parseSearchTerm(undefined)).toBe("");
  });
  it("apara e aceita 2 caracteres", () => {
    expect(parseSearchTerm("  ab ")).toBe("ab");
  });
  it("limita a 80 caracteres sem quebrar pares substitutos", () => {
    const out = parseSearchTerm("😀".repeat(100));
    expect(Array.from(out)).toHaveLength(80);
  });
  it("troca caracteres de controle por espaço", () => {
    expect(parseSearchTerm("a\u0000b\nc")).toBe("a b c");
  });
});

describe("paginação (T-CMS-U07)", () => {
  it("pageCount", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(1)).toBe(1);
    expect(pageCount(20)).toBe(1);
    expect(pageCount(21)).toBe(2);
    expect(pageCount(100)).toBe(5);
    expect(pageCount(Number.NaN)).toBe(1);
  });
  it("clampPage limita ao intervalo", () => {
    expect(clampPage(9, 41)).toBe(3);
    expect(clampPage(0, 41)).toBe(1);
    expect(clampPage(5, 0)).toBe(1);
  });
  it("pageRange é inclusivo e de 20 itens", () => {
    expect(pageRange(1)).toEqual({ from: 0, to: 19 });
    expect(pageRange(3)).toEqual({ from: 40, to: 59 });
  });
});

describe("escape de busca (T-CMS-U02, PRP-07)", () => {
  it("escapa \\, % e _ para LIKE", () => {
    expect(escapeLikeTerm("100%_a\\b")).toBe("100\\%\\_a\\\\b");
  });
  it("escapa metacaracteres de regex", () => {
    expect(escapeRegexTerm("a*b.c(d)[e]")).toBe("a\\*b\\.c\\(d\\)\\[e\\]");
  });
  it("quotePostgrestValue escapa \\ e aspas", () => {
    expect(quotePostgrestValue('a"b\\c')).toBe('"a\\"b\\\\c"');
  });

  const hostile = ["%", "_", "\\", '"', ",", "(", ")", ".", "--", "a b", "ação ñ 日本", "x),title.eq.1,(y", '"),or=(id.neq.0'];

  it.each(hostile)("termo hostil %j não escapa das aspas do filtro", (term) => {
    const filter = buildSearchOrFilter(`ab${term}`, ["title", "slug", "summary"]);
    // Três colunas, cada uma com UM valor entre aspas; nada fora das aspas além da estrutura.
    const structure = filter.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    expect(structure).toBe('title.ilike."",slug.ilike."",summary.ilike.""');
  });

  it("usa ilike com padrão %termo% escapado em duas camadas", () => {
    // termo: a_b%c\d -> LIKE: a\_b\%c\\d -> aspas: a\\_b\\%c\\\\d
    expect(buildSearchOrFilter("a_b%c\\d", ["title"])).toBe('title.ilike."%a\\\\_b\\\\%c\\\\\\\\d%"');
  });

  it("termo com * usa imatch (regex literal) e nunca ilike", () => {
    const filter = buildSearchOrFilter("a*b", ["title", "slug"]);
    expect(filter).toBe('title.imatch."a\\\\*b",slug.imatch."a\\\\*b"');
    expect(filter).not.toContain("ilike");
  });

  it("termo com * e aspas permanece contido nas aspas", () => {
    const filter = buildSearchOrFilter('x*"y', ["title"]);
    const structure = filter.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    expect(structure).toBe('title.imatch.""');
  });
});

describe("buildListHref", () => {
  it("omite vazios e codifica valores", () => {
    expect(buildListHref("/x", { q: "a b&c", page: 2, status: null, from: "" })).toBe("/x?q=a+b%26c&page=2");
    expect(buildListHref("/x", {})).toBe("/x");
  });
});
