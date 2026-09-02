/**
 * Conteúdo da ponte RC2 → Zapbox (`/zapbox`).
 *
 * Decisões autoritativas: `docs/19-fase-6-zapbox-handoff-decision.md`
 * (CD-1 = BRIDGE_FIRST, CD-3 = CHANNEL_AND_OBJECT). Copy fechada em
 * `docs/20` §3 e transcrita aqui literalmente.
 *
 * A ponte **roteia**; não vende. Sem preços, sem lista completa de recursos,
 * sem captura de tela do produto e sem formulário — isso vive em
 * `www.zapbox.cloud`.
 *
 * Todo destino externo usa o canonical **com `www`**: o apex
 * `zapbox.cloud` responde 308 e custaria um salto extra.
 */

type TerritoryBlock = {
  title: string;
  lead: string;
  items: readonly string[];
};

type ExternalRoute = {
  intent: string;
  href: string;
  analyticsLabel: string;
};

type InternalLink = {
  label: string;
  href: string;
  analyticsLabel: string;
};

type Cta = {
  label: string;
  href: string;
  analyticsLabel: string;
  /** A ponte tem um único botão — docs/20 §4.1 (NO_SECONDARY_CTA). */
  secondary?: undefined;
};

/** Domínio canônico do produto. O apex redireciona; nunca usar o apex. */
const ZAPBOX_ORIGIN = "https://www.zapbox.cloud";

export const ZAPBOX_BRIDGE_COPY = {
  eyebrow: "Produto próprio",
  h1: "Quando o problema é o WhatsApp, a resposta da RC2 chama-se Zapbox.",
  subheadline:
    "O Zapbox é o produto da RC2 para atendimento e vendas pelo WhatsApp — equipe no mesmo número, histórico, CRM comercial e Sales AI. Esta página explica o que pertence a ele, o que continua sendo trabalho da RC2 e para onde ir a partir daqui.",
} as const;

export const ZAPBOX_BRIDGE_BRAND = {
  eyebrow: "A relação",
  title: "Zapbox é um produto da RC2 Soluções",
  paragraphs: [
    "O Zapbox é desenvolvido e mantido pela RC2. É a mesma equipe, a mesma forma de trabalhar e o mesmo canal de contato — o produto apenas tem site e ambiente próprios, porque tem operação própria.",
    "Quando a necessidade é atendimento ou vendas pelo WhatsApp, a RC2 não monta uma solução sob medida: encaminha para o produto que já resolve isso.",
  ],
} as const;

export const ZAPBOX_TERRITORY: TerritoryBlock = {
  title: "Quando o Zapbox é a solução adequada",
  lead: "Se o objeto do problema é uma conversa, um lead ou uma venda, o lugar é o Zapbox.",
  items: [
    "Vários atendentes trabalhando no mesmo número, com histórico e responsável por conversa.",
    "Leads que chegam pelo WhatsApp organizados em pipeline comercial.",
    "CRM ligado ao atendimento, em vez de planilha paralela.",
    "Sales AI que atende, qualifica e passa para uma pessoa quando o caso exige.",
    "Automações dentro do próprio fluxo de atendimento e vendas.",
  ],
};

/** Roteamento por intenção — três destinos, não um catálogo de recursos. */
export const ZAPBOX_BRIDGE_ROUTES: readonly ExternalRoute[] = [
  {
    intent: "Atendimento e qualificação com IA",
    href: `${ZAPBOX_ORIGIN}/sales-ai`,
    analyticsLabel: "sales_ai",
  },
  {
    intent: "Leads, pipeline e CRM comercial",
    href: `${ZAPBOX_ORIGIN}/crm-vendas`,
    analyticsLabel: "crm_vendas",
  },
  {
    intent: "Automações no fluxo de atendimento",
    href: `${ZAPBOX_ORIGIN}/automacoes`,
    analyticsLabel: "automacoes",
  },
];

export const RC2_TERRITORY: TerritoryBlock = {
  title: "Quando o trabalho continua sendo da RC2",
  lead: "Se o objeto do problema é um processo, um sistema ou um dado, o Zapbox não resolve — e não deveria.",
  items: [
    "O processo roda no braço e depende de quem lembra da regra.",
    "Os sistemas não conversam e alguém faz a ponte digitando duas vezes.",
    "Há interesse em IA, mas sobre processo interno, não sobre conversa com cliente.",
    "A operação digital cresceu em partes: plataforma, ERP, logística e dados separados.",
    "O que já foi implantado precisa de acompanhamento técnico contínuo.",
  ],
};

export const ZAPBOX_SHARED_BOUNDARY = {
  title: "Quando o Zapbox precisa conversar com os outros sistemas",
  paragraphs: [
    "O Zapbox opera o atendimento e o funil comercial. Os pedidos, cadastros e dados que nascem ali normalmente precisam chegar ao ERP, ao financeiro ou às demais ferramentas da operação.",
    "Essa ligação entre plataformas é trabalho de integração — e é aí que a RC2 entra, quando contratada para isso. O fluxo entre os sistemas é da RC2; o atendimento que roda dentro do Zapbox continua sendo do produto, operado pela sua equipe.",
  ],
} as const;

export const ZAPBOX_BRIDGE_INTERNAL_LINKS: readonly InternalLink[] = [
  {
    label: "Ver as competências da RC2",
    href: "/solucoes",
    analyticsLabel: "ver_solucoes",
  },
  {
    label: "Ver Integração de Sistemas",
    href: "/solucoes#integracao-de-sistemas",
    analyticsLabel: "integracao_de_sistemas",
  },
];

export const ZAPBOX_BRIDGE_CTA: Cta = {
  label: "Ir para o Zapbox",
  href: `${ZAPBOX_ORIGIN}/`,
  analyticsLabel: "ir_para_zapbox",
};

export const ZAPBOX_BRIDGE_CLOSING = {
  title: "O Zapbox fica em outro endereço",
  paragraph:
    "O produto tem site próprio, com detalhes de cada recurso.",
} as const;

export const ZAPBOX_BRIDGE_METADATA = {
  title: "Zapbox — o produto da RC2 para WhatsApp, atendimento e vendas",
  description:
    "O Zapbox é o produto próprio da RC2 para atendimento e vendas pelo WhatsApp. Entenda o que pertence ao produto, o que continua sendo trabalho de automação e integração da RC2, e como os dois se conectam.",
  ogDescription:
    "O produto da RC2 para WhatsApp, atendimento e vendas — e onde termina o território dele.",
} as const;

/** Location única de analytics desta superfície — docs/20 §13. */
export const ZAPBOX_BRIDGE_LOCATION = "zapbox_bridge" as const;
