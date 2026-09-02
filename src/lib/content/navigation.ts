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

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/", label: "Início" },
  { href: "/solucoes", label: "Soluções" },
  { href: "/sobre", label: "Sobre" },
  { href: "/blog", label: "Blog" },
];

export const FOOTER_COMPANY_LINKS: readonly NavLink[] = [
  { href: "/sobre", label: "Sobre" },
  { href: "/solucoes", label: "Soluções" },
  { href: "/blog", label: "Blog" },
  { href: "/contato", label: "Contato" },
];

const SOLUTION_LABELS: Record<(typeof SOLUCOES_ANCHORS)[number], string> = {
  "automacao-de-processos": "Automação de Processos",
  "integracao-de-sistemas": "Integração de Sistemas",
  "ia-para-operacoes": "IA para Operações",
  "operacoes-digitais-commerce": "Operações Digitais & Commerce",
  "operacao-gerenciada": "Operação Gerenciada",
};

export const FOOTER_SOLUTION_LINKS: readonly TrackedNavLink[] =
  SOLUCOES_ANCHORS.map((anchor) => ({
    href: `/solucoes#${anchor}`,
    label: SOLUTION_LABELS[anchor],
    analyticsLabel: anchor.replaceAll("-", "_"),
  }));

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
