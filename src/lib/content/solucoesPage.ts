/**
 * Conteúdo estrutural de `/solucoes` — a página comercial central da RC2.
 *
 * Copy fechada em `docs/14-fase-5-solucoes-design.md` §5 e transcrita
 * literalmente em `docs/15` §2. O módulo existe para que o contrato de copy,
 * âncoras e analytics seja testável sem renderizar RSC.
 *
 * Não confundir com `src/lib/content/solutions.ts`, que descreve as cinco
 * páginas legadas por dor e continua servindo `/solucoes/[slug]`.
 */

type Cta = {
  label: string;
  href: string;
  analyticsLabel: string;
  /** O hero não tem CTA secundário — docs/14 §5.1. */
  secondary?: undefined;
};

type Competency = {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  signals: readonly string[];
  interventions: readonly string[];
  /** Limite factual da competência: o que a RC2 não promete. */
  limit?: string;
  /** Fronteira de território — hoje, só o Zapbox em IA para Operações. */
  boundary?: string;
  analyticsLabel: string;
};

type MethodLevel = {
  name: string;
  description: string;
};

export const SOLUCOES_COPY = {
  eyebrow: "Soluções RC2",
  h1: "Automação, integrações e IA aplicadas à sua operação.",
  subheadline:
    "A RC2 atua em quatro frentes conectadas para que processos e sistemas acompanhem o tamanho da operação — da automação de tarefas à integração entre plataformas, ERP e dados.",
} as const;

export const SOLUCOES_CTAS = {
  hero: {
    label: "Falar sobre minha operação",
    href: "/contato",
    analyticsLabel: "falar_sobre_minha_operacao",
  } as Cta,
  final: {
    label: "Falar sobre minha operação",
    href: "/contato",
    analyticsLabel: "falar_sobre_minha_operacao",
    title: "Qual processo da sua operação ainda depende de alguém lembrar?",
    description:
      "Comece por uma conversa de 20 a 30 minutos, sem compromisso, para entender o cenário e definir o próximo passo.",
  },
} as const;

export const SOLUCOES_ORIENTATION = {
  title: "Você não precisa chegar sabendo qual ferramenta quer",
  lead: "Basta reconhecer o problema da operação. O caminho técnico é definido depois, junto.",
  items: [
    {
      symptom: "A equipe repete a mesma tarefa todo dia",
      href: "#automacao-de-processos",
      competency: "Automação de Processos",
      analyticsLabel: "automacao_de_processos",
    },
    {
      symptom: "Os sistemas não conversam e alguém faz a ponte",
      href: "#integracao-de-sistemas",
      competency: "Integração de Sistemas",
      analyticsLabel: "integracao_de_sistemas",
    },
    {
      symptom: "Quero usar IA, mas o processo não está estruturado",
      href: "#ia-para-operacoes",
      competency: "IA para Operações",
      analyticsLabel: "ia_para_operacoes",
    },
    {
      symptom: "A operação digital cresceu em partes desconectadas",
      href: "#operacoes-digitais-commerce",
      competency: "Operações Digitais & Commerce",
      analyticsLabel: "operacoes_digitais_commerce",
    },
  ],
} as const;

export const SOLUCOES_COMPETENCIES: readonly Competency[] = [
  {
    id: "automacao-de-processos",
    eyebrow: "Competência 01",
    title: "Automação de Processos",
    lead: "O processo existe e a equipe sabe executá-lo. O problema é que ele roda no braço, depende de quem lembra da regra e não deixa registro do que aconteceu.",
    signals: [
      "A mesma tarefa é refeita todo dia, na mão, por várias pessoas.",
      "Dados são copiados de um sistema e colados em outro.",
      "Uma planilha virou o sistema de controle de uma área inteira.",
      "A regra de negócio está na cabeça de uma pessoa, não no processo.",
      "Ninguém consegue dizer com precisão o que foi executado e quando.",
    ],
    interventions: [
      "Mapeamento do fluxo real — como ele acontece hoje, não como está no manual.",
      "Automação das etapas repetitivas, com as regras de negócio explícitas.",
      "Tratamento de exceções: o que o fluxo faz quando o caso não é o padrão.",
      "Registro do que foi executado, para a operação ter rastreabilidade.",
    ],
    limit:
      "O ganho depende do processo e é medido depois da implantação. A RC2 não trabalha com percentual prometido antes de conhecer o fluxo.",
    analyticsLabel: "automacao_de_processos",
  },
  {
    id: "integracao-de-sistemas",
    eyebrow: "Competência 02",
    title: "Integração de Sistemas",
    lead: "Cada sistema resolve bem o seu pedaço, mas eles não conversam. A ponte entre eles acaba sendo uma pessoa, digitando duas vezes a mesma informação.",
    signals: [
      "O mesmo cadastro é digitado em mais de um sistema.",
      "O ERP e a plataforma de vendas discordam sobre o mesmo pedido.",
      "Alguém exporta uma planilha de um sistema para importar em outro.",
      "O dado existe, mas não chega a tempo em quem precisa dele.",
      "Cada área tem a sua própria versão do mesmo número.",
    ],
    interventions: [
      "Integração entre ERP, CRM, plataformas e sistemas internos por API ou webhook.",
      "Definição de qual sistema é a fonte da verdade para cada dado.",
      "Sincronização com tratamento de erro, reprocessamento e log.",
      "Conexão de ferramentas que não têm integração nativa entre si.",
    ],
    limit:
      "Integração é competência própria, não um detalhe da automação: decidir como o dado circula entre sistemas é decisão de arquitetura.",
    analyticsLabel: "integracao_de_sistemas",
  },
  {
    id: "ia-para-operacoes",
    eyebrow: "Competência 03",
    title: "IA para Operações",
    lead: "IA aplicada sobre processo estruturado resolve. Aplicada sobre processo indefinido, ela apenas automatiza a confusão mais rápido.",
    signals: [
      "Há interesse em usar IA, mas o processo ainda não está descrito.",
      "Documentos e mensagens chegam em volume e alguém lê tudo na mão.",
      "Informação é classificada e encaminhada manualmente, caso a caso.",
      "A equipe repete consultas às mesmas fontes para responder perguntas internas.",
    ],
    interventions: [
      "Agentes de IA aplicados a etapas específicas de um processo definido.",
      "Classificação e triagem de informação com critérios explícitos.",
      "Leitura e interpretação de documentos e mensagens para alimentar o fluxo.",
      "Apoio operacional interno: consulta às bases da empresa com contexto controlado.",
      "Governança: o que o agente pode fazer, com quais dados e até qual limite.",
      "Handoff humano definido — quando o caso sai do agente e vai para uma pessoa.",
    ],
    boundary:
      "Atendimento e vendas pelo WhatsApp, equipe de atendimento, CRM comercial e Sales AI são território do Zapbox, produto da própria RC2. Não é o que esta competência cobre.",
    analyticsLabel: "ia_para_operacoes",
  },
  {
    id: "operacoes-digitais-commerce",
    eyebrow: "Competência 04",
    title: "Operações Digitais & Commerce",
    lead: "A operação digital cresceu em partes: a loja veio primeiro, depois o ERP, depois a logística, depois o atendimento ao pedido. Cada uma resolvida isoladamente.",
    signals: [
      "O estoque da loja não reflete o estoque real.",
      "O pedido é criado na plataforma e recriado no ERP.",
      "Status de pagamento e de entrega vivem em telas diferentes.",
      "Cada canal de venda tem o seu próprio processo paralelo.",
    ],
    interventions: [
      "Integração entre plataforma, ERP, logística, meios de pagamento e estoque.",
      "Fluxo de pedido único, do checkout à entrega, com status consistente.",
      "Automação das rotinas que hoje dependem de conferência manual.",
      "Consolidação dos dados da operação em uma visão só.",
    ],
    limit:
      "A RC2 não se posiciona como fábrica de lojas virtuais. Loja, site e interface podem fazer parte de um projeto; o trabalho é a operação digital integrada.",
    analyticsLabel: "operacoes_digitais_commerce",
  },
];

export const SOLUCOES_METHOD = {
  title: "Como a RC2 trabalha",
  lead: "Da primeira conversa à continuidade técnica, sem etapa obrigatória que a operação não precise.",
  levels: [
    {
      name: "Conversa inicial",
      description:
        "Uma conversa de 20 a 30 minutos, sem compromisso, para entender o cenário, o problema e se há aderência.",
    },
    {
      name: "Discovery Operacional",
      description:
        "Quando há incerteza estrutural, o passo seguinte é o Discovery Operacional — uma etapa paga, com levantamento, arquitetura, riscos, prioridades e roadmap.",
    },
    {
      name: "Implantação",
      description:
        "A construção das automações e integrações, com a operação acompanhando cada entrega.",
    },
    {
      name: "Operação Gerenciada",
      description:
        "Depois da implantação, o acompanhamento técnico contínuo do que já está rodando.",
    },
  ] as readonly MethodLevel[],
} as const;

/** Contrato público de âncoras — docs/14 §6. Estável entre fases. */
export const SOLUCOES_ANCHORS = [
  "automacao-de-processos",
  "integracao-de-sistemas",
  "ia-para-operacoes",
  "operacoes-digitais-commerce",
  "operacao-gerenciada",
] as const;

export const SOLUCOES_METADATA = {
  title: "Soluções — Automação, Integrações e IA para Operações",
  description:
    "Automação de processos, integração de sistemas, IA para operações e operações digitais & commerce. As quatro competências da RC2 para a operação da sua empresa funcionar melhor.",
  ogDescription:
    "As quatro competências da RC2: automação de processos, integração de sistemas, IA para operações e operações digitais & commerce.",
} as const;
