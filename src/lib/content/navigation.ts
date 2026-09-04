/**
 * Navegação do site — Header e Footer.
 *
 * Os links da coluna "Soluções" derivam de `SOLUCOES_ANCHORS`, para que âncora
 * publicada e link do Footer não possam divergir silenciosamente.
 *
 * `/servicos` e `/solucoes-com-ia` saíram da navegação na Fase 5. As URLs
 * continuam 200 e no sitemap — sair do menu não é sair do site (docs/14 §20).
 */

import { SOLUCOES_ANCHORS } from "./solucoesPage";

export type NavLink = {
  href: string;
  label: string;
};

export type TrackedNavLink = NavLink & {
  analyticsLabel: string;
};

/**
 * Fase 3 (`docs/24` §4): o Zapbox entra no header, conforme
 * `RC2_Correcoes_Recomendadas_Site.md` §17.
 *
 * O §17 anota "Zapbox ↗ abre domínio próprio". O destino aqui é a ponte
 * interna `/zapbox`, não `zapbox.cloud`: `CD-1 = BRIDGE_FIRST` (`docs/19`)
 * determina que só o CTA da ponte sai do domínio. Sem seta de link externo,
 * porque o link não é externo.
 *
 * "Agenda Confirmada" entrou depois, na Fase 6, quando a rota foi publicada e
 * o `DEFER_ROUTE` encerrado.
 *
 * A ordem segue o §17 adaptada ao que existe. "Blog" **não** vira "Conteúdo":
 * o §17 sugere, mas o rótulo mexe em taxonomia de analytics e continua fora de
 * escopo, como registrado desde a Fase 3.
 */
export const NAV_LINKS: readonly NavLink[] = [
  { href: "/", label: "Início" },
  { href: "/solucoes", label: "Soluções" },
  { href: "/zapbox", label: "Zapbox" },
  { href: "/solucoes/agenda-confirmada", label: "Agenda Confirmada" },
  { href: "/sobre", label: "Sobre" },
  { href: "/blog", label: "Blog" },
];

/**
 * Fase 3 (`docs/24` §4): "Avaliações e Projetos" entra, conforme
 * `RC2_Correcoes_Recomendadas_Site.md` §18. A página existia, estava no
 * sitemap e não recebia nenhum link interno — órfã na prática.
 *
 * O rótulo é "Avaliações e Projetos", nunca "Cases de Sucesso": não há case
 * documentado.
 */
export const FOOTER_COMPANY_LINKS: readonly NavLink[] = [
  { href: "/sobre", label: "Sobre" },
  { href: "/solucoes", label: "Soluções" },
  { href: "/blog", label: "Blog" },
  { href: "/avaliacoes", label: "Avaliações e Projetos" },
  { href: "/contato", label: "Contato" },
];

const SOLUTION_LABELS: Record<(typeof SOLUCOES_ANCHORS)[number], string> = {
  "automacao-de-processos": "Automação de Processos",
  "integracao-de-sistemas": "Integração de Sistemas",
  "ia-para-operacoes": "IA para Operações",
  "operacoes-digitais-commerce": "Operações Digitais & Commerce",
  "operacao-gerenciada": "Operação Gerenciada",
};

/**
 * Fase 6: "Agenda Confirmada" entra na coluna Soluções, fechando o item do §18
 * das Correções que ficara de fora só porque a rota não existia. É link de
 * rota, não de âncora — por isso vem depois das cinco competências.
 */
export const FOOTER_SOLUTION_LINKS: readonly TrackedNavLink[] = [
  ...SOLUCOES_ANCHORS.map((anchor) => ({
    href: `/solucoes#${anchor}`,
    label: SOLUTION_LABELS[anchor],
    analyticsLabel: anchor.replaceAll("-", "_"),
  })),
  {
    href: "/solucoes/agenda-confirmada",
    label: "Agenda Confirmada",
    analyticsLabel: "agenda_confirmada",
  },
];

/**
 * Zapbox é produto próprio da RC2 — nunca competência.
 *
 * Fase 6E: o destino é a ponte `/zapbox`, não o domínio do produto. A ponte
 * delimita o território e faz a única saída autorizada (`CD-1 = BRIDGE_FIRST`).
 */
export const FOOTER_PRODUCT_LINK = {
  href: "/zapbox",
  label: "Zapbox",
  description: "atendimento e vendas pelo WhatsApp",
  analyticsLabel: "conhecer_zapbox",
} as const;
