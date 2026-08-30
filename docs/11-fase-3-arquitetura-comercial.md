# Fase 3 — Arquitetura comercial

> **Registro autoritativo das decisões do gate comercial #00055.**
>
> Estas decisões foram tomadas pelo responsável pelo negócio e substituem os
> campos em aberto de `docs/09-fase-1-decisoes-comerciais.md` (pendências 1.1,
> 2.1 e 2.2). São a **fonte de verdade** para a implementação da Fase 3.
>
> Nada aqui é inferência. Onde a decisão silencia, o documento **marca a
> pendência** em vez de preencher.

**Origem:** gate comercial #00055 · **Baseline:** `main @ c612a2d`

---

## 1. Decisão 1.1 — Preço do Discovery Operacional

**PUBLICAR FAIXA.**

Faixa pública aprovada: **R$ 1.500 a R$ 5.000, conforme a complexidade.**

### Regras de apresentação

- Deixar explícito que o Discovery Operacional é uma **etapa paga**.
- **Não** transformar preço em headline ou CTA.
- Separar **visual e semanticamente** da conversa inicial gratuita.
- A conversa gratuita continua sem compromisso e serve apenas para avaliar fit
  e entender inicialmente o problema.
- Nenhum conteúdo da conversa gratuita pode prometer mapa de processo,
  arquitetura, roadmap, levantamento completo ou documentação.
- Menção de valor em `/contato` só no **contexto explicativo do Discovery**,
  nunca como preço da conversa inicial.
- **Proibido** derivar preços, descontos ou "a partir de" diferentes da faixa.

---

## 2. Decisão 2.1 — Formato da Operação Gerenciada

### Natureza

Serviço **técnico recorrente** de sustentação, monitoramento e evolução da
automação, integrações e componentes de IA da operação.

**Não é** terceirização da operação do cliente e **não é** BPO.

A RC2 acompanha tecnicamente o que foi implantado para evitar que automações e
integrações se tornem ativos abandonados, frágeis ou sem observabilidade.

### O que a RC2 entrega — os nove entregáveis aprovados

monitoramento · alertas · correções · backups (quando aplicáveis ao escopo
gerenciado) · observabilidade · revisão de workflows · manutenção de
integrações · análise de consumo · evolução.

A execução concreta depende do escopo contratado e dos ativos efetivamente
gerenciados.

### O que NÃO faz parte

- executar tarefas operacionais cotidianas que pertencem à equipe do cliente;
- funcionar como equipe terceirizada de atendimento, vendas ou backoffice;
- assumir atendimento e vendas por WhatsApp como serviço RC2 — **território
  Zapbox**;
- executar projetos novos de grande porte ou implantações fora do escopo;
- entregar novo mapeamento completo, arquitetura ampla ou Discovery sem
  contratação específica;
- absorver automaticamente custos e licenças de plataformas, infraestrutura ou
  serviços de terceiros.

Mudanças relevantes de arquitetura ou novos projetos são **novo projeto RC2** e,
quando necessário, precedidos por Discovery Operacional.

### Modelo de contratação

Contrato **recorrente mensal por escopo gerenciado**. O escopo define quais
automações, integrações, workflows e componentes técnicos ficam sob
responsabilidade da RC2.

**Não publicar** prazo mínimo, SLA ou condições comerciais ainda não
formalizados.

### Recorrência

**Mensal — MRR.** Relação contínua de sustentação e evolução, não entrega
pontual.

### Relação com o Discovery Operacional

**Discovery não é obrigatório em todos os casos.**

1. Se a RC2 implantou a solução e já conhece a arquitetura, a Operação
   Gerenciada pode começar após a implantação **sem novo Discovery**.
2. Se a RC2 assumir automações, integrações ou sistemas de terceiros e o
   ambiente não estiver suficientemente documentado, deve existir antes uma
   **etapa paga** de Discovery/avaliação técnica.
3. Se durante a Operação Gerenciada surgir mudança estrutural relevante, ela
   **sai do escopo recorrente** e volta para Discovery/projeto.

> Discovery é porta de entrada **quando existe incerteza arquitetural**; não é
> taxa obrigatória para todo cliente recorrente.

### Relação com o Zapbox

A Operação Gerenciada **não concorre com o Zapbox**. O Zapbox segue responsável
por **WhatsApp + equipe + atendimento + vendas + CRM + Sales AI**.

A Operação Gerenciada **pode** incluir a sustentação das **integrações entre
Zapbox e outros sistemas** da operação, quando parte de uma arquitetura maior.

**Não vender sob "Operação Gerenciada":** gestão cotidiana de conversas de
WhatsApp · operação comercial dentro do CRM · equipe de atendimento · Sales AI
como serviço genérico da RC2. Esses itens apontam para o Zapbox.

### Responsável pela operação cotidiana

**O cliente** continua responsável pela operação do negócio — atendimento,
vendas, financeiro, logística, aprovações e demais processos.

A RC2 responde pela **camada técnica definida em contrato**: saúde das
automações, integrações, observabilidade, incidentes dentro do escopo,
manutenção e evolução técnica.

Frase operacional que orienta a copy:

> **A RC2 gerencia a tecnologia da operação; não substitui a operação do
> cliente.**

### Resultado pretendido

Manter automações e integrações confiáveis depois da implantação · detectar
problemas antes de virarem gargalos recorrentes · reduzir manutenção reativa ·
dar visibilidade técnica sobre workflows e integrações · evoluir a solução
conforme a operação muda · evitar que projetos implantados se deteriorem por
falta de acompanhamento.

**Proibido** criar percentuais, SLAs, garantias de disponibilidade ou métricas
sem documentação.

### Forma de apresentação no site

**Seção dentro de `/solucoes`.** **Não criar página própria nesta fase.**

- `/solucoes` — seção completa explicando a oferta
- Home — menção resumida, se necessária à arquitetura da nova Home
- `/contato` — pode aparecer como opção de interesse/necessidade
- **nenhuma rota nova nesta fase**

Motivo registrado: a arquitetura-alvo já consolida as ofertas RC2 em
`/solucoes`; uma rota nova adicionaria superfície SEO antes da consolidação das
URLs existentes. Reconsiderável no futuro, se houver volume de conteúdo ou
demanda orgânica.

---

## 3. Decisão 2.2 — Preço da Operação Gerenciada

**SOB CONSULTA.**

Não publicar preço, faixa, "a partir de" ou mensalidade estimada nesta fase.

Copy aprovada:

> Operação Gerenciada é uma contratação mensal, com escopo e valor definidos
> conforme a operação que será acompanhada.

Versão curta aprovada:

> Contratação mensal sob consulta.

**Proibido:** inventar faixa · derivar preço da faixa do Discovery · criar tiers
Bronze/Prata/Ouro, planos ou pacotes.

---

## 4. Jornada comercial aprovada

| # | Etapa | Modelo | Entrega | Não entrega |
|---|---|---|---|---|
| 1 | **Conversa inicial** | gratuita | conversa de 20–30 min: entender problema, contexto e fit | mapeamento completo, arquitetura, roadmap, projeto técnico |
| 2 | **Discovery Operacional** | pago, **R$ 1.500–5.000** | levantamento estruturado, arquitetura, riscos, requisitos, prioridades, estimativa, roadmap | — |
| 3 | **Implantação / projeto RC2** | projeto | automação, integrações, IA para Operações, Agenda Confirmada, Operações Digitais & Commerce | território Zapbox |
| 4 | **Operação Gerenciada** | mensal, **sob consulta** | sustentação e evolução técnica do implantado | operação cotidiana do cliente |

A jornada **não é obrigatoriamente linear**. O Discovery entra quando há
incerteza arquitetural. Necessidades predominantemente de WhatsApp,
atendimento, vendas, CRM ou Sales AI seguem para o **Zapbox**.

---

## 5. Fronteira que a Fase 3 implementa em `/contato`

### A página NÃO pode mais oferecer gratuitamente

mapeamento inicial da operação · identificação estruturada de gargalos ·
sugestão detalhada de automações · priorização técnica · roadmap · proposta
arquitetural.

Esses elementos pertencem ao **Discovery pago** quando exigem trabalho
consultivo estruturado.

### A conversa gratuita promete apenas

- entender o cenário
- ouvir o principal problema
- verificar aderência com a RC2
- identificar qual deve ser o próximo passo

### Próximos passos possíveis

conversa/proposta direta (problema simples e definido) · Discovery Operacional ·
projeto RC2 · Zapbox · Agenda Confirmada · Operação Gerenciada (ambiente já
implantado).

> **Não transformar toda oportunidade obrigatoriamente em Discovery.**

---

## 6. Matriz de sobreposição — antes × depois

`OBSERVED` — bloco "O que você recebe" de `/contato` antes da Fase 3, cruzado
com os nove entregáveis do Discovery (`docs/09` §1).

| Promessa gratuita atual | Entregável do Discovery | Pertence à conversa? | Pertence ao Discovery? | Ação |
|---|---|---|---|---|
| Mapeamento inicial da operação | mapa do processo · sistemas envolvidos | não | **sim** | mover |
| Identificação de gargalos | gargalos | não | **sim** | mover |
| Sugestão de automações possíveis | fluxos · integrações | não | **sim** | mover |
| Priorização por impacto e complexidade | prioridades | não | **sim** | mover |
| Roadmap de implantação | arquitetura proposta | não | **sim** | mover |
| Proposta para execução | estimativa | não | **sim** | mover |
| — | riscos | não | **sim** | já exclusivo do Discovery |

**6 de 6** promessas gratuitas colidiam com **8 dos 9** entregáveis pagos. Só
"riscos" era exclusivo do Discovery — ou seja, o Discovery pago não tinha
proposta de valor distinta.

Substituídas pelas quatro promessas da conversa inicial (seção 5).

---

## 7. Regras editoriais desta fase

- Linguagem madura, consultiva, objetiva, tecnicamente precisa.
- Sem hype, urgência artificial, claims não comprovados ou termos vagos.
- **Nenhum** preço, prazo, SLA, garantia, métrica, case ou percentual além do
  que está aprovado acima.
- Fronteira RC2 × Zapbox preservada em toda a copy.
- Taxonomia histórica de analytics preservada — ver
  `docs/10-divida-taxonomia-analytics.md`.
- Brand Guide integral; alterações de layout apenas quando necessárias à
  hierarquia comercial, mínimas e sistemáticas.

---

## 8. Pendências que permanecem abertas

| ID | Pendência | Bloqueia | Origem |
|---|---|---|---|
| 2.1-a | Prazo mínimo de contrato e SLA da Operação Gerenciada | copy que os mencione | não formalizados (decisão 2.1) |
| 2.1-b | Instrumentação de link externo para o Zapbox | medição de saída para o produto | não existe `kind` de tracking para link de produto; o link foi implementado como âncora simples, **sem inventar convenção** — ver `docs/10` |
| 3.1 | Mapeamento 1:1 das URLs RC2 → páginas Zapbox | Fase 6 | `docs/09` §3 |
| 3.2 | Histórico orgânico das URLs a migrar | Fase 6 | `docs/09` §3 |
| — | Renomear `/avaliacoes` para "Avaliações e Projetos" | fase editorial futura | `docs/08` §19 #7 |
| — | Revisão da taxonomia de analytics | unidade própria | `docs/10` |

Nenhuma delas bloqueia a Fase 3.
