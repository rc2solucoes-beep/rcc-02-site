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

/** Seção 2 — os quatro territórios de problema (docs/12 §5.2). */
export const HOME_PROBLEMS = [
  {
    title: "Trabalho manual",
    description:
      "Tarefas repetidas todos os dias porque nenhum sistema as executa sozinho.",
    examples: [
      "copiar e colar entre sistemas",
      "planilha usada como sistema",
      "retrabalho a cada correção",
    ],
  },
  {
    title: "Sistemas desconectados",
    description:
      "Cada ferramenta resolve uma parte e ninguém conversa com ninguém.",
    examples: [
      "sistemas isolados",
      "cadastro refeito em cada ferramenta",
      "pessoas servindo de ponte entre plataformas",
    ],
  },
  {
    title: "Informação espalhada",
    description:
      "O dado existe, mas está em lugares diferentes e nem sempre confere.",
    examples: [
      "informação duplicada",
      "versões divergentes do mesmo número",
      "falta de rastreabilidade",
    ],
  },
  {
    title: "Operação digital fragmentada",
    description:
      "Plataforma, ERP, logística e pagamentos operam sem uma costura comum.",
    examples: [
      "processos dependentes de pessoas específicas",
      "pedidos conferidos à mão",
      "nenhuma visão única da operação",
    ],
  },
] as const;

/** Seção 3 — as quatro competências (docs/12 §5.3). */
export const HOME_COMPETENCIES = [
  {
    title: "Automação de Processos",
    problem: "O processo existe, mas roda no braço.",
    delivery:
      "Mapeamos o fluxo real e automatizamos as etapas repetitivas, com registro do que aconteceu.",
    href: "/solucoes#automacao-de-processos",
    linkLabel: "Ver automação de processos",
    analyticsLabel: "automacao_de_processos",
  },
  {
    title: "Integração de Sistemas",
    problem: "Os sistemas não conversam e alguém faz a ponte.",
    delivery:
      "Conectamos ERP, CRM, plataforma e ferramentas internas para o dado circular sem digitação dupla.",
    href: "/solucoes#integracao-de-sistemas",
    linkLabel: "Ver integração de sistemas",
    analyticsLabel: "integracao_de_sistemas",
  },
  {
    title: "IA para Operações",
    problem: "Há interesse em IA, mas falta processo para sustentá-la.",
    delivery:
      "Aplicamos IA sobre processo estruturado, com contexto, dados e governança definidos.",
    href: "/solucoes#ia-para-operacoes",
    linkLabel: "Ver IA para operações",
    analyticsLabel: "ia_para_operacoes",
  },
  {
    title: "Operações Digitais & Commerce",
    problem: "A operação digital cresceu em partes desconectadas.",
    delivery:
      "Integramos plataforma, ERP, logística, pagamentos e dados em uma operação única.",
    href: "/solucoes#operacoes-digitais-commerce",
    linkLabel: "Ver operações digitais e commerce",
    analyticsLabel: "operacoes_digitais_commerce",
  },
] as const;

/** Seção 4 — produtos e soluções próprias (docs/12 §5.4). */
export const HOME_PRODUCTS = {
  zapbox: {
    name: "Zapbox",
    category: "Produto próprio da RC2",
    description:
      "Atendimento e vendas pelo WhatsApp com equipe, CRM comercial e Sales AI. É o produto da RC2 para esse território — e é onde essas necessidades devem ser resolvidas.",
    ctaLabel: "Conhecer Zapbox",
    // Fase 6E: BRIDGE_FIRST — a ponte `/zapbox` explica o território e
    // encaminha ao produto. Nenhuma superfície institucional sai direto.
    href: "/zapbox",
    external: false,
    analyticsLabel: "conhecer_zapbox",
  },
  agendaConfirmada: {
    name: "Agenda Confirmada",
    category: "Solução vertical RC2 para clínicas",
    description:
      "Confirmações e lembretes de consulta sem depender da recepção ligar uma a uma, reduzindo faltas e horários vagos.",
    ctaLabel: "Falar sobre agenda e confirmações",
    href: "/contato",
    external: false,
    analyticsLabel: "agenda_confirmada",
  },
} as const;

/** Seção 5 — método (docs/12 §5.5). */
export const HOME_METHOD = {
  steps: [
    {
      name: "Entender",
      description:
        "Uma conversa de 20 a 30 minutos para entender o cenário, o problema e se há aderência. Quando o trabalho exige levantamento estruturado, arquitetura ou roadmap, o passo seguinte é o Discovery Operacional, que é uma etapa paga.",
    },
    {
      name: "Desenhar",
      description:
        "Definimos como o processo deve funcionar, quais sistemas entram e onde a automação faz sentido.",
    },
    {
      name: "Implantar",
      description:
        "Construímos as automações e integrações, com a operação acompanhando cada entrega.",
    },
    {
      name: "Medir",
      description:
        "Instrumentamos o que foi implantado para saber se está rodando como o esperado.",
    },
    {
      name: "Evoluir",
      description:
        "Depois da implantação, a Operação Gerenciada mantém automações e integrações sob acompanhamento técnico contínuo.",
    },
  ],
  managedOpsHref: "/solucoes#operacao-gerenciada",
  managedOpsLabel: "Ver Operação Gerenciada",
  managedOpsAnalyticsLabel: "operacao_gerenciada",
} as const;

/** Seção 6 — autoridade (proposta §16, fatos aprovados). */
export const HOME_AUTHORITY = {
  intro:
    "A RC2 é liderada por Robson Azevedo, com mais de 20 anos em tecnologia e operações digitais.",
  facts: [
    {
      org: "Edenred",
      fact: "Coordenou operação de suporte e monitoramento 24×7 para 10 países da América Latina.",
    },
    {
      org: "Uno Healthcare",
      fact: "Estruturou um canal D2C nos Estados Unidos que gerou US$ 384 mil em receita e 636 pedidos em cerca de 11 meses, liderando uma equipe de 10 profissionais.",
    },
    {
      org: "Forta Tech",
      fact: "Trabalhou com Shopify, Tray, Totvs, logística, CRM e atendimento com IA.",
    },
  ],
  proofLabel: "Avaliações e Projetos",
} as const;

type Demo = {
  title: string;
  description: string;
  /** Só presente quando existe ativo navegável verificável. */
  ctaLabel?: string;
  href?: string;
  analyticsLabel?: string;
};

/** Seção 7 — demonstrações verificáveis (docs/12 §5.7). */
export const HOME_DEMOS: readonly Demo[] = [
  {
    title: "Zapbox, no ar",
    description:
      "O produto está publicado e pode ser conhecido agora, com suas próprias páginas de automação, CRM, integrações e Sales AI.",
    ctaLabel: "Conhecer Zapbox",
    href: "/zapbox",
    analyticsLabel: "conhecer_zapbox",
  },
  {
    title: "O agente de IA do nosso comercial",
    description:
      "A RC2 usa no próprio comercial o que implementa nos clientes: um agente de IA filtra, e quem conversa com você é o Robson.",
  },
];

/** Seção 8 — filosofia (docs/12 §5.8). */
export const HOME_PHILOSOPHY = {
  thesis: "A IA não substitui uma operação mal estruturada.",
  points: [
    "Tecnologia não corrige processo ruim sozinha.",
    "Automação precisa de processo definido antes de escalar.",
    "IA precisa de contexto, dados e governança.",
    "Integração reduz a dependência de pessoas como ponte entre sistemas.",
  ],
  closing:
    "A RC2 não entrega só ferramenta. Entrega processo funcionando no dia a dia da empresa.",
} as const;

/**
 * Tracking de um artigo da seção Conteúdo.
 *
 * Mantém a matriz aprovada em docs/13 num único lugar, para que o payload
 * emitido pelos cards seja testável sem renderizar a seção.
 */
export function homeArticleTracking(slug: string) {
  return {
    location: "home_content",
    label: slug,
    destination: `/blog/${slug}`,
  };
}
