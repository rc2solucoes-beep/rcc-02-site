/**
 * Conteúdo estrutural da Home.
 *
 * Centraliza copy, CTAs e destinos para que as decisões aprovadas em
 * `docs/12-fase-4-home-design.md` sejam testáveis sem renderizar a página,
 * que é um Server Component assíncrono.
 *
 * Não é CMS: nada aqui tem lógica de runtime.
 */

export const HOME_COPY = {
  eyebrow: "Automação · Integrações · IA para Operações",
  h1: "Sua operação não precisa de mais ferramentas. Precisa funcionar melhor.",
  subheadline:
    "A RC2 conecta sistemas, automatiza processos e aplica inteligência artificial para reduzir trabalho manual, retrabalho e gargalos na operação.",
  signature: "Tecnologia que funciona. Operação que entrega.",
} as const;

type Cta = {
  label: string;
  href: string;
  /** Identificador de analytics. Históricos são preservados — ver docs/10. */
  analyticsLabel: string;
};

export const HOME_CTAS = {
  heroPrimary: {
    label: "Falar sobre minha operação",
    href: "/contato",
    // Label histórico preservado apesar da nova copy visível (docs/10).
    analyticsLabel: "solicitar_diagnostico",
  },
  heroSecondary: {
    label: "Conhecer soluções",
    href: "/solucoes",
    analyticsLabel: "conhecer_solucoes",
  },
  competencies: {
    label: "Conhecer soluções",
    href: "/solucoes",
    analyticsLabel: "conhecer_solucoes",
  },
  authority: {
    label: "Ver avaliações e projetos",
    href: "/avaliacoes",
    analyticsLabel: "avaliacoes",
  },
  content: {
    label: "Ver todos os artigos",
    href: "/blog",
    analyticsLabel: "ver_todos_artigos",
  },
} as const satisfies Record<string, Cta>;

export const HOME_BLOG_SLUGS = [
  "processos-manuais-o-que-automatizar",
  "custo-de-agente-de-ia",
  "governanca-agentes-ia-pmes",
] as const;

/**
 * Expressões descontinuadas ou não sustentadas que não podem voltar à Home.
 * Fonte: AGENTS.md, docs/11 e docs/12 §5.1.
 */
export const FORBIDDEN_HOME_CLAIMS = [
  "diagnóstico gratuito",
  "solicitar diagnóstico",
  "menos de 2 minutos",
  "24h por dia",
  "30 dias",
  "sem contratar mais ninguém",
  "cases de sucesso",
] as const;
