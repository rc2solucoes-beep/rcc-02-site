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
    // §4: a frase "é o produto da RC2 para esse território — e é onde essas
    // necessidades devem ser resolvidas" era arquitetura de marca falando com
    // ela mesma. O leitor quer saber o que o produto faz.
    tagline: "Atendimento e vendas pelo WhatsApp",
    description:
      "Organize sua equipe, centralize conversas e histórico e evolua sua operação com CRM, automações e Sales AI.",
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
    tagline: "Automação de agenda para clínicas",
    // §5: a redução de faltas saiu da promessa. Reduzir esquecimento é efeito
    // esperado, não resultado garantido — e não há métrica documentada.
    description:
      "Automatize lembretes e confirmações pelo WhatsApp, reduza o trabalho manual da recepção e ganhe mais previsibilidade sobre sua agenda.",
    // CTA aprovado no AGENTS.md. `docs/18` §13.2 previa que ele "só volta a
    // ser aplicável quando houver o que ver" — a página existe desde a Fase 6.
    ctaLabel: "Ver Agenda Confirmada",
    href: "/solucoes/agenda-confirmada",
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

/**
 * Números do case Uno Healthcare para o componente Stat/Counter (§8, §9).
 *
 * São os mesmos já publicados em `HOME_AUTHORITY.facts` — nenhum número novo,
 * nenhum arredondamento. A fonte é a seção 16 da `RC2_PROPOSTA_ATUALIZACAO`.
 */
export const HOME_AUTHORITY_STATS = [
  {
    value: 384,
    prefix: "US$ ",
    suffix: " mil",
    label: "Receita gerada pelo canal D2C nos Estados Unidos, em cerca de 11 meses",
  },
  {
    value: 636,
    label: "Pedidos processados no mesmo período",
  },
  {
    value: 20,
    suffix: "+",
    label: "Anos em tecnologia e operações digitais",
  },
] as const;

/**
 * Gesto cinético do hero (direção de arte §12).
 *
 * `word` é a palavra da copy aprovada (`HOME_COPY.h1`) e é onde a sequência
 * começa e termina. `alternates` são as palavras que passam antes disso —
 * **aprovadas em 03/09/2026**, fechando a decisão de copy que a §12 deixava em
 * aberto.
 *
 * `prefix` e `suffix` são derivados do H1 aprovado em tempo de execução, para
 * que a frase renderizada não possa divergir dele.
 */
export const HOME_HERO_KINETIC = {
  word: "ferramentas",
  alternates: ["sistemas", "planilhas"],
  copyApproved: true,
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

/**
 * Canal próprio da Valéria — não é o WhatsApp comercial geral do site
 * (`5511988028550`), que atende outro fluxo. Confirmado em 03/09/2026.
 */
const VALERIA_WHATSAPP_URL =
  "https://wa.me/5511966958192?text=" +
  encodeURIComponent("Olá, Valéria. Quero conhecer o que a RC2 faz.");

type Demo = {
  title: string;
  description: string;
  /** Só presente quando existe ativo navegável verificável. */
  ctaLabel?: string;
  href?: string;
  /** Sai do domínio: exige `target`, `rel` e ícone de saída no render. */
  external?: boolean;
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
    // §11: a demonstração deixa de ser descrita por dentro ("o agente do nosso
    // comercial") e passa a ser apresentada pelo nome, como qualquer coisa que
    // se pode experimentar.
    title: "Converse com a Valéria",
    description:
      "A Valéria é a assistente comercial com IA que faz o primeiro atendimento da RC2 e do Zapbox pelo WhatsApp. Ela responde dúvidas, apresenta planos, qualifica interesse e transfere para uma pessoa quando necessário. Você não precisa imaginar como funciona: é só chamar e conversar com ela.",
    ctaLabel: "Conversar com a Valéria",
    href: VALERIA_WHATSAPP_URL,
    external: true,
    analyticsLabel: "conversar_valeria",
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
