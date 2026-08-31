# Fase 5 — Consolidação de /solucoes — Design

> **Design, inventário e plano de migração. Não é implementação.** Nenhum
> arquivo em `src/`, redirect, sitemap, robots, rota, Header, Footer ou banco
> foi alterado nesta tarefa. **Nenhum redirect é executado aqui.**
>
> Este documento precisa de revisão do responsável pelo negócio antes do plano
> técnico da Fase 5.

**Baseline:** `main @ c74b6f1` · Fases 0, 1, 2, 3 e 4 publicadas.

### Convenção de marcação

| Marca | Significado |
|---|---|
| `APPROVED` | Consta em fonte oficial do projeto, citada. |
| `OBSERVED` | Verificado nesta tarefa, no código ou em produção. |
| `INFERRED` | Proposta de design derivada das fontes; decisão deste documento. |
| `DEPENDÊNCIA EXTERNA` | Falta dado externo; o documento diz qual, o impacto e a decisão provisória segura. |

### Nota de autoridade

`docs/02-plano-fases-execucao.md` descreve a numeração histórica da construção
inicial do site e **não** define a sequência da reformulação de 2026. A
sequência vigente, registrada no baseline: **Fase 4 = Home · Fase 5 =
consolidação de `/solucoes` · Fase 6 = Agenda Confirmada e território Zapbox.**

---

## 1. Objetivo

Transformar `/solucoes` na **página comercial central da RC2**, organizada pelas
quatro competências aprovadas, e planejar como a navegação e os links internos
deixam de promover a arquitetura legada — **sem remover nenhuma URL**.

---

## 2. Fontes de verdade

`AGENTS.md` · `PRODUCT.md` · `DESIGN.md` · `RC2_PROPOSTA_ATUALIZACAO.txt` ·
`RC2_PROMPT_MESTRE_REFORMULACAO.txt` · `RC2_Brand_Guide_v2.1.md` · `docs/08` a
`docs/13` · skills `rc2-site-migration` e `rc2-brand-system`.

Código inspecionado sem edição: `/solucoes`, `/solucoes/[slug]`, `/servicos`,
`/servicos/[slug]`, `/solucoes-com-ia`, `solutions.ts`, `services.ts`,
`Header.tsx`, `Footer.tsx`, `home.ts`, `sitemap.ts`, `robots.ts`,
`next.config.ts`, `globals.css`, tracking.

---

## 3. Estado atual

`OBSERVED` — `/solucoes` hoje:

| Item | Valor |
|---|---|
| `title` | "Soluções por Problema" |
| `description` | "Encontre soluções para **atendimento lento, leads sem resposta**, processos manuais, sistemas desconectados e **WhatsApp desorganizado**." |
| H1 (`PageHero`) | "Soluções por problema: da dor real à execução" |
| Eyebrow | "Soluções" · label de seção "Mapeamento por dor" |
| Schema | `WebPage` + **`CollectionPage`** (3 ocorrências) |
| Cards | 5, um por slug de `solutions.ts` |
| CTA dos cards | "Ver solução completa" → `/solucoes/<slug>` |
| Analytics | `solution_hub_card` (grid) e `solutions_managed_ops` (seção da Fase 3) |
| Canonical | `https://www.rc2solucoes.com.br/solucoes` |
| Sitemap | presente, prioridade 0.8 |
| Operação Gerenciada | seção `id="operacao-gerenciada"`, aprovada na Fase 3 |

**Três dos cinco cards são território Zapbox** (atendimento lento, leads sem
resposta, WhatsApp desorganizado), e a `description` os coloca na frente.

### Classificação dos blocos atuais

| Bloco | Ação |
|---|---|
| `PageHero` "Soluções por problema" | **SUBSTITUIR** — território e enquadramento errados |
| metadata + `description` | **SUBSTITUIR** |
| schema `CollectionPage` | **REMOVER_DA_PAGINA** — deixa de ser coleção de 5 subpages |
| schema `WebPage` | **REFATORAR** — nova descrição |
| SectionLabel "Mapeamento por dor" | **SUBSTITUIR** |
| Grid de 5 cards por dor | **SUBSTITUIR** pelas 4 competências |
| CTA "Ver solução completa" ×5 | **REMOVER_DA_PAGINA** — rótulo genérico (A11Y-04) |
| Links para `/solucoes/*` | **MIGRAR_PARA_OUTRA_FASE** — as URLs seguem 200; saem desta página |
| Seção Operação Gerenciada | **PRESERVAR** — decisões da Fase 3 intactas |

`OBSERVED` — Header expõe **`/servicos`** e **`/solucoes-com-ia`**; Footer
importa `services` e lista os **5 serviços legados** sob o heading "Serviços",
com a copy institucional "Consultoria especializada em IA, automações e
operações digitais".

---

## 4. Princípios

`/solucoes` **deixa de ser** hub por dor centrado em atendimento, leads e
WhatsApp, e **passa a ser** a página comercial central da RC2:

**Automação de Processos + Integração de Sistemas + IA para Operações +
Operações Digitais & Commerce.**

A página deve responder, nesta ordem: que problemas operacionais a RC2 resolve ·
quais são as quatro competências · como cada uma funciona na prática · quando há
necessidade de Discovery · como a RC2 continua após a implantação · qual o
próximo passo.

`APPROVED` — o território **WhatsApp · equipe · atendimento · vendas · CRM ·
Sales AI** continua pertencendo ao **Zapbox**.

---

## 5. Arquitetura da nova /solucoes

Nove seções. Um único `<h1>`; cada competência é `<h2>`.

### 5.1 Hero

**H1** `INFERRED`: **"Automação, integrações e IA aplicadas à sua operação."**

Não repete o H1 da Home ("Sua operação não precisa de mais ferramentas…"): a
Home nomeia o problema, `/solucoes` nomeia as competências.

**Subheadline** `INFERRED`: "A RC2 atua em quatro frentes conectadas para que
processos e sistemas acompanhem o tamanho da operação — da automação de tarefas
à integração entre plataformas, ERP e dados."

**Eyebrow:** "Soluções RC2".

**CTA principal:** "Falar sobre minha operação" → `/contato`.

**CTA secundário:** **nenhum.** `INFERRED` — na Home o secundário conduzia para
cá; aqui o visitante já chegou, e um segundo botão competiria com a leitura das
quatro competências. A orientação vem da seção 5.2, não de um botão.

**Proibido:** lead · WhatsApp · atendimento automático como enquadramento.

### 5.2 Orientação — como escolher

**Objetivo:** dizer que o visitante **não precisa** chegar sabendo qual
ferramenta, automação ou integração quer. Basta reconhecer o problema
operacional.

Formato: bloco curto ligando cada sintoma à competência correspondente, com
links de âncora internos.

| Sintoma | Vai para |
|---|---|
| "A equipe repete a mesma tarefa todo dia" | `#automacao-de-processos` |
| "Os sistemas não conversam e alguém faz a ponte" | `#integracao-de-sistemas` |
| "Quero usar IA, mas o processo não está estruturado" | `#ia-para-operacoes` |
| "A operação digital cresceu em partes desconectadas" | `#operacoes-digitais-commerce` |

**Proibido:** prometer Discovery gratuito, mapeamento, arquitetura ou roadmap.

### 5.3 Automação de Processos — `#automacao-de-processos`

Cobre: trabalho manual · tarefas repetitivas · copiar e colar entre sistemas ·
planilha usada como sistema · regras de negócio · tratamento de exceções ·
workflows · rastreabilidade do que foi executado.

Sem métrica, prazo ou percentual não documentado.

### 5.4 Integração de Sistemas — `#integracao-de-sistemas`

Cobre: ERP · CRM · APIs · webhooks · plataformas · planilhas · sistemas
internos · dados duplicados · pessoas usadas como ponte entre ferramentas.

**Competência própria**, não subtópico de automação — é a distinção que a Fase 4
já estabeleceu na Home.

### 5.5 IA para Operações — `#ia-para-operacoes`

Cobre: agentes aplicados a processo · classificação · leitura e interpretação de
documentos e mensagens · apoio operacional interno · consultas · análise ·
processamento de informação · contexto · governança · handoff humano.

**Fronteira obrigatória:** não invadir WhatsApp, CRM comercial nem Sales AI —
território Zapbox. **Proibido** "chatbot" ou "chatbot genérico"; o termo é
"agente de IA".

Absorve a intenção de `/solucoes-com-ia` e `/servicos/agentes-de-ia`.

### 5.6 Operações Digitais & Commerce — `#operacoes-digitais-commerce`

Cobre: plataforma · ERP · logística · pagamentos · estoque · pedidos · dados ·
automações · integrações entre essas pontas.

**Proibido** comunicar "fazemos sua loja" como oferta. Sites, interfaces e
e-commerce existem como **componentes de projeto**, nunca como pilar.

### 5.7 Como a RC2 trabalha

Quatro níveis, sem duplicar `/contato`:

| Nível | O que é |
|---|---|
| Conversa inicial | contexto, problema, fit e próximo passo — 20 a 30 min, sem compromisso |
| **Discovery Operacional** | trabalho **pago**, quando há incerteza estrutural: levantamento, arquitetura, riscos, prioridades, estimativa, roadmap |
| Implantação | o projeto RC2 |
| Operação Gerenciada | continuidade técnica após a implantação |

`APPROVED` (`docs/11` §1) — **a faixa de preço do Discovery não se repete
aqui.** Ela vive em `/contato`, com o contexto explicativo exigido pela decisão
1.1. `/solucoes` cita o Discovery nominalmente, como etapa paga.

### 5.8 Operação Gerenciada — `#operacao-gerenciada`

`APPROVED` — seção da Fase 3, **id preservado** porque a Home já aponta para
`/solucoes#operacao-gerenciada`.

**Refino apenas visual**, para integrar-se ao novo ritmo da página. Preservar
sem reescrever: os **nove entregáveis** · não é BPO nem terceirização · o
cliente opera o negócio · fronteira Zapbox · sustentação das integrações
Zapbox ↔ sistemas quando no escopo · projetos novos saem da recorrência ·
contratação mensal · **sem preço público**.

### 5.9 CTA final

"Falar sobre minha operação" → `/contato`. Reforça conversa curta e sem
compromisso.

**Proibido:** levantamento completo, arquitetura ou roadmap gratuitos.

---

## 6. Contrato de âncoras

Estáveis para esta fase e para as seguintes:

```
/solucoes#automacao-de-processos
/solucoes#integracao-de-sistemas
/solucoes#ia-para-operacoes
/solucoes#operacoes-digitais-commerce
/solucoes#operacao-gerenciada
```

- Nomes derivados dos nomes oficiais das competências — semanticamente corretos
  e estáveis.
- IDs **únicos** na página; nenhum colide com id existente.
- `#operacao-gerenciada` **não muda**: já é destino público desde a Fase 3.
- `#operacoes-digitais-commerce` sem "&" nem acento, coerente com os demais.

`OBSERVED` — **o offset do Header sticky já está resolvido**:
`globals.css` define `:where([id]) { scroll-margin-top: 5.5rem; }`, e o Header é
`sticky top-0 z-50`. **Nenhum CSS novo é necessário** para as âncoras.

**Acessibilidade da navegação por hash:** cada âncora é o `<h2>` da competência
ou a `<section>` que o contém, de modo que o leitor de tela anuncie o título ao
saltar. Nenhuma âncora aponta para elemento decorativo.

---

## 7. Home → soluções

`OBSERVED` — a Fase 4 deixou as quatro competências apontando genericamente
para `/solucoes`, porque as âncoras ainda não existiam.

**Decisão** `INFERRED`: **SIM**, os quatro links passam a apontar para as
âncoras específicas.

| Competência na Home | destination atual | destination novo |
|---|---|---|
| Automação de Processos | `/solucoes` | `/solucoes#automacao-de-processos` |
| Integração de Sistemas | `/solucoes` | `/solucoes#integracao-de-sistemas` |
| IA para Operações | `/solucoes` | `/solucoes#ia-para-operacoes` |
| Operações Digitais & Commerce | `/solucoes` | `/solucoes#operacoes-digitais-commerce` |

**Somente o `destination` muda.** `event` (`cta_click`), `location`
(`home_solutions`) e `label` permanecem idênticos. O CTA geral
"Conhecer soluções" continua em `/solucoes` sem âncora.

Alteração concentrada em `src/lib/content/home.ts` (campo `href` de
`HOME_COMPETENCIES`), sem tocar em componentes.

---

## 8. Header

`OBSERVED` — atual: Início · **Serviços** (`/servicos`) · **Soluções com IA**
(`/solucoes-com-ia`) · Sobre · Blog, mais o CTA.

**Header-alvo** `INFERRED`:

```
Início · Soluções (/solucoes) · Sobre · Blog        [Falar com a RC2 → /contato]
```

- `Serviços` e `Soluções com IA` **saem do menu**; **as URLs continuam 200**.
- CTA do Header preservado — rótulo aprovado na Fase 2 e label histórico
  `diagnostico_gratuito` intacto (`docs/10`).
- **Sem dropdown, sem megamenu, sem os cinco serviços legados.**
- Comportamento mobile preservado integralmente: `aria-expanded`,
  `aria-controls`, `Escape` fechando e devolvendo o foco ao gatilho.

`/contato` e `/avaliacoes` seguem fora do menu, como hoje — decisão não
reaberta nesta fase.

---

## 9. Footer

`OBSERVED` — atual: colunas Empresa · **Serviços** (5 legados, via
`import { services }`) · Contato, com copy institucional legada.

**Footer-alvo** `INFERRED`:

| Coluna | Conteúdo |
|---|---|
| **Empresa** | Sobre · Soluções · Blog · Contato *(inalterada em estrutura)* |
| **Soluções** *(substitui "Serviços")* | Automação de Processos · Integração de Sistemas · IA para Operações · Operações Digitais & Commerce · Operação Gerenciada — todos por âncora de `/solucoes` |
| **Contato** | WhatsApp · e-mail *(inalterada; preservar o `break-words` da Fase 0)* |

O `import { services }` é **removido** — o Footer deixa de depender do conteúdo
legado.

**Copy institucional** `INFERRED`: "Consultoria e implementação de automação de
processos, integração de sistemas e IA para operações." Alinha ao
posicionamento vigente, sem claim novo.

**Zapbox no Footer** `INFERRED` — **incluir**, como uma linha própria
identificada como produto:

> **Produto** — Zapbox: atendimento e vendas pelo WhatsApp → `zapbox.cloud`
> (externo, `target="_blank"`, `rel="noopener noreferrer"`)

Justificativa: reforça a fronteira de território em todas as páginas a um custo
mínimo de complexidade. **Não** é tratado como competência RC2. Se a revisão
preferir simplicidade máxima, pode ser omitido sem prejuízo — o prompt permite
ambos.

`DEPENDÊNCIA EXTERNA` — não há tracking kind para link externo de produto
(`docs/11` §8). O link do Zapbox no Footer usa `kind: "cta"`, como na Home.

---

## 10. Inventário de URLs legadas

`OBSERVED` — todas verificadas em produção nesta tarefa: **12 URLs, todas 200,
todas com self-canonical correto, todas no sitemap** (as de `/servicos/*` e
`/solucoes/*` entram via `serviceRoutes`/`solutionRoutes`).

| URL | HTTP | Canonical | Sitemap | Links internos recebidos (código) | Intenção atual (title) | Território |
|---|---|---|---|---|---|---|
| `/servicos` | 200 | self | sim | Header · Footer(indireto) · `/blog` vazio · `ContactForm` · `/servicos/[slug]` | Hub de 5 serviços | RC2 |
| `/servicos/automacoes-com-ia` | 200 | self | sim | `/servicos` grid · Footer | "Automação de Atendimento com IA para **WhatsApp e Vendas**" | **Zapbox** |
| `/servicos/agentes-de-ia` | 200 | self | sim | `/servicos` grid · Footer | "Agentes de IA para Empresas e **Processos Internos**" | RC2 |
| `/servicos/automacao-de-processos` | 200 | self | sim | `/servicos` grid · Footer | "Automação de Processos com n8n, APIs e Integrações" | RC2 |
| `/servicos/e-commerce` | 200 | self | sim | `/servicos` grid · Footer | "Consultoria e Implantação de E-commerce para PMEs" | RC2 (Commerce) |
| `/servicos/sites-e-landing-pages` | 200 | self | sim | `/servicos` grid · Footer | "Sites e Landing Pages para Geração de Leads" | Despriorizado |
| `/solucoes-com-ia` | 200 | self | sim | Header | "Soluções com IA" | RC2 (IA) |
| `/solucoes/atendimento-lento` | 200 | self | sim | `/solucoes` grid · `/servicos/[slug]` related | "Atendimento Lento: Como Resolver…" | **Zapbox** |
| `/solucoes/leads-sem-resposta` | 200 | self | sim | `/solucoes` grid · related | "Leads sem Resposta: Como Evitar Perda de Vendas" | **Zapbox** |
| `/solucoes/whatsapp-desorganizado` | 200 | self | sim | `/solucoes` grid · related | "WhatsApp Desorganizado…" | **Zapbox** |
| `/solucoes/processos-manuais` | 200 | self | sim | `/solucoes` grid · related | "Processos Manuais: **Como** Automatizar Tarefas Repetitivas" | RC2 |
| `/solucoes/sistemas-desconectados` | 200 | self | sim | `/solucoes` grid · related | "Sistemas Desconectados: **Como** Integrar Ferramentas e Dados" | RC2 |

### Aliases e redirects existentes

`OBSERVED` — `next.config.ts`:

| Source | Destino atual | Status |
|---|---|---|
| apex `/:path*` | `www` | 301 |
| `/index.htm` | `/` | 308 |
| `/about` · `/about/` | `/sobre` | 308 (`/about/` com 2 saltos) |
| `/services` | `/servicos` | 308 |
| `/services/` | `/services` → `/servicos` | 308, **2 saltos** |
| `/servicos/automacao-de-atendimento` | `/servicos/automacoes-com-ia` | 308 |
| `/servicos/integracao-de-sistemas` | `/servicos/automacao-de-processos` | 308 |
| `/servicos/operacoes-digitais` | `/servicos/automacao-de-processos` | 308 |

---

## 11. Disposições por URL

| URL | Ação nesta fase | Ação futura | Evidência necessária |
|---|---|---|---|
| `/servicos` | `REMOVE_FROM_NAV_ONLY` | `REDIRECT_CANDIDATE` → `/solucoes` | — |
| `/solucoes-com-ia` | `REMOVE_FROM_NAV_ONLY` | `REDIRECT_CANDIDATE` → `#ia-para-operacoes` | absorver conteúdo antes |
| `/servicos/agentes-de-ia` | `KEEP_200` | `REDIRECT_CANDIDATE` → `#ia-para-operacoes` | — |
| `/servicos/automacao-de-processos` | `KEEP_200` | `REDIRECT_CANDIDATE` → `#automacao-de-processos` | — |
| `/servicos/e-commerce` | `KEEP_200` | `REPOSITION` → `#operacoes-digitais-commerce` | **`NEEDS_SEO_DATA`** |
| `/servicos/sites-e-landing-pages` | `REMOVE_FROM_NAV_ONLY` | `KEEP_200` | — |
| `/servicos/automacoes-com-ia` | `KEEP_200` | `PRESERVE_FOR_PHASE_6` | destino Zapbox equivalente |
| `/solucoes/atendimento-lento` | `KEEP_200` | `PRESERVE_FOR_PHASE_6` | destino Zapbox equivalente |
| `/solucoes/leads-sem-resposta` | `KEEP_200` | `PRESERVE_FOR_PHASE_6` | destino Zapbox equivalente |
| `/solucoes/whatsapp-desorganizado` | `KEEP_200` | `PRESERVE_FOR_PHASE_6` | destino Zapbox equivalente |
| `/solucoes/processos-manuais` | `KEEP_200` | `INVESTIGATE` | **`NEEDS_SEO_DATA`** |
| `/solucoes/sistemas-desconectados` | `KEEP_200` | `INVESTIGATE` | **`NEEDS_SEO_DATA`** |

**Nenhuma URL é removida nesta fase. Nenhum redirect é executado.**

### Nota sobre `/servicos` e seus filhos

`INFERRED` — redirecionar `/servicos` enquanto os cinco `/servicos/*`
permanecem 200 deixa os filhos sem página-mãe. Não é quebra, mas é
estruturalmente estranho. **Recomendação:** o redirect de `/servicos` só entra
quando **todos** os cinco filhos tiverem disposição definida — o que hoje
depende do território Zapbox (Fase 6) e dos dados de SEO.

### Processos manuais e sistemas desconectados

`OBSERVED` — ambos os titles começam com **"Como…"**, sinal de intenção
**informacional**, não comercial. É exatamente a ambiguidade que a skill
registra: *"incorporar em `/solucoes` ou virar artigo"*.

`INFERRED` — **recomendação:** absorver a intenção comercial nas competências
correspondentes e avaliar converter o conteúdo restante em artigo de blog,
preservando a URL. **A decisão não está tomada** e depende de dados orgânicos.

---

## 12. Redirect plan — documentado, não executado

| # | Source | Target proposto | Intenção equivalente? | Chain hoje | Chain futura | Status |
|---|---|---|---|---|---|---|
| 1 | `/servicos` | `/solucoes` | sim — hub → hub | não | não | `SAFE_NOW`¹ |
| 2 | `/solucoes-com-ia` | `/solucoes#ia-para-operacoes` | sim `APPROVED` | não | não | `SAFE_NOW`² |
| 3 | `/servicos/agentes-de-ia` | `/solucoes#ia-para-operacoes` | sim `APPROVED` | não | não | `SAFE_NOW`² |
| 4 | `/servicos/automacao-de-processos` | `/solucoes#automacao-de-processos` | sim `APPROVED` | não | não | `SAFE_NOW`² |
| 5 | `/servicos/e-commerce` | `/solucoes#operacoes-digitais-commerce` | provável | não | não | `NEEDS_SEO_DATA` |
| 6 | `/solucoes/processos-manuais` | `/solucoes#automacao-de-processos` | ambígua (informacional) | não | não | `NEEDS_SEO_DATA` |
| 7 | `/solucoes/sistemas-desconectados` | `/solucoes#integracao-de-sistemas` | ambígua (informacional) | não | não | `NEEDS_SEO_DATA` |
| 8 | `/servicos/sites-e-landing-pages` | — | — | não | não | `KEEP` |
| 9 | `/servicos/automacoes-com-ia` | Zapbox equivalente | pendente | não | — | `DEFER_PHASE_6` |
| 10 | `/solucoes/atendimento-lento` | Zapbox equivalente | pendente | não | — | `DEFER_PHASE_6` |
| 11 | `/solucoes/leads-sem-resposta` | Zapbox equivalente | pendente | não | — | `DEFER_PHASE_6` |
| 12 | `/solucoes/whatsapp-desorganizado` | Zapbox equivalente | pendente | não | — | `DEFER_PHASE_6` |
| 13 | `/servicos/integracao-de-sistemas` | `/solucoes#integracao-de-sistemas` | sim | 1 salto | 1 salto | `SAFE_NOW`³ |
| 14 | `/servicos/operacoes-digitais` | `/solucoes#operacoes-digitais-commerce` | sim | 1 salto | 1 salto | `SAFE_NOW`³ |
| 15 | `/servicos/automacao-de-atendimento` | manter → `/servicos/automacoes-com-ia` | território Zapbox | 1 salto | 1 salto | `DEFER_PHASE_6` |
| 16 | `/services` | `/solucoes` | sim | 1 salto | 1 salto | `SAFE_NOW`⁴ |
| 17 | `/services/` | `/solucoes` | sim | **2 saltos** | 2 saltos | `INVESTIGATE`⁴ |

¹ Condicionado à nota da §11: só quando os cinco filhos tiverem disposição.
² Executável junto com a implementação da Fase 5, pois o destino-âncora passa a
existir. O conteúdo útil precisa ser absorvido **antes** do redirect.
³ Deve ser reapontado **no mesmo momento** em que o destino intermediário
consolidar — ver §13.
⁴ Ver §13.

**Regra herdada** `APPROVED` (`rc2-site-migration`): o redirect vai para o
destino **equivalente em intenção**, nunca para a Home; **um salto só**;
permanente apenas quando a decisão for permanente; sempre documentado.

### 12.1 Sitemap — regra de migração

`OBSERVED` — verificado em `src/app/sitemap.ts` e em
`https://www.rc2solucoes.com.br/sitemap.xml` (31 URLs no total): as **12 URLs
legadas estão hoje no sitemap**. `/servicos`, `/solucoes-com-ia` e `/solucoes`
entram por `staticPages`; os cinco `/servicos/*` por `serviceRoutes` e os cinco
`/solucoes/*` por `solutionRoutes`, ambos derivados de `services.ts` e
`solutions.ts`. Nenhum alias aparece no sitemap.

`APPROVED` — **regra:** quando uma URL indexável 200 passar a redirect
permanente, na **mesma unidade de implementação**:

1. remover a URL de `src/app/sitemap.ts` (ou da coleção de conteúdo que a
   alimenta);
2. garantir que o destino final esteja no sitemap, quando indexável;
3. nunca publicar no sitemap uma URL que redireciona;
4. nunca deixar o sitemap apontando para um redirect.

Armadilha específica deste repositório: como `serviceRoutes` e `solutionRoutes`
derivam de `services.ts` e `solutions.ts`, um redirect criado em
`next.config.ts` **não** remove a origem do sitemap. Uma tarefa futura que
mexa em redirect sem tocar nessas coleções publicará a origem antiga
redirecionando. Isso é proibido.

O inverso também vale, e é a regra que governa a Fase 5: **sair da navegação
não implica sair do sitemap.** Enquanto uma URL for 200, indexável e
self-canonical, ela permanece publicada — mesmo fora do Header e do Footer.

| Classe | URLs | Situação no sitemap |
|---|---|---|
| `SAFE_NOW` ainda não executado | `/solucoes-com-ia` · `/servicos/agentes-de-ia` · `/servicos/automacao-de-processos` | **permanecem**; saem **junto** com o redirect, quando executado |
| `SAFE_NOW` condicionado | `/servicos` | **permanece** enquanto o hub for 200; sai na mesma mudança que consolidar o hub (§11) |
| `NEEDS_SEO_DATA` | `/servicos/e-commerce` · `/solucoes/processos-manuais` · `/solucoes/sistemas-desconectados` | **permanecem** enquanto não houver decisão |
| `DEFER_PHASE_6` | `/servicos/automacoes-com-ia` · `/solucoes/atendimento-lento` · `/solucoes/leads-sem-resposta` · `/solucoes/whatsapp-desorganizado` | **permanecem**; não remover antecipadamente |
| `KEEP` | `/servicos/sites-e-landing-pages` | **permanece** enquanto for 200, indexável e self-canonical |

**Aliases não são entradas de sitemap** `OBSERVED` — confirmado ausente em
produção. Continuam fora, e não devem ser adicionados: `/services`,
`/services/`, `/servicos/automacao-de-atendimento`,
`/servicos/integracao-de-sistemas`, `/servicos/operacoes-digitais`. O sitemap
publica **URLs canônicas indexáveis**, não aliases históricos.

Consequência para a Fase 5 como desenhada: como **nenhum redirect é executado**
(unidade J fora do release), `sitemap.ts` **não muda** — e é justamente por
isso que ele não muda. Não é uma omissão: é a regra acima aplicada.

---

## 13. RED-01 / RED-02

### RED-02 — os três aliases

**`/servicos/integracao-de-sistemas`** → hoje aponta para
`/servicos/automacao-de-processos`. Quando este consolidar em
`#automacao-de-processos`, o alias vira chain de 2 saltos. **Solução:**
reapontar o alias **diretamente** para `/solucoes#integracao-de-sistemas` — um
salto, e para a âncora semanticamente correta (integração, não automação).
Isso **corrige** também um destino historicamente impreciso.

**`/servicos/operacoes-digitais`** → mesma situação. Reapontar direto para
`/solucoes#operacoes-digitais-commerce`. Um salto, âncora correta.

**`/servicos/automacao-de-atendimento`** → **exceção consciente.** O destino
atual (`/servicos/automacoes-com-ia`) é território **Zapbox**. Reapontar para
`#ia-para-operacoes` seria trazer para a RC2 um território que é do produto —
**a regra de território vence a vontade de "limpar" redirect**. Mantém-se o
alias e **preserva-se a página destino**. Classificação: `DEFER_PHASE_6`.

> Consequência aceita: enquanto os outros dois aliases apontam para `/solucoes`,
> este continua apontando para `/servicos/*`. É assimetria deliberada e
> documentada, não inconsistência.

### `/services` e trailing slash

`OBSERVED` — hoje: `/services/` → `/services` → `/servicos` (**2 saltos**), e a
normalização de trailing slash é do **framework**, executada **antes** dos
`redirects()` do `next.config.ts`.

Se `/servicos` passar a redirecionar para `/solucoes`, `/services/` vira **3
saltos** — inaceitável.

**Destino final esperado:** `/services` → `/solucoes` (**1 salto**), reapontando
o redirect existente.

**Para `/services/`** há duas soluções candidatas `INFERRED`:

| Candidata | Resultado | Custo |
|---|---|---|
| Aceitar 2 saltos (`/services/` → `/services` → `/solucoes`) | 2 saltos, sem chain de 3 | zero — só reapontar `/services` |
| Interceptar em middleware, antes da normalização | 1 salto | introduz middleware para um caso de baixo volume |

**Recomendação:** a primeira. Reapontar `/services` elimina o risco real (a
chain de 3) a custo zero; o 2-salto remanescente é a mesma classe do `/about/`,
que está fora do escopo por decisão anterior. Middleware só se os dados
mostrarem volume relevante.

`/about` e `/about/` **não são tocados** nesta fase.

---

## 14. Internal linking

`OBSERVED` — links internos no **código** para as URLs legadas:

| Origem | Alvo | Ação na Fase 5 |
|---|---|---|
| `Header.tsx` | `/servicos`, `/solucoes-com-ia` | **substituir** por `/solucoes` |
| `Footer.tsx` | `/servicos/<slug>` ×5 via `import { services }` | **substituir** pelas 5 âncoras |
| `home.ts` | `/solucoes` ×4 | **reapontar** para as âncoras (§7) |
| `blog/page.tsx` (estado vazio) | `/servicos` | **reapontar** para `/solucoes` |
| `ContactForm.tsx` | `/servicos` | **reapontar** para `/solucoes` |
| `/solucoes/page.tsx` | `/solucoes/<slug>` ×5 | **removido** com o grid |
| `/servicos/page.tsx` | `/servicos/<slug>` ×5 | **não tocar** — a página continua existindo |
| `/servicos/[slug]` | `/solucoes/<slug>` related, prev/next | **não tocar** |
| `/solucoes/[slug]` | `/servicos/<slug>` related | **não tocar** |

**Princípio:** a Fase 5 redistribui apenas os links de **superfícies que ela já
está reformulando** (Header, Footer, Home, `/solucoes`) mais dois pontos
pontuais. As páginas legadas continuam com sua própria malha interna intacta —
elas seguem vivas e não devem virar páginas órfãs.

### Links dentro de artigos do blog

`DEPENDÊNCIA EXTERNA` — o conteúdo dos posts vem do **CMS/banco**, não do
repositório. **A Fase 5 não edita artigos em massa.** Links de artigos para
`/servicos/*` e `/solucoes/*` continuam funcionando, porque **nenhuma URL é
removida**. Uma política de atualização editorial é assunto separado, a definir
quando houver redirects aprovados.

---

## 15. Analytics

Evento único `cta_click`; **nenhum kind ou evento novo** (`docs/10`).

| Série | Situação na Fase 5 |
|---|---|
| `solution_hub_card` | **ENCERRADA_POR_REMOCAO_DE_SUPERFICIE** — o grid de 5 cards deixa de existir |
| `solutions_managed_ops` | **PRESERVADA** — a seção continua, com o mesmo id |
| `home_solutions` (4 labels) | **REAPONTADA** — só o `destination` muda; `event`, `location` e `label` idênticos |
| `footer_empresa`, `footer_contact` | **PRESERVADAS** |
| `service_detail_*`, `solution_detail_*`, `solution_related_*`, `service_related_*`, `service_navigation_*` | **PRESERVADAS** — as páginas continuam existindo |
| Header CTA (`diagnostico_gratuito`) | **PRESERVADA** — label histórico |

**Novas** `INFERRED`, para as superfícies criadas:

| Superfície | location | label |
|---|---|---|
| Hero de `/solucoes` | `solutions_hero` | `falar_sobre_minha_operacao` |
| Orientação → âncoras | `solutions_orientation` | slug da âncora |
| CTA final | `solutions_final_cta` | `falar_sobre_minha_operacao` |
| Footer — coluna Soluções | `footer_solucoes` | slug da âncora |

**Regra:** nenhum identificador antigo é reutilizado com novo significado. A
série `solution_hub_card` fica encerrada, não renomeada.

---

## 16. Metadata e schema

`INFERRED` — direção proposta:

| Campo | Valor |
|---|---|
| `title` | **"Soluções — Automação, Integrações e IA para Operações"** |
| `description` | **"Automação de processos, integração de sistemas, IA para operações e operações digitais & commerce. As quatro competências da RC2 para a operação da sua empresa funcionar melhor."** |
| `og:title` | igual ao `title` |
| `og:description` | versão curta, mesmo território |
| `canonical` | **`https://www.rc2solucoes.com.br/solucoes` — inalterado** |

**Proibido** na metadata: atendimento lento · leads sem resposta · WhatsApp
desorganizado · chatbot.

### Schema

- **`WebPage`** — mantido, com nome e descrição novos.
- **`CollectionPage`** — **removido.** `OBSERVED` a página deixa de ser uma
  coleção de 5 subpages; manter o tipo seria declarar uma estrutura que não
  existe mais. Não manter schema incorreto por compatibilidade.
- `Organization`, `LocalBusiness` e `WebSite` continuam vindo do layout raiz.

`INFERRED` — **não** introduzir `Service` schema por competência nesta fase: as
competências não são entidades com URL própria, e `Service` sem URL canônica
própria adiciona ruído. Reavaliável se alguma competência ganhar página.

---

## 17. Design system

Preservar integralmente: Barlow · tokens `--rc2-*` · Navy · Safety Orange
(< 10% da área) · `#F7F5F1` · `SectionLabel` · `ScrollReveal`/`FadeIn` · anéis
de foco (`#C2410C` claro / `#FF5F1F` navy) · Lucide · spacing · contrastes.
**Nenhum hex literal em componente.**

`/solucoes` **não pode** virar grid de cards repetitivo, landing SaaS genérica,
catálogo de features ou dashboard fictício.

`INFERRED` — as quatro competências devem ler-se como **um sistema**, não como
quatro produtos independentes. Para isso, variar a composição entre seções:
hero tipográfico → bloco de orientação em lista → competências alternando
superfície clara e navy, cada uma com estrutura própria (lista, par
problema/entrega, enumeração de sistemas) → "Como trabalhamos" em fluxo →
Operação Gerenciada em dois blocos (já existente) → CTA final.

**Proibido:** repetir o mesmo card quatro vezes.

---

## 18. Responsividade

Obrigatório em **390×844 · 768×1024 · 1024×768 · 1440×900**:

- `scrollWidth == innerWidth` em todos — **zero overflow**
- âncoras **não** escondidas pelo Header sticky — já garantido por
  `:where([id]) { scroll-margin-top: 5.5rem }` `OBSERVED`
- os quatro territórios legíveis sem depender de hover
- listas e diagramas degradam para empilhamento vertical
- Operação Gerenciada continua legível em 390 (hoje já está)
- alvos de toque ≥ 24px; botões principais ≥ 44px
- preservar o `break-words` do Footer (Fase 0) em qualquer conteúdo novo com
  token longo

---

## 19. Acessibilidade

- **um único `<h1>`** no hero
- **um `<h2>` por competência**; `<h3>` só quando subordinado
- landmarks preservados: `header` · `nav` · `main#main-content` · `footer`
- skip link preservado
- links com rótulo específico — **proibido** repetir "Ver solução completa"
- foco visível em todos os CTAs, inclusive sobre navy
- navegação por hash compreensível: cada âncora leva a um título anunciável
- cor nunca como única distinção entre competências
- `prefers-reduced-motion` respeitado pelo sistema existente
- Header mobile **sem regressão**: `aria-expanded`, `aria-controls`, `Escape`
  fechando e devolvendo o foco ao gatilho

---

## 20. SEO e preservação de URLs

| Área | Fase 5 |
|---|---|
| Página `/solucoes` | **pode ser reformulada** |
| Header / Footer / links no código | **podem ser replanejados** |
| Redirect plan | **documentado** (§12) |
| **Execução de redirect** | **NÃO acontece nesta tarefa de design** |
| Agenda Confirmada | **Fase 6** |
| Migrações para Zapbox | dependem de destino equivalente — **Fase 6** |
| Renomear `/avaliacoes` | **fora do escopo** |
| Slug corrompido do blog | **fora do escopo** |
| `sitemap.ts` / `robots.ts` | **não alterados nesta fase** — porque nenhum redirect é executado; regra em §12.1 |

`APPROVED` — *"Nunca remover uma URL apenas porque ela não fará parte da nova
navegação."* **Sair do menu ≠ sair do site**, e tampouco sair do sitemap. As 12
URLs legadas continuam 200, indexáveis e no sitemap ao fim da Fase 5 — estado
verificado em código e em produção (§12.1).

`INFERRED` — **risco aceito:** ao tirar `/servicos` e `/solucoes-com-ia` do
Header e os cinco serviços do Footer, essas páginas perdem links internos
sitewide e ganham menos autoridade interna. É consequência direta da
consolidação e é temporária: quando os redirects forem aprovados, a autoridade
consolida em `/solucoes`. Enquanto isso, elas permanecem alcançáveis por
sitemap, busca e pela malha interna própria.

---

## 21. Dependências externas

| ID | Dado que falta | Impacto | Decisão provisória segura |
|---|---|---|---|
| **DE-1** | Search Console de `/solucoes/processos-manuais` e `/solucoes/sistemas-desconectados` — impressões, cliques, posição, backlinks | Define se viram redirect para âncora ou artigo de blog | `KEEP_200`, fora da navegação, **sem redirect** |
| **DE-2** | Search Console de `/servicos/e-commerce` | "e-commerce" é o termo legado de maior volume potencial; redirect errado custa caro | `KEEP_200`, **sem redirect**; intenção absorvida em `#operacoes-digitais-commerce` |
| **DE-3** | Confirmação de que as páginas do Zapbox cobrem a intenção das 4 URLs de território | Libera os redirects da Fase 6 | `PRESERVE_FOR_PHASE_6`; `docs/09` §3 já confirmou que as páginas **existem**, falta validar equivalência de conteúdo |
| **DE-4** | Política para links internos dentro de artigos do blog (CMS) | Define se e quando artigos são reescritos | Não editar artigos; nenhuma URL removida, logo nenhum link quebra |

Nenhuma bloqueia a Fase 5.

---

## 22. Implementação futura por unidades

Divisão conceitual, revisável isoladamente. **O plano técnico é tarefa
separada.**

| # | Unidade | Depende de |
|---|---|---|
| A | Conteúdo estrutural testável de `/solucoes` (`solucoes.ts` ou equivalente) | — |
| B | Metadata e schema | A |
| C | As quatro competências e suas âncoras | A |
| D | Seção "Como a RC2 trabalha" (Discovery / projeto / recorrência) | A |
| E | Preservação da Operação Gerenciada com o id intacto | — |
| F | Header | — |
| G | Footer | C (âncoras) |
| H | Home → âncoras | C |
| I | Links internos no código (blog vazio, ContactForm) | C |
| J | **Redirects aprovados — somente com autorização posterior.** Cada redirect autorizado é entregue como pacote único: **redirect + sitemap + links internos + canonical/destino**, na mesma unidade — ver §12.1 | §12 + §12.1 + dados de SEO |
| K | Regressão SEO e runtime | tudo acima |

**Release:** `/solucoes` coerente num único PR; **J fica fora** até haver
autorização explícita.

---

## 23. Critérios de aceite

1. `/solucoes` com H1 único e as quatro competências como `<h2>`.
2. As cinco âncoras presentes, únicas e navegáveis sob Header sticky.
3. `#operacao-gerenciada` preservado e funcional a partir da Home.
4. Nenhuma copy de território Zapbox como eixo de `/solucoes`.
5. Discovery citado sem repetir a faixa de preço.
6. Metadata e schema no novo posicionamento; `CollectionPage` removido.
7. Canonical `/solucoes` inalterado.
8. Header e Footer sem `/servicos` e `/solucoes-com-ia`.
9. Home apontando para as quatro âncoras, com analytics preservado.
10. **As 12 URLs legadas continuam 200 e no sitemap.**
11. Nenhum redirect criado, alterado ou removido.
12. `solution_hub_card` registrada como encerrada, não renomeada.
13. Zero overflow nos quatro viewports.
14. Fases 0–4 sem regressão.
15. Build, testes, lint, typecheck e brand audit verdes.

---

## 24. Fora do escopo

Criar `/solucoes/agenda-confirmada` · migrar URLs de território Zapbox ·
executar qualquer redirect · alterar `sitemap.ts` ou `robots.ts` · remover
qualquer URL · renomear `/avaliacoes` · corrigir o slug corrompido do blog ·
revisar a taxonomia de analytics · instrumentar o link do Zapbox · editar
artigos do blog · alterar `/contato`, preço do Discovery ou formato da Operação
Gerenciada · tocar `/about` e `/about/` · alterar a Home além do `destination`
dos quatro links.

---

## 25. Decisões fechadas

1. **H1:** "Automação, integrações e IA aplicadas à sua operação."
2. **Subheadline:** conforme §5.1.
3. **Ordem:** Hero · Orientação · Automação · Integração · IA · Commerce · Como
   a RC2 trabalha · Operação Gerenciada · CTA final.
4. **Cinco âncoras** conforme §6; `#operacao-gerenciada` inalterada.
5. **Sem CTA secundário** no hero.
6. **Home passa a usar as âncoras**; só o `destination` muda.
7. **Header:** Início · Soluções · Sobre · Blog + CTA atual.
8. **Footer:** coluna "Soluções" com as cinco âncoras; `import { services }`
   removido; copy institucional atualizada; Zapbox como produto externo.
9. **`CollectionPage` removido**; `WebPage` mantido e atualizado.
10. **`solution_hub_card` encerrada**; `solutions_managed_ops` preservada;
    quatro locations novas.
11. **RED-02:** dois aliases reapontados em um salto;
    `/servicos/automacao-de-atendimento` **preservado** por regra de território.
12. **`/services` → `/solucoes`** em um salto; `/services/` aceita 2 saltos.
13. **Nenhuma URL removida; nenhum redirect executado nesta fase.**
14. **`/servicos` só redireciona** quando os cinco filhos tiverem disposição.
