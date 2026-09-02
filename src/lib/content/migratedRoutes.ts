/**
 * Slugs cuja URL passou a redirecionar e que, por isso, saem do sitemap, da
 * navegação sequencial e de qualquer lookup que ofereça destino ao usuário.
 *
 * Uma URL que redireciona não pode continuar publicada como destino: nem no
 * sitemap, nem em prev/next, nem em bloco relacionado.
 *
 * A fonte é única de propósito. Estes conjuntos são lidos pelo sitemap, pelo
 * hub `/servicos`, pela navegação sequencial e pelo lookup reverso de
 * `servicos/[slug]`; mantê-los duplicados por arquivo permitiria que um slug
 * saísse do sitemap mas continuasse em prev/next — exatamente a incoerência
 * que eles existem para impedir.
 *
 * Escopo: migrações já publicadas. Não é um registry genérico de rotas.
 *
 * - `agentes-de-ia`, `automacao-de-processos` — migração SEO pós-Fase 5
 *   (`docs/16` §13), absorvidas pelas âncoras de `/solucoes`.
 * - `automacoes-com-ia` e as três soluções — Fase 6F (`docs/22` §1),
 *   território integralmente Zapbox, consolidado na ponte `/zapbox`.
 */

export const MIGRATED_SERVICE_SLUGS = new Set([
  "agentes-de-ia",
  "automacao-de-processos",
  "automacoes-com-ia",
]);

export const MIGRATED_SOLUTION_SLUGS = new Set([
  "atendimento-lento",
  "leads-sem-resposta",
  "whatsapp-desorganizado",
]);
