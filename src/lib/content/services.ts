export type ServiceFaq = {
  question: string;
  answer: string;
};

export type ServiceRelatedLink = {
  label: string;
  href: string;
};

export type Service = {
  slug: string;
  shortTitle: string;
  title: string;
  seoTitle: string;
  summary: string;
  description: string;
  items: string[];
  benefits: string[];
  cta: string;
  keywords: string;
  painPoints: string[];
  useCases: string[];
  implementationSteps: string[];
  integrations: string[];
  metrics: string[];
  faq: ServiceFaq[];
  relatedLinks: ServiceRelatedLink[];
};

export const services: Service[] = [
  {
    slug: "automacoes-com-ia",
    shortTitle: "Automações com IA",
    title: "Automações com IA para atendimento, vendas e operação",
    seoTitle: "Automação de Atendimento com IA para WhatsApp e Vendas",
    summary:
      "Automatize atendimentos, vendas e processos usando IA conectada aos canais e sistemas da sua empresa.",
    description:
      "Para empresas com atendimento sobrecarregado e leads sem resposta, implementamos IA com processo claro e controle humano. Conectamos WhatsApp, site, formulários e CRM para responder clientes mais rápido, qualificar contatos e organizar a operação comercial.",
    items: [
      "Atendimento automático com IA",
      "Agente de IA para WhatsApp e site",
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
    keywords:
      "automação de atendimento, agente de IA para atendimento, WhatsApp automatizado, qualificação de leads, atendimento 24/7, automação de vendas, contato automático, inteligência artificial para atendimento",
    painPoints: [
      "Clientes ficam sem resposta fora do horário comercial.",
      "Leads chegam pelo WhatsApp, site ou formulário e se perdem no processo.",
      "A equipe responde perguntas repetidas todos os dias.",
      "Não existe triagem clara entre dúvida simples, lead qualificado e atendimento humano.",
      "Gestores não conseguem medir motivos de contato, tempo de resposta e oportunidades perdidas.",
    ],
    useCases: [
      "Atendimento automático inicial no WhatsApp.",
      "Qualificação de leads antes do envio ao vendedor.",
      "Respostas automáticas para dúvidas frequentes.",
      "Triagem de solicitações por tipo de demanda.",
      "Encaminhamento inteligente para atendimento humano.",
      "Fluxos de pré-venda, pós-venda e reativação.",
      "Coleta estruturada de dados do cliente durante a conversa.",
    ],
    implementationSteps: [
      "Mapeamento dos principais motivos de contato e perguntas frequentes.",
      "Definição dos fluxos de atendimento, qualificação e encaminhamento para humano.",
      "Configuração da base de conhecimento e das regras de resposta.",
      "Integração com canais como WhatsApp, site, formulários, CRM ou planilhas.",
      "Testes com cenários reais de atendimento.",
      "Publicação assistida e monitoramento dos primeiros atendimentos.",
      "Ajustes contínuos com base nos dados da operação.",
    ],
    integrations: [
      "WhatsApp",
      "Site institucional",
      "Formulários",
      "CRM",
      "Planilhas",
      "E-mail",
      "ERP",
      "n8n",
      "APIs internas ou externas",
    ],
    metrics: [
      "Tempo médio de primeira resposta",
      "Volume de atendimentos automatizados",
      "Leads qualificados",
      "Taxa de encaminhamento para humano",
      "Motivos de contato mais frequentes",
      "Conversões originadas no atendimento",
      "Atendimentos fora do horário comercial",
    ],
    faq: [
      {
        question: "O que é automação de atendimento com IA?",
        answer:
          "É o uso de inteligência artificial e fluxos automatizados para responder clientes, qualificar leads, organizar solicitações e encaminhar casos para atendimento humano quando necessário.",
      },
      {
        question: "A IA substitui minha equipe de atendimento?",
        answer:
          "Não necessariamente. Para PMEs, o modelo mais seguro costuma ser híbrido: a IA resolve dúvidas simples, coleta dados e qualifica contatos, enquanto a equipe humana assume casos comerciais ou complexos.",
      },
      {
        question: "É possível integrar a automação com WhatsApp e CRM?",
        answer:
          "Sim. A automação pode conectar WhatsApp, formulários, CRM, planilhas, ERP, e-mail e outras ferramentas via APIs, webhooks ou plataformas como n8n.",
      },
      {
        question: "Como evitar respostas erradas da IA?",
        answer:
          "A implantação deve combinar base de conhecimento controlada, regras de escopo, fallback para humano, testes com cenários reais e monitoramento contínuo das conversas.",
      },
      {
        question: "Quanto tempo leva para implantar?",
        answer:
          "Depende do número de canais, integrações e regras de atendimento. O ideal é começar com um fluxo enxuto, validar os principais casos e expandir depois.",
      },
    ],
    relatedLinks: [
      { label: "Soluções com IA", href: "/solucoes-com-ia" },
      { label: "Automação de processos com n8n", href: "/solucoes#automacao-de-processos" },
      { label: "Contato", href: "/contato" },
    ],
  },
  {
    slug: "agentes-de-ia",
    shortTitle: "IA para equipe interna",
    title: "IA para equipe interna e processos do dia a dia",
    seoTitle: "Agentes de IA para Empresas e Processos Internos",
    summary:
      "Use IA para responder dúvidas internas, resumir informações e reduzir tarefas administrativas da equipe.",
    description:
      "Quando a equipe perde tempo buscando informação ou montando relatórios manuais, a IA pode ajudar com segurança. Criamos assistentes internos para vendas, atendimento, operação, financeiro, RH, marketing e gestão, conectados às fontes de dados da empresa.",
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
    keywords:
      "agentes de IA, assistentes inteligentes, automação interna, RPA, análise de dados, IA para empresas, automação de processos internos, agentes conversacionais",
    painPoints: [
      "Informações importantes ficam espalhadas em documentos, planilhas, sistemas e conversas.",
      "A equipe perde tempo procurando respostas operacionais simples.",
      "Gestores dependem de pessoas específicas para acessar conhecimento interno.",
      "Relatórios, resumos e análises são produzidos manualmente.",
      "Processos internos não têm apoio automatizado para consulta e tomada de decisão.",
    ],
    useCases: [
      "Assistente interno para consultar documentos e procedimentos.",
      "Agente para responder dúvidas da equipe.",
      "Agente para resumir reuniões, e-mails e relatórios.",
      "Agente para apoiar vendedores com propostas e mensagens.",
      "Agente para analisar chamados e classificar demandas.",
      "Agente conectado a planilhas, bases de conhecimento ou APIs.",
      "Agente para apoiar gestão com informações operacionais.",
    ],
    implementationSteps: [
      "Definição do objetivo do agente e do público interno que irá utilizá-lo.",
      "Mapeamento das fontes de informação e regras de acesso.",
      "Organização da base de conhecimento ou dos dados conectados.",
      "Configuração das instruções, limites e comportamento esperado.",
      "Integração com ferramentas, documentos, planilhas ou sistemas.",
      "Teste com perguntas reais da equipe.",
      "Ajustes de segurança, precisão e governança de uso.",
    ],
    integrations: [
      "Google Drive",
      "Notion",
      "Planilhas",
      "CRM",
      "ERP",
      "E-mail",
      "Slack",
      "Microsoft Teams",
      "n8n",
      "APIs",
      "Bases de conhecimento",
    ],
    metrics: [
      "Tempo economizado em consultas internas",
      "Volume de perguntas respondidas",
      "Taxa de resolução sem intervenção humana",
      "Principais dúvidas da equipe",
      "Uso por área ou equipe",
      "Redução de tarefas manuais",
      "Tempo de geração de relatórios ou resumos",
    ],
    faq: [
      {
        question: "O que é um agente de IA interno?",
        answer:
          "É um assistente inteligente configurado para apoiar equipes em consultas, análises, tarefas, resumos e tomada de decisão, usando informações e regras da própria empresa.",
      },
      {
        question: "Um agente de IA pode acessar documentos da empresa?",
        answer:
          "Sim, desde que a integração seja configurada com controle de acesso, escopo definido e fontes confiáveis. O agente deve responder com base nas informações autorizadas.",
      },
      {
        question: "Qual a diferença entre chatbot e agente de IA?",
        answer:
          "Um chatbot normalmente segue fluxos mais fixos. Um agente de IA pode interpretar contexto, consultar fontes, executar tarefas e apoiar processos mais flexíveis.",
      },
      {
        question: "É seguro usar agentes de IA com dados internos?",
        answer:
          "Pode ser seguro quando há governança, controle de permissões, definição de escopo, registro de uso e cuidado com dados sensíveis.",
      },
      {
        question: "Por onde começar?",
        answer:
          "O ideal é começar com um caso de uso específico, como consulta a documentos, apoio comercial, análise de chamados ou geração de relatórios.",
      },
    ],
    relatedLinks: [
      { label: "Automações com IA", href: "/servicos/automacoes-com-ia" },
      { label: "Soluções com IA", href: "/solucoes-com-ia" },
      { label: "Contato", href: "/contato" },
    ],
  },
  {
    slug: "automacao-de-processos",
    shortTitle: "Integração de sistemas",
    title: "Automação para conectar sistemas e reduzir retrabalho",
    seoTitle: "Automação de Processos com n8n, APIs e Integrações",
    summary:
      "Conecte ferramentas, planilhas e sistemas para reduzir digitação manual e retrabalho na operação.",
    description:
      "Se sua equipe copia dados entre planilhas, CRM, ERP e WhatsApp, existe espaço para ganhar eficiência rápida. A RC2 cria automações com n8n, APIs e integrações para conectar processos e reduzir erros manuais.",
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
    keywords:
      "n8n automação, integrações de sistemas, API automação, automação de dados, integrações CRM, automação de processos, fluxos automatizados, zapier alternativa",
    painPoints: [
      "A equipe copia dados manualmente entre sistemas.",
      "Planilhas, CRM, ERP e canais de atendimento não conversam entre si.",
      "Tarefas repetitivas consomem tempo operacional todos os dias.",
      "Erros manuais geram retrabalho, atraso e perda de informação.",
      "Gestores não têm visibilidade clara sobre etapas e gargalos do processo.",
    ],
    useCases: [
      "Integração entre formulários, CRM e planilhas.",
      "Envio automático de e-mails e mensagens.",
      "Criação automática de tarefas e alertas.",
      "Atualização de dados entre sistemas.",
      "Geração de relatórios recorrentes.",
      "Fluxos de aprovação internos.",
      "Integração entre e-commerce, ERP, atendimento e financeiro.",
    ],
    implementationSteps: [
      "Mapeamento do processo atual e das tarefas repetitivas.",
      "Identificação dos sistemas, APIs e pontos de entrada de dados.",
      "Definição do fluxo ideal e das regras de negócio.",
      "Construção dos workflows em n8n ou ferramenta adequada.",
      "Configuração de autenticações, webhooks e tratamentos de erro.",
      "Testes com dados reais e cenários de exceção.",
      "Monitoramento inicial e documentação do fluxo.",
    ],
    integrations: [
      "n8n",
      "APIs REST",
      "Webhooks",
      "Google Sheets",
      "CRM",
      "ERP",
      "WhatsApp",
      "E-mail",
      "Formulários",
      "E-commerce",
      "Banco de dados",
      "Ferramentas internas",
    ],
    metrics: [
      "Horas manuais economizadas",
      "Volume de tarefas automatizadas",
      "Redução de erros operacionais",
      "Tempo de execução do processo",
      "Falhas ou exceções por workflow",
      "Quantidade de integrações ativas",
      "Processos monitorados em tempo real",
    ],
    faq: [
      {
        question: "O que é automação de processos com n8n?",
        answer:
          "É a criação de fluxos automatizados que conectam sistemas, APIs, planilhas, CRM, ERP, e-mail e canais digitais para reduzir tarefas manuais e retrabalho.",
      },
      {
        question: "Que tipos de processos podem ser automatizados?",
        answer:
          "Processos comerciais, administrativos, financeiros, operacionais, atendimento, relatórios, atualização de dados, alertas e integrações entre sistemas.",
      },
      {
        question: "Preciso trocar meus sistemas atuais?",
        answer:
          "Na maioria dos casos, não. A automação pode conectar as ferramentas que a empresa já usa, desde que existam APIs, webhooks, exportações ou formas seguras de integração.",
      },
      {
        question: "n8n é melhor que Zapier ou Make?",
        answer:
          "Depende do contexto. O n8n costuma ser forte quando a empresa precisa de mais controle, lógica personalizada, self-hosting ou integrações técnicas mais flexíveis.",
      },
      {
        question: "Como evitar que uma automação quebre a operação?",
        answer:
          "É necessário tratar erros, registrar execuções, validar dados, criar alertas, documentar fluxos e testar cenários antes da publicação.",
      },
    ],
    relatedLinks: [
      { label: "Automações com IA", href: "/servicos/automacoes-com-ia" },
      { label: "E-commerce", href: "/servicos/e-commerce" },
      { label: "Contato", href: "/contato" },
    ],
  },
  {
    slug: "e-commerce",
    shortTitle: "E-commerce",
    title: "Implantação e estruturação de e-commerce",
    seoTitle: "Consultoria e Implantação de E-commerce para PMEs",
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
    keywords:
      "e-commerce, loja virtual, Shopify, WooCommerce, plataforma de vendas, integração ERP, automação logística, pagamento online, D2C, operação digital",
    painPoints: [
      "A empresa quer vender online, mas não sabe qual plataforma escolher.",
      "Pedidos, estoque, pagamento, frete e atendimento funcionam de forma desconectada.",
      "A loja virtual existe, mas a operação é manual e pouco escalável.",
      "Cadastro de produtos, checkout, logística e dados não estão bem estruturados.",
      "Campanhas de marketing não têm base técnica confiável para medir resultado.",
    ],
    useCases: [
      "Implantação de loja virtual em Shopify, Tray, WooCommerce ou outra plataforma.",
      "Organização de catálogo, categorias e cadastro de produtos.",
      "Integração com ERP, logística, pagamento e atendimento.",
      "Configuração de pixels, GA4, eventos e dados de conversão.",
      "Estruturação de operação D2C.",
      "Melhoria de checkout, navegação e experiência de compra.",
      "Treinamento da equipe para operar a loja.",
    ],
    implementationSteps: [
      "Diagnóstico da operação atual e dos objetivos comerciais.",
      "Definição da plataforma e arquitetura da operação.",
      "Planejamento de catálogo, categorias, frete, pagamento e integrações.",
      "Configuração da loja, checkout, meios de pagamento e logística.",
      "Integração com ERP, atendimento, dados e marketing.",
      "Testes de compra, pedido, pagamento, frete e comunicação.",
      "Treinamento da equipe e acompanhamento inicial da operação.",
    ],
    integrations: [
      "Shopify",
      "Tray",
      "WooCommerce",
      "ERP",
      "Gateways de pagamento",
      "Correios",
      "Transportadoras",
      "WhatsApp",
      "CRM",
      "GA4",
      "Google Tag Manager",
      "Meta Pixel",
      "Google Ads",
    ],
    metrics: [
      "Taxa de conversão",
      "Receita por canal",
      "Pedidos gerados",
      "Abandono de carrinho",
      "Ticket médio",
      "Custo por aquisição",
      "Tempo de processamento de pedido",
      "Performance de produtos e categorias",
    ],
    faq: [
      {
        question: "Qual plataforma de e-commerce escolher?",
        answer:
          "A escolha depende do tamanho da operação, catálogo, integrações, orçamento, nível de personalização e equipe disponível. Shopify, Tray e WooCommerce atendem cenários diferentes.",
      },
      {
        question: "A RC2 apenas cria a loja virtual?",
        answer:
          "Não. O foco é estruturar a operação digital, incluindo plataforma, processos, integrações, dados, atendimento, logística e treinamento da equipe.",
      },
      {
        question: "É possível integrar a loja com ERP?",
        answer:
          "Sim. A integração com ERP pode automatizar pedidos, estoque, notas fiscais, produtos e informações operacionais, dependendo das ferramentas utilizadas.",
      },
      {
        question: "O e-commerce já sai preparado para campanhas?",
        answer:
          "A implantação deve incluir configuração de GA4, Google Tag Manager, eventos, pixels e estrutura mínima para medir campanhas e conversões.",
      },
      {
        question: "Quando vale a pena modernizar uma loja existente?",
        answer:
          "Quando a operação depende de muito trabalho manual, tem baixa conversão, problemas de integração, lentidão, falhas de checkout ou dificuldade para medir resultados.",
      },
    ],
    relatedLinks: [
      { label: "Automação de processos", href: "/solucoes#automacao-de-processos" },
      { label: "Sites e landing pages", href: "/servicos/sites-e-landing-pages" },
      { label: "Contato", href: "/contato" },
    ],
  },
  {
    slug: "sites-e-landing-pages",
    shortTitle: "Sites Inteligentes",
    title: "Modernização de sites, landing pages e interfaces com IA",
    seoTitle: "Sites e Landing Pages para Geração de Leads",
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
    keywords:
      "desenvolvimento de sites, landing pages, captação de leads, site inteligente, chatbot website, formulários dinâmicos, integração WhatsApp site, conversão de visitantes",
    painPoints: [
      "O site atual não explica claramente a oferta da empresa.",
      "Visitantes acessam a página, mas não entram em contato.",
      "Landing pages de campanha não estão preparadas para conversão.",
      "Formulários, WhatsApp, CRM e automações não estão integrados.",
      "A empresa não consegue medir quais páginas geram leads e oportunidades.",
    ],
    useCases: [
      "Site institucional com foco em clareza e autoridade.",
      "Landing page para campanhas de tráfego pago.",
      "Página para captação de leads.",
      "Página de serviço com estrutura SEO.",
      "Integração com WhatsApp, CRM, formulários e automações.",
      "Modernização de site antigo.",
      "Interface simples para operação, atendimento ou coleta de dados.",
    ],
    implementationSteps: [
      "Diagnóstico da oferta, público e objetivo da página.",
      "Definição da estrutura de conteúdo, CTA e jornada do visitante.",
      "Criação ou modernização da interface com foco em clareza e conversão.",
      "Configuração de formulários, WhatsApp, eventos e integrações.",
      "Ajustes de SEO técnico, metadata, Open Graph e performance.",
      "Testes de responsividade, carregamento e rastreamento.",
      "Publicação e acompanhamento dos primeiros dados de conversão.",
    ],
    integrations: [
      "WhatsApp",
      "Formulários",
      "CRM",
      "Google Tag Manager",
      "GA4",
      "Meta Pixel",
      "Google Ads",
      "E-mail",
      "n8n",
      "Supabase",
      "APIs",
    ],
    metrics: [
      "Taxa de conversão da página",
      "Cliques em CTA",
      "Envios de formulário",
      "Cliques para WhatsApp",
      "Origem dos leads",
      "Performance por campanha",
      "Tempo de carregamento",
      "Engajamento por seção",
    ],
    faq: [
      {
        question: "Qual a diferença entre site e landing page?",
        answer:
          "O site apresenta a empresa de forma mais ampla. A landing page é focada em uma oferta, campanha ou conversão específica, com menos distrações e CTA mais direto.",
      },
      {
        question: "Uma landing page precisa de SEO?",
        answer:
          "Depende do objetivo. Landing pages de campanha podem priorizar conversão, mas ainda devem ter boa performance, metadata, Open Graph e estrutura técnica correta.",
      },
      {
        question: "O site pode ser integrado ao WhatsApp e CRM?",
        answer:
          "Sim. Formulários, botões de WhatsApp, CRM, planilhas e automações podem ser integrados para organizar os leads e reduzir trabalho manual.",
      },
      {
        question: "Como saber se o site está convertendo bem?",
        answer:
          "É necessário medir eventos como clique em CTA, envio de formulário, clique no WhatsApp, origem do visitante e taxa de conversão por página ou campanha.",
      },
      {
        question: "Vocês modernizam sites já existentes?",
        answer:
          "Sim. A modernização pode envolver revisão de conteúdo, interface, performance, SEO técnico, integrações e estrutura de conversão.",
      },
    ],
    relatedLinks: [
      { label: "Automações com IA", href: "/servicos/automacoes-com-ia" },
      { label: "E-commerce", href: "/servicos/e-commerce" },
      { label: "Contato", href: "/contato" },
    ],
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
