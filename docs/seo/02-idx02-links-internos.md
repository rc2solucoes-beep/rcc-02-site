# IDX-02 — Links internos do CMS para URLs redirecionadas

## Status

| Fase | Estado |
|---|---|
| A — auditoria + plano | **concluída** (2026-09-28) |
| DG-2 | **aprovado para 31 de 32 ocorrências**; #4 bloqueado (seção 4) |
| B.0 — mapa final + dry-run | **concluída** (2026-09-28) |
| B.0.1 — ajuste editorial do #22 + congelamento | **concluída** (2026-09-28) |
| B — 1ª tentativa de execução manual | **abortada antes do COMMIT** — nada gravado (seção 11) |
| B.0.2 — correção do shadowing PL/pgSQL + recongelamento | **concluída** (2026-09-28) — **script recongelado** |
| B.0.3 — preflight da 2ª tentativa | **aprovado** (2026-09-28) |
| B — 2ª tentativa de execução manual | **concluída** — 2026-09-28 20:47:24 UTC |
| B — auditoria pós-execução | **concluída** (2026-09-29) — **migração principal confirmada em produção, 31/32** |

**Migração principal executada e confirmada em produção: 31/32.** #4 segue
pendente por decisão editorial. A 1ª tentativa abortou sem persistir nada
(seção 11). Script final recongelado na B.0.2, pronto para copiar e rodar sem
edição: `docs/sql/32-idx02-links-internos-canonicos.sql` (31
aprovadas, 1 bloqueada). Reversão:
`docs/sql/32-idx02-links-internos-canonicos-reversao.sql`. Impressão digital do
mapa (md5 de `ord|aprovado|old|new` das 32 linhas):
`1b8e2494334be9d422678beddac5978d`.

| | |
|---|---|
| Auditoria | 2026-09-28, `main` @ `a7e68f8` (PR #34) |
| Fonte | `public.posts.content`, lido por SELECT na conexão MCP (`supabase_read_only_user`, `transaction_read_only = on`) |
| Achado de origem | `docs/seo/01-indexacao-rastreamento.md`, IDX-02 |
| Executor da Fase B | usuário, no Supabase SQL Editor (role `postgres`) |

---

## 1. Estado auditado × baseline

| | Baseline (2026-09-27) | Auditoria (2026-09-28) |
|---|---:|---:|
| Posts publicados | 15 | 15 |
| Posts afetados | 13 | **13** |
| Links para URL redirecionada | 23 | **32 ocorrências** |
| Ocorrências com 2 saltos (apex) | 5 | **7** |
| Ocorrências com 1 salto | 18 | **25** |

**Por que 32 e não 23.** O crawler do baseline contou um link por destino por
página. A unidade desta auditoria é a **ocorrência**: post + href + âncora +
contexto. O conteúdo é o mesmo do baseline — o md5 dos 13 posts, registrado na
auditoria, continuava igual na simulação da Fase B.0.

Nenhum post fora de `published` tem esses links. Todas as ocorrências vêm do
`content` do CMS — nenhuma do código.

## 2. Redirects e destinos (revalidados na Fase B.0)

| Origem | Saltos | Destino final |
|---|---:|---|
| `/servicos/automacoes-com-ia` | 1 (308) | `/zapbox` |
| `/solucoes/leads-sem-resposta` | 1 (308) | `/zapbox` |
| `/servicos/agentes-de-ia` | 1 (308) | `/solucoes#ia-para-operacoes` |
| `/servicos/automacao-de-processos` | 1 (308) | `/solucoes#automacao-de-processos` |
| `/servicos/e-commerce` | 1 (308) | `/solucoes#operacoes-digitais-commerce` |
| `/servicos/sites-e-landing-pages` | 1 (308) | `/solucoes` |
| `/solucoes/processos-manuais` | 1 (308) | `/solucoes` |
| absoluto `www` das rotas acima | 1 (308) | idem |
| absoluto apex das rotas acima | **2** (301 → 308) | idem |

Sem mudança desde a Fase A. Destinos finais: `/zapbox` e `/solucoes` → 200,
canonical próprio, `index, follow`. `#ia-para-operacoes`,
`#automacao-de-processos` e `#operacoes-digitais-commerce` existem em
`/solucoes` (1 `id` cada).

## 3. Mapa final

Todos os hrefs finais são **relativos**. Formato do href atual: `rel`
relativo · `www` absoluto www · `apex` absoluto apex.

| # | Post | Âncora atual | Href atual | Destino final | Âncora final | Alteração | Status |
|---:|---|---|---|---|---|---|---|
| 1 | atendimento-automatizado-contexto | atendimento automatizado com IA | `/servicos/automacoes-com-ia` (rel) | `/zapbox` | = | href-only | APROVADO |
| 2 | atendimento-automatizado-contexto | automações com IA para atendimento | `/servicos/automacoes-com-ia` (rel) | `/zapbox` | = | href-only | APROVADO |
| 3 | atendimento-automatizado-contexto | Conhecer as automações com IA para atendimento da RC2 → | `/servicos/automacoes-com-ia` (rel) | `/zapbox` | Ver como o Zapbox usa IA no atendimento pelo WhatsApp → | href+anchor | APROVADO |
| 4 | atendimento-omnichannel-pme | agente de IA | `/servicos/agentes-de-ia` (apex) | — | — | blocked | **BLOQUEADO** |
| 5 | atendimento-omnichannel-pme | n8n | `/servicos/automacao-de-processos` (apex) | `/solucoes#automacao-de-processos` | = | href-only | APROVADO |
| 6 | atendimento-omnichannel-pme | agentes de IA | `/servicos/agentes-de-ia` (apex) | `/solucoes#ia-para-operacoes` | = | href-only | APROVADO |
| 7 | atendimento-omnichannel-pme | Ver soluções de automação e atendimento → | `/servicos/automacoes-com-ia` (apex) | `/zapbox` | = | href-only | APROVADO |
| 8 | automacao-whatsapp-ia | agentes de IA | `/servicos/automacoes-com-ia` (apex) | `/zapbox` | = | href-only | APROVADO |
| 9 | automacao-whatsapp-ia | Ver soluções de automação com IA → | `/servicos/automacoes-com-ia` (apex) | `/solucoes` | = | href-only | APROVADO |
| 10 | custo-de-agente-de-ia | agentes de IA para operação | `/servicos/agentes-de-ia` (rel) | `/solucoes#ia-para-operacoes` | = | href-only | APROVADO |
| 11 | custo-de-agente-de-ia | automações de atendimento com IA | `/servicos/automacoes-com-ia` (rel) | `/zapbox` | = | href-only | APROVADO |
| 12 | e-commerce-para-pme-operacao | e-commerce da RC2 | `/servicos/e-commerce` (rel) | `/solucoes#operacoes-digitais-commerce` | = | href-only | APROVADO |
| 13 | e-commerce-para-pme-operacao | automação de processos | `/servicos/automacao-de-processos` (rel) | `/solucoes#automacao-de-processos` | = | href-only | APROVADO |
| 14 | e-commerce-para-pme-operacao | landing page de conversão | `/servicos/sites-e-landing-pages` (rel) | `/solucoes` | = | href-only | APROVADO |
| 15 | e-commerce-para-pme-operacao | Conhecer as soluções de e-commerce da RC2 → | `/servicos/e-commerce` (rel) | `/solucoes#operacoes-digitais-commerce` | = | href-only | APROVADO |
| 16 | governanca-agentes-ia-pmes | implementação de agentes de IA para empresas | `/servicos/agentes-de-ia` (www) | `/solucoes#ia-para-operacoes` | = | href-only | APROVADO |
| 17 | governanca-agentes-ia-pmes | automação de processos com integrações | `/servicos/automacao-de-processos` (www) | `/solucoes#automacao-de-processos` | = | href-only | APROVADO |
| 18 | ia-para-pequenas-empresas | Ver soluções de automação da RC2 → | `/servicos/automacoes-com-ia` (apex) | `/solucoes` | = | href-only | APROVADO |
| 19 | integracao-canais-atendimento | automação de atendimento com IA | `/servicos/automacoes-com-ia` (rel) | `/zapbox` | = | href-only | APROVADO |
| 20 | integracao-canais-atendimento | integração entre processos | `/servicos/automacao-de-processos` (rel) | `/solucoes#automacao-de-processos` | = | href-only | APROVADO |
| 21 | integracao-canais-atendimento | Conhecer as soluções de automação de atendimento da RC2 → | `/servicos/automacoes-com-ia` (rel) | `/zapbox` | Conhecer o Zapbox, produto da RC2 para atendimento e vendas no WhatsApp → | href+anchor | APROVADO |
| 22 | leads-sem-resposta-primeiro-retorno | leads sem resposta no atendimento | `/solucoes/leads-sem-resposta` (rel) | `/zapbox` | Zapbox (frase reescrita — seção 5) | sentence-rewrite | APROVADO |
| 23 | leads-sem-resposta-primeiro-retorno | automação de atendimento com IA | `/servicos/automacoes-com-ia` (rel) | `/zapbox` | = | href-only | APROVADO |
| 24 | leads-sem-resposta-primeiro-retorno | Conhecer as soluções de automação de atendimento com IA da RC2 → | `/servicos/automacoes-com-ia` (rel) | `/zapbox` | Ver como o Zapbox organiza leads em pipeline comercial → | href+anchor | APROVADO |
| 25 | mensagens-servico-whatsapp-business-api | agente de IA integrado ao atendimento | `/servicos/automacoes-com-ia` (rel) | `/zapbox` | = | href-only | APROVADO |
| 26 | mensagens-servico-whatsapp-business-api | automações de atendimento com IA | `/servicos/automacoes-com-ia` (rel) | `/zapbox` | = | href-only | APROVADO |
| 27 | processos-manuais-o-que-automatizar | automação de processos com n8n | `/servicos/automacao-de-processos` (www) | `/solucoes#automacao-de-processos` | = | href-only | APROVADO |
| 28 | seguranca-de-agente-de-ia | agentes de IA em produção | `/servicos/agentes-de-ia` (rel) | `/solucoes#ia-para-operacoes` | = | href-only | APROVADO |
| 29 | seguranca-de-agente-de-ia | agentes de IA que rodam com registro e permissão definidos | `/servicos/agentes-de-ia` (rel) | `/solucoes#ia-para-operacoes` | = | href-only | APROVADO |
| 30 | seguranca-de-agente-de-ia | automação de processos desenhada para ser auditada | `/servicos/automacao-de-processos` (rel) | `/solucoes#automacao-de-processos` | = | href-only | APROVADO |
| 31 | solucoes-automatizadas-7-criterios-para-avaliar-fornecedores | gargalos causados por processos manuais | `/solucoes/processos-manuais` (rel) | `/solucoes` | = | href-only | APROVADO |
| 32 | solucoes-automatizadas-7-criterios-para-avaliar-fornecedores | integração entre ferramentas via API | `/servicos/automacao-de-processos` (www) | `/solucoes#automacao-de-processos` | = | href-only | APROVADO |

**Totais:** 32 ocorrências · **31 APROVADO** (27 href-only · 3 href+anchor ·
1 sentence-rewrite) · **1 BLOQUEADO** (#4).

**Destinos das aprovadas:** 13 → `/zapbox` (9 âncoras mantidas · 3 âncoras
alteradas: #3, #21, #24 · 1 frase reescrita: #22) · 7 → `#automacao-de-processos` · 5 →
`#ia-para-operacoes` · 4 → `/solucoes` (#9, #14, #18, #31) · 2 →
`#operacoes-digitais-commerce`.

O #18 é o único link com atributos além do `href` (`target="_blank"`,
`rel="noopener noreferrer nofollow"`, `class=…`): a tag nova preserva todos, na
mesma ordem; só o `href` muda.

## 4. #4 — decision gate (único pendente)

**Post:** `atendimento-omnichannel-pme` · seção H2 "Como a IA melhora o
atendimento omnichannel" › H3 "Triagem e qualificação automática".

**Parágrafo completo:**

> Um `<a href="https://rc2solucoes.com.br/servicos/agentes-de-ia">agente de IA</a>`
> pode receber a primeira mensagem do cliente em qualquer canal, identificar a
> natureza da solicitação — dúvida, reclamação, pedido, suporte técnico — e
> encaminhar para o atendente certo sem intervenção humana. Isso reduz o tempo
> de espera e garante que cada solicitação chegue para quem tem mais contexto
> para resolver.

- **Frase anterior** (fim da seção): "Omnichannel organiza os canais. IA
  potencializa o que acontece dentro deles. […] uma operação de atendimento que
  escala sem precisar crescer proporcionalmente em equipe."
- **Frase posterior** (H3 seguinte): "Respostas automáticas para perguntas
  frequentes".
- **Href atual:** apex, 2 saltos (301 → 308) → `/solucoes#ia-para-operacoes`.

**Análise.**

- **A. Contexto:** atendimento ao cliente — primeira mensagem, triagem,
  encaminhamento para atendente. Não fala de processo interno, backoffice ou
  decisão operacional. O canal, porém, é "qualquer canal" (omnichannel), não
  especificamente WhatsApp.
- **B. Âncora:** "agente de IA" — descreve a tecnologia, não o produto nem a
  competência.
- **C. Destino:** `#ia-para-operacoes` contradiz a fronteira: a própria ponte
  `/zapbox` diz que IA "sobre processo interno, **não sobre conversa com
  cliente**" é RC2. Pelo objeto (conversa com cliente), o território é Zapbox
  (CD-3) — e a ponte sustenta "Atendimento e qualificação com IA" / "Sales AI
  que atende, qualifica e passa para uma pessoa". `/solucoes` e
  `#automacao-de-processos` não se aplicam.

**Status: PENDENTE (decisão editorial).** Não migrado; href e âncora
inalterados em produção.

**Decisão (B.0.1): BLOQUEADO, `aprovado = false`.** Nenhum dos dois destinos
existentes representa bem o trecho: `/zapbox` é específico demais (WhatsApp)
para um texto sobre "qualquer canal", e `#ia-para-operacoes` não representa um
trecho sobre atendimento/conversa com cliente. É preferível manter
temporariamente o redirect conhecido a introduzir um link semanticamente
incorreto. Destino e âncora não mudam; a linha continua no mapa.

A linha #4 do mapa guarda um `new_tag` de rascunho (`/zapbox` · "agente de IA
de atendimento"), **não aprovado**. Ele só existe para a linha ter formato
válido; mudar `aprovado` para `true` exige um novo decision gate. O preflight
do script para se as linhas bloqueadas não forem exatamente `[4]`. **O lote das
outras 31 não depende do #4.**

## 5. #22 — reescrita da frase (versão final, B.0.1)

**Parágrafo atual (HTML completo):**

```html
<p>A página da RC2 sobre <a href="/solucoes/leads-sem-resposta">leads sem resposta no atendimento</a> trata essa dor como um gargalo operacional, não como falta de esforço da equipe. Esse olhar é importante: antes de cobrar mais velocidade, é preciso enxergar como o lead entra e por onde ele para.</p>
```

**Parágrafo final (HTML completo, gerado pela simulação sobre o conteúdo real):**

```html
<p>No <a href="/zapbox">Zapbox</a>, leads que chegam pelo WhatsApp podem ser organizados e acompanhados em um pipeline comercial, ajudando a tratar a falta de resposta como um gargalo operacional, não como falta de esforço da equipe. Esse olhar é importante: antes de cobrar mais velocidade, é preciso enxergar como o lead entra e por onde ele para.</p>
```

- **Referente de "Esse olhar".** Na versão da B.0, a frase nova falava só de
  organizar leads, e "Esse olhar é importante" ficava sem referente. Na versão
  final, a primeira frase termina com "tratar a falta de resposta como um
  gargalo operacional, não como falta de esforço da equipe" — exatamente o
  "olhar" retomado pela frase seguinte, como no original.
- **Chave da troca:** o trecho exato de `<p>A página da RC2 sobre` até
  `…esforço da equipe.` — 1 ocorrência no post e em todo o site. Guard: antigo
  = 1 e novo = 0, senão `RAISE` e o lote aborta. Sem regex.
- **Só a primeira frase muda.** "Esse olhar é importante: …", o `</p>`, os
  links seguintes e o resto do post ficam idênticos — provado pela simulação:
  desfazer a troca devolve o post original byte a byte.
- Âncora dentro da frase: **"Zapbox"** (o nome do destino).

## 6. Diff por post (simulado sobre o conteúdo real)

| Slug | Hrefs alterados | Âncoras alteradas | Frases alteradas | Delta chars |
|---|---:|---:|---:|---:|
| atendimento-automatizado-contexto | 3 | 1 | 0 | −60 |
| atendimento-omnichannel-pme | 3 | 0 | 0 | −94 |
| automacao-whatsapp-ia | 2 | 0 | 0 | −90 |
| custo-de-agente-de-ia | 2 | 0 | 0 | −16 |
| e-commerce-para-pme-operacao | 4 | 0 | 0 | +12 |
| governanca-agentes-ia-pmes | 2 | 0 | 0 | −56 |
| ia-para-pequenas-empresas | 1 | 0 | 0 | −44 |
| integracao-canais-atendimento | 3 | 1 | 0 | −24 |
| leads-sem-resposta-primeiro-retorno | 3 | 2 | **1 (#22)** | +3 |
| mensagens-servico-whatsapp-business-api | 2 | 0 | 0 | −40 |
| processos-manuais-o-que-automatizar | 1 | 0 | 0 | −30 |
| seguranca-de-agente-de-ia | 3 | 0 | 0 | +8 |
| solucoes-automatizadas-7-criterios-para-avaliar-fornecedores | 2 | 0 | 0 | −48 |
| **Total** | **31** | **4** | **1** | |

Âncoras alteradas = #3, #21, #24 (href+anchor) + a âncora do #22, que faz
parte da frase reescrita. Nenhum outro post tem frase alterada.

## 7. SQL final

`docs/sql/32-idx02-links-internos-canonicos.sql` — **NÃO EXECUTADO.** Copiar
o arquivo inteiro no SQL Editor e rodar; nenhuma edição manual. Uma única
transação: qualquer `RAISE` desfaz tudo.

1. **Estado auditado** — 13 ids + md5 do `content` em 2026-09-28.
2. **Mapa** — 32 linhas; old/new = trecho HTML exato (a tag `<a>` inteira; no
   #22, a frase). #4 com `aprovado = false`.
3. **Preflight** (antes de qualquer escrita) — 13 posts publicados com id/slug
   auditados; mapa com 32 linhas, 31 aprovadas, 1 bloqueada; destinos só da
   lista aprovada; linhas bloqueadas exatamente `[4]`; md5 de cada post =
   auditado (ou backup deste lote, numa
   reexecução); trigger `posts_updated_at` existe e está ativo.
4. **Backup** — `public.idx02_links_backup_20260928` (id, slug, content
   original, md5 original, `updated_at` original, `backup_at`, md5 migrado),
   só dos 13 posts, persistente. `IF NOT EXISTS` + checagem: backup de outra
   auditoria → para. RLS ligada e `REVOKE ALL` de `anon`/`authenticated`.
5. **Aplicação** — `FOR UPDATE` nas 13 linhas; núcleo de decisão por post
   (concorrência pelo md5 → 1 antiga/0 nova por troca, ou 0/1 = já aplicada);
   `UPDATE` com `md5(content)` igual ao lido e `updated_at` = original; trigger
   desligado e religado no mesmo bloco, com verificação de que voltou ativo.
6. **Conferência** (em `RAISE`, antes do `COMMIT`):
   - 6A — nenhum trecho antigo aprovado restante;
   - 6B/6C — hrefs IDX-02 restantes (rel/www/apex) = só os das linhas
     bloqueadas (1);
   - 6D — cada trecho novo aprovado presente 1 vez; nº de links igual ao backup;
   - 6E — `<a>` = `</a>`, nº de `<p>` igual; desfazer as trocas devolve o
     original exato (nada fora das regiões mapeadas mudou);
   - 6F — `updated_at` preservado;
   - 6G — trigger ativo.
7. **`COMMIT`**, e depois uma visão final só de leitura (13 linhas).

**Idempotência:** rodar de novo = 0 mudanças (trocas já aplicadas são
reconhecidas). **Reversão:** arquivo próprio; restaura `content` e
`updated_at` só onde o conteúdo ainda é o que a migração gravou — se um post
foi editado depois, para sem sobrescrever.

**Validação (B.0.2), em três camadas:**

- **Sintaxe** — parser do Postgres 17 (`@libpg-query/parser`): migração (14
  statements, 4 blocos PL/pgSQL) e reversão (4 statements, 1 bloco) válidas.
  Sozinha não basta: aceitou o script que falhou.
- **Nomes** — linter de shadowing por bloco `DO` (variável × alias SQL ×
  coluna): 0 conflitos; nenhum alias de uma letra dentro de PL/pgSQL.
- **Runtime** — os scripts completos executados em PostgreSQL 17.5 local
  (PGlite; schema equivalente: `posts`, trigger `posts_updated_at`, RLS,
  roles `anon`/`authenticated`; conteúdo sintético com os trechos exatos do
  mapa). 11/11 cenários passam, e o script da 1ª tentativa reproduz
  exatamente o erro de produção (controle negativo).

## 8. Simulação (somente leitura, conteúdo real)

Executada com **o mesmo núcleo PL/pgSQL** do script (gerado do mesmo texto),
sobre os 13 posts lidos do banco, sem escrita.

| Cenário | Resultado |
|---|---|
| Primeira execução | 31 trocas, 13 posts; `<a>` = `</a>` e nº de `<p>` iguais nos 13; desfazer as trocas devolve o original nos 13 (0 mudanças fora do mapa); hrefs IDX-02 restantes = 1 (#4, original) |
| Segunda execução | 0 trocas, 0 posts alterados; 31/31 aprovadas reconhecidas como já aplicadas; #4 intacto |
| CMS concorrente (`content` alterado) | lote abortado — `conflito: custo-de-agente-de-ia foi editado depois da auditoria` |
| Tag antiga ausente | abortado pelo md5; com o md5 "reauditado", abortado pela contagem: `obtido 0/0` |
| Tag antiga duplicada | abortado pelo md5; com o md5 "reauditado", abortado pela contagem: `obtido 2/0` |
| Reversão (original → migração → reversão) | 13/13 posts idênticos byte a byte ao original, #22 inclusive |
| Reversão com post editado depois da migração | abortada — `conflito: leads-sem-resposta-primeiro-retorno foi editado depois da migração` |

A simulação usa o mesmo texto PL/pgSQL do script (núcleo da migração e núcleo
da reversão) e confere a impressão digital do mapa: o md5 calculado no banco
bateu com o do mapa gerado (`1b8e2494…5978d`).

Na execução real, o aborto desfaz o lote inteiro (transação única): posts
processados antes do erro também não são gravados.

### Critérios pós-execução (Fase B)

Depois do `COMMIT` e do ISR de 60 s, conferir em produção (read-only):

- 0 links para `/servicos/…`, `/solucoes/leads-sem-resposta`,
  `/solucoes/processos-manuais` nos posts publicados, exceto o #4 bloqueado;
- 0 links absolutos www/apex dessas rotas, exceto o #4; 0 com 2 saltos
  (exceto o #4);
- as 31 ocorrências com o href novo, cada destino respondendo 200 sem salto;
- metadata, JSON-LD, H1 e `dateModified` dos 13 posts inalterados.

## 9. Riscos

| Risco | Mitigação |
|---|---|
| Post editado no CMS entre a auditoria e a execução | md5 auditado + `FOR UPDATE` + `RAISE`; o lote todo volta |
| Replace atingir outra ocorrência | trecho exato como chave; guard 1/0; 6E prova que nada fora das regiões mudou |
| Trigger ficar desligado | desliga/religa no mesmo bloco; checagem antes, depois e na conferência 6G |
| Backup exposto pela API | RLS + `REVOKE ALL` de `anon`/`authenticated` |
| Cache | ISR de 60 s atualiza sozinho; nenhum deploy |
| Lock durante o lote | `DISABLE TRIGGER` pega lock exclusivo em `posts` pelos milissegundos do lote; leituras/revalidações nesse intervalo só esperam. Rodar fora de horário de edição no CMS |

## 10. Fora do escopo (não corrigidos)

- **F-1 — CTA descontinuado** ("diagnóstico gratuito") em
  `integracao-canais-atendimento` e `seguranca-de-agente-de-ia`.
- **F-2 — link interno com `nofollow`/`target="_blank"`** (#18), preservado.
- **F-3 — CTAs finais duplicados para `/zapbox`** (#3, #7, #24).
- **F-4 — `#integracao-de-sistemas`** casaria melhor com #20 e #32; fora do
  mapa de redirects aprovado.
- ~~F-5 — coesão no #22~~ — resolvido na B.0.1 (seção 5).

## 11. Histórico de execução

**2026-09-28 — 1ª tentativa de execução manual: abortada antes do `COMMIT`.**

- **Erro:** `ERROR: 55000: record "m" is not assigned yet` — no bloco de
  conferência (passo 6), na checagem 6A:
  `EXISTS (SELECT 1 FROM idx02_map m JOIN public.posts p USING (slug) WHERE m.aprovado …)`.
- **Causa:** shadowing entre variável PL/pgSQL e alias SQL. O bloco declarava
  `b record; m record` e as consultas do mesmo bloco usavam `m` (`idx02_map`)
  e `b` (backup) como alias; o PL/pgSQL resolveu `m.aprovado` como campo do
  record `m`, ainda não atribuído. O conflito entrou na B.0, quando a
  checagem 6E virou um laço. O parser aceitou (é erro de resolução de nomes,
  não de sintaxe) e a simulação só exercitava o núcleo do passo 5.
- **Impacto:** nenhuma escrita persistida — confirmado por auditoria
  read-only: md5 dos 13 posts = baseline, 32 trechos antigos presentes (1/0),
  tabela de backup inexistente, trigger `posts_updated_at` ativo, `updated_at`
  dos 13 posts idênticos aos da auditoria.
- **Correção (B.0.2):** aliases e variáveis de laço inequívocos em todos os
  blocos PL/pgSQL (`map_row`, `post_row`, `audit_row`, `backup_row`;
  `map_rec`, `post_rec`, `audit_rec`, `backup_rec`), sem
  `plpgsql.variable_conflict`. Mapa, destinos, âncoras, #22, #4, backup,
  `updated_at` e estratégia de reversão inalterados.

**Conflitos encontrados na auditoria de shadowing**

| Arquivo · bloco | Conflito variável = alias | Aliases curtos (≤ 2 letras) |
|---|---|---|
| migração · passo 3 (preflight) | — | `a`, `p`, `m` |
| migração · passo 4 (checagem do backup) | — | `b`, `a` |
| migração · passo 5 (aplicação) | — | `a`, `p` |
| migração · passo 6 (conferência) | **`b`, `m`** (causa do erro) | `m`, `p`, `a`, `b`, `bk` |
| reversão | — | `bk`, `p` |

**Runtime (PostgreSQL 17.5 local) — 11/11**

| Cenário | Resultado |
|---|---|
| Script da 1ª tentativa | reproduz `record "m" is not assigned yet`; 0 alterações, sem backup |
| 1ª execução | 31 trocas, 13 posts = esperado, #4 intacto, 0 mudanças fora do mapa, HTML balanceado, `updated_at` 13/13, trigger ativo, backup 13 linhas com RLS e sem acesso de `anon`/`authenticated` |
| 2ª execução | 0 mudanças |
| Reversão | 13/13 byte a byte (#22 incluso), `updated_at` 13/13, trigger ativo |
| Reaplicar após reversão | 13/13 = esperado |
| Reversão com post editado depois | abortada (conflito), nada alterado |
| CMS concorrente | abortado (conflito), 0 alterações, sem backup |
| Tag ausente | abortado (`obtido 0/0`) |
| Tag duplicada | abortado (`obtido 2/0`) |
| Trigger desativado antes | abortado no preflight |
| Expressão 6A isolada | antes: erro; depois: executa |

Um controle extra mostrou que o runtime pega o que o parser e o linter não
pegam: durante a renomeação, `FOR UPDATE OF p` ficou para trás num passo —
o teste de runtime acusou `relation "p" in FOR UPDATE clause not found` e a
linha foi corrigida antes do recongelamento.

**2026-09-28 20:47:24 UTC — 2ª tentativa: concluída.** Script
`e823d440…` (idêntico ao validado na B.0.2), rodado no SQL Editor. Visão final:
13 posts com `migrado = true` e `updated_at_preservado = true`;
`hrefs_antigos = 0` em 12 e `1` em `atendimento-omnichannel-pme` (#4).

**Auditoria pós-execução (2026-09-29, somente leitura)**

| Verificação | Resultado |
|---|---|
| Backup `public.idx02_links_backup_20260928` | 13 linhas íntegras; md5 original = auditoria 13/13; RLS ligada; `anon`/`authenticated` sem acesso |
| Trigger `posts_updated_at` | ativo (`O`); único trigger de `posts` |
| `updated_at` | 13/13 iguais ao original |
| Ocorrências aprovadas | 31/31 aplicadas (antigo 0 / novo 1) |
| #4 | intacto (antigo 1 / novo 0) — pendente |
| hrefs IDX-02 restantes no site | 1 (o #4); apex restante: 1 (o #4) |
| Links aprovados para `/zapbox` | 13 (9 âncoras mantidas, 3 alteradas, 1 frase) |
| #22 | frase nova 1×, antiga 0× — no banco e em produção |
| HTML | balanceado 13/13; reverter as 31 trocas devolve o backup byte a byte 13/13 |
| Produção (HTML) | 32/32 ocorrências no estado esperado; 1 href antigo (#4) |
| Destinos novos | `/zapbox`, `/solucoes` → 200 sem redirect; 3 fragmentos presentes 1× |
| Metadata e JSON-LD (23 URLs do sitemap) | 0 diferenças contra o snapshot pré-execução |
| Texto visível | muda só nas regiões aprovadas e na ordem dos cards de relacionados (F-6); provado reconstruindo o hash pré-execução nos 7 posts com mudança de texto |
| robots/googlebot | 16/16 posts publicados com `index, follow` + `googlebot` completo |
| IDX-01 / IDX-08 | 404, só `noindex`, sem canonical — intactos |
| Rotas principais e redirects | inalterados |
| Rollback | **não executado** — fica como contingência |

**Contexto registrado, fora do escopo da migração:** na validação final havia
**16** posts publicados (não 15). O 16º, `o-que-e-agente-de-ia`, foi publicado
em 2026-09-28 17:00 UTC (antes da migração), está em `/blog`, responde 200,
tem robots/googlebot corretos e nenhum link do IDX-02.

**Achados novos (não corrigidos)**

- **F-6 — ordem dos "Posts Relacionados" não é determinística.**
  `getRelatedPosts` busca com `.in("id", …)` sem `ORDER BY` e sem respeitar a
  ordem de `related_post_ids`. O `UPDATE` da migração regravou as linhas e a
  ordem física mudou: em 7 páginas (6 do lote e `agente-ia-interno-documentos`)
  os dois cards trocaram de lugar. Conteúdo idêntico; é cosmético.
- **F-7 — `sitemap.xml` não regenera.** `src/app/sitemap.ts` declara
  `revalidate = 60`, mas a resposta segue `x-vercel-cache: HIT` com `age` de ~23 h
  (gerada no deploy da PR #34). O post `o-que-e-agente-de-ia` ainda não está no
  sitemap (25 URLs: 15 posts, 8 estáticas, 2 `llms*.txt`). Relaciona-se ao
  IDX-03. **Finding relevante:** há 16 posts publicados e 15 no sitemap — um
  post publicado está fora do sitemap. Tratar em SDD próprio; não corrigido
  nesta branch.
