# SEO pós-Fase 5 — Migração SAFE_NOW — Design

> **Design e auditoria. Não é implementação.** Nenhum redirect foi executado,
> nenhum arquivo em `src/`, `next.config.ts`, `sitemap.ts` ou `robots.ts` foi
> alterado nesta tarefa.
>
> Este documento precisa de revisão antes do plano técnico da unidade SEO.

**Baseline:** `main @ aef739e` · Fases 0 a 5 publicadas · nova `/solucoes` em
Production e validada.

| Marca | Significado |
|---|---|
| `OBSERVED` | Verificado nesta tarefa, no código ou em Production. |
| `APPROVED` | Consta em fonte oficial do projeto ou em ruling desta unidade. |
| `INFERRED` | Decisão de design deste documento. |
| `DEFERRED` | Adiado com motivo e condição de desbloqueio explícitos. |

---

## 1. Objetivo

Definir, com evidência, quais URLs legadas podem receber redirect permanente
**agora** — porque a intenção já tem destino equivalente e validado na nova
`/solucoes` — e quais não podem, com o motivo de cada exclusão.

A unidade é deliberadamente **pequena**: redirect permanente é a única mudança
desta reformulação que o `git revert` não desfaz de verdade (§21).

---

## 2. Fontes de verdade

`AGENTS.md` · `PRODUCT.md` · `docs/08` · `docs/10` · `docs/11` · `docs/14` ·
`docs/15` · skill `rc2-site-migration`.

Código inspecionado sem edição: `next.config.ts`, `src/app/sitemap.ts`,
`/servicos`, `/servicos/[slug]`, `/solucoes-com-ia`, `/solucoes/[slug]`,
`services.ts`, `solutions.ts`, `llms.txt`, `robots.ts`,
`tests/e2e/services.spec.ts`, `docs/BLOG_INTERNAL_LINKING_GUIDE.md`.

---

## 3. Estado Production

`OBSERVED` — medido em `https://www.rc2solucoes.com.br` nesta tarefa.

### 3.1 Sources candidatas

| Source | HTTP | Location | Saltos | URL final | Canonical | Robots | Sitemap |
|---|---|---|---|---|---|---|---|
| `/solucoes-com-ia` | **200** | — | 0 | própria | self | `index, follow` | **SIM** |
| `/servicos/agentes-de-ia` | **200** | — | 0 | própria | self | `index, follow` | **SIM** |
| `/servicos/automacao-de-processos` | **200** | — | 0 | própria | self | `index, follow` | **SIM** |
| `/servicos/integracao-de-sistemas` | **308** | `/servicos/automacao-de-processos` | 1 | `/servicos/automacao-de-processos` | n/a | n/a | não |
| `/servicos/operacoes-digitais` | **308** | `/servicos/automacao-de-processos` | 1 | `/servicos/automacao-de-processos` | n/a | n/a | não |
| `/services` | **308** | `/servicos` | 1 | `/servicos` | n/a | n/a | não |
| `/services/` | **308** | `/services` | **2** | `/servicos` | n/a | n/a | não |

### 3.2 Sources NÃO migráveis — baseline

| URL | HTTP | Classe |
|---|---|---|
| `/servicos` | 200, self-canonical, `index, follow`, **no sitemap** | hub legado — `RULING 1` |
| `/servicos/automacao-de-atendimento` | 308 → `/servicos/automacoes-com-ia` (1 salto) | território Zapbox |
| `/servicos/automacoes-com-ia` · `/solucoes/atendimento-lento` · `/solucoes/leads-sem-resposta` · `/solucoes/whatsapp-desorganizado` | 200 | `DEFER_PHASE_6` |
| `/servicos/e-commerce` · `/solucoes/processos-manuais` · `/solucoes/sistemas-desconectados` | 200 | `NEEDS_SEO_DATA` |
| `/servicos/sites-e-landing-pages` | 200 | `KEEP` |

**Nenhum alias está no sitemap** — confirmado para os cinco.

### 3.3 Dois achados que contradizem a presunção inicial

`OBSERVED` — registrados aqui porque mudam decisões, e detalhados em §7 e §8:

1. **`/services/` não usa a regra que existe para ele.** `next.config.ts`
   declara `{ source: "/services/", destination: "/servicos" }`, mas a
   normalização de trailing slash do framework roda **antes** dos
   `redirects()` e emite `/services/ → /services` primeiro. A regra explícita
   é código morto que nunca dispara. Os 2 saltos medidos comprovam isso.
2. **`/solucoes-com-ia` é metade território Zapbox.** Ver §7.1 — é o motivo de
   ela não entrar nesta unidade.

---

## 4. Princípios

`APPROVED` (`rc2-site-migration`):

1. Redirect vai para o destino **equivalente em intenção**, nunca para a Home.
2. **Um salto só.**
3. Permanente apenas quando a decisão for permanente.
4. Nenhuma URL é removida só por sair da navegação.
5. Nenhum link interno controlado pela RC2 cria voluntariamente um salto
   quando o destino final é conhecido.
6. `REDIRECT + SITEMAP + INTERNAL LINKS + CANONICAL/DESTINO` viajam **na mesma
   unidade** (`docs/14` §12.1).

---

## 5. Sources candidatas

Seis, mais uma normalização. Cada uma avaliada individualmente em §7 e §8;
resultado consolidado em §13.

---

## 6. Destinos

`OBSERVED` — validado em Production na tarefa de merge da Fase 5 e reconfirmado
aqui:

| Âncora | Existe | ID único | Heading | Topo após salto | Header | Hash preservado |
|---|---|---|---|---|---|---|
| `#automacao-de-processos` | sim | sim | `<h2>` Automação de Processos | 88px | 65px | sim |
| `#integracao-de-sistemas` | sim | sim | `<h2>` Integração de Sistemas | 88px | 65px | sim |
| `#ia-para-operacoes` | sim | sim | `<h2>` IA para Operações | 88px | 65px | sim |
| `#operacoes-digitais-commerce` | sim | sim | `<h2>` Operações Digitais & Commerce | 88px | 65px | sim |

`/solucoes` responde **200**, canonical
`https://www.rc2solucoes.com.br/solucoes`, e está no sitemap. Nenhum redirect
proposto aponta para âncora inexistente.

---

## 7. Equivalência de intenção

### 7.1 `/solucoes-com-ia` → `#ia-para-operacoes` — **NÃO equivalente**

`OBSERVED` — a página tem quatro blocos:

| Bloco | Conteúdo | Território |
|---|---|---|
| **IA para atendimento** | responder perguntas frequentes · direcionar para o setor · consultar informações · segunda via e status · **atender fora do horário comercial** | **Zapbox** |
| **IA para vendas** | entender a necessidade do cliente · enviar informações de produtos · **encaminhar oportunidades para vendedores** · criar mensagens comerciais · **follow-up automático** · **recuperar contatos parados** | **Zapbox** |
| IA para operação | organizar solicitações internas · apoiar decisões com dados · reduzir tarefas administrativas | RC2 |
| IA integrada aos seus sistemas | plataformas de e-commerce, integrações | RC2 |

A própria `description` da página declara a ordem:
*"responder clientes, qualificar leads, organizar operação e integrar sistemas"*
— duas das quatro intenções são **atendimento e leads**.

`INFERRED` — **metade da intenção desta URL pertence ao Zapbox.** Redirecionar
para `#ia-para-operacoes` levaria essa metade para uma seção que **declara
explicitamente não cobrir esse território** e aponta para o Zapbox. Não é um
destino equivalente; é um destino que diz "não é aqui".

É exatamente o mesmo problema de `/servicos/automacoes-com-ia`, que a
`RULING 6` já classifica como `DEFER_PHASE_6`. **Tratar as duas de forma
diferente seria incoerente.**

**Decisão:** `DEFERRED` → **DEFER_PHASE_6**. Desbloqueia quando a Fase 6
definir o destino equivalente no Zapbox — a URL pode então ser dividida
(parte para o Zapbox, parte para `#ia-para-operacoes`) ou migrada inteira.

> Esta é a única divergência desta spec em relação à presunção da `RULING 2`.
> A própria ruling exige *"comprovar novamente equivalência antes de aprovar
> cada uma"* — a comprovação falhou para esta URL.

### 7.2 `/servicos/agentes-de-ia` → `#ia-para-operacoes` — **equivalente**

`OBSERVED` — `shortTitle` **"IA para equipe interna"**; `summary`
*"responder dúvidas internas, resumir informações e reduzir tarefas
administrativas da equipe"*.

| Origem | Destino `#ia-para-operacoes` |
|---|---|
| agente para consultar documentos internos | "leitura e interpretação de documentos … para alimentar o fluxo" |
| agente para responder dúvidas da equipe | "apoio operacional interno: consulta às bases da empresa com contexto controlado" |
| agente para análise de chamados / classificar demandas | "classificação e triagem de informação com critérios explícitos" |
| segurança e governança de uso | "governança: o que o agente pode fazer, com quais dados e até qual limite" |
| — | "handoff humano definido" |

Território **interno**, não comercial. Equivalência forte. **EXECUTE.**

### 7.3 `/servicos/automacao-de-processos` → `#automacao-de-processos` — **equivalente, com ressalva**

`OBSERVED` — `title` "Automação para conectar sistemas e reduzir retrabalho";
`painPoints` "a equipe copia dados manualmente entre sistemas", "tarefas
repetitivas consomem tempo todos os dias", "erros manuais geram retrabalho".
Todos têm correspondente direto nos `signals` da competência.

`OBSERVED` — **ressalva de conteúdo híbrido:** o `shortTitle` desta página é
literalmente **"Integração de sistemas"**, e o `seoTitle` é *"Automação de
Processos com n8n, APIs e Integrações"*. A página cobre **automação e
integração ao mesmo tempo**.

`INFERRED` — isso **não** bloqueia: `#automacao-de-processos` e
`#integracao-de-sistemas` são seções vizinhas da **mesma página**. O visitante
chega ancorado em automação com a integração logo abaixo. O `seoTitle` lidera
com "Automação de Processos", o que sustenta a escolha da âncora.

**EXECUTE**, condicionado à absorção da §8.2.

### 7.4 Aliases

| Alias | Destino atual | Destino proposto | Equivalência |
|---|---|---|---|
| `/servicos/integracao-de-sistemas` | `/servicos/automacao-de-processos` | `#integracao-de-sistemas` | **melhora** — o nome do alias é literalmente a competência de destino |
| `/servicos/operacoes-digitais` | `/servicos/automacao-de-processos` | `#operacoes-digitais-commerce` | **melhora** — hoje aponta para automação, que não é o assunto |

`INFERRED` — os dois aliases hoje apontam para um destino **historicamente
impreciso**. Reapontá-los corrige a imprecisão **e** elimina a chain futura.
São independentes do item 7.3: valem por si, mesmo que a absorção atrase.

### 7.5 `/services` → `/solucoes`

`APPROVED` (`RULING 4`) — alias histórico, fora do sitemap. `/solucoes` é o hub
comercial vigente. Reapontar mantém **1 salto** e elimina o risco de virar
`/services → /servicos → …` no futuro. **EXECUTE.**

---

## 8. Absorção de conteúdo

Classificação por item, conforme exigido.

### 8.1 `/servicos/agentes-de-ia`

| Item | Classe |
|---|---|
| agentes internos, documentos, dúvidas da equipe, resumos, chamados | `ABSORBED` |
| governança, limites de acesso, segurança | `ABSORBED` |
| integrações nomeadas (Google Drive, Notion, Slack, planilhas, CRM, ERP) | `UNIQUE_BUT_NON_BLOCKING` — a competência cita as categorias, não as marcas |
| métricas ("tempo economizado", "taxa de resolução sem intervenção humana") | `LEGACY_NO_LONGER_RELEVANT` — `AGENTS.md` proíbe métrica sem documentação |
| 5 FAQs, incl. *"Qual a diferença entre chatbot e agente de IA?"* | `UNIQUE_BUT_NON_BLOCKING` |
| "agente para apoiar atendimento ao cliente" / "apoio comercial" | `LEGACY_NO_LONGER_RELEVANT` — território Zapbox, corretamente ausente |

**Nenhum `UNIQUE_AND_REQUIRED`. Redirect é SAFE.**

### 8.2 `/servicos/automacao-de-processos`

| Item | Classe |
|---|---|
| copiar/colar entre sistemas, tarefas repetitivas, retrabalho, planilhas | `ABSORBED` |
| tratamento de exceções, regras de negócio, monitoramento | `ABSORBED` |
| APIs, webhooks, ERP, CRM | `ABSORBED` — presentes no conteúdo visível da nova página |
| **`n8n` como ferramenta nomeada** | **`UNIQUE_AND_REQUIRED`** |
| métricas ("horas manuais economizadas") | `LEGACY_NO_LONGER_RELEVANT` |
| 5 FAQs, incl. *"n8n é melhor que Zapier ou Make?"* e *"Preciso trocar meus sistemas atuais?"* | `UNIQUE_BUT_NON_BLOCKING` |

`OBSERVED` — **`n8n` não aparece no conteúdo visível da nova `/solucoes`.** As
duas ocorrências no HTML estão apenas no `<meta name="keywords">` global do
layout, que não carrega peso de busca. A URL de origem, ao contrário, traz n8n
no `seoTitle`, nos `integrations` e em duas FAQs.

`INFERRED` — o nome da ferramenta é um ativo orgânico real ("automação n8n",
"n8n para empresas"). Migrar sem absorvê-lo descarta a intenção de busca por
ferramenta.

**Status: `BLOCKED_PENDING_CONTENT_ABSORPTION`.**

**Condição de desbloqueio** — na **mesma unidade SEO**, antes do redirect:
acrescentar ao conteúdo visível de `#automacao-de-processos` uma menção
factual às ferramentas de execução (n8n, APIs, webhooks), sem métrica, sem
comparação com concorrentes e sem promessa. É uma frase, não uma seção.

Feita a absorção, o item passa a **EXECUTE** dentro da mesma unidade.

### 8.3 `/solucoes-com-ia`

Não classificada item a item: **reprova antes disso**, na equivalência de
intenção (§7.1). `DEFERRED`.

---

## 9. Internal links

`OBSERVED` — inventário completo das referências às sources no repositório.

### 9.1 `RUNTIME_CODE` — precisam mudar

| Arquivo | Refs | Alvo |
|---|---|---|
| `src/lib/content/solutions.ts` | **8×** `/servicos/automacao-de-processos` (`relatedServices`) · **2×** `/servicos/agentes-de-ia` · 1× `/solucoes-com-ia` | reapontar as 10 primeiras para as âncoras finais; **manter** a de `/solucoes-com-ia` |
| `src/lib/content/services.ts` | 2× `/servicos/automacao-de-processos` · 2× `/solucoes-com-ia` (`relatedLinks`) | reapontar as 2 primeiras; **manter** as de `/solucoes-com-ia` |
| `src/app/(public)/servicos/page.tsx` | grid de 5 cards | ver §10 |
| `src/app/(public)/servicos/[slug]/page.tsx` | prev/next entre serviços | ver §10 |
| `src/app/llms.txt/route.ts` | 3 refs | ver §17 |

> **Atenção à `RULING 10`:** reapontar `href` de `relatedLinks` **não é**
> mutilar as coleções. Nenhuma entrada de `services.ts` ou `solutions.ts` é
> removida — os módulos continuam alimentando `/servicos`, `/servicos/[slug]`,
> `/solucoes/[slug]` e o sitemap.

### 9.2 `TEST` — quebra se ignorado

`OBSERVED` — **`tests/e2e/services.spec.ts`** percorre os cinco slugs de
serviço, incluindo `agentes-de-ia` e `automacao-de-processos`, e afirma
`await expect(page).toHaveURL(/agentes-de-ia/)` após clicar em "Agentes".

Com o redirect ativo, a URL final passa a ser `/solucoes#ia-para-operacoes` e
**a asserção falha**. O teste precisa ser atualizado na mesma unidade.

> Não roda em `npm run test` (Vitest ignora `tests/e2e/**`), só em
> `npm run test:e2e`. Não vai aparecer no gate padrão — por isso está
> registrado aqui.

### 9.3 `DOCUMENTATION` — operacional, precisa mudar

`OBSERVED` — **`docs/BLOG_INTERNAL_LINKING_GUIDE.md`** instrui autores a
inserir links para `/servicos/automacao-de-processos` e `/solucoes-com-ia` em
**novos** artigos, e recomenda o CTA *"Diagnóstico de atendimento e
qualificação de leads"* — vocabulário descontinuado desde a Fase 2.

`INFERRED` — é **guia operacional**, não registro histórico: deixá-lo intacto
faz o site produzir dívida nova a cada artigo publicado. Deve ser atualizado na
unidade SEO.

### 9.4 `HISTORICAL_DOC` — não mexer

`docs/00` a `docs/04`, `docs/08`, `docs/12` a `docs/15` citam as URLs antigas
ao registrar o estado da época. **Não reescrever** — registro histórico não é
dívida.

### 9.5 `CMS_CONTENT`

`DEFERRED` — o conteúdo dos posts vive no banco. Não foi consultado nesta
tarefa e não será editado. Se houver links para as sources migráveis dentro de
artigos, **o redirect os mantém funcionais**.

Registrar: **`CMS_INTERNAL_LINK_DEBT`**. Não bloqueia os redirects SAFE_NOW.

---

## 10. Hub `/servicos`

`APPROVED` (`RULING 1`) — **não redireciona nesta unidade.** Permanece 200,
self-canonical, `index, follow` e **no sitemap** (`OBSERVED`, §3.2).

**Decisão** `INFERRED` — **ABORDAGEM A**: os cards de `agentes-de-ia` e
`automacao-de-processos` no grid de `/servicos` passam a apontar **diretamente
para as âncoras finais**. Os outros três cards ficam como estão.

Motivo: princípio 5 da §4 — link interno controlado pela RC2 não cria salto
voluntário quando o destino final é conhecido. A alternativa (B) faria o hub
gerar dois saltos evitáveis em cada visita.

**Consequência aceita e registrada:** o hub `/servicos` passa a listar cinco
cards com destinos heterogêneos — três para `/servicos/*` e dois para
`/solucoes#*`. É transitório e termina quando o hub tiver disposição definitiva
(`DEFER`, §13).

**Prev/next em `/servicos/[slug]`** — a navegação sequencial entre serviços
inclui os dois slugs migrados. Mesma regra: apontar para o destino final, ou
retirá-los da sequência. O plano técnico escolhe a forma; a regra é não gerar
salto.

---

## 11. Sitemap

`OBSERVED` — `src/app/sitemap.ts`: `staticPages` inclui `/servicos`,
`/solucoes-com-ia` e `/solucoes`; `serviceRoutes` = `services.map(...)` sobre
os 5 slugs; `solutionRoutes` idem. Total atual: **31 URLs**. Nenhuma âncora
está no sitemap; nenhum alias está no sitemap.

### 11.1 Ações

| URL | Ação | Quando |
|---|---|---|
| `/servicos/agentes-de-ia` | **REMOVER** | mesma unidade do seu redirect |
| `/servicos/automacao-de-processos` | **REMOVER** | mesma unidade do seu redirect |
| `/solucoes-com-ia` | **MANTER** | segue 200 e indexável — `DEFERRED` |
| `/servicos` | **MANTER** | `RULING 1` |
| `/solucoes` | **MANTER** | destino indexável |
| demais 200 (`e-commerce`, `sites-e-landing-pages`, 4 de Zapbox, 2 `NEEDS_SEO_DATA`) | **MANTER** | 200 · indexável · self-canonical |
| aliases (`/services`, `/services/`, `integracao-de-sistemas`, `operacoes-digitais`, `automacao-de-atendimento`) | **CONTINUAM FORA** | aliases nunca entram |
| âncoras `/solucoes#*` | **NÃO ADICIONAR** | fragmento não é URL de sitemap |

Resultado esperado: **31 → 29 URLs**.

### 11.2 Como remover apenas os slugs migrados

`APPROVED` (`RULING 10`) — **não** remover entradas de `services.ts`: o módulo
alimenta `/servicos`, `/servicos/[slug]` e o próprio hub.

`INFERRED` — a solução é **localizada em `sitemap.ts`**: uma lista explícita de
slugs migrados, filtrada antes de produzir `serviceRoutes`, com comentário
apontando para o redirect correspondente. Forma exata fica para o plano
técnico; a regra é que a exclusão viva no sitemap, não na coleção de conteúdo.

`/solucoes-com-ia` está em `staticPages` — quando (e se) migrar, sai de lá pela
mesma regra.

---

## 12. Redirect status

`OBSERVED` — os redirects existentes emitem **`308 Permanent Redirect`**,
medido em Production nos cinco aliases atuais. É o que o Next.js produz com
`permanent: true`.

`APPROVED` — status desta unidade: **`PERMANENT_308`**.

Não escrever "301" na documentação nem alterar o mecanismo para obter 301: 308
preserva o método e é tratado pelos buscadores como equivalente a 301 para fins
de consolidação.

---

## 13. Redirect matrix

| # | Source | Tipo | Baseline | Target | Intenção | Conteúdo absorvido? | Sitemap action | Internal links | Status | Executar? |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/servicos/agentes-de-ia` | canônica | 200, sitemap | `/solucoes#ia-para-operacoes` | equivalente | **sim** | **remover** | `solutions.ts` ×2 · hub · prev/next · llms · e2e | **SAFE_NOW** | **EXECUTE** |
| 2 | `/servicos/automacao-de-processos` | canônica | 200, sitemap | `/solucoes#automacao-de-processos` | equivalente | **falta n8n** (§8.2) | **remover** | `solutions.ts` ×8 · `services.ts` ×2 · hub · prev/next · llms · e2e · guia do blog | **BLOCKED_PENDING_CONTENT_ABSORPTION** | **EXECUTE após absorção, na mesma unidade** |
| 3 | `/servicos/integracao-de-sistemas` | alias | 308 → automacao-de-processos | `/solucoes#integracao-de-sistemas` | melhora | n/a | já fora | nenhum no código | **SAFE_NOW** | **EXECUTE** |
| 4 | `/servicos/operacoes-digitais` | alias | 308 → automacao-de-processos | `/solucoes#operacoes-digitais-commerce` | melhora | n/a | já fora | nenhum no código | **SAFE_NOW** | **EXECUTE** |
| 5 | `/services` | alias | 308 → `/servicos` | `/solucoes` | equivalente | n/a | já fora | nenhum no código | **SAFE_NOW** | **EXECUTE** |
| 6 | `/services/` | normalização | 308 → `/services` (2 saltos) | — | — | — | já fora | — | **ACCEPTED_TWO_HOP_FRAMEWORK_NORMALIZATION** | **NORMALIZATION_ONLY** |
| 7 | `/solucoes-com-ia` | canônica | 200, sitemap | — | **metade Zapbox** (§7.1) | n/a | **manter** | manter os links | **DEFER_PHASE_6** | **DEFER** |
| 8 | `/servicos` | hub | 200, sitemap | — | — | — | **manter** | — | `RULING 1` | **DEFER** |
| 9 | `/servicos/automacao-de-atendimento` | alias | 308 → automacoes-com-ia | — | território Zapbox | — | já fora | — | `RULING 6` | **DEFER** |
| 10 | `/servicos/automacoes-com-ia` | canônica | 200, sitemap | — | território Zapbox | — | **manter** | — | `DEFER_PHASE_6` | **DEFER** |
| 11 | `/solucoes/atendimento-lento` | canônica | 200, sitemap | — | território Zapbox | — | **manter** | — | `DEFER_PHASE_6` | **DEFER** |
| 12 | `/solucoes/leads-sem-resposta` | canônica | 200, sitemap | — | território Zapbox | — | **manter** | — | `DEFER_PHASE_6` | **DEFER** |
| 13 | `/solucoes/whatsapp-desorganizado` | canônica | 200, sitemap | — | território Zapbox | — | **manter** | — | `DEFER_PHASE_6` | **DEFER** |
| 14 | `/servicos/e-commerce` | canônica | 200, sitemap | — | provável, não comprovada | — | **manter** | — | `NEEDS_SEO_DATA` | **DEFER** |
| 15 | `/solucoes/processos-manuais` | canônica | 200, sitemap | — | ambígua (informacional) | — | **manter** | — | `NEEDS_SEO_DATA` | **DEFER** |
| 16 | `/solucoes/sistemas-desconectados` | canônica | 200, sitemap | — | ambígua (informacional) | — | **manter** | — | `NEEDS_SEO_DATA` | **DEFER** |
| 17 | `/servicos/sites-e-landing-pages` | canônica | 200, sitemap | — | despriorizada, não migrada | — | **manter** | — | `KEEP` | **KEEP** |

**Resumo:** 4 `EXECUTE` diretos · 1 `EXECUTE` após absorção · 1
`NORMALIZATION_ONLY` · 10 `DEFER` · 1 `KEEP`.

---

## 14. Chain analysis

### Estado atual

```
/servicos/integracao-de-sistemas  →  /servicos/automacao-de-processos  (200)
/servicos/operacoes-digitais      →  /servicos/automacao-de-processos  (200)
/services                         →  /servicos                         (200)
/services/  →  /services          →  /servicos                         (200)
```

### Estado futuro aprovado

```
/servicos/agentes-de-ia           →  /solucoes#ia-para-operacoes            (1)
/servicos/automacao-de-processos  →  /solucoes#automacao-de-processos       (1)
/servicos/integracao-de-sistemas  →  /solucoes#integracao-de-sistemas       (1)
/servicos/operacoes-digitais      →  /solucoes#operacoes-digitais-commerce  (1)
/services                         →  /solucoes                              (1)
/services/  →  /services          →  /solucoes                              (2, normalização)
```

**Nenhuma chain de 2 saltos por regra própria.** O único 2-salto é o
`/services/`, produzido pela normalização do framework antes dos `redirects()`.

### O risco que esta unidade elimina

Se `/servicos/automacao-de-processos` migrasse **sem** reapontar os itens 3 e
4, eles virariam:

```
/servicos/integracao-de-sistemas → /servicos/automacao-de-processos → /solucoes#…   (2 saltos)
```

Por isso os três andam juntos — `RULING 3`.

E se `/servicos` migrasse antes de `/services` ser reapontado, `/services/`
chegaria a **3 saltos**. Reapontar `/services` agora (item 5) remove esse risco
de forma permanente, **independentemente** do futuro do hub.

---

## 15. Canonicals

`INFERRED` — nada a alterar:

- As sources deixam de servir HTML, logo o canonical delas some junto. Não é
  preciso editá-lo antes.
- `/solucoes` mantém `https://www.rc2solucoes.com.br/solucoes`.
- **Nunca** criar canonical com fragmento
  (`…/solucoes#ia-para-operacoes` **não** é canonical válido).
- Nenhuma outra página muda de canonical.

---

## 16. Analytics

`APPROVED` — redirect não cria analytics.

| Série | Situação |
|---|---|
| `service_detail_*` e related de `/servicos/agentes-de-ia` e `/servicos/automacao-de-processos` | **`SOURCE_PAGE_SERIES_ENDED_BY_REDIRECT`** — sem render, sem evento |
| séries de `/solucoes-com-ia` | **preservadas** — a página continua |
| `solutions_hero`, `solutions_orientation`, `solutions_final_cta`, `solutions_managed_ops`, `footer_solucoes`, `footer_produto`, `home_solutions` | **intactas** |
| `solution_hub_card` | permanece **encerrada** desde a Fase 5 |

**Nenhum identificador das páginas migradas é reutilizado** na nova
`/solucoes`. Nenhum event kind novo. A taxonomia global (`docs/10`) não é
revista aqui.

---

## 17. llms.txt

`OBSERVED` — `src/app/llms.txt/route.ts` lista hoje oito URLs e descreve o site
pela arquitetura legada, incluindo *"Soluções por Problema … atendimento lento,
leads sem resposta"* e as três sources desta unidade.

`INFERRED` — **entra na unidade SEO**, porque agora há mudança real de
descoberta: dois dos links que ele recomenda passam a redirecionar.

Estado-alvo:

- **Arquitetura principal:** `/` · `/solucoes` · `/sobre` · `/blog` ·
  `/contato` · `/avaliacoes`
- **As quatro competências**, por âncora de `/solucoes`
- **Zapbox** como produto externo (`https://zapbox.cloud/`), não como
  competência RC2
- **Remover** as duas URLs que passam a redirecionar
- **Não listar** URLs `DEFER_PHASE_6` como arquitetura principal
- **Não inventar** descrição: usar a copy já aprovada em `docs/14` §5 e
  `docs/15` §2

`/llms-full.txt` fica **fora do escopo** desta unidade — deriva das coleções
legadas, que permanecem intactas.

---

## 18. robots.txt

`OBSERVED` — inspecionado; nada a mudar.

`APPROVED` — **`ROBOTS_NO_CHANGE`**. Redirect não exige bloqueio. Bloquear as
sources em `robots.txt` seria **contraproducente**: impediria o crawler de
processar o próprio redirect e de transferir sinal ao destino.

---

## 19. Test strategy futura

**Unit** (`tests/unit/**/*.test.ts`, nunca `.test.tsx`):

- a configuração de redirects contém as cinco entradas aprovadas, com
  `permanent: true`
- nenhum redirect aprovado aponta para outra source de redirect (anti-chain,
  verificável na própria configuração)
- `sitemap.ts` **não** produz `/servicos/agentes-de-ia` nem
  `/servicos/automacao-de-processos`
- `sitemap.ts` **produz** `/solucoes`, `/servicos`, `/solucoes-com-ia` e as
  demais preservadas
- nenhuma URL do sitemap contém `#`
- `solutions.ts` e `services.ts` não têm mais `href` para os dois slugs
  migrados

**Runtime local** (`npm run build && npm run start`):

- cada source responde **308** com o `Location` esperado
- contagem de saltos: **1** para as cinco; **2** apenas para `/services/`
- destino final responde 200 e a âncora existe

**E2E:** atualizar `tests/e2e/services.spec.ts` (§9.2) — é a única suíte que
quebra.

**Smoke das preservadas:** as URLs `DEFER`/`KEEP` continuam 200.

---

## 20. Production validation futura

Após o merge, somente leitura: status, `Location`, número de saltos e URL final
das seis sources · `sitemap.xml` sem as duas migradas e com as preservadas ·
`llms.txt` atualizado · `robots.txt` inalterado · smoke das 10 URLs preservadas
· `/solucoes` e âncoras 200 · console sem regressão.

Não executar agora.

---

## 21. Rollback

`APPROVED` — **um redirect permanente não é revertido por `git revert`.**
O código volta; o cache do navegador e o processamento do crawler, não. O
Google pode já ter consolidado o sinal no destino.

Por isso esta unidade é desenhada assim:

- **conjunto mínimo** — 5 redirects, não 17
- **equivalência comprovada** URL a URL, não presumida
- **sem bulk redirect**
- **uma única migration pequena**, observável
- **Production observada** após o merge

Se um redirect precisar ser desfeito, o caminho realista é publicar o caminho
inverso e esperar o reprocessamento — não "voltar atrás".

---

## 22. Fora do escopo

Redirect do hub `/servicos` · `/servicos/e-commerce` ·
`/solucoes/processos-manuais` · `/solucoes/sistemas-desconectados` ·
`/servicos/sites-e-landing-pages` · todo o território Zapbox
(`/servicos/automacoes-com-ia`, `/servicos/automacao-de-atendimento`,
`atendimento-lento`, `leads-sem-resposta`, `whatsapp-desorganizado`) ·
`/solucoes-com-ia` · Agenda Confirmada · renomear `/avaliacoes` · slug
corrompido do blog · taxonomia global de analytics · edição em massa do CMS ·
`/llms-full.txt` · **remoção física de páginas** (§23) · criar middleware ·
tocar `/about` e `/about/`.

---

## 23. Preservação da implementação

`APPROVED` — **`PRESERVE_IMPLEMENTATION_FOR_ROLLBACK`**.

Os arquivos e registros das páginas redirecionadas **não são removidos**:

- o redirect vive na camada de routing e já torna o conteúdo inacessível
  publicamente;
- `services.ts` continua alimentando `/servicos`, `/servicos/[slug]` e o
  sitemap das URLs preservadas;
- manter o código é a única forma barata de voltar atrás;
- remoção física, se algum dia fizer sentido, é uma limpeza posterior, após
  estabilidade observada.

---

## 24. Critérios de aceite

Cada source só recebe `EXECUTE` se os dez critérios passarem:

| # | Critério | 1 · agentes-de-ia | 2 · automacao-de-processos | 3 · integracao | 4 · operacoes-digitais | 5 · /services | 7 · solucoes-com-ia |
|---|---|---|---|---|---|---|---|
| 1 | destino existe | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | destino 200 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | intenção equivalente | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 4 | conteúdo essencial absorvido | ✅ | ⚠️ n8n | n/a | n/a | n/a | — |
| 5 | não cria chain | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 6 | sitemap action definida | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | internal links mapeados | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | não depende do Zapbox | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 9 | não depende do Search Console | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | decisão é permanente | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| | **Resultado** | **EXECUTE** | **EXECUTE após absorção** | **EXECUTE** | **EXECUTE** | **EXECUTE** | **DEFER** |

Critérios de aceite do futuro PR: os cinco redirects em 308 com 1 salto ·
sitemap 31 → 29 · zero chain · `robots.txt` byte-idêntico · `llms.txt`
atualizado · nenhuma URL preservada virando 404 · e2e atualizado · gate
completo verde.

---

## 25. Decisões fechadas

1. **Cinco redirects aprovados**, um deles condicionado à absorção do n8n.
2. **`/solucoes-com-ia` fica de fora** — metade da intenção é território
   Zapbox, e o destino proposto declara não cobrir esse território.
3. **`/servicos` não migra** — `RULING 1`; permanece 200 e no sitemap.
4. **Status `PERMANENT_308`**, medido, não presumido.
5. **`/services/` aceita 2 saltos** — `ACCEPTED_TWO_HOP_FRAMEWORK_NORMALIZATION`;
   sem middleware.
6. **A regra explícita de `/services/` em `next.config.ts` é código morto** —
   a normalização dispara antes dela.
7. **Hub `/servicos`: abordagem A** — os dois cards migrados apontam direto
   para as âncoras.
8. **Sitemap: 31 → 29**, por filtro localizado em `sitemap.ts`, sem tocar nas
   coleções de conteúdo.
9. **Âncoras nunca entram no sitemap.**
10. **`robots.txt` não muda** — `ROBOTS_NO_CHANGE`.
11. **`llms.txt` entra na unidade SEO**; `llms-full.txt` não.
12. **`docs/BLOG_INTERNAL_LINKING_GUIDE.md` é atualizado** — guia operacional,
    não registro histórico.
13. **`tests/e2e/services.spec.ts` é atualizado** — quebra com o redirect.
14. **`CMS_INTERNAL_LINK_DEBT` registrada**, não bloqueante.
15. **Nenhuma página é removida fisicamente** —
    `PRESERVE_IMPLEMENTATION_FOR_ROLLBACK`.
16. **Nenhum redirect foi executado nesta tarefa.**
