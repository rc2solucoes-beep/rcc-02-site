/**
 * Resolve uma URL para uso em Schema.org.
 *
 * - absoluta `http(s)://` → devolvida exatamente como veio;
 * - relativa → resolvida contra `baseUrl`;
 * - vazia, só espaços ou inválida → `undefined`.
 *
 * Existe porque concatenar `baseUrl` com um valor que já era absoluto gerava
 * `https://www.rc2solucoes.com.brhttps://…` (`docs/schema/baseline.md`).
 * Módulo puro — sem banco nem cache — para ser usado por qualquer builder.
 */
export function resolveSchemaUrl(
  value: string | null | undefined,
  baseUrl: string
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  try {
    return new URL(trimmed, `${baseUrl}/`).href;
  } catch {
    return undefined;
  }
}
