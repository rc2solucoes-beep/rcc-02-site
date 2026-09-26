---
name: pre-pr
description: Gate final antes de abrir Pull Request no RC2 Site. Roda as validações determinísticas (check, build, audit:brand) com fail-fast, faz a triagem do diff, aciona governance-reviewer e seo-migration-checker quando aplicável, valida visualmente as rotas afetadas e emite um PR READINESS REPORT. Somente diagnóstico — não corrige nada.
disable-model-invocation: true
argument-hint: "[working-tree]"
---

# /pre-pr — gate de prontidão para Pull Request

Responda a uma pergunta: **este diff está tecnicamente e semanticamente pronto
para virar Pull Request?**

Você é um **orquestrador**. Não é um novo reviewer: não reimplemente regras do
`audit-brand.sh`, do `governance-reviewer` nem do `seo-migration-checker`.
Chame essas camadas e consolide o que elas dizem.

```
determinístico  →  semântico  →  visual  →  consolidação
```

## Proibido nesta skill

Somente diagnóstico. **Não:** editar arquivo, rodar `--fix`, corrigir lint,
alterar copy, redirect, sitemap, CTA ou SEO, `git add`, `git commit`,
`git push`, `git stash`, mudar staging, abrir PR, fazer deploy, alterar `.env*`.
Se algo precisar de correção, isso vai no relatório — a decisão é do usuário.

## Etapa 1 — Estado Git e escopo

```bash
git branch --show-current
git status --short
git fetch origin main --quiet   # só atualiza refs remotas; não toca working tree nem staging
git merge-base origin/main HEAD
```

**A base é `origin/main`, não `main` local.** A `main` local pode estar
atrasada: comparar contra ela faz a skill revisar commits que já foram
mesclados e publicados. Se o `fetch` falhar (sem rede), use o `origin/main`
já existente e avise no relatório que a base pode estar desatualizada.

**Escopo padrão (o que a PR vai conter):** tudo entre o merge-base com
`origin/main` e o working tree — commits da branch ainda não mesclados +
alterações não commitadas (staged e unstaged) + arquivos untracked relevantes.
Se a branch não tiver commits à frente de `origin/main`
(`git rev-list --count origin/main..HEAD` = 0), diga isso no relatório: o
escopo é só o que não foi commitado.

```bash
BASE=$(git merge-base origin/main HEAD)
git diff --stat $BASE
git diff --name-status $BASE
git diff $BASE
git status --short   # untracked (??) entram no escopo
```

**Argumento `working-tree`:** se `$ARGUMENTS` contiver `working-tree`, o escopo
é só o não commitado: `git diff HEAD --stat`, `git diff HEAD --name-status`,
`git diff HEAD` e os untracked.

Registre para o relatório: branch, escopo usado, arquivos alterados. Se houver
alterações **não commitadas** no escopo padrão, avise no relatório: elas foram
validadas, mas só entram na PR depois de commitadas.

Se estiver na `main`, ou o escopo estiver vazio, pare e diga isso — não há PR a
validar.

## Etapa 2 — Validações determinísticas (fail-fast)

Rode **em sequência**, parando na primeira falha:

| # | Comando | O que cobre | Tempo típico |
|---|---|---|---|
| 1 | `npm run check` | `typecheck && lint && test` (Vitest, `tests/unit/**`) | ~50 s |
| 2 | `npm run build` | `next build` | 15–60 s |
| 3 | `npm run audit:brand` | marca e governança determinística | ~1 s |

`check` **não** contém `audit:brand` nem `build` — os três são independentes;
rode os três. Capture exit code e saída de cada um (redirecione para um arquivo
temporário fora do repo e leia o trecho relevante).

Critérios:

- **`check`:** exit ≠ 0 → FAIL. Warnings de lint não reprovam (há 10
  preexistentes).
- **`audit:brand`:** exit 0 → PASS; exit 1 com "Violações bloqueantes" → FAIL
  (violação); qualquer outro código → FAIL (erro operacional). Warnings do audit
  não reprovam.
- **`build`:** exit ≠ 0 → FAIL, **com uma única exceção**: se a saída contiver
  `Next.js build worker exited with code` e **nenhum** erro de compilação, de
  tipo ou de prerender (`Failed to compile`, `Type error`, `Error occurred
  prerendering`, `Module not found`), é o crash nativo intermitente do worker
  no Windows (observado: código `3221226505` / `0xC0000409`). Nesse caso rode
  `npm run build` **mais uma vez**. Passou → PASS, anotando
  `PASS (retry após crash de worker)`. Falhou de novo → FAIL. Nunca repita mais
  de uma vez, e nunca repita outro tipo de falha.

### Fail-fast

Se qualquer um falhar: **pare**. Não rode reviewers, não rode Playwright. Emita
o relatório com `Status: PRE-PR BLOCKED`, marcando os passos seguintes como
`NOT RUN`, e inclua: comando, exit code, resumo do erro (as linhas que
identificam a falha, não o log inteiro) e arquivos relacionados quando
identificáveis.

## Etapa 3 — Triagem do diff

Classifique cada arquivo do escopo. Use o nome **e** o conteúdo do diff — um
arquivo pode acionar um reviewer pelo que mudou, não pelo lugar onde está.

### `seo-migration-checker` — REQUIRED quando

- o diff toca `next.config.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`,
  `src/lib/content/migratedRoutes.ts`, `src/lib/content/navigation.ts`,
  `src/lib/siteMetadata.ts`, `src/app/llms.txt/**`, `src/app/llms-full.txt/**`,
  `tests/unit/seo/**`, `tests/e2e/*migration*`;
- um `page.tsx`, `layout.tsx` ou `route.ts` sob `src/app/` é **adicionado,
  removido, renomeado ou movido** (`--name-status` com A, D ou R);
- linhas alteradas contêm `href`, `canonical`, `alternates`, `redirect`,
  `robots`, `noindex`, `openGraph`/`buildOg` com `url`, `BASE_URL`, ou um path
  interno (`"/…"`) sendo trocado.

**NOT REQUIRED** quando nenhuma rota, URL, link ou metadata de URL muda — ex.:
só copy, só estilo, só scripts/docs/config interna.

### `governance-reviewer` — REQUIRED quando

- o diff altera texto que o visitante lê ou oferta comercial: `src/lib/content/**`,
  strings de copy em `src/app/(public)/**` ou `src/components/marketing/**`,
  rótulos e destinos de CTA, headlines, descrições de serviço, preço, claim,
  métrica, case, menção a Zapbox, Discovery, Agenda Confirmada ou Operação
  Gerenciada;
- metadata com texto (title/description) muda de sentido comercial.

**NOT REQUIRED** quando a mudança é técnica sem efeito sobre o que é dito ao
visitante: refactor, tipos, classes CSS, testes, scripts, config, docs internos.
Na dúvida entre "copy" e "técnico", leia o hunk — é copy se muda o que o
visitante lê.

### Playwright (validação visual) — REQUIRED quando

o diff pode mudar o que é renderizado: `src/app/(public)/**`,
`src/components/**` (exceto `admin/`), `src/lib/content/**`, `src/app/globals.css`,
classes Tailwind em JSX, layout, navegação, CTAs.

**NOT REQUIRED** quando o escopo toca só `scripts/`, `docs/`, `tests/`,
`.claude/`, `.agents/`, config de ferramenta, ou código sem efeito visual
(ex.: utilitário não visual, tipos). Declare o motivo no relatório.

## Etapa 4 — Reviewers

Rode apenas os REQUIRED. **Se os dois forem necessários, lance-os em paralelo,
na mesma mensagem** — são somente leitura e independentes.

Passe a cada um o **escopo exato** (o `BASE` ou `working-tree`) e peça o
relatório no formato do agent.

### Modo de execução

1. Tente pelo nome: `subagent_type: "governance-reviewer"` /
   `"seo-migration-checker"` → `Mode: NATIVE`.
2. Se o Agent tool responder que o tipo não existe (agents criados depois do
   início da sessão só são carregados numa sessão nova), use o fallback:
   `subagent_type: "general-purpose"`, com o prompt:
   > Atue EXATAMENTE como o subagent definido em
   > `.claude/agents/<nome>.md`. Leia o arquivo inteiro: o corpo abaixo do
   > frontmatter é o seu system prompt e as restrições de ferramentas valem
   > integralmente — não use Edit nem Write, nem comando que altere arquivos,
   > índice ou branches. Revise <escopo exato>. Responda só com o relatório no
   > formato definido.

   → `Mode: FALLBACK`.
3. **Nunca** simule um reviewer nem escreva findings por conta própria. Se o
   agent falhar, marque `ERROR` e trate como bloqueio técnico.

Espere as notificações de conclusão; não preveja resultados.

### Consolidação dos findings

| Finding | Classe |
|---|---|
| BLOCKING + HIGH | **BLOCKER** → PR bloqueada |
| erro técnico inequívoco reportado pelo reviewer (ex.: chain, loop, 404, teste quebrado confirmado) | **BLOCKER** |
| BLOCKING + MEDIUM · WARNING + HIGH · WARNING + MEDIUM | **HUMAN REVIEW** |
| WARNING + LOW · BLOCKING + LOW · INFO | **NON-BLOCKING** (só listar) |

LOW nunca bloqueia. Não reclassifique findings por opinião própria: use a
severidade e a confiança que o reviewer deu. Se dois reviewers apontarem o
mesmo trecho, mantenha os dois e diga que convergem.

Se já houver BLOCKER, **não rode Playwright** — o resultado já é PRE-PR
BLOCKED; marque `SKIPPED (pipeline já bloqueado)`.

## Etapa 5 — Validação visual (quando REQUIRED)

1. **Rotas afetadas.** Mapeie arquivo → rota: `src/app/(public)/X/page.tsx` →
   `/X`; para `src/components/**` e `src/lib/content/**`, siga os imports
   (`Grep` pelo nome do módulo) até os `page.tsx` que os usam. Não cubra o site
   inteiro — só as rotas afetadas (Header/Footer/navigation → Home basta).
2. **Servidor.** Verifique antes se já há um rodando:
   `curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000`.
   - Respondeu → reutilize e **não** o encerre no fim.
   - Não respondeu → o build da Etapa 2 já existe: inicie
     `npx next start -p 3100` **em background** e aguarde `http://localhost:3100`
     responder 200 (poll curto com curl, até ~60 s). Anote que a skill o
     iniciou.
3. **Por rota**, com as ferramentas `mcp__playwright__*` (carregue via
   ToolSearch se necessário):
   - `browser_navigate` para a rota;
   - carregou? (status/título coerentes, sem página de erro do Next);
   - `browser_console_messages` (nível `error`) → erros de console. Separe o
     que o diff causa do que é preexistente: hoje a Home já registra bloqueios
     de CSP a scripts de terceiros (Ahrefs, DoubleClick,
     `analytics.google.com`). Se o diff não toca `next.config.ts` (CSP),
     analytics nem scripts de terceiros, esses erros **não** são FAIL — vão em
     Info como preexistentes;
   - `browser_find` / `browser_snapshot` → confira que os elementos alterados
     pelo diff estão presentes e com o conteúdo esperado;
   - `browser_take_screenshot` quando ajudar a mostrar a mudança. O Playwright
     MCP só grava dentro do repositório: use `.playwright-mcp/<nome>.png`
     (ignorado pelo Git). Nunca salve em outro caminho do repo.
4. **Comparação visual formal só se houver baseline documentado.** Não há
   baseline versionado no projeto hoje: reporte apenas o comportamento
   observado. Não invente "antes/depois".
5. **FAIL objetivo:** rota que não carrega, erro de runtime/console causado
   pela mudança, elemento alterado ausente ou quebrado. Observação estética
   subjetiva não é FAIL — vai como observação.
6. **Encerramento:** se a skill iniciou o servidor, encerre-o ao terminar —
   pare a tarefa em background que o iniciou ou, se preciso, o processo que
   escuta a porta 3100 (Windows/PowerShell:
   `Get-NetTCPConnection -LocalPort 3100 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`;
   macOS/Linux: `kill $(lsof -t -i :3100)`) — e feche o browser
   (`browser_close`). Confirme que a porta ficou livre.

Suíte e2e (`npm run test:e2e`) **não** roda por padrão. Um spec específico só
roda se mapear diretamente para a área alterada, com
`PLAYWRIGHT_BASE_URL=http://localhost:<porta> npx playwright test <spec>`.
Falhas preexistentes conhecidas, que não contam contra o diff:
`admin.spec.ts:44`, `home-motion.spec.ts:4` (`docs/29` §4).

## Etapa 6 — Resumo das mudanças

A partir do diff real (não de mensagens de commit sozinhas): arquivos
alterados, áreas, rotas afetadas, mudanças funcionais, visuais, de SEO, de
governança e testes relevantes. Nada de changelog genérico.

## Etapa 7 — Decisão

| Status | Quando |
|---|---|
| **PRE-PR BLOCKED** | falha em check, build ou audit:brand · qualquer BLOCKER de reviewer · reviewer com `ERROR` · FAIL visual objetivo quando Playwright era REQUIRED |
| **HUMAN REVIEW REQUIRED** | sem blocker, mas há ao menos um item HUMAN REVIEW |
| **READY FOR PR — WITH WARNINGS** | sem blocker, sem HUMAN REVIEW, mas há NON-BLOCKING (WARNING/LOW, INFO) ou observação visual não objetiva |
| **READY FOR PR** | tudo passou, reviewers necessários sem findings, visual necessário PASS |

Use exatamente um desses rótulos.

## Formato do relatório

```
# PRE-PR REPORT

Status:
<READY FOR PR | READY FOR PR — WITH WARNINGS | HUMAN REVIEW REQUIRED | PRE-PR BLOCKED>

Branch:
<branch> — escopo: <merge-base <sha curto>…working tree | working-tree>

Diff:
<N> files changed (<+x −y>)<; K arquivos não commitados>

## Deterministic checks

npm run check
PASS | FAIL (exit N) | NOT RUN

npm run build
PASS | PASS (retry após crash de worker) | FAIL (exit N) | NOT RUN

npm run audit:brand
PASS | FAIL (exit N) | NOT RUN

## Reviewers

Governance:
NOT REQUIRED | NOT RUN | PASS | FINDINGS | ERROR
Mode: NATIVE | FALLBACK | —
Trigger: <motivo em uma linha>

SEO migration:
NOT REQUIRED | NOT RUN | PASS | FINDINGS | ERROR
Mode: NATIVE | FALLBACK | —
Trigger: <motivo em uma linha>

## Visual validation

NOT REQUIRED | NOT RUN | SKIPPED (pipeline já bloqueado) | PASS | FAIL
Motivo: <…>

Routes checked:
<rota — resultado> | —

## Blocking findings

<cada BLOCKER: origem (comando ou reviewer), categoria, arquivo:linha, resumo> | Nenhum

## Warnings

<itens HUMAN REVIEW, depois NON-BLOCKING WARNING, com origem e confiança> | Nenhum

## Info

<INFO dos reviewers, observações visuais, avisos de escopo> | Nenhum

## Changed areas

<áreas e rotas>

## PR summary

<3–6 linhas descrevendo o que a PR faz, baseado no diff>

## Final decision

<status repetido + a razão determinante em 1–2 frases + o que precisa acontecer
para mudar de status, se não for READY>
```
