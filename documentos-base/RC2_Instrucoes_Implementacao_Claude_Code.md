# RC2 Soluções — Instruções de Implementação
## Para execução por agente (Claude Code)

**Como usar este documento:** ele não substitui os documentos-fonte — orquestra a ordem em que o agente deve aplicá-los, as dependências entre as duas frentes de trabalho, e os critérios de validação a cada etapa. Os valores, decisões e textos definitivos estão nos documentos-fonte; este arquivo não deve ser tratado como fonte de verdade para tokens, copy ou redirects.

**Documentos-fonte (devem estar na pasta `documentos-base` do projeto):**
- `RC2_Direcao_de_Arte_e_Sistema_Visual.md` — sistema visual: tipografia, cor, spacing, componentes, motion, páginas representativas. **Domínio visual.**
- `RC2_Correcoes_Recomendadas_Site.md` — arquitetura de informação, redirects, consolidação de páginas, copy, SEO. **Domínio de conteúdo/produto — não foi produzido nem validado como parte da refatoração visual; o agente deve tratá-lo como especificação independente.**
- `RC2_Brand_Guide_v2.1.md` — identidade e estratégia de marca. Fonte de verdade para tudo que os dois documentos acima não cobrirem.

**Regra de precedência:** onde os dois documentos operacionais se sobrepõem (não deveria acontecer, mas se acontecer), o Brand Guide decide. Onde um documento é claramente de conteúdo (copy, redirect, sitemap) e o outro é claramente visual (token, componente, motion), cada um manda no seu domínio — não misturar decisão de um no espaço do outro sem necessidade.

---

## Fase 0 — Reconhecimento do repositório

Antes de qualquer alteração, mapear:

- Stack e abordagem de estilo (framework, sistema de tokens/tema, se já existe arquivo central de design tokens ou se cores estão espalhadas).
- Estrutura real de rotas/páginas e onde cada página mencionada nos documentos-fonte vive no código.
- Componentes reutilizáveis já existentes que correspondam aos componentes descritos no documento visual (Card, Botão, Stepper, Nav item, etc.) — usar os nomes reais do código, não os nomes conceituais dos documentos.
- Se Phosphor Icons ou Lucide já são dependência do projeto (o documento visual pede um desses dois; não introduzir um terceiro).
- Convenção de branch/PR do repositório.

**Produzir, antes de tocar em qualquer código:** uma tabela de correspondência "conceito do documento → arquivo/componente real". Isso evita duplicar componente por não encontrar o existente, e serve de checklist de cobertura.

---

## Fase 1 — Fundações de token (visual)

**Fonte:** `RC2_Direcao_de_Arte_e_Sistema_Visual.md`, Seção 6.

- Atualizar o token de background claro para o valor definido nessa seção.
- Corrigir a escala tipográfica: o H1 deixa de referenciar o peso condensed extrabold por padrão em todo lugar — só o gesto de assinatura do hero mantém esse peso.
- Adicionar a escala de espaçamento "seção de assinatura" como token adicional (não substitui a escala padrão, convive com ela).
- Confirmar/instalar a dependência de ícones definida.

**Critério de validação:** ao final desta fase, nenhuma página deve ter mudado de layout ou conteúdo — só fundo e tipografia. Se algo mais mudou, essa mudança pertence a outra fase e foi antecipada por engano.

---

## Fase 2 — Correção da violação mais grave (visual)

**Fonte:** mesmo documento, Seção 2 e a linha "CTA band Contato" da Seção 8.

- Trocar o fundo full-bleed em Safety Orange da faixa "Já enviou sua demanda?" (página Contato) para navy/neutro, restringindo o laranja aos botões dentro dela.

Isolado, sem dependência das demais fases — pode ser feito em paralelo à Fase 1.

---

## Fase 3 — Consolidação de arquitetura de informação (conteúdo)

**Fonte:** `RC2_Correcoes_Recomendadas_Site.md`, Seções 12, 13, 17, 18, 19, 20.

- Configurar os redirects 301 listados (consolidação de `/servicos` em `/solucoes`, páginas antigas de WhatsApp apontando para o destino relevante).
- Atualizar sitemap conforme a Seção 19.
- Atualizar header e footer conforme Seções 17 e 18 (inclusão de Zapbox/Agenda Confirmada, remoção do antigo item "Serviços").

**Por que isso vem antes do rollout visual completo (Fase 5):** investir tempo de implementação visual em páginas que serão descontinuadas é retrabalho. Resolver a arquitetura primeiro define com precisão a lista final de páginas que a Fase 5 precisa cobrir.

**Nota de domínio:** esta fase não foi avaliada nem produzida como parte da direção visual — o agente aplica como especificação independente do documento de Correções.

---

## Fase 4 — Copy e reposicionamento (conteúdo)

**Fonte:** `RC2_Correcoes_Recomendadas_Site.md`, Seções 4, 5, 7, 9, 10, 11.

- Aplicar os textos definidos: Zapbox e Agenda Confirmada na Home, nova abertura de `/sobre`, renomeação e reestruturação de `/avaliacoes`, introdução da Valéria, padronização de CTAs.
- Este é conteúdo, não tratamento visual — a camada tipográfica e de espaçamento já deve estar correta pela Fase 1; aqui só entra o texto novo dentro dos componentes já existentes.

---

## Fase 5 — Rollout do sistema visual pelas páginas restantes

**Fonte:** `RC2_Direcao_de_Arte_e_Sistema_Visual.md`, Seções 8 e 9.

Aplicar, página por página, a recomendação específica já registrada na Seção 9: Home, Soluções, Sobre, Blog (índice e artigo individual), Avaliações e Projetos. Formalizar os componentes descritos na Seção 8 (Numerado, Stat/Counter, FAQ item, Breadcrumb, Share row, Author byline) como componentes reutilizáveis do design system do projeto — não implementações ad-hoc por página.

**Escopo já reduzido pela Fase 3:** não aplicar tratamento visual em `/servicos` — a página será redirecionada, não mantida.

---

## Fase 6 — Nova página: Agenda Confirmada

**Fonte combinada:**
- Estrutura de conteúdo: `RC2_Correcoes_Recomendadas_Site.md`, Seção 6.
- Tratamento visual: o template mais próximo já especificado é "Landing pages por problema" (`RC2_Direcao_de_Arte_e_Sistema_Visual.md`, Seção 9) — hero, sinais do problema, CTA intermediário, e o componente Numerado para etapas.

**Ressalva sobre o "Como funciona"** (diagrama Agenda → Automação → WhatsApp → Confirmação/Cancelamento → Atualização/Alerta, presente no documento de Correções): isso é conteúdo de página interna, não hero — o Princípio 5 do sistema visual (proibição de fluxograma/nó-e-seta) foi escopado explicitamente só para o hero. Ainda assim, seguir a disciplina geral do brand guide contra clichê visual de IA: preferir uma sequência vertical simples, reaproveitando o componente Numerado já existente no sistema, a um mockup de fluxograma com nós e setas soltos.

---

## Fase 7 — SEO técnico e QA final

**Fonte:** `RC2_Correcoes_Recomendadas_Site.md`, Seção 21 (canonical, redirects, status HTTP) + `RC2_Direcao_de_Arte_e_Sistema_Visual.md`, Seção 12 (pendências de QA visual).

- Testar status HTTP de todos os redirects configurados na Fase 3; evitar cadeia de redirects (A→B→C), preferir A→C direto.
- Revisar canonical e meta descriptions.
- QA visual dos dois pontos que não puderam ser auditados por screenshot estático: estados de hover/focus/active em todos os componentes interativos, e o widget de avaliações do Google em `/avaliacoes` (carrega via JavaScript).

---

## Uso das ferramentas do ambiente

- Se houver automação de navegador/captura de tela disponível, usar para comparar visualmente antes/depois de cada fase — toda a especificação visual desta conversa foi construída a partir de screenshots estáticos e leitura de conteúdo, nunca do site rodando ao vivo.
- Se houver integração com rastreador de tarefas, transformar as fases acima e o checklist já existente na Seção 28 do documento de Correções em tarefas rastreáveis, uma por item.
- Trabalhar em branches separadas por fase — facilita revisão e rollback isolado caso uma fase precise ser revertida sem afetar as demais.
- Ao final de cada fase visual (1, 2, 5, 6), revisar contra a tabela Do/Don't (Seção 11 do documento de direção de arte) antes de prosseguir.

---

## O que não fazer

- Não inventar valor de token, cor, espaçamento ou copy que não esteja em nenhum dos documentos-fonte — decisão não especificada é motivo para perguntar, não para assumir.
- Não aplicar tratamento visual detalhado (Fase 5) em páginas que a Fase 3 vai descontinuar.
- Não decidir por conta própria a lista de palavras do gesto cinético do hero da Home — está registrada como decisão de copy em aberto na Seção 12 do documento de direção de arte.
- Não aplicar decisões do documento de Correções como se fossem parte da direção visual, nem o inverso — manter a distinção de domínio ao longo de toda a implementação, inclusive em commits e PRs (facilita review e reversão seletiva).

---

*RC2 Soluções · Instruções de Implementação para Agente · 2026*
