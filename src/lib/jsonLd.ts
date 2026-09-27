/**
 * Serializa um objeto JSON-LD para `<script type="application/ld+json">`.
 *
 * `JSON.stringify` não escapa `<`: um valor com `</script>` — título de post,
 * resposta de FAQ, campo de settings — fecharia a tag antes da hora e deixaria
 * o resto ser interpretado como HTML. Trocar todo `<` por `<` impede isso
 * (inclusive `<!--`) e mantém o JSON válido: `JSON.parse` devolve o `<` original.
 *
 * Único ponto de serialização de JSON-LD do projeto — não use `JSON.stringify`
 * direto em `dangerouslySetInnerHTML` de scripts estruturados.
 */
export function serializeJsonLd(value: unknown): string {
  return (JSON.stringify(value) ?? "null").replace(/</g, "\\u003c");
}
