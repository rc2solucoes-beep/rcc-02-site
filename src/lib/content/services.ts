export type Service = {
  slug: string;
  shortTitle: string;
  title: string;
  summary: string;
  description: string;
  items: string[];
  benefits: string[];
  cta: string;
  keywords: string;
};

export const services: Service[] = [
  {
    slug: "automacoes-com-ia",
    shortTitle: "Automações com IA",
    title: "Automações com IA para atendimento, vendas e operação",
    summary:
      "Automatize atendimentos, vendas e processos usando IA conectada aos canais e sistemas da sua empresa.",
    description:
      "Automatize o atendimento da sua empresa com inteligência artificial, sem perder o controle humano da operação. Criamos soluções para WhatsApp, site, formulários, CRM e canais digitais que ajudam sua empresa a responder clientes, qualificar leads, organizar demandas e vender com mais eficiência.",
    items: [
      "Atendimento automático com IA",
      "Chatbot para WhatsApp e site",
      "Qualificação de leads",
      "Respostas automáticas para dúvidas frequentes",
      "Captação e organização de contatos",
      "Encaminhamento para vendedores ou atendentes",
      "Fluxos de pré-venda e pós-venda",
      "Atendimento 24/7",
      "Relatórios de contatos, motivos de atendimento e oportunidades",
    ],
    benefits: [
      "Menos perda de leads",
      "Atendimento mais rápido",
      "Equipe menos sobrecarregada",
      "Mais organização no processo comercial",
      "Melhor experiência para o cliente",
      "Operação funcionando mesmo fora do horário comercial",
    ],
    cta: "Transforme seu atendimento em uma operação inteligente, automatizada e preparada para vender mais.",
    keywords: "automação de atendimento, chatbot IA, WhatsApp automatizado, qualificação de leads, atendimento 24/7, automação de vendas, contato automático, inteligência artificial para atendimento",
  },
  {
    slug: "agentes-de-ia",
    shortTitle: "Agentes de IA Internos",
    title: "Implantação de agentes de IA para processos internos",
    summary:
      "Crie assistentes inteligentes para apoiar sua equipe em consultas, relatórios, tarefas e tomada de decisão.",
    description:
      "Criamos agentes de IA para apoiar áreas internas da empresa em tarefas repetitivas, consultas, análises, relatórios e organização de informações. Esses agentes podem atuar como assistentes internos para equipes de vendas, atendimento, operação, financeiro, RH, marketing ou gestão.",
    items: [
      "Agente para consultar documentos internos",
      "Agente para responder dúvidas da equipe",
      "Agente para resumir reuniões, e-mails e relatórios",
      "Agente para gerar tarefas automaticamente",
      "Agente para apoiar atendimento ao cliente",
      "Agente para análise de chamados",
      "Agente para apoio comercial",
      "Agente para criação de propostas e mensagens",
      "Agente conectado a bases de conhecimento",
      "Agente integrado com sistemas, planilhas ou APIs",
    ],
    benefits: [
      "Ganho de produtividade",
      "Redução de tarefas manuais",
      "Padronização de respostas",
      "Menos dependência de pessoas específicas",
      "Informação acessível com mais rapidez",
      "Mais tempo para decisões estratégicas",
    ],
    cta: "Coloque a IA para trabalhar dentro da sua empresa, apoiando pessoas e acelerando processos.",
    keywords: "agentes de IA, assistentes inteligentes, automação interna, RPA, análise de dados, IA para empresas, automação de processos internos, agentes conversacionais",
  },
  {
    slug: "automacao-de-processos",
    shortTitle: "Integrações e n8n",
    title: "Automação de processos com n8n, APIs e integrações",
    summary:
      "Conecte ferramentas, sistemas, planilhas, CRM, ERP, e-mail e WhatsApp para reduzir trabalho manual.",
    description:
      "Muitas empresas perdem tempo todos os dias copiando informações entre sistemas, atualizando planilhas, enviando mensagens manuais e repetindo tarefas que poderiam ser automatizadas. A RC2 cria automações sob medida usando n8n, APIs e integrações entre ferramentas para conectar processos e reduzir retrabalho.",
    items: [
      "Integração entre formulários, CRM e planilhas",
      "Envio automático de e-mails e mensagens",
      "Criação automática de tarefas",
      "Atualização de dados entre sistemas",
      "Integração com WhatsApp",
      "Integração com ERP, CRM e e-commerce",
      "Alertas automáticos para equipe",
      "Geração de relatórios recorrentes",
      "Fluxos de aprovação",
      "Automações comerciais, operacionais e administrativas",
    ],
    benefits: [
      "Menos erro manual",
      "Menos retrabalho",
      "Mais velocidade na operação",
      "Sistemas conectados",
      "Processos mais organizados",
      "Equipe focada no que realmente importa",
    ],
    cta: "Se uma tarefa é repetitiva, provavelmente ela pode ser automatizada.",
    keywords: "n8n automação, integrações de sistemas, API automação, automação de dados, integrações CRM, automação de processos, fluxos automatizados, zapier alternativa",
  },
  {
    slug: "e-commerce",
    shortTitle: "E-commerce",
    title: "Implantação e estruturação de e-commerce",
    summary:
      "Implante ou organize sua loja virtual com plataforma, ERP, logística, pagamento, dados e operação.",
    description:
      "A RC2 ajuda empresas a venderem pela internet com estrutura, tecnologia e processos bem definidos. Implantamos lojas virtuais e canais D2C conectando plataforma, ERP, logística, meios de pagamento, atendimento, dados e marketing.",
    items: [
      "Loja virtual em Shopify, Tray, WooCommerce ou outra plataforma",
      "Integração com ERP",
      "Integração com frete e logística",
      "Configuração de meios de pagamento",
      "Cadastro e organização de produtos",
      "Estrutura de checkout",
      "Integração com WhatsApp e atendimento",
      "Configuração de pixels, GA4 e eventos",
      "Relatórios de vendas e performance",
      "Treinamento da equipe",
    ],
    benefits: [
      "Entrada estruturada no digital",
      "Operação mais profissional",
      "Mais controle sobre vendas e pedidos",
      "Melhor experiência de compra",
      "Integração entre áreas",
      "Base preparada para campanhas e crescimento",
    ],
    cta: "Não criamos apenas lojas virtuais. Estruturamos operações digitais para vender com consistência.",
    keywords: "e-commerce, loja virtual, Shopify, WooCommerce, plataforma de vendas, integração ERP, automação logística, pagamento online, D2C, operação digital",
  },
  {
    slug: "sites-e-landing-pages",
    shortTitle: "Sites Inteligentes",
    title: "Modernização de sites, landing pages e interfaces com IA",
    summary:
      "Crie sites e landing pages conectados a IA, automações, formulários, WhatsApp e geração de leads.",
    description:
      "Criamos e modernizamos sites, landing pages e interfaces digitais com foco em clareza, conversão, tecnologia e integração com ferramentas de IA e automação. Seu site precisa ser mais do que uma vitrine. Ele precisa captar leads, explicar sua oferta, integrar com canais de atendimento e gerar oportunidades.",
    items: [
      "Site institucional",
      "Landing page de vendas",
      "Página para captação de leads",
      "Página para campanhas de tráfego pago",
      "Reformulação de sites antigos",
      "Integração com WhatsApp",
      "Integração com CRM",
      "Formulários inteligentes",
      "Chatbot ou agente de IA no site",
      "Dashboards ou interfaces simples para operação",
    ],
    benefits: [
      "Presença digital mais profissional",
      "Mais geração de leads",
      "Melhor apresentação da empresa",
      "Páginas integradas com automações",
      "Mais clareza na comunicação",
      "Base pronta para campanhas",
    ],
    cta: "Transforme seu site em um canal ativo de vendas, atendimento e relacionamento.",
    keywords: "desenvolvimento de sites, landing pages, captação de leads, site inteligente, chatbot website, formulários dinâmicos, integração WhatsApp site, conversão de visitantes",
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
