export type SolutionFaq = {
  question: string;
  answer: string;
};

export type SolutionRelatedLink = {
  label: string;
  href: string;
};

export type SolutionServiceLink = {
  label: string;
  href: string;
  description: string;
};

export type Solution = {
  slug: string;
  shortTitle: string;
  title: string;
  seoTitle: string;
  summary: string;
  description: string;
  targetAudience: string[];
  symptoms: string[];
  businessImpact: string[];
  rootCauses: string[];
  recommendedApproach: string[];
  relatedServices: SolutionServiceLink[];
  metrics: string[];
  faq: SolutionFaq[];
  relatedLinks: SolutionRelatedLink[];
  ctaTitle: string;
  ctaDescription: string;
  keywords: string;
};

export const solutions: Solution[] = [
  {
    slug: "atendimento-lento",
    shortTitle: "Atendimento lento",
    title: "Atendimento lento está fazendo sua empresa perder clientes?",
    seoTitle: "Atendimento Lento: Como Resolver com IA e Automação",
    summary:
      "Entenda como reduzir demora no atendimento, organizar demandas e responder clientes com mais velocidade usando IA, automação e processos claros.",
    description:
      "Quando o atendimento demora, o cliente procura outra empresa, o lead esfria e a equipe passa o dia apagando incêndios. A RC2 ajuda a transformar atendimento lento em uma operação mais rápida, organizada e mensurável.",
    targetAudience: [
      "Empresas que recebem muitos contatos pelo WhatsApp.",
      "PMEs com equipe comercial ou atendimento sobrecarregada.",
      "Negócios que perdem leads por demora na primeira resposta.",
      "Empresas sem triagem clara entre dúvidas simples e demandas complexas.",
    ],
    symptoms: [
      "Clientes cobram resposta mais de uma vez.",
      "Leads chegam, mas não são atendidos no momento certo.",
      "A equipe responde as mesmas perguntas todos os dias.",
      "Atendimentos ficam espalhados entre WhatsApp, e-mail, formulário e planilhas.",
      "Gestores não sabem quanto tempo a empresa demora para responder.",
    ],
    businessImpact: [
      "Perda de oportunidades comerciais.",
      "Redução da taxa de conversão.",
      "Piora da experiência do cliente.",
      "Equipe sobrecarregada com tarefas repetitivas.",
      "Falta de previsibilidade no atendimento.",
    ],
    rootCauses: [
      "Ausência de automação para perguntas frequentes.",
      "Falta de priorização de leads.",
      "Canais de atendimento desconectados.",
      "Processos manuais para registrar e encaminhar demandas.",
      "Falta de indicadores de tempo de resposta e volume de atendimento.",
    ],
    recommendedApproach: [
      "Mapear os principais motivos de contato.",
      "Separar dúvidas simples, leads comerciais e demandas que exigem humano.",
      "Criar automações para primeira resposta e qualificação.",
      "Integrar WhatsApp, formulários, CRM e planilhas quando necessário.",
      "Monitorar tempo de resposta, volume e taxa de handoff para humano.",
    ],
    relatedServices: [
      {
        label: "Automações com IA",
        href: "/servicos/automacoes-com-ia",
        description:
          "Para automatizar primeira resposta, FAQ, qualificação de leads e handoff para humano.",
      },
      {
        label: "Automação de processos",
        href: "/servicos/automacao-de-processos",
        description:
          "Para conectar canais, CRM, planilhas e sistemas usados na operação.",
      },
    ],
    metrics: [
      "Tempo médio de primeira resposta",
      "Volume de atendimentos por canal",
      "Leads qualificados",
      "Taxa de atendimento resolvido pela automação",
      "Taxa de encaminhamento para humano",
      "Conversões originadas no atendimento",
    ],
    faq: [
      {
        question: "Como saber se meu atendimento está lento?",
        answer:
          "O sinal mais claro é quando clientes precisam cobrar retorno, leads esfriam antes de falar com a equipe ou o tempo de primeira resposta não é medido. A ausência de indicadores também é parte do problema.",
      },
      {
        question: "IA resolve atendimento lento sozinha?",
        answer:
          "Não. A IA ajuda muito na primeira resposta, perguntas frequentes e qualificação, mas o resultado depende de processo, base de conhecimento, regras de handoff e integração com os canais certos.",
      },
      {
        question: "Preciso trocar minhas ferramentas atuais?",
        answer:
          "Na maioria dos casos, não. A solução pode conectar WhatsApp, formulários, CRM, planilhas e outros sistemas já usados pela empresa.",
      },
    ],
    relatedLinks: [
      { label: "Automações com IA", href: "/servicos/automacoes-com-ia" },
      { label: "Soluções com IA", href: "/solucoes-com-ia" },
      { label: "Contato", href: "/contato" },
    ],
    ctaTitle: "Quer reduzir o tempo de resposta da sua empresa?",
    ctaDescription:
      "Fale com a RC2 sobre a sua operação e entenda o próximo passo para automatizar o atendimento sem perder controle humano.",
    keywords:
      "atendimento lento, demora no atendimento, automação de atendimento, IA para atendimento, WhatsApp automatizado",
  },
  {
    slug: "leads-sem-resposta",
    shortTitle: "Leads sem resposta",
    title: "Leads sem resposta estão virando vendas perdidas?",
    seoTitle: "Leads sem Resposta: Como Evitar Perda de Vendas",
    summary:
      "Veja como organizar a entrada de leads, automatizar a primeira resposta e criar um fluxo comercial mais previsível.",
    description:
      "Quando leads entram pelo WhatsApp, site, redes sociais ou formulários e não recebem retorno rápido, a empresa perde dinheiro antes mesmo da negociação começar. A RC2 ajuda a criar fluxos para capturar, qualificar, registrar e encaminhar leads com mais controle.",
    targetAudience: [
      "Empresas que recebem leads por múltiplos canais.",
      "Times comerciais que dependem de WhatsApp e formulários.",
      "PMEs sem CRM ou com CRM mal utilizado.",
      "Negócios que investem em tráfego pago, mas perdem contatos no atendimento.",
    ],
    symptoms: [
      "Leads entram, mas não são registrados corretamente.",
      "Vendedores escolhem manualmente quem responder primeiro.",
      "Não existe histórico claro do contato.",
      "A empresa não sabe quantos leads perdeu.",
      "Campanhas geram contatos, mas a conversão é baixa.",
    ],
    businessImpact: [
      "Desperdício de investimento em marketing.",
      "Baixa conversão comercial.",
      "Falta de previsibilidade no funil de vendas.",
      "Perda de velocidade na abordagem.",
      "Dificuldade para medir origem e qualidade dos leads.",
    ],
    rootCauses: [
      "Ausência de fluxo automático de captação.",
      "Falta de integração entre formulário, WhatsApp, CRM e planilhas.",
      "Sem regra de priorização ou qualificação.",
      "Dados do lead coletados de forma incompleta.",
      "Equipe comercial sem processo padronizado.",
    ],
    recommendedApproach: [
      "Centralizar os pontos de entrada de leads.",
      "Automatizar confirmação de recebimento e coleta de dados.",
      "Criar critérios de qualificação.",
      "Enviar leads qualificados para o vendedor ou CRM.",
      "Medir origem, status, tempo de resposta e conversão.",
    ],
    relatedServices: [
      {
        label: "Automações com IA",
        href: "/servicos/automacoes-com-ia",
        description:
          "Para responder, qualificar e encaminhar leads automaticamente.",
      },
      {
        label: "Sites e landing pages",
        href: "/servicos/sites-e-landing-pages",
        description:
          "Para criar páginas e formulários preparados para geração de leads.",
      },
      {
        label: "Automação de processos",
        href: "/servicos/automacao-de-processos",
        description:
          "Para integrar formulários, CRM, planilhas e canais de atendimento.",
      },
    ],
    metrics: [
      "Leads captados por canal",
      "Tempo de primeira resposta",
      "Taxa de leads qualificados",
      "Taxa de conversão por origem",
      "Leads sem contato",
      "Custo por lead aproveitado",
    ],
    faq: [
      {
        question:
          "Por que minha empresa perde leads mesmo recebendo contatos?",
        answer:
          "Normalmente isso acontece por demora na resposta, falta de registro, ausência de qualificação ou canais desconectados. O lead chega, mas não entra em um processo comercial claro.",
      },
      {
        question: "Preciso de CRM para resolver isso?",
        answer:
          "Um CRM ajuda, mas não resolve sozinho. O mais importante é ter fluxo de entrada, qualificação, encaminhamento e acompanhamento. O CRM pode ser parte desse fluxo.",
      },
      {
        question: "Dá para automatizar leads vindos do WhatsApp?",
        answer:
          "Sim. É possível automatizar saudação, perguntas de qualificação, registro de dados e encaminhamento para vendedor ou ferramenta comercial.",
      },
    ],
    relatedLinks: [
      { label: "Automações com IA", href: "/servicos/automacoes-com-ia" },
      {
        label: "Sites e landing pages",
        href: "/servicos/sites-e-landing-pages",
      },
      { label: "Contato", href: "/contato" },
    ],
    ctaTitle: "Quer parar de perder leads por falta de resposta?",
    ctaDescription:
      "A RC2 pode mapear seus canais de entrada e criar um fluxo automatizado para captação e qualificação.",
    keywords:
      "leads sem resposta, perda de leads, automação de leads, qualificação de leads, WhatsApp vendas",
  },
  {
    slug: "processos-manuais",
    shortTitle: "Processos manuais",
    title: "Processos manuais estão travando sua operação?",
    seoTitle: "Processos Manuais: Como Automatizar Tarefas Repetitivas",
    summary:
      "Identifique tarefas repetitivas, reduza retrabalho e conecte ferramentas com automação de processos, n8n e integrações.",
    description:
      "Toda empresa tem tarefas que consomem tempo todos os dias: copiar dados, atualizar planilhas, enviar mensagens, criar tarefas e conferir informações. A RC2 ajuda a transformar processos manuais em fluxos automatizados, monitoráveis e mais confiáveis.",
    targetAudience: [
      "Empresas que dependem de planilhas para controlar operação.",
      "Equipes que copiam dados entre sistemas.",
      "PMEs com tarefas repetitivas em vendas, atendimento, financeiro ou administrativo.",
      "Negócios que precisam integrar ferramentas sem trocar toda a estrutura.",
    ],
    symptoms: [
      "A mesma informação é digitada em mais de um sistema.",
      "Planilhas precisam ser atualizadas manualmente.",
      "Erros humanos geram retrabalho.",
      "Tarefas dependem de uma pessoa específica.",
      "Relatórios são montados manualmente.",
    ],
    businessImpact: [
      "Perda de produtividade.",
      "Aumento de erros operacionais.",
      "Demora na execução de processos simples.",
      "Baixa rastreabilidade.",
      "Dificuldade para escalar a operação.",
    ],
    rootCauses: [
      "Falta de integração entre sistemas.",
      "Ausência de workflows automatizados.",
      "Dependência excessiva de planilhas.",
      "Processos não documentados.",
      "Falta de monitoramento de execução.",
    ],
    recommendedApproach: [
      "Mapear tarefas repetitivas e gargalos.",
      "Identificar sistemas, planilhas e canais envolvidos.",
      "Definir regras de negócio e exceções.",
      "Criar automações com n8n, APIs ou webhooks.",
      "Monitorar execuções, falhas e ganhos operacionais.",
    ],
    relatedServices: [
      {
        label: "Automação de processos",
        href: "/servicos/automacao-de-processos",
        description:
          "Para criar workflows, integrações e automações entre sistemas.",
      },
      {
        label: "Agentes de IA",
        href: "/servicos/agentes-de-ia",
        description:
          "Para apoiar a equipe com consultas, relatórios e tarefas internas.",
      },
    ],
    metrics: [
      "Horas manuais economizadas",
      "Tarefas automatizadas",
      "Erros reduzidos",
      "Tempo de execução do processo",
      "Falhas por workflow",
      "Volume processado automaticamente",
    ],
    faq: [
      {
        question: "Que processos manuais podem ser automatizados?",
        answer:
          "Tarefas repetitivas com regras claras são boas candidatas: atualizar planilhas, enviar notificações, registrar dados, gerar relatórios, criar tarefas e integrar sistemas.",
      },
      {
        question: "Automação exige trocar meus sistemas?",
        answer:
          "Geralmente não. A automação pode conectar ferramentas existentes usando APIs, webhooks, planilhas, e-mails ou plataformas como n8n.",
      },
      {
        question: "Como saber por onde começar?",
        answer:
          "Comece pelos processos repetitivos, frequentes, sujeitos a erro e que consomem tempo da equipe. Um diagnóstico ajuda a priorizar o que gera mais retorno.",
      },
    ],
    relatedLinks: [
      {
        label: "Automação de processos",
        href: "/servicos/automacao-de-processos",
      },
      { label: "Agentes de IA", href: "/servicos/agentes-de-ia" },
      { label: "Contato", href: "/contato" },
    ],
    ctaTitle: "Quer identificar quais tarefas podem ser automatizadas?",
    ctaDescription:
      "Fale com a RC2 sobre os processos manuais da sua operação e entenda o próximo passo para automatizá-los.",
    keywords:
      "processos manuais, tarefas repetitivas, automação de processos, n8n, integração de sistemas",
  },
  {
    slug: "sistemas-desconectados",
    shortTitle: "Sistemas desconectados",
    title: "Sistemas desconectados estão criando retrabalho?",
    seoTitle: "Sistemas Desconectados: Como Integrar Ferramentas e Dados",
    summary:
      "Conecte CRM, ERP, planilhas, e-commerce, WhatsApp e outras ferramentas para reduzir retrabalho e melhorar a operação.",
    description:
      "Quando cada sistema funciona isolado, a equipe precisa copiar informações, conferir dados manualmente e lidar com falhas de comunicação entre áreas. A RC2 cria integrações para conectar ferramentas e dar mais fluidez à operação.",
    targetAudience: [
      "Empresas que usam várias ferramentas sem integração.",
      "Operações com CRM, ERP, e-commerce, planilhas e WhatsApp desconectados.",
      "Equipes que precisam transferir dados manualmente.",
      "PMEs que querem mais controle sem trocar todos os sistemas.",
    ],
    symptoms: [
      "Dados de clientes ficam duplicados ou incompletos.",
      "Pedidos, leads ou solicitações precisam ser lançados manualmente.",
      "Planilhas viram ponte entre sistemas.",
      "Áreas diferentes usam informações divergentes.",
      "Gestores não têm visão consolidada da operação.",
    ],
    businessImpact: [
      "Retrabalho constante.",
      "Falhas na comunicação entre áreas.",
      "Decisões baseadas em dados incompletos.",
      "Atrasos no atendimento e na operação.",
      "Baixa confiabilidade das informações.",
    ],
    rootCauses: [
      "Ferramentas escolhidas sem arquitetura de integração.",
      "Falta de APIs ou webhooks configurados.",
      "Ausência de fluxo central de dados.",
      "Processos criados de forma improvisada.",
      "Baixa documentação operacional.",
    ],
    recommendedApproach: [
      "Mapear sistemas e dados críticos.",
      "Definir fonte de verdade para cada informação.",
      "Desenhar fluxos de integração entre ferramentas.",
      "Implementar APIs, webhooks ou automações intermediárias.",
      "Criar monitoramento de falhas e documentação do fluxo.",
    ],
    relatedServices: [
      {
        label: "Automação de processos",
        href: "/servicos/automacao-de-processos",
        description:
          "Para integrar sistemas, APIs, planilhas, CRM, ERP e canais digitais.",
      },
      {
        label: "E-commerce",
        href: "/servicos/e-commerce",
        description:
          "Para conectar loja virtual, ERP, pagamento, logística e atendimento.",
      },
    ],
    metrics: [
      "Integrações ativas",
      "Processos sem digitação manual",
      "Redução de erros de cadastro",
      "Tempo de sincronização",
      "Falhas de integração",
      "Volume de dados processados automaticamente",
    ],
    faq: [
      {
        question: "É possível integrar sistemas diferentes?",
        answer:
          "Sim, desde que existam APIs, webhooks, conectores, exportações ou algum caminho técnico seguro para troca de dados entre as ferramentas.",
      },
      {
        question: "Preciso substituir meu ERP ou CRM?",
        answer:
          "Não necessariamente. Muitas vezes o melhor caminho é integrar as ferramentas atuais e corrigir os fluxos de dados antes de pensar em troca de sistema.",
      },
      {
        question: "Como evitar que integrações falhem sem ninguém perceber?",
        answer:
          "As automações devem ter tratamento de erro, logs, alertas e monitoramento para identificar falhas rapidamente.",
      },
    ],
    relatedLinks: [
      {
        label: "Automação de processos",
        href: "/servicos/automacao-de-processos",
      },
      { label: "E-commerce", href: "/servicos/e-commerce" },
      { label: "Contato", href: "/contato" },
    ],
    ctaTitle: "Quer conectar seus sistemas e reduzir retrabalho?",
    ctaDescription:
      "A RC2 pode mapear suas ferramentas e desenhar integrações para tornar sua operação mais fluida.",
    keywords:
      "sistemas desconectados, integração de sistemas, CRM ERP planilhas, automação com APIs, n8n integrações",
  },
  {
    slug: "whatsapp-desorganizado",
    shortTitle: "WhatsApp desorganizado",
    title:
      "WhatsApp desorganizado está prejudicando seu atendimento e suas vendas?",
    seoTitle:
      "WhatsApp Desorganizado: Como Organizar Atendimento e Vendas",
    summary:
      "Organize conversas, qualifique contatos e conecte o WhatsApp ao processo comercial com automação, IA e integração.",
    description:
      "O WhatsApp é um canal essencial para muitas PMEs, mas quando vira uma fila desorganizada de mensagens, a empresa perde controle, demora para responder e deixa oportunidades passarem. A RC2 ajuda a transformar o WhatsApp em um canal operacional mais estruturado.",
    targetAudience: [
      "Empresas que vendem ou atendem principalmente pelo WhatsApp.",
      "Equipes com múltiplos atendentes no mesmo canal.",
      "Negócios que perdem histórico de conversas e dados de clientes.",
      "PMEs que querem organizar atendimento, pré-venda e pós-venda.",
    ],
    symptoms: [
      "Conversas importantes somem na lista do WhatsApp.",
      "Clientes são respondidos fora de ordem.",
      "A equipe não sabe quais contatos são prioridade.",
      "Não existe padrão de resposta ou coleta de dados.",
      "Vendas dependem da memória dos atendentes.",
    ],
    businessImpact: [
      "Perda de leads e pedidos.",
      "Atendimento inconsistente.",
      "Dificuldade para acompanhar a jornada do cliente.",
      "Baixa produtividade da equipe.",
      "Ausência de indicadores comerciais do canal.",
    ],
    rootCauses: [
      "WhatsApp usado sem processo definido.",
      "Falta de triagem automática.",
      "Ausência de integração com CRM ou planilha.",
      "Respostas repetitivas feitas manualmente.",
      "Sem indicadores de atendimento e conversão.",
    ],
    recommendedApproach: [
      "Mapear os tipos de conversa que chegam pelo WhatsApp.",
      "Criar fluxo de saudação, triagem e qualificação.",
      "Definir regras de prioridade e encaminhamento.",
      "Integrar dados com CRM, planilhas ou ferramentas comerciais.",
      "Acompanhar indicadores de resposta, volume e conversão.",
    ],
    relatedServices: [
      {
        label: "Automações com IA",
        href: "/servicos/automacoes-com-ia",
        description:
          "Para automatizar triagem, respostas frequentes e qualificação no WhatsApp.",
      },
      {
        label: "Automação de processos",
        href: "/servicos/automacao-de-processos",
        description:
          "Para integrar WhatsApp com CRM, planilhas e outros sistemas.",
      },
      {
        label: "Sites e landing pages",
        href: "/servicos/sites-e-landing-pages",
        description:
          "Para conectar formulários, páginas e CTAs diretamente a fluxos comerciais.",
      },
    ],
    metrics: [
      "Mensagens recebidas por período",
      "Tempo de primeira resposta",
      "Leads qualificados pelo WhatsApp",
      "Conversas encaminhadas para humano",
      "Taxa de conversão por canal",
      "Motivos de contato mais frequentes",
    ],
    faq: [
      {
        question: "Como organizar atendimento pelo WhatsApp?",
        answer:
          "O primeiro passo é mapear os tipos de contato, definir uma triagem inicial, padronizar respostas, coletar dados essenciais e encaminhar cada demanda para o fluxo correto.",
      },
      {
        question: "Dá para usar IA no WhatsApp sem perder controle?",
        answer:
          "Sim. A IA pode atuar dentro de limites definidos, com base de conhecimento controlada e encaminhamento para humano quando a conversa exigir análise ou decisão.",
      },
      {
        question: "O WhatsApp pode ser integrado com CRM?",
        answer:
          "Sim. Dependendo das ferramentas usadas, é possível registrar contatos, atualizar status, criar tarefas e alimentar o CRM automaticamente.",
      },
    ],
    relatedLinks: [
      { label: "Automações com IA", href: "/servicos/automacoes-com-ia" },
      {
        label: "Automação de processos",
        href: "/servicos/automacao-de-processos",
      },
      { label: "Contato", href: "/contato" },
    ],
    ctaTitle:
      "Quer transformar seu WhatsApp em um canal organizado de atendimento e vendas?",
    ctaDescription:
      "Fale com a RC2 sobre a sua operação e entenda o próximo passo para organizar o WhatsApp e integrá-lo aos seus sistemas.",
    keywords:
      "WhatsApp desorganizado, atendimento pelo WhatsApp, automação WhatsApp, WhatsApp vendas, qualificação de leads WhatsApp",
  },
];

export function getSolutionBySlug(slug: string): Solution | undefined {
  return solutions.find((solution) => solution.slug === slug);
}
