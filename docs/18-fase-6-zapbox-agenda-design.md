# Fase 6 — Zapbox, Agenda Confirmada e URLs adiadas — Design

> **Auditoria, inventário e arquitetura. Não é implementação.** Nenhum arquivo
> em `src/`, redirect, sitemap, robots, `llms.txt`, banco ou propriedade do
> Zapbox foi alterado nesta tarefa. A rota `/solucoes/agenda-confirmada`
> **não** foi criada.
>
> Este documento precisa de decisões comerciais (§13) antes do plano técnico.

**Baseline:** `main @ 567533a` · Fases 0 a 5 publicadas · migração SEO SAFE_NOW
concluída, com 5 redirects permanentes em Production.

| Marca | Significado |
|---|---|
| `OBSERVED` | Verificado nesta tarefa, no código ou em Production. |
| `APPROVED` | Consta em fonte oficial citada. |
| `INFERRED` | Proposta de design deste documento. |
| `DEFERRED` | Adiado, com motivo e condição de desbloqueio. |
| `COMMERCIAL_DECISION_REQUIRED` | Falta decisão de negócio; não inferida aqui. |
| `NEEDS_SEO_DATA` | Falta dado externo (Search Console / backlinks). |

**Convenção de sitemap:** este documento usa sempre **PRESENTE no sitemap** ou
**AUSENTE do sitemap**. A forma curta "no sitemap" está proibida aqui — ela já
produziu duas leituras invertidas em documentos anteriores.

---

## 1. Objetivo

Definir o que acontece com as seis URLs de território Zapbox que a migração
anterior classificou como `DEFER_PHASE_6`, e definir a arquitetura da **Agenda
Confirmada**, cuja rota ainda não existe.

Nada é implementado aqui.

---

## 2. Fontes de verdade

`AGENTS.md` · `PRODUCT.md` · `documentos-base/RC2_PROPOSTA_ATUALIZACAO.txt` ·
`RC2_PROMPT_MESTRE_REFORMULACAO.txt` · `docs/08` · `docs/09` · `docs/10` ·
`docs/11` · `docs/12` · `docs/14` · `docs/16` · skills `rc2-site-migration` e
`rc2-brand-system`.

Auditado sem edição: as seis URLs em Production, `zapbox.cloud` (5 rotas),
`services.ts`, `solutions.ts`, `sitemap.ts`, `navigation.ts`,
`/solucoes-com-ia/page.tsx`, `/servicos/[slug]`, `/solucoes/[slug]`.

---

## 3. Estado Production

`OBSERVED` — medido em `https://www.rc2solucoes.com.br` nesta tarefa.

| URL | HTTP | Location | Saltos | Canonical | Robots | Sitemap |
|---|---|---|---|---|---|---|
| `/solucoes-com-ia` | **200** | — | 0 | self | `index, follow` | **PRESENTE** |
| `/servicos/automacoes-com-ia` | **200** | — | 0 | self | `index, follow` | **PRESENTE** |
| `/servicos/automacao-de-atendimento` | **308** | `/servicos/automacoes-com-ia` | 1 | n/a | n/a | **AUSENTE** (alias) |
| `/solucoes/atendimento-lento` | **200** | — | 0 | self | `index, follow` | **PRESENTE** |
| `/solucoes/leads-sem-resposta` | **200** | — | 0 | self | `index, follow` | **PRESENTE** |
| `/solucoes/whatsapp-desorganizado` | **200** | — | 0 | self | `index, follow` | **PRESENTE** |
| `/solucoes/agenda-confirmada` | **404** | — | — | — | — | **AUSENTE** |

Sitemap de Production: **29 URLs**. Cinco das seis candidatas estão publicadas.

### 3.1 Títulos e H1 observados

| URL | `title` | H1 |
|---|---|---|
| `/solucoes-com-ia` | "Soluções com IA" | "Como a IA pode ajudar sua empresa na prática" |
| `/servicos/automacoes-com-ia` | "Automação de Atendimento com IA para **WhatsApp e Vendas**" | "Automações com IA para atendimento, vendas e operação" |
| `/solucoes/atendimento-lento` | "Atendimento Lento: **Como** Resolver com IA e Automação" | "Atendimento lento está fazendo sua empresa perder clientes?" |
| `/solucoes/leads-sem-resposta` | "Leads sem Resposta: **Como** Evitar Perda de Vendas" | "Leads sem resposta estão virando vendas perdidas?" |
| `/solucoes/whatsapp-desorganizado` | "WhatsApp Desorganizado: **Como** Organizar Atendimento e Vendas" | "WhatsApp desorganizado está prejudicando seu atendimento e suas vendas?" |

`OBSERVED` — as três `/solucoes/*` têm `FAQPage` no schema; as cinco páginas
carregam 3 referências a `zapbox.cloud` cada, vindas do Footer e do schema
global — **nenhuma delas tem link editorial próprio para o produto**.

---

## 4. Princípios

`APPROVED`:

1. **Território:** WhatsApp · atendimento · equipe · vendas · CRM comercial ·
   Sales AI pertencem ao **Zapbox** (`AGENTS.md`).
2. **A RC2 não compete com o próprio produto** (`AGENTS.md`).
3. **Agenda Confirmada é solução vertical RC2** para clínicas, não um módulo do
   Zapbox (proposta §6).
4. Nenhuma URL é removida só por sair da navegação (`rc2-site-migration`).
5. Um salto só; destino equivalente em intenção; nunca a Home.
6. `REDIRECT + SITEMAP + INTERNAL LINKS + CANONICAL` viajam na mesma unidade.
7. Nenhuma métrica, capacidade ou claim sem fonte aprovada.

---

## 5. Arquitetura observada do Zapbox

`OBSERVED` — `zapbox.cloud`, cinco rotas, todas **200**:

| Rota | `title` | H1 | Intenção |
|---|---|---|---|
| `/` | "Zapbox \| Atendimento em equipe pelo WhatsApp" | "Transforme seu WhatsApp em uma operação organizada" | WhatsApp desorganizado · múltiplos atendentes · histórico |
| `/automacoes` | "Automação de Atendimento e Vendas \| Zapbox" | "Pare de usar pessoas para fazer tarefas que podem acontecer sozinhas." | automação entre WhatsApp, atendimento, CRM e sistemas |
| `/crm-vendas` | "CRM para WhatsApp e Gestão de Vendas \| Zapbox" | "Pare de deixar oportunidades escondidas dentro do WhatsApp." | leads · pipeline · processo comercial |
| `/integracoes` | "Integrações WhatsApp, CRM e ERP \| Zapbox" | "Seus sistemas deveriam conversar entre si. Não usar pessoas como ponte." | integrar Zapbox a CRM, ERP, e-commerce |
| `/sales-ai` | "Sales AI para WhatsApp \| Zapbox" | "Inteligência artificial que atende. Qualifica. E sabe quando chamar uma pessoa." | IA de atendimento e qualificação, com handoff |

**A homepage não é o destino ideal para tudo** — há rota específica por
intenção, o que torna possível redirecionar sem perder precisão.

### 5.1 Sobreposição de discurso — achado

`OBSERVED` — **risco de duplicação entre marcas.** Duas rotas do Zapbox usam
praticamente a mesma tagline que a proposta atribuiu a **serviços RC2**:

| Zapbox | RC2 (proposta §6) |
|---|---|
| `/automacoes` H1: "Pare de usar pessoas para fazer tarefas que podem acontecer sozinhas." | Automação de Processos: "Pare de usar pessoas para tarefas que podem acontecer automaticamente." |
| `/integracoes` H1: "Seus sistemas deveriam conversar entre si. Não usar pessoas como ponte." | Integração de Sistemas: "Faça seus sistemas conversarem sem usar sua equipe como ponte." |

`INFERRED` — isso **não** invalida a fronteira, mas significa que o corte não
pode ser feito pelo vocabulário: as duas marcas falam igual. O critério
operante tem de ser o **canal e o objeto**:

- automação/integração **dentro ou a partir do WhatsApp e do funil comercial** → Zapbox;
- automação/integração de **processos e sistemas de retaguarda** (ERP, back-office, dados, workflows internos) → RC2.

Registrado como **risco R-4** (§18) e como insumo para a decisão comercial
`CD-3` (§13).

---

## 6. Auditoria de território, bloco a bloco

`OBSERVED` — classificação por bloco de conteúdo, não por título.

### 6.1 `/solucoes-com-ia`

| Bloco (H2) | Conteúdo | Território |
|---|---|---|
| **IA para atendimento** | responder FAQ · direcionar setor · consultar informações · segunda via/status · **atender fora do horário** | **ZAPBOX** |
| **IA para vendas** | entender necessidade · enviar informações de produto · **encaminhar oportunidades a vendedores** · mensagens comerciais · **follow-up automático** · **recuperar contatos parados** | **ZAPBOX** |
| **IA para operação** | organizar solicitações internas · apoiar decisões com dados · reduzir tarefas administrativas | **RC2_CORE** |
| **IA integrada aos seus sistemas** | plataformas de e-commerce, integrações | **RC2_CORE** |

**2 de 4 blocos são Zapbox.** A `description` lista a ordem
*"responder clientes, qualificar leads, organizar operação e integrar sistemas"*
— o território do produto vem primeiro.

### 6.2 `/servicos/automacoes-com-ia`

| Bloco | Amostra | Território |
|---|---|---|
| `items` (9) | "Atendimento automático com IA" · **"Chatbot para WhatsApp e site"** · "Qualificação de leads" · "Encaminhamento para vendedores ou atendentes" | **ZAPBOX** |
| `painPoints` (5) | clientes sem resposta fora do horário · leads por WhatsApp/site/formulário · triagem dúvida × lead | **ZAPBOX** |
| `useCases` (7) | atendimento inicial no WhatsApp · qualificação antes do vendedor · pré-venda, pós-venda e reativação | **ZAPBOX** |
| `integrations` (9) | WhatsApp · site · formulários · CRM · planilhas | **MIXED** — CRM/planilhas também são RC2 |
| `benefits` (6) | menos perda de leads · atendimento mais rápido · processo comercial | **ZAPBOX** |
| FAQ (5) | "A IA substitui minha equipe de atendimento?" · "integrar com WhatsApp e CRM?" | **ZAPBOX** |

**Praticamente 100% Zapbox.** Além disso, `items` contém **"Chatbot para
WhatsApp e site"** — termo **proibido** por `AGENTS.md`, que exige "agente de
IA". `LEGACY_NO_LONGER_RELEVANT`.

### 6.3 As três `/solucoes/*`

| URL | Público-alvo | Sintomas | Abordagem | Território |
|---|---|---|---|---|
| `atendimento-lento` | "empresas que recebem muitos contatos pelo WhatsApp" · equipe comercial sobrecarregada | cobrança de resposta · leads não atendidos · perguntas repetidas | triagem · primeira resposta · qualificação · **handoff para humano** | **ZAPBOX**, com 1 item MIXED |
| `leads-sem-resposta` | leads em múltiplos canais · times que dependem de WhatsApp · **PMEs sem CRM** | leads não registrados · sem histórico · baixa conversão | centralizar entrada · qualificar · **enviar ao vendedor ou CRM** | **ZAPBOX**, com 1 item MIXED |
| `whatsapp-desorganizado` | vendem/atendem pelo WhatsApp · **múltiplos atendentes no mesmo canal** | conversas somem · resposta fora de ordem · vendas dependem da memória | triagem · prioridade · encaminhamento | **ZAPBOX** ~integral |

**O item MIXED em cada uma** é o mesmo: *"Integrar WhatsApp, formulários, CRM e
planilhas quando necessário"* / *"Falta de integração entre formulário,
WhatsApp, CRM e planilhas"*. Isso é a **integração Zapbox ↔ demais sistemas**,
que `docs/11` §8 e `docs/14` §5.8 já atribuem à RC2 quando contratada. É uma
fração pequena e **já coberta** por `/solucoes#integracao-de-sistemas` e pela
Operação Gerenciada.

**Todas as três carregam `metrics`** ("taxa de conversão", "custo por lead
aproveitado", "tempo médio de primeira resposta"). São **nomes de indicadores a
medir**, não resultados afirmados — não violam a regra de claims, mas também
não devem ser transportados para lugar nenhum sem revisão.

---

## 7. `/solucoes-com-ia` — decisão

**Pergunta A — a página deveria deixar de existir?**
`INFERRED` — **sim, como está.** O enquadramento "Como a IA pode ajudar sua
empresa na prática" foi substituído por `/solucoes#ia-para-operacoes` e pelo
Zapbox; a página é hoje um híbrido que a arquitetura vigente não tem.

**Pergunta B — existe UM destino equivalente?**
`OBSERVED` — **não.** Metade da intenção é Zapbox e metade é RC2. Qualquer
redirect único descarta metade do tráfego numa página que declara não cobrir
aquele território.

**Pergunta C — precisa ser dividida?**
`INFERRED` — **sim.** Classificação: **`SPLIT_INTENT`**.

### 7.1 Tratamento proposto — `CONSOLIDATE_AND_SPLIT`

`INFERRED` — em vez de um redirect global, a URL é **reescrita como página de
roteamento de intenção**, curta, e **permanece 200**:

- os dois blocos RC2 (operação, sistemas) são absorvidos por
  `/solucoes#ia-para-operacoes` — já cobertos hoje, sem lacuna material;
- os dois blocos Zapbox saem do domínio RC2 e viram encaminhamento explícito
  para `zapbox.cloud/sales-ai`;
- a página passa a existir para dizer **onde cada intenção é resolvida**.

**Por que não redirecionar:** `OBSERVED` — a URL é **PRESENTE no sitemap**,
`index, follow`, self-canonical, e tem histórico orgânico próprio para
"soluções com IA". Um `SPLIT_INTENT` preserva o sinal e resolve o território;
um redirect global perde metade da intenção.

**Alternativa registrada e não escolhida:** redirecionar tudo para
`#ia-para-operacoes`. Rejeitada pelo mesmo motivo que a reprovou em `docs/16`
§7.1 — não houve fato novo que a torne equivalente.

`NEEDS_SEO_DATA` — se o Search Console mostrar que o tráfego desta URL é
majoritariamente de uma das duas metades, a decisão pode simplificar para
redirect único. **A decisão atual não depende desse dado**; ele só a
simplificaria.

---

## 8. `/servicos/automacoes-com-ia` — decisão

**É essencialmente Zapbox?** `OBSERVED` — **sim**, em todos os blocos (§6.2).

**Há conteúdo RC2 relevante?** Apenas `integrations` cita CRM e planilhas —
`MIXED`, e já coberto por `#integracao-de-sistemas`.

**Há conteúdo a absorver antes do redirect?** `INFERRED` — **não pela RC2.**
O que é único aqui (chatbot de WhatsApp, qualificação de leads, encaminhamento
para vendedores) é exatamente o que a RC2 **não deve** absorver. Absorver seria
violar a regra de território.

**O destino é externo?** `INFERRED` — sim: **`https://zapbox.cloud/sales-ai`**,
por equivalência de intenção (§9).

**Redirect externo permanente é desejável?**
`INFERRED` — **é desejável, mas não como primeiro passo.** Ver §10: a decisão
sobre *externo permanente* é `COMMERCIAL_DECISION_REQUIRED` (`CD-2`), porque
transfere sinal de domínio de forma irreversível.

**Classificação:** **`EXECUTE_AFTER_ABSORPTION`** — onde "absorção" significa
**publicar a ponte de marca**, não copiar conteúdo. Ver §10.2.

---

## 9. Matriz de equivalência para destino externo

`OBSERVED` + `INFERRED`:

| Source | Source intent | Target | Target intent | Overlap | Missing on target | Extra on target | Brand risk | SEO risk | Equivalente? |
|---|---|---|---|---|---|---|---|---|---|
| `/servicos/automacoes-com-ia` | automação de atendimento e vendas com IA, no WhatsApp | `zapbox.cloud/sales-ai` | IA que atende, qualifica e faz handoff | **alto** | integrações com planilhas/CRM próprios do cliente | planos, demonstração | médio | **alto** — cross-domain | **SIM** |
| `/solucoes/whatsapp-desorganizado` | WhatsApp desorganizado, vários atendentes, histórico | `zapbox.cloud/` | "Transforme seu WhatsApp em uma operação organizada" | **muito alto** | nenhum material | preços, planos | médio | alto | **SIM** |
| `/solucoes/leads-sem-resposta` | leads perdidos, sem CRM, primeira resposta | `zapbox.cloud/crm-vendas` | "Do WhatsApp para o pipeline" | **alto** | conteúdo de tráfego pago | pipeline visual | médio | alto | **SIM** |
| `/solucoes/atendimento-lento` | tempo de resposta, triagem, FAQ, handoff | `zapbox.cloud/sales-ai` | atende, qualifica, chama pessoa | **alto** | indicadores de tempo de resposta | demonstração | médio | alto | **SIM** |
| `/solucoes-com-ia` | metade RC2, metade Zapbox | — | — | **parcial** | metade RC2 | — | **alto** | alto | **NÃO** |

`INFERRED` — quatro das cinco têm equivalência real. **Nenhuma delas, porém,
está aprovada para redirect externo permanente** enquanto `CD-2` não for
decidida (§13).

---

## 10. Por que um redirect externo permanente não é trivial

`INFERRED` — é a diferença central entre esta fase e a migração SAFE_NOW.

Na Fase 5, os redirects moviam sinal **dentro do mesmo domínio**: o valor
permanecia em `rc2solucoes.com.br`. Aqui, um `308` para `zapbox.cloud`:

1. **transfere sinal de domínio** de forma irreversível na prática;
2. **remove 4 URLs indexadas** do domínio institucional, que hoje somam parte
   relevante das 29 URLs do sitemap;
3. o usuário **sai do site** sem passar por nenhuma mensagem da RC2 — sem
   handoff de marca;
4. o Zapbox é um **domínio que a RC2 não versiona neste repositório**: se uma
   rota lá mudar, o redirect quebra e nada neste projeto avisa.

### 10.1 Opção A — redirect externo direto (308)

Ganho: consolida o território de uma vez.
Custo: irreversível, sem handoff, dependente de um domínio externo.

### 10.2 Opção B — ponte de marca antes do redirect `INFERRED` (recomendada)

As URLs permanecem **200 e PRESENTES no sitemap**, mas o conteúdo passa a ser
uma **página de transição curta**: reconhece o problema, diz explicitamente que
esse território é do Zapbox — produto da própria RC2 — e leva ao destino
específico com link instrumentado.

Ganhos: o sinal orgânico continua no domínio institucional; o visitante entende
por que está sendo levado a outro domínio; o clique passa a ser **mensurável**
(hoje não é — as páginas não têm link editorial para o produto, §3.1); e a
decisão continua reversível.

Custo: mantém 4 URLs para revisar depois, e adia a consolidação.

**Recomendação:** **Opção B primeiro**, com o redirect permanente reavaliado
depois, à luz do comportamento medido. `CD-2` decide.

---

## 11. `/servicos/automacao-de-atendimento` — chain

`OBSERVED` — hoje: `308 → /servicos/automacoes-com-ia` (1 salto).

`INFERRED` — **o alias precisa viajar na mesma unidade** que o seu destino. Se
`automacoes-com-ia` mudar de destino e o alias não for reapontado:

```
/servicos/automacao-de-atendimento → /servicos/automacoes-com-ia → destino   (2 saltos)
```

| Cenário para `automacoes-com-ia` | Disposição do alias |
|---|---|
| Opção B (permanece 200 como ponte) | **não muda** — continua 1 salto, sem chain |
| Opção A (redirect externo) | **reapontar para o mesmo destino externo**, em 1 salto |

É a mesma regra que salvou `integracao-de-sistemas` e `operacoes-digitais` na
Fase 5. `AUSENTE do sitemap` em qualquer cenário — aliases não entram.

---

## 12. Agenda Confirmada — inventário

### 12.1 Fatos aprovados

`APPROVED` (proposta §5 e §6; `AGENTS.md`; `docs/09`; `docs/12` §5.4):

| Campo | Valor |
|---|---|
| Categoria | **solução vertical RC2 para clínicas** — não é produto próprio como o Zapbox |
| Tagline | "Confirmações automáticas, menos trabalho manual e mais previsibilidade na agenda." |
| Problema | recepção confirmando agenda manualmente · faltas · horários vagos |
| Benefício | organizar lembretes, confirmações e fluxos de agenda |
| ICP | **clínicas e consultórios** |
| Canal | **WhatsApp** |
| Integração | "nas operações mais estruturadas, integra-se ao **sistema da clínica** para acompanhar cancelamentos, horários liberados e indicadores de agenda" |
| CTA aprovado | **"Ver Agenda Confirmada"** (`AGENTS.md`) |
| Rota prevista | `/solucoes/agenda-confirmada` (skill `rc2-site-migration`) |
| Gatilho de roteamento | clínicas · agenda · confirmações · lembretes · faltas · horários vagos (`AGENTS.md`) |

`OBSERVED` — copy vigente na Home (`home.ts`, Fase 4): *"Confirmações e
lembretes de consulta sem depender da recepção ligar uma a uma, reduzindo
faltas e horários vagos."* CTA atual: **"Falar sobre agenda e confirmações"** →
`/contato`, porque a rota é 404 (`docs/12` §5.4).

### 12.2 O que **não** está definido

`UNDEFINED` — nenhuma fonte responde:

| # | Lacuna |
|---|---|
| U-1 | **Modelo comercial** — mensalidade, setup, por profissional, por clínica? Nenhuma fonte cita preço ou formato. |
| U-2 | **Fluxo operacional** — quem envia, em que janela, quantas tentativas, o que acontece na não-resposta. |
| U-3 | **Entrada e saída de dados** — a agenda vem de qual sistema? Há integração pronta com algum software de clínica? Qual? |
| U-4 | **Base técnica** — roda sobre o Zapbox, sobre automação própria (n8n), ou os dois? |
| U-5 | **Número de WhatsApp** — usa o número da clínica? Exige API oficial? |
| U-6 | **Estágio** — está em produção com clientes, em piloto, ou é oferta nova? |
| U-7 | **Claims de resultado** — "reduz faltas" é benefício declarado; não há métrica documentada. |

**Nenhuma dessas foi preenchida por inferência.** Sete lacunas, das quais U-3,
U-4 e U-6 bloqueiam a criação da rota.

### 12.3 Relação Zapbox × Agenda Confirmada

`OBSERVED` — a proposta separa as duas explicitamente: *"O Zapbox passa a ser o
**produto próprio** da RC2. O Agenda Confirmada permanece uma **solução
vertical da RC2 para clínicas**."* São categorias distintas na mesma seção do
portfólio.

`OBSERVED` — mas a Agenda Confirmada **opera por WhatsApp**, que é território
declarado do Zapbox. As fontes **não dizem** se ela é construída sobre o produto.

Das opções da tarefa:

- **A. produto independente** — contraria "solução vertical", que é categoria
  distinta de "produto próprio";
- **B. módulo do Zapbox** — nenhuma fonte diz isso; a proposta as separa;
- **C. solução construída sobre o Zapbox** — **compatível** com tudo o que está
  escrito, mas **não afirmado** por nenhuma fonte;
- **D. serviço RC2** — parcialmente: "solução vertical" sugere oferta
  empacotada, não serviço sob medida;
- **E. combinação** — plausível;
- **F. não definido** — é o estado factual das fontes.

**Classificação: `COMMERCIAL_DECISION_REQUIRED` (`CD-1`).**

`INFERRED` — a leitura mais consistente com as fontes é **C**: solução vertical
RC2, com o WhatsApp entregue pela infraestrutura do próprio produto. Isso
explicaria por que a proposta a mantém sob a marca RC2 mesmo operando no canal
do Zapbox. **Mas é leitura, não fato — e a resposta muda a página inteira**
(§13).

---

## 13. Rota `/solucoes/agenda-confirmada`

`OBSERVED` — hoje **404**, **AUSENTE do sitemap**, sem nenhum link no código
apontando para ela — a Fase 4 proibiu explicitamente esse `href`
(`docs/13` §356).

**Decisão: `DEFER_ROUTE`.**

`INFERRED` — não por falta de importância, mas porque **três das sete lacunas
de §12.2 bloqueiam a arquitetura da página**, não apenas a copy:

| Lacuna | Por que bloqueia a rota |
|---|---|
| **U-4** (base técnica) | define se a página tem CTA para `/contato` ou para o Zapbox, e se a fronteira de território precisa ser declarada nela |
| **U-3** (integração com sistema da clínica) | define se existe seção de integrações ou se a promessa é só de canal |
| **U-6** (estágio) | define se a página vende uma oferta ativa ou registra uma capacidade — e se pode haver prova |

Publicar uma rota indexável sobre um produto cujo modelo não está definido cria
uma URL que precisará ser reescrita — exatamente o que esta reformulação
passou cinco fases corrigindo.

### 13.1 Condição de desbloqueio

`CD-1` respondida (§12.3) **e** U-3, U-4, U-6 preenchidas. Com isso, a rota
passa a `CREATE_ROUTE` e ganha desenho próprio na unidade 6A.

### 13.2 O que fica valendo enquanto isso

`APPROVED` — o tratamento da Fase 4 permanece: a Agenda Confirmada aparece na
Home, na seção de produtos, com CTA **"Falar sobre agenda e confirmações"** →
`/contato`, **sem link para a rota inexistente**.

`INFERRED` — o CTA aprovado em `AGENTS.md`, "Ver Agenda Confirmada", só volta a
ser aplicável quando houver o que ver. Registrar como dívida de vocabulário, não
como violação.

---

## 14. Internal links

`OBSERVED` — inventário completo no repositório.

### 14.1 `RUNTIME_CODE` / `CONTENT_COLLECTION`

| Arquivo | Referências |
|---|---|
| `src/lib/content/solutions.ts` | **3×** `relatedServices.href = /servicos/automacoes-com-ia` (linhas 85, 178, 475) · **3×** `relatedLinks` para o mesmo · **2×** `/solucoes-com-ia` (linhas 123, e via services) |
| `src/lib/content/services.ts` | **2×** `/solucoes-com-ia` (136, 249) · **3×** `/servicos/automacoes-com-ia` (248, 361, 589) |
| `src/app/sitemap.ts` | `/solucoes-com-ia` em `staticPages` (linha 42) |
| `src/app/(public)/solucoes-com-ia/page.tsx` | canonical e OG próprios |
| `src/lib/content/navigation.ts` | apenas **comentário** — nenhum link |

### 14.2 Armadilha A-1 recorrente

`OBSERVED` — **as 3 ocorrências de `relatedServices.href =
"/servicos/automacoes-com-ia"` são também a chave de lookup reverso** que faz
`/servicos/automacoes-com-ia` exibir sua "solução relacionada"
(`servicos/[slug]/page.tsx:53-55`).

É exatamente o achado que quase quebrou a Fase 5. Se essas 3 forem reapontadas
e a página continuar renderizando (Opção B), **ela perde o bloco**. Qualquer
plano da Fase 6 precisa do mesmo teste-guarda.

### 14.3 `TEST`

`tests/e2e/services.spec.ts` inclui `automacoes-com-ia` em `RENDERED_SLUGS`, e
`tests/unit/seo/internalLinks.test.ts` afirma que os links para
`/solucoes-com-ia` **permanecem**. Ambos precisam acompanhar qualquer mudança.

### 14.4 `CMS`

`DEFERRED` — o banco não foi consultado. `CMS_INTERNAL_LINK_DEBT` da Fase 5
continua aberta e cresce se estas URLs mudarem. Não bloqueia; precisa ser
registrada.

### 14.5 `OPERATIONAL_DOCUMENTATION`

`OBSERVED` — `docs/BLOG_INTERNAL_LINKING_GUIDE.md` mantém o cluster
"Atendimento com IA" apontando para `/servicos/automacoes-com-ia`, com a nota
da Fase 5 dizendo que o território aguarda a Fase 6. **É esta fase.** O guia
precisa ser fechado junto.

---

## 15. Sitemap

`OBSERVED` — estado atual em Production, sem ambiguidade:

| URL | Situação |
|---|---|
| `/solucoes-com-ia` | **PRESENTE no sitemap** |
| `/servicos/automacoes-com-ia` | **PRESENTE no sitemap** |
| `/solucoes/atendimento-lento` | **PRESENTE no sitemap** |
| `/solucoes/leads-sem-resposta` | **PRESENTE no sitemap** |
| `/solucoes/whatsapp-desorganizado` | **PRESENTE no sitemap** |
| `/servicos/automacao-de-atendimento` | **AUSENTE do sitemap** (alias) |
| `/solucoes/agenda-confirmada` | **AUSENTE do sitemap** (404) |

`APPROVED` — regra mantida: uma URL só sai do sitemap **na mesma unidade** em
que deixa de ser 200 + indexável + canônica.

Consequência das opções: com a **Opção B**, as cinco continuam **PRESENTES**.
Com a **Opção A**, quatro saem — e o sitemap cai de 29 para 25.

`OBSERVED` — a remoção usaria o mesmo mecanismo já implantado na Fase 5:
`MIGRATED_SERVICE_SLUGS` em `sitemap.ts`, mais o equivalente para
`solutionRoutes` e para `/solucoes-com-ia` em `staticPages`. **Sem mutilar
`services.ts` nem `solutions.ts`.**

---

## 16. Analytics

`OBSERVED` — séries hoje vivas nas superfícies candidatas:

| Location | Onde | Ação proposta |
|---|---|---|
| `service_detail_midpoint`, `service_detail_benefits` | `/servicos/[slug]` | `PRESERVE` na Opção B · `SOURCE_PAGE_SERIES_ENDED` na Opção A |
| `service_related_links`, `service_navigation_prev/next` | `/servicos/[slug]` | idem |
| `solution_detail_midpoint`, `solution_related_links`, `solution_related_services` | `/solucoes/[slug]` | idem |
| `home_products` / `conhecer_zapbox`, `agenda_confirmada` | Home | `PRESERVE` |
| `footer_produto` / `conhecer_zapbox` | Footer | `PRESERVE` |
| `solutions_managed_ops` | `/solucoes` | `PRESERVE` |

`INFERRED` — **`NEW_SURFACE_REQUIRED` na Opção B:** as páginas-ponte passam a
ter link editorial para o Zapbox, que hoje não existe (§3.1). Sugestão de
identificadores, a fechar no plano: `location: "zapbox_bridge"`, label = slug da
rota de destino. **Nenhum event kind novo** — `cta_click` já cobre.

`TAXONOMY_DEBT` — `docs/10` continua aberta (`solicitar_diagnostico`,
`diagnostico_gratuito`, `comenzar_diagnostico`). **Não é resolvida aqui.**

**Nenhum identificador histórico é reutilizado com novo significado.**

---

## 17. Dependências externas

| Classe | Itens |
|---|---|
| **`SAFE_BY_EQUIVALENCE`** | equivalência de intenção das 4 URLs Zapbox (§9); tratamento do alias (§11); fechamento do guia do blog (§14.5) |
| **`NEEDS_SEARCH_CONSOLE`** | volume e consultas de `/solucoes-com-ia` (simplificaria §7, não bloqueia); volume das 3 `/solucoes/*` para dimensionar a perda na Opção A |
| **`NEEDS_BACKLINK_DATA`** | backlinks apontando para as 4 URLs — determinam quanto sinal seria transferido para fora do domínio |
| **`NEEDS_BUSINESS_DECISION`** | `CD-1`, `CD-2`, `CD-3` (§19) |

**A Fase 6 não está integralmente bloqueada:** §14.5, §11 e a unidade 6D podem
avançar sem nenhum dado externo.

---

## 18. Matriz final de URLs

| Source | Status | Sitemap | Território | Intenção | Target | Equivalência | Absorção | Internal links | Sitemap action | Analytics | Decisão | Bloqueador |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/solucoes-com-ia` | 200 | **PRESENTE** | 50% Zapbox / 50% RC2 | mista | — (reescrita) | **não** | RC2 já absorvido | manter os 2 links | **manter** | `PRESERVE` | **`SPLIT_INTENT`** | `CD-3` |
| `/servicos/automacoes-com-ia` | 200 | **PRESENTE** | ZAPBOX | comercial | `zapbox.cloud/sales-ai` | **sim** | nada a absorver | **3 são chave de lookup** (§14.2) | manter (B) / remover (A) | `PRESERVE` (B) | **`EXECUTE_AFTER_ABSORPTION`** | `CD-2` |
| `/servicos/automacao-de-atendimento` | 308 → automacoes-com-ia | **AUSENTE** | ZAPBOX | alias | acompanha o destino | n/a | n/a | nenhum no código | continua ausente | nenhuma | **`EXECUTE_PHASE_6`** (junto) | — |
| `/solucoes/atendimento-lento` | 200 | **PRESENTE** | ZAPBOX (1 bloco MIXED) | informacional-comercial | `zapbox.cloud/sales-ai` | **sim** | bloco MIXED já coberto | 1 related | manter (B) / remover (A) | `PRESERVE` (B) | **`EXECUTE_AFTER_ABSORPTION`** | `CD-2` |
| `/solucoes/leads-sem-resposta` | 200 | **PRESENTE** | ZAPBOX (1 bloco MIXED) | comercial | `zapbox.cloud/crm-vendas` | **sim** | idem | 1 related | manter (B) / remover (A) | `PRESERVE` (B) | **`EXECUTE_AFTER_ABSORPTION`** | `CD-2` |
| `/solucoes/whatsapp-desorganizado` | 200 | **PRESENTE** | ZAPBOX integral | comercial | `zapbox.cloud/` | **sim, muito alta** | nada a absorver | 1 related | manter (B) / remover (A) | `PRESERVE` (B) | **`EXECUTE_AFTER_ABSORPTION`** | `CD-2` |
| `/solucoes/agenda-confirmada` | **404** | **AUSENTE** | RC2 vertical | — | — | — | — | nenhum (proibido) | permanece ausente | — | **`DEFER_ROUTE`** | `CD-1` + U-3/U-4/U-6 |

### Fora desta decisão — inalterados

| URL | Status | Sitemap | Classificação |
|---|---|---|---|
| `/servicos/e-commerce` | 200 | **PRESENTE** | `NEEDS_SEO_DATA` |
| `/solucoes/processos-manuais` | 200 | **PRESENTE** | `NEEDS_SEO_DATA` |
| `/solucoes/sistemas-desconectados` | 200 | **PRESENTE** | `NEEDS_SEO_DATA` |
| `/servicos/sites-e-landing-pages` | 200 | **PRESENTE** | `KEEP` |
| `/servicos` (hub) | 200 | **PRESENTE** | `DEFER` — condicionado aos filhos |
| slug corrompido do blog · `/avaliacoes` · taxonomia de analytics | — | — | unidades separadas |

**Não resolver por oportunismo.**

---

## 19. Decisões que bloqueiam implementação

### `CD-1` — Natureza da Agenda Confirmada

**Pergunta:** a Agenda Confirmada é (A) produto independente, (B) módulo do
Zapbox, (C) solução vertical RC2 **construída sobre** o Zapbox, (D) serviço RC2
sob medida, ou (E) combinação?

**Por que bloqueia:** define o CTA, a fronteira de território na página, se há
seção de integrações e se a rota pode existir.
**Leitura mais provável (não confirmada):** **C**.
**Bloqueia:** unidade 6A inteira.

### `CD-2` — Redirect externo permanente

**Pergunta:** as 4 URLs de território Zapbox devem **(A)** receber `308`
permanente para `zapbox.cloud`, ou **(B)** virar páginas-ponte 200 no domínio
RC2, com o redirect reavaliado depois?

**Por que bloqueia:** é irreversível na prática e transfere sinal para fora do
domínio institucional.
**Recomendação deste documento:** **B primeiro**.
**Bloqueia:** unidades 6B e 6C.

### `CD-3` — Fronteira de automação e integração entre as marcas

**Pergunta:** com Zapbox e RC2 usando taglines quase idênticas para automação e
integração (§5.1), qual é o critério oficial de corte?

**Proposta deste documento:** canal e objeto — WhatsApp e funil comercial →
Zapbox; processos e sistemas de retaguarda → RC2.
**Por que bloqueia:** define a copy da `/solucoes-com-ia` reescrita e das
páginas-ponte.
**Bloqueia:** unidade 6B.

**Nenhuma outra decisão bloqueante.** As unidades 6D e 6E podem avançar sob
qualquer resposta.

---

## 20. Arquitetura de navegação proposta

`INFERRED` — como RC2, Zapbox e Agenda Confirmada coexistem:

| Superfície | RC2 | Zapbox | Agenda Confirmada |
|---|---|---|---|
| **Header** | Início · Soluções · Sobre · Blog + CTA | **não aparece** | **não aparece** |
| **Footer** | coluna "Soluções" com as 5 âncoras | linha "Produto" → `zapbox.cloud` *(já existe)* | **não aparece** enquanto não houver rota |
| **Home** | problema, 4 competências, método, autoridade | seção de produtos, link externo *(já existe)* | seção de produtos, CTA → `/contato` *(já existe)* |
| **`/solucoes`** | as 4 competências + Operação Gerenciada | fronteira declarada em `#ia-para-operacoes` *(já existe)* | **entra quando a rota existir** |
| **`/contato`** | conversa inicial, Discovery, faixa de preço | — | recebe hoje o interesse de agenda |

**Quando o usuário permanece em `rc2solucoes.com.br`:** problema operacional
interno, integração entre sistemas, IA sobre processo, commerce, continuidade
técnica, e — quando a rota existir — agenda de clínicas.

**Quando sai para `zapbox.cloud`:** WhatsApp, atendimento, equipe de
atendimento, CRM comercial, Sales AI.

`INFERRED` — **o Header não recebe Zapbox nem Agenda Confirmada.** O Header tem
quatro itens por decisão da Fase 5; produtos vivem na Home, no Footer e em
`/solucoes`. Acrescentar produto ao Header reabriria a arquitetura de navegação
sem necessidade.

---

## 21. Jornadas

`INFERRED`:

| # | Situação | Landing | Mensagem | Oferta | CTA | Próximo passo |
|---|---|---|---|---|---|---|
| **A** | problema operacional interno — trabalho manual, sistemas desconectados | `/` → `/solucoes#automacao-de-processos` ou `#integracao-de-sistemas` | "sua operação cresceu, o processo não acompanhou" | Automação · Integração · IA para Operações | **Falar sobre minha operação** | conversa inicial → Discovery se houver incerteza estrutural |
| **B** | WhatsApp, atendimento, vendas, leads | hoje: `/solucoes/whatsapp-desorganizado` etc. · alvo: página-ponte ou `zapbox.cloud` | "esse território é do Zapbox, produto da própria RC2" | **Zapbox** | **Conhecer Zapbox** | sai para `zapbox.cloud`, na rota específica |
| **C** | clínica — confirmações, faltas, horários vagos | hoje: Home (seção de produtos) · alvo: `/solucoes/agenda-confirmada` | "confirmações sem a recepção ligar uma a uma" | **Agenda Confirmada** | hoje **Falar sobre agenda e confirmações** → `/contato`; depois **Ver Agenda Confirmada** | conversa inicial |
| **D** | já usa Zapbox e precisa integrá-lo ao ERP/CRM/sistemas | `/solucoes#integracao-de-sistemas` ou `#operacao-gerenciada` | "o fluxo entre as plataformas, não o atendimento que roda dentro delas" | Integração de Sistemas · Operação Gerenciada | **Falar sobre minha operação** | conversa inicial |

`OBSERVED` — a jornada **D** já está coberta: `docs/14` §5.8 e a seção de
Operação Gerenciada em produção declaram que as integrações Zapbox ↔ sistemas
entram no acompanhamento técnico da RC2 quando contratadas. **Nada a criar.**

---

## 22. Claims

| Classe | Itens |
|---|---|
| **`APPROVED_CLAIM`** | Zapbox = produto próprio da RC2 · Agenda Confirmada = solução vertical RC2 para clínicas · território WhatsApp/atendimento/vendas/CRM/Sales AI = Zapbox · Agenda Confirmada opera por WhatsApp e integra-se ao sistema da clínica "nas operações mais estruturadas" · taglines e pitches da proposta §6 |
| **`OBSERVED_PRODUCT_CAPABILITY`** | do site do Zapbox: atendimento em equipe no mesmo número · histórico · CRM e pipeline · automações entre WhatsApp/CRM/sistemas · integrações com CRM, ERP, e-commerce, formulários · Sales AI que qualifica e faz handoff · planos publicados. **Citável como capacidade observada do produto, com atribuição** |
| **`UNVERIFIED`** | as 7 lacunas de §12.2 · qualquer número de redução de faltas, taxa de resposta, aumento de vendas, economia ou conversão · SLA, prazo de implantação, volume de clientes |
| **`PROHIBITED`** | **"chatbot"** (`AGENTS.md` exige "agente de IA") — hoje presente em `automacoes-com-ia` · qualquer métrica sem documentação · cliente, case, depoimento ou parceria inventados · a RC2 oferecer, em nome próprio, atendimento/vendas por WhatsApp |

`OBSERVED` — as `metrics` das três `/solucoes/*` são **indicadores a medir**,
não resultados afirmados. Não violam a regra, mas não devem ser transportadas
sem revisão.

---

## 23. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R-1 | Redirect externo permanente é irreversível e transfere sinal para fora do domínio | `CD-2`; Opção B primeiro; medir antes de consolidar |
| R-2 | Perda de intenção em `/solucoes-com-ia` (metade RC2) | `SPLIT_INTENT`, não redirect global |
| R-3 | Handoff de marca abrupto — usuário sai sem contexto | páginas-ponte declarando que o Zapbox é produto da própria RC2 |
| R-4 | Duplicação de discurso RC2 × Zapbox em automação e integração (§5.1) | `CD-3` — corte por canal e objeto |
| R-5 | Agenda Confirmada publicada sem definição suficiente | `DEFER_ROUTE` até `CD-1` + U-3/U-4/U-6 |
| R-6 | Perda de tráfego orgânico de 4 URLs indexadas | `NEEDS_SEARCH_CONSOLE` e `NEEDS_BACKLINK_DATA` antes da Opção A |
| R-7 | Chain via `automacoes-com-ia` se o alias não viajar junto | §11 — mesma unidade, sempre |
| R-8 | Sitemap publicando URL que redireciona | regra da §15, com o mecanismo já implantado na Fase 5 |
| R-9 | Quebrar o lookup reverso ao reapontar `relatedServices` (§14.2) | teste-guarda obrigatório, como na Fase 5 |
| R-10 | Analytics fragmentado entre domínios — o clique de saída não é medido hoje | `NEW_SURFACE_REQUIRED` (§16) |
| R-11 | Links legados no CMS apontando para URLs migradas | `CMS_INTERNAL_LINK_DEBT`; redirect mantém tudo funcional |
| R-12 | Rota do Zapbox mudar e quebrar o redirect, sem aviso neste repositório | preferir Opção B; se A, checagem periódica dos 5 destinos |

---

## 24. Faseamento recomendado

`INFERRED` — cinco unidades pequenas, ordenadas por dependência:

| Unidade | Escopo | Depende de | Pode começar agora? |
|---|---|---|---|
| **6A — Agenda Confirmada** | responder `CD-1` + U-3/U-4/U-6; então desenhar e criar `/solucoes/agenda-confirmada` | `CD-1` | **não** |
| **6B — Fronteira e ponte de marca** | `CD-3`; reescrever `/solucoes-com-ia` como `SPLIT_INTENT`; converter as 4 URLs Zapbox em páginas-ponte | `CD-2`, `CD-3` | **não** |
| **6C — Migração de URL** | redirects externos permanentes + alias + sitemap + internal links + testes | `CD-2` e o resultado medido de 6B | **não** |
| **6D — Higiene de descoberta** | fechar `BLOG_INTERNAL_LINKING_GUIDE.md`; remover "chatbot" de `automacoes-com-ia`; revisar `llms-full.txt` | — | **sim** |
| **6E — Limpeza** | reavaliar `NEEDS_SEO_DATA`, hub `/servicos`, remoção física | 6C estável | **não** |

`INFERRED` — **6D é a única que avança sem nenhuma decisão pendente**, e
resolve duas dívidas já identificadas: o guia que ainda manda criar links para
território Zapbox e o termo proibido em produção.

**A ordem 6B → 6C é deliberada:** medir a ponte antes de tornar a saída
permanente.

---

## 25. Fora do escopo

`/servicos/e-commerce` · `/solucoes/processos-manuais` ·
`/solucoes/sistemas-desconectados` (`NEEDS_SEO_DATA`) ·
`/servicos/sites-e-landing-pages` (`KEEP`) · hub `/servicos` · slug corrompido
do blog · renomear `/avaliacoes` · taxonomia global de analytics
(`docs/10`) · edição em massa do CMS · qualquer alteração em `zapbox.cloud` ·
remoção física de páginas · `llms-full.txt` além do registro.

---

## 26. Decisões fechadas neste documento

1. **`/solucoes-com-ia` = `SPLIT_INTENT`** — não recebe redirect global; a
   metade RC2 já está absorvida, a metade Zapbox é encaminhada.
2. **`/servicos/automacoes-com-ia` = território Zapbox integral**, destino
   `zapbox.cloud/sales-ai`, equivalência confirmada.
3. **As três `/solucoes/*` têm destino específico e equivalente** —
   `sales-ai`, `crm-vendas` e a home do Zapbox, respectivamente.
4. **O alias `automacao-de-atendimento` viaja com o seu destino**, sempre em 1
   salto, e continua **AUSENTE do sitemap**.
5. **Nenhum redirect externo é aprovado enquanto `CD-2` não for decidida.**
6. **Recomendação: ponte de marca (Opção B) antes de redirect permanente.**
7. **`/solucoes/agenda-confirmada` = `DEFER_ROUTE`** — 3 lacunas bloqueiam a
   arquitetura, não só a copy.
8. **A natureza da Agenda Confirmada é `COMMERCIAL_DECISION_REQUIRED`** — as
   fontes a separam do Zapbox, mas não dizem sobre o que ela roda.
9. **Header não recebe produto**; Zapbox e Agenda Confirmada vivem na Home, no
   Footer e em `/solucoes`.
10. **As cinco URLs candidatas continuam PRESENTES no sitemap** enquanto forem
    200 e indexáveis.
11. **6D pode começar imediatamente**; as demais dependem de `CD-1`/`CD-2`/`CD-3`.
12. **Nenhum redirect foi executado, nenhuma rota criada, nada implementado
    nesta tarefa.**
