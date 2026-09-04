/**
 * Agenda Confirmada — solução vertical da RC2 para clínicas.
 *
 * Fonte da estrutura e da copy: `RC2_Correcoes_Recomendadas_Site.md` §6.
 *
 * ## Sobre a rota
 *
 * `/solucoes/agenda-confirmada` era `DEFER_ROUTE` (`docs/18` §13). A condição
 * de desbloqueio era `CD-1` respondida **e** as lacunas U-3, U-4 e U-6
 * preenchidas. `CD-1` foi respondida (`docs/19`); o §6 preenche U-3 em parte e
 * implica U-6 pelas versões, mas **U-4 — a base técnica — continua indefinida**.
 *
 * Por isso esta página **não afirma stack**: não diz que roda sobre o Zapbox,
 * sobre automação própria, nem sobre os dois. Descreve o que a clínica passa a
 * ter, não como é construído. Quando U-4 for respondida, é aqui que a
 * informação entra.
 *
 * ## Sobre claims
 *
 * U-7 segue aberta: "reduz faltas" não tem métrica documentada. Os sintomas
 * abaixo descrevem a operação **atual** da clínica — são a dor, não uma
 * promessa de resultado. Nenhum número aparece nesta página.
 */

export const AGENDA_CONFIRMADA_ROUTE = "/solucoes/agenda-confirmada";

export const AGENDA_CONFIRMADA = {
  eyebrow: "Solução vertical RC2 para clínicas",
  h1: "Sua clínica ainda confirma agenda manualmente pelo WhatsApp?",
  lead: "Automatize lembretes, confirmações e avisos usando Google Agenda ou o sistema de gestão da clínica.",

  heroCta: {
    label: "Quero automatizar minha agenda",
    href: "/contato",
    analyticsLabel: "automatizar_agenda",
  },

  /** Sintomas da operação atual — dor observada, não resultado prometido. */
  problemLabel: "O que acontece hoje",
  problemTitle: "A recepção vira central de confirmação.",
  problems: [
    "Mensagens enviadas manualmente, uma a uma",
    "Recepção repetindo a mesma tarefa todos os dias",
    "Pacientes esquecendo horários",
    "Cancelamentos em cima da hora",
    "Dificuldade para acompanhar quem confirmou",
    "Horários vagos que ninguém reaproveita",
  ],

  /**
   * Sequência vertical, não fluxograma.
   *
   * O §6 desenha isto como diagrama de nós e setas. A disciplina do brand guide
   * contra clichê visual pede o contrário: o mesmo encadeamento lido como
   * etapas numeradas, reaproveitando o componente Numerado do sistema.
   */
  howLabel: "Como funciona",
  howTitle: "Cinco etapas, sem ninguém digitando.",
  how: [
    {
      title: "Agenda",
      description:
        "Os horários marcados saem do Google Agenda ou do sistema de gestão que a clínica já usa.",
    },
    {
      title: "Automação",
      description:
        "A automação lê os compromissos do período e monta os envios, sem depender de alguém abrir a lista.",
    },
    {
      title: "WhatsApp",
      description:
        "O paciente recebe o lembrete no canal em que ele já responde.",
    },
    {
      title: "Confirmação ou cancelamento",
      description:
        "A resposta do paciente é registrada como confirmação ou cancelamento, sem digitação manual.",
    },
    {
      title: "Atualização e alerta",
      description:
        "A agenda reflete a resposta, e a clínica é avisada do que precisa de ação — como um horário que vagou.",
    },
  ],

  /**
   * Nomes das versões conforme o §6. **Sem descrição por versão de propósito:**
   * o documento lista só os nomes, e inventar o que cada uma inclui seria criar
   * oferta que nenhuma fonte aprovou.
   */
  versionsLabel: "Versões",
  versionsTitle: "Quatro versões, conforme o tamanho da operação.",
  versionsNote:
    "O escopo de cada versão é definido na conversa, a partir do volume de agendamentos e dos sistemas que a clínica já usa.",
  versions: [
    "Agenda Confirmada Start",
    "Agenda Confirmada Plus",
    "Agenda Confirmada",
    "Agenda Confirmada Pro",
  ],

  boundaryLabel: "O que não faz",
  boundaryTitle: "Onde esta solução termina.",
  boundaryIntro:
    "A Agenda Confirmada cuida da comunicação em torno da agenda. Ela não entra no cuidado ao paciente nem na gestão da clínica.",
  boundaries: [
    "Atendimento médico",
    "Orientação clínica",
    "Prontuário",
    "Diagnóstico",
    "Interpretação de exames",
    "Gestão completa da clínica",
  ],

  finalCta: {
    title: "Quer parar de confirmar agenda uma mensagem por vez?",
    description:
      "Uma conversa curta para entender o volume da sua agenda, os sistemas que você já usa e se essa solução faz sentido para a sua clínica.",
    label: "Agendar uma Sessão de Compatibilidade",
    href: "/contato",
    analyticsLabel: "sessao_compatibilidade",
  },
} as const;

export const AGENDA_CONFIRMADA_METADATA = {
  title: "Agenda Confirmada — Automação de agenda para clínicas",
  description:
    "Automatize lembretes, confirmações e avisos de agenda usando Google Agenda ou o sistema de gestão da clínica. Solução vertical da RC2 para clínicas.",
  keywords:
    "agenda confirmada, confirmação de consulta, lembrete de consulta, automação para clínicas, agenda de clínica, WhatsApp para clínica",
} as const;
