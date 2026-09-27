import { describe, expect, it } from "vitest";
import { BASE_URL } from "@/lib/siteMetadata";
import { SCHEMA_IDS } from "@/lib/schemaIds";
import { getBlogAuthorSchema } from "@/lib/blogSchema";
import type { Post } from "@/lib/types/post";

/**
 * SDD Schema.org — Fase 5.1: estabilidade do `Person @id`.
 *
 * Ordem de identidade: institucional → `#organization`; pessoa com
 * `author_id` → `#person-{author_id}`; pessoa sem `author_id` → slug do nome.
 */

type AuthorFields = Pick<
  Post,
  "author_id" | "author_name" | "author_title" | "author_photo" | "author_linkedin"
>;

const author = (fields: Partial<AuthorFields>): AuthorFields => ({
  author_id: null,
  author_name: null,
  author_title: null,
  author_photo: null,
  author_linkedin: null,
  ...fields,
});

// UUIDs fictícios, no formato de `authors.id`.
const ID_A = "3f2b8c1e-7a4d-4e9b-9c2f-1a2b3c4d5e6f";
const ID_B = "9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b";

const personId = (fields: Partial<AuthorFields>) =>
  getBlogAuthorSchema(author(fields)).person?.["@id"];

describe("Person @id — ordem de identidade", () => {
  it("T01 — autor institucional ignora author_id: #organization, sem Person", () => {
    for (const author_name of ["RC2 Soluções", null, "", "   "]) {
      const r = getBlogAuthorSchema(author({ author_name, author_id: ID_A }));
      expect(r).toEqual({ author: { "@id": SCHEMA_IDS.organization }, person: null });
    }
  });

  it("T02 — pessoa com author_id usa o author_id, não o nome", () => {
    const r = getBlogAuthorSchema(author({ author_name: "Robson Azevedo", author_id: ID_A }));
    expect(r.person?.["@id"]).toBe(`${BASE_URL}/#person-${ID_A}`);
    expect(r.person?.["@id"]).not.toContain("robson-azevedo");
    expect(r.author).toEqual({ "@id": `${BASE_URL}/#person-${ID_A}` });
  });

  it("T03 — estabilidade: nome muda, author_id igual → mesmo @id", () => {
    const antes = personId({ author_id: ID_A, author_name: "Robson Azevedo" });
    const depois = personId({ author_id: ID_A, author_name: "Robson S. Azevedo" });
    expect(antes).toBeDefined();
    expect(depois).toBe(antes);
  });

  it("T04 — colisão: mesmo nome, author_id diferente → @id diferente", () => {
    const a = personId({ author_id: ID_A, author_name: "Robson Azevedo" });
    const b = personId({ author_id: ID_B, author_name: "Robson Azevedo" });
    expect(a).not.toBe(b);
  });

  it("mesmo author_id gera o mesmo @id; normaliza espaços e maiúsculas", () => {
    expect(personId({ author_id: ID_A, author_name: "Robson Azevedo" })).toBe(
      personId({ author_id: `  ${ID_A.toUpperCase()} `, author_name: "Robson Azevedo" })
    );
  });

  it("T05 — sem author_id, fallback pelo slug do nome", () => {
    for (const author_id of [null, "", "   "]) {
      expect(personId({ author_id, author_name: "Robson Azevedo" })).toBe(
        `${BASE_URL}/#person-robson-azevedo`
      );
    }
  });

  it("author_id fora do formato UUID não é usado: cai no fallback do nome", () => {
    expect(personId({ author_id: "nao-e-uuid</script>", author_name: "Robson Azevedo" })).toBe(
      `${BASE_URL}/#person-robson-azevedo`
    );
  });

  it("T06 — fallback determinístico: mesmo nome sem author_id → mesmo @id", () => {
    expect(personId({ author_name: "Robson Azevedo" })).toBe(
      personId({ author_name: " Robson Azevedo " })
    );
  });
});

describe("Person — campos opcionais preservados da Fase 5", () => {
  it("T07 — jobTitle, image e sameAs seguem as mesmas regras", () => {
    const completo = getBlogAuthorSchema(
      author({
        author_id: ID_A,
        author_name: "Robson Azevedo",
        author_title: "Fundador",
        author_photo: "/images/r.jpg",
        author_linkedin: "https://www.linkedin.com/in/exemplo",
      })
    ).person;
    expect(completo).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${BASE_URL}/#person-${ID_A}`,
      name: "Robson Azevedo",
      jobTitle: "Fundador",
      image: `${BASE_URL}/images/r.jpg`,
      sameAs: ["https://www.linkedin.com/in/exemplo"],
    });

    const vazio = getBlogAuthorSchema(
      author({ author_id: ID_A, author_name: "Robson Azevedo", author_title: "", author_photo: "" })
    ).person;
    expect(vazio).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${BASE_URL}/#person-${ID_A}`,
      name: "Robson Azevedo",
    });
  });
});
