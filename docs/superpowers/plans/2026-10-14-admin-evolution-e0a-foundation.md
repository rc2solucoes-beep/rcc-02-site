# E0a — Fundação (runbook de migrations, ambiente isolado, suíte de RLS, Vitest `.tsx`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status do plano:** versão 2, corrigida após a revisão de engenharia de 2026-10-14. **Aguardando aprovação final. Nenhuma tarefa está autorizada para execução.**

**Goal:** Entregar a fundação E0a da evolução do painel administrativo: runbook de migrations manuais, ambiente Supabase isolado documentado e validado, suíte de integração de RLS com guarda anti-produção e correção da descoberta de testes `.tsx` pelo Vitest.

**Architecture:** Mudanças aditivas e reversíveis: um `vitest.config.ts` ajustado, uma segunda configuração do Vitest (`vitest.integration.config.ts`) que só roda sob `npm run test:integration`, uma guarda pura (`assertSafeTestTarget`) **reaplicada em todo caminho de criação de cliente e a cada acesso ao cliente `service_role`**, um marcador de ambiente de teste verificado antes de qualquer cliente privilegiado existir, sondas de RLS que **confirmam o efeito real por um cliente privilegiado do ambiente isolado**, um registro de limpeza que nunca é silencioso e documentação operacional em `docs/runbooks/`. Nada em `src/`, em `next.config.ts` ou em `supabase/migrations/` é tocado, e nada é aplicado em produção.

**Tech Stack:** Vitest 4, TypeScript, `@supabase/supabase-js` (já instalado), Node 24 (`process.loadEnvFile`), Markdown e SQL somente leitura. **Nenhuma dependência nova.**

**Spec:** baseline arquitetural aprovada, em `docs/superpowers/specs/`:
- `2026-10-13-admin-evolution-prd.md` (RF-OPS-01..03, DEC-01, DEC-02, DEC-16, BL-04, DEP-01, PV-15)
- `2026-10-13-admin-leads-management-design.md` (Parte I, §4: E0a)
- `2026-10-13-admin-evolution-traceability.md` (§1.1, §6.1, §7)

**Escopo desta entrega (e só ele):** RF-OPS-01, RF-OPS-02, RF-OPS-03. Fora de escopo: E0b, E0c, E1, E2, E3 e E4 (nenhuma migration, nenhuma mudança em `src/`). O PRD e os três SDDs aprovados **não são alterados** por este plano.

## Histórico de revisão deste plano

| Versão | Data | Mudança |
|---|---|---|
| 1 | 2026-10-14 | Plano inicial |
| 2 | 2026-10-14 | Correções do parecer de engenharia: rollback da Task 0 sem risco de perder a baseline documental; guarda reaplicada na criação de clientes e nas operações privilegiadas, com marcador de ambiente e verificação independente; sondas de RLS refeitas (efeito real, UPDATE e DELETE, quatro papéis); limpeza obrigatória e não silenciosa; lint de SQL com limites documentados; matriz ampliada de 28 para **67 verificações**; baseline renomeada para "snapshot histórico" |
| 3 | 2026-10-16 | Exceção `E0a-C14-EX01` (aprovada em 2026-10-16): gate C14 com duas vias (checklist original **ou** exceção com controles compensatórios), C14 original registrado como **NÃO ATENDIDO**, autorizações separadas (AUT-D5, AUT-EXEC), execução com código de saída preservado, procedimento único de falha sem reexecução automática e varredura de segredos só com status. O runbook embutido na Task 7 foi harmonizado apenas quanto ao gate; em caso de divergência, vale `docs/runbooks/ambiente-supabase-isolado.md` |

## Decisões confirmadas pela revisão de engenharia

| # | Decisão |
|---|---|
| 1 | O ambiente isolado reproduz o **snapshot conhecido** do estado da produção, **incluindo o drift documentado**, e não aplica cegamente todas as migrations completas |
| 2 | Esse baseline é um **snapshot histórico** (`docs/07-supabase-migration-baseline.md` de 30/08 + metadados de 13/10), **sujeito à confirmação posterior no preflight E0b.1**. **Este plano não declara paridade atual com a produção.** |
| 3 | As variáveis adicionais da guarda (`RC2_TEST_PROJECT_REF_ALLOWLIST`, `RC2_PRODUCTION_PROJECT_REF`) estão aprovadas |
| 4 | O lint de SQL somente leitura permanece como proteção **complementar** (não substitui `BEGIN READ ONLY` nem revisão humana) |
| 5 | Recomendação: **projeto Supabase separado** para testes |
| 6 | Branch `feat/admin-e0a-foundation` a partir de `main`, preservando a tracking. Criação da branch e commits **continuam aguardando EX-0** |

## Global Constraints

Valores copiados da especificação aprovada. Todo task as inclui implicitamente.

- **Nunca executar SQL remoto sem autorização** (DEC-02). Em E0a, **nenhum SQL é executado em produção, em nenhuma hipótese.**
- Preservar integralmente a branch `fix/tracking-p0-foundation` (DEC-01): sem rebase, merge, commit ou alteração; ponta atual `bfc50d0c7a08221529b02cbc345f4a6c6dbd627c`.
- Suíte de integração em `tests/integration/`, **fora do `npm test` padrão**, com script próprio `test:integration` (LEADS §4.2).
- **Guarda anti-produção:** a suíte lê `RC2_TEST_SUPABASE_URL` e `RC2_TEST_PROJECT_REF`; recusa executar se a URL não estiver na allowlist de projetos de teste ou se coincidir com `NEXT_PUBLIC_SUPABASE_URL` de produção; **falha antes de qualquer conexão** (LEADS §4.2).
- Papéis cobertos: `anon`, `authenticated` sem registro em `admin_users`, `authenticated` admin, `service_role` (LEADS §4.2).
- Usuários de teste criados pela API de administração do próprio projeto de teste; **dados sintéticos, nunca cópias de produção** (LEADS §4.2).
- Relatório: matriz tabela × papel × operação (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) com o resultado esperado e o observado (LEADS §4.2).
- Runbook: `README.md`, `preflight.sql` (**somente leitura**), `verify.sql` (**somente leitura**), `rollback.sql`; o `apply` é o arquivo `supabase/migrations/NNN_nome.sql`, numeração a partir de `012_*` (LEADS §4.1).
- Vitest: `include` passa a cobrir `tests/unit/**/*.test.{ts,tsx}` (LEADS §4.3).
- Nenhum fornecedor ou dependência nova (RNF-04). Cada entrega é reversível de forma independente (RNF-05).
- Segredos nunca entram no repositório, em logs, em evidências nem em mensagens de erro.
- Comentários e documentação em português do Brasil, no estilo do repositório. Commits em Conventional Commits, terminando com a linha `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Antes de abrir PR: `npm run check` e `npm run audit:brand` verdes (AGENTS.md).

**Restrições adicionais deste plano (revisão de engenharia):**
- A guarda é reaplicada **em todo caminho de criação de cliente** e **a cada acesso ao cliente `service_role`**. Nenhum cliente `service_role` pode existir sem validação prévia do alvo.
- Nenhuma operação de escrita é classificada como "negada" só porque afetou zero linhas: a negação exige confirmação por leitura privilegiada de que a linha existia e continua inalterada.
- Todo recurso sintético é **registrado antes** de ser criado ou tentado. Falha de limpeza **reprova** a suíte.

## Limites da proteção anti-produção (declaração obrigatória)

1. A **allowlist é configurada pelo operador**. Ela reduz o risco de apontar a suíte para o projeto errado; **não o elimina**. Uma configuração em que o projeto de produção seja listado na allowlist e o ref de produção seja omitido ou errado derrota as camadas estáticas.
2. **Chaves opacas.** As chaves no formato novo do Supabase (`sb_publishable_…`, `sb_secret_…`) **não são JWT** e não carregam o ref do projeto. A guarda só confere o claim `ref` de chaves JWT legadas; para chaves opacas **não há inspeção automática**.
3. Camadas que compensam, em ordem: (a) guarda estática (URL, ref, allowlist, ref de produção, `NEXT_PUBLIC_SUPABASE_URL`); (b) o gateway do Supabase rejeita chave de um projeto usada contra a URL de outro; (c) **marcador de ambiente de teste** lido com a chave `anon` antes de existir qualquer cliente privilegiado; (d) **verificação independente humana**, registrada na evidência (critério C14).
4. O marcador (c) é uma leitura (`SELECT`) de uma linha pública do projeto **declarado como de teste**. Ela só ocorre depois de a guarda estática aceitar o alvo, isto é, nunca contra um alvo que a guarda já reconheça como produção.
5. Risco residual declarado: operador que lista produção na allowlist **e** omite o ref de produção **e** cria o marcador na produção. A verificação humana (d) existe para cobrir esse caso.

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `vitest.config.ts` | Modificar | `include` com `.ts` e `.tsx`; exclui `tests/integration/**` |
| `vitest.integration.config.ts` | Criar | Configuração exclusiva da suíte de integração |
| `package.json` | Modificar | Script `test:integration` |
| `.env.example` | Modificar | Somente os **nomes** das variáveis `RC2_TEST_*` e `RC2_PRODUCTION_PROJECT_REF` |
| `tests/integration/support/guard.ts` | Criar | Guarda pura anti-produção |
| `tests/integration/support/env.ts` | Criar | Carrega **somente** `.env.test.local` |
| `tests/integration/support/target.ts` | Criar | `getVerifiedTarget()`: alvo validado e tipado (marca) |
| `tests/integration/support/globalSetup.ts` | Criar | Carrega o env de teste e valida o alvo antes de qualquer teste |
| `tests/integration/support/clients.ts` | Criar | Único ponto que chama `createClient`; marcador; `service` com revalidação a cada acesso |
| `tests/integration/support/cleanup.ts` | Criar | Registro de recursos sintéticos, limpeza e inspeção final |
| `tests/integration/support/matrix.ts` | Criar | Registro e relatório da matriz |
| `tests/integration/support/probes.ts` | Criar | Sondas de efeito real e `classifyWrite` |
| `tests/integration/support/fixtures.ts` | Criar | Fábricas de fixtures sintéticas |
| `tests/integration/support/readOnlySql.ts` | Criar | Lint complementar de SQL somente leitura |
| `tests/integration/rls/baseline.test.ts` | Criar | Matriz de 67 verificações sobre tabelas de política estável |
| `tests/unit/ops/vitestConfig.test.ts` | Criar | T-OPS-U02 |
| `tests/unit/ops/integrationGuard.test.ts` | Criar | T-OPS-U01 |
| `tests/unit/ops/globalSetup.test.ts` | Criar | Carga restrita ao env de teste e ordem guarda → clientes |
| `tests/unit/ops/targetGuard.test.ts` | Criar | `getVerifiedTarget` |
| `tests/unit/ops/clientsGuard.test.ts` | Criar | Guarda no caminho de criação de clientes (mock de rede) e varreduras estáticas |
| `tests/unit/ops/cleanupRegistry.test.ts` | Criar | Limpeza e inspeção não silenciosas |
| `tests/unit/ops/probesDecision.test.ts` | Criar | Tabela de decisão de `classifyWrite` |
| `tests/unit/ops/readOnlySql.test.ts` | Criar | Lint de SQL |
| `tests/unit/ops/runbookTemplate.test.ts` | Criar | Template completo e SQL somente leitura em `docs/runbooks/` |
| `docs/runbooks/README.md` | Criar | Índice |
| `docs/runbooks/migrations-manuais.md` | Criar | Runbook de migrations manuais |
| `docs/runbooks/migrations/REGISTRO.md` | Criar | Registro manual de migrations aplicadas |
| `docs/runbooks/migrations/_template/{README.md,preflight.sql,verify.sql,rollback.sql}` | Criar | Modelo por migration |
| `docs/runbooks/ambiente-supabase-isolado.md` | Criar | Criação, snapshot histórico, marcador, verificação independente, uso e descarte |
| `docs/runbooks/ambiente-teste/verify-baseline.sql` | Criar | Verificação somente leitura do snapshot histórico |
| `docs/runbooks/evidence/E0a-<data>.md` | Criar (na execução) | Evidências (sem segredos) |
| `CHANGELOG.md` | Modificar | Entrada em `[Unreleased]` |

**Não tocar:** `src/**`, `next.config.ts`, `supabase/migrations/**`, `migrations/**`, `.gitignore` (`.env.test.local` e `test-results/` já estão ignorados), `playwright.config.ts`, a branch `fix/tracking-p0-foundation`, o PRD e os três SDDs.

---

## Dependências e ordem de execução

```
Task 0 (proteção recuperável + branch + baseline)
  ├─▶ Task 1 (Vitest .tsx)                                [Gate A]
  ├─▶ Task 2 (guarda) ─▶ Task 3 (env, alvo verificado, config)   [Gate B]
  │                          └─▶ Task 4 (clientes com marcador) ─▶ Task 5 (limpeza, sondas, matriz de 67)
  ├─▶ Task 6 (runbook e lint de SQL)                      [Gate C]
  └─▶ Task 7 (doc do ambiente isolado)                    [Gate D]  ──▶ EX-1..EX-3
Task 8 (execução no ambiente isolado + evidências)   ← precisa de Task 5, 7 e EX-1..EX-3   [Gate E]
Task 9 (fechamento)
```

Tasks 1, 2 e 6 são independentes entre si. Tasks 4 e 5 são **escritas e validadas estaticamente e por testes unitários com rede simulada** antes de o ambiente existir; só a execução real delas (Task 8) depende dele.

## Pontos que exigem autorização externa

| ID | O que | Quem autoriza ou executa | Quando |
|---|---|---|---|
| **EX-0** | Criar o diretório de backup fora do repositório, a branch `feat/admin-e0a-foundation` a partir de `main`, o **commit docs-only**, a **tag** `backup/admin-evolution-baseline-docs` e o *bundle*; demais commits da E0a | Responsável pelo repositório | Task 0 e seguintes |
| EX-0b | (Opcional, recomendado) enviar a branch e a tag ao remoto para durabilidade | Responsável pelo repositório | Após Task 0 |
| **EX-1** | Criar o ambiente isolado (**projeto Supabase separado**, recomendado), com possível custo | Dono da infraestrutura | Antes de Task 8 |
| **EX-2** | Aplicar o snapshot histórico e **criar o marcador de ambiente de teste** no projeto de teste (SQL Editor do projeto de teste); rodar `verify-baseline.sql` | Dono da infraestrutura (ou executor com credenciais **só do projeto de teste**) | Task 8 |
| **EX-3** | Fornecer as chaves **do projeto de teste** em `.env.test.local` e satisfazer o gate C14 por **uma** via: **assinatura da verificação independente** **ou** exceção E0a-C14-EX01 com os controles pré-execução comprovados | Dono da infraestrutura | Task 8 |
| EX-4 | (Opcional, fora de E0a) apontar um Preview da Vercel ao ambiente isolado | Dono da infraestrutura | Não faz parte de E0a |

**Nenhuma etapa de E0a precisa de credencial, URL, leitura ou escrita de produção.** O executor não deve receber credenciais de produção.

---

## Critérios objetivos de conclusão de E0a

Todos precisam ser verdadeiros e ter evidência em `docs/runbooks/evidence/E0a-<data>.md`, com uma única ressalva: o **C14** pode ser satisfeito por uma de duas vias (C14 original **ou** C14-alt, abaixo). O C14 original é registrado separadamente e **nunca** passa a "atendido" pela via excepcional. Em 2026-10-16 o resultado do C14 original é **NÃO ATENDIDO**:

| ID | Critério | Como verificar |
|---|---|---|
| C1 | `.tsx` executa no `npm test` | `npx vitest list --filesOnly` lista `tests/unit/admin/security-page-sanitization.test.tsx`; `npm test` verde |
| C2 | `npm test` não executa nada de `tests/integration/` | `npx vitest list --filesOnly` sem `tests/integration` |
| C3 | Testes unitários de `tests/unit/ops` verdes (T-OPS-U01, T-OPS-U02 e os de guarda, clientes, limpeza, sondas, lint e runbook) | `npx vitest run tests/unit/ops` |
| C4 | A guarda aborta **antes de qualquer conexão** nos ensaios D1–D4 (sem rede), os testes do caminho de criação de clientes passam e o ensaio D5 (marcador ausente, no ambiente isolado) aborta antes de criar o cliente `service_role`. D1–D4 são offline; D5 é real e só ocorre após o gate C14 e com autorização específica (Task 8, Step 3) | saídas arquivadas |
| C5 | `npm run test:integration` verde no ambiente isolado | relatório do Vitest |
| C6 | Matriz com **67 verificações**, **0 divergências** e **0 resultados inconclusivos (`error`)** | `test-results/integration/rls-matrix-baseline.md` anexado |
| C7 | `verify-baseline.sql` executado no ambiente isolado; divergências em relação ao **snapshot histórico** documentadas. **Não se declara paridade atual com a produção** | saída arquivada |
| C8 | Runbook completo (template, `REGISTRO.md`, `migrations-manuais.md`) e lint de SQL (14 casos) verdes, com os limites do lint documentados | `npx vitest run tests/unit/ops/runbookTemplate.test.ts tests/unit/ops/readOnlySql.test.ts` |
| C9 | `npm run check` e `npm run audit:brand` verdes | saída dos comandos |
| C10 | Diff restrito aos arquivos do mapa; nada em `src/`, `next.config.ts`, `supabase/migrations/`, PRD ou SDDs | `git diff --stat main...HEAD` |
| C11 | Nenhum segredo no diff nem na evidência | `git diff main...HEAD` sem `eyJ…`, `sb_secret_`, valores de chave |
| C12 | `fix/tracking-p0-foundation` intacta | `git rev-parse fix/tracking-p0-foundation` = `bfc50d0c7a08221529b02cbc345f4a6c6dbd627c` |
| C13 | **Limpeza sem resíduo:** o registro de limpeza, a inspeção final automática e a inspeção manual no projeto de teste não encontram nenhum recurso sintético; nenhuma falha de limpeza foi silenciada | saída do `afterAll` e inspeção manual registrada |
| C14 | **Verificação independente assinada** (§ "Verificação independente" da Task 7) antes da primeira execução real. Resultado histórico: **NÃO ATENDIDO** | checklist preenchido na evidência |
| C14-alt | **Via excepcional**, aceita no lugar do C14 enquanto o C14 original estiver não atendido: exceção `E0a-C14-EX01` aprovada **e** CC-1..CC-8 comprovados antes da execução, CC-9a conforme antes e CC-9b conforme depois. Não altera o estado do C14 original | seção "Exceção C14" da evidência |

## Procedimento de rollback da fase

- **Código e docs:** tudo é aditivo. Reverter com `git revert <commits da E0a>`. **Nunca** usar `git branch -D` nem `git reset --hard` na branch `feat/admin-e0a-foundation` enquanto a baseline documental existir **somente** nela (ver Task 0 e o rollback seguro ali descrito).
- **Ambiente isolado:** apagar o projeto de teste no painel (ação do dono). Nenhum dado de produção existe nele.
- **Configuração do Vitest:** restaurar `vitest.config.ts` do commit anterior devolve a descoberta apenas de `.ts` (e `security-page-sanitization.test.tsx` volta a não rodar).
- Rollback por task está indicado em cada task.

## Checkpoints de revisão

| Gate | Após | O revisor confirma |
|---|---|---|
| A | Task 1 | Config do Vitest e contagem de testes; nenhum teste existente quebrou |
| B | Task 3 | Guarda, `env.ts`, `target.ts` e `globalSetup`: falha fechada, sem leitura de `.env.local`; ensaios D1–D4 |
| C | Task 6 | Runbook, template e lint (inclusive seus limites) |
| D | Task 7 | Documento do ambiente isolado, marcador e checklist de verificação independente, antes de pedir EX-1..EX-3 |
| E | Task 8 | Evidências C1–C14 |

---

### Task 0: Proteção recuperável da baseline documental, branch de trabalho e baseline de testes

**Files:**
- Create: nenhum arquivo novo de código. Os cinco documentos aprovados e este plano (hoje **não rastreados**) são protegidos e, depois, commitados **sozinhos** no primeiro commit da nova branch.

**Interfaces:**
- Produces: diretório de backup externo com manifesto SHA-256; branch `feat/admin-e0a-foundation` (base `main`); **commit docs-only**; tag anotada `backup/admin-evolution-baseline-docs`; *bundle* verificado; baseline de testes `B`.

**Requer autorização EX-0.**

**Por que esta task mudou:** os documentos hoje existem apenas como arquivos não rastreados. Depois do commit na branch nova, **eles passam a existir somente nesse commit**: ao voltar para a branch de tracking, os arquivos somem do diretório de trabalho, e um `git branch -D` apagaria o único commit que os contém. Por isso a proteção é criada **antes** de qualquer troca de branch e verificada por hash.

- [ ] **Step 1: Registrar o estado de partida (somente leitura)**

Run:
```bash
git status --short
git branch --show-current
git rev-parse fix/tracking-p0-foundation main
git diff --name-only main...fix/tracking-p0-foundation | grep -E "^(package.json|vitest.config.ts|\.gitignore|\.env.example|tests/unit/ops/|tests/integration/|docs/runbooks/)" || echo "sem sobreposição com E0a"
```
Expected: somente os 5 documentos de `docs/superpowers/specs/` e este plano como não rastreados; `bfc50d0c7a08221529b02cbc345f4a6c6dbd627c` e `9d7486263f1dff2db8783781f59a22077d2e4908`; `sem sobreposição com E0a`.

- [ ] **Step 2: Backup externo com manifesto de hash (antes de trocar de branch)**

Run:
```bash
BK="/d/Projetos/_backup-rc2-baseline-docs-2026-10-14"
mkdir -p "$BK"
cp docs/superpowers/specs/2026-10-13-*.md docs/superpowers/plans/2026-10-14-admin-evolution-e0a-foundation.md "$BK"/
( cd "$BK" && sha256sum *.md > MANIFEST.sha256 && sha256sum -c MANIFEST.sha256 && ls -1 *.md | wc -l )
```
Expected: seis linhas `OK` e `6`. O diretório fica **fora** do repositório. Se este plano for editado de novo antes do commit, refaça o Step 2.

- [ ] **Step 3: Criar a branch a partir de `main` sem tocar na branch de tracking**

Run:
```bash
git switch -c feat/admin-e0a-foundation main
git branch --show-current
git rev-parse fix/tracking-p0-foundation
git status --short | wc -l
```
Expected: `feat/admin-e0a-foundation`; a SHA continua `bfc50d0c7a08221529b02cbc345f4a6c6dbd627c`; `6` (os arquivos não rastreados acompanham a troca).

- [ ] **Step 4: Commit docs-only**

```bash
git add docs/superpowers/specs/2026-10-13-*.md docs/superpowers/plans/2026-10-14-admin-evolution-e0a-foundation.md
git status --short
git commit -m "docs(specs): baseline arquitetural aprovada da evolução do painel e plano E0a

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Expected: `git status` mostra exatamente 6 arquivos adicionados e nenhum outro; o commit contém **só** documentos.

- [ ] **Step 5: Tag anotada, bundle e verificação por hash**

```bash
git tag -a backup/admin-evolution-baseline-docs -m "Baseline documental aprovada (E0a, Task 0)"
BK="/d/Projetos/_backup-rc2-baseline-docs-2026-10-14"
git bundle create "$BK/baseline-docs.bundle" main..backup/admin-evolution-baseline-docs
git bundle verify "$BK/baseline-docs.bundle"
for f in docs/superpowers/specs/2026-10-13-*.md docs/superpowers/plans/2026-10-14-admin-evolution-e0a-foundation.md; do
  a=$(git show "backup/admin-evolution-baseline-docs:$f" | sha256sum | cut -d' ' -f1)
  b=$(sha256sum "$f" | cut -d' ' -f1)
  m=$(grep " $(basename "$f")\$" "$BK/MANIFEST.sha256" | cut -d' ' -f1)
  [ "$a" = "$b" ] && [ "$a" = "$m" ] && echo "ok $(basename "$f")" || echo "DIVERGE $(basename "$f")"
done
```
Expected: `The bundle records a complete history` (ou equivalente com prerequisito `main`) e seis linhas `ok`. **Só continue se não houver nenhuma linha `DIVERGE`.** (EX-0b: enviar branch e tag ao remoto aumenta a durabilidade; exige autorização.)

- [ ] **Step 6: Registrar a baseline de testes `B` nesta branch**

Run: `npm test 2>&1 | tail -8`
Expected: verde. **Anote `Test Files` e `Tests`** (`B_files`, `B_tests`). Todas as contagens esperadas abaixo são **relativas a B**. (Referência: na ponta da branch de tracking, medido em 2026-10-14, B = 57 arquivos / 643 testes; em `main` o número é menor porque os testes de tracking não existem lá.)

**Rollback seguro (substitui o anterior):**
1. **Proibido** nesta branch, enquanto o commit de baseline for o único que contém os documentos: `git branch -D`, `git reset --hard` e qualquer operação que descarte esse commit.
2. Para **descartar o código da E0a mantendo a baseline:** use `git revert` dos commits de código (nunca do commit docs-only). Se for preciso abandonar a branch, primeiro dê à baseline uma casa nomeada: `git switch -c docs/admin-evolution-baseline backup/admin-evolution-baseline-docs`; só então, e com aprovação do responsável, remova a branch da E0a com `git branch -d` (que **recusa** apagar commits não integrados), nunca `-D`.
3. **Ao voltar para `fix/tracking-p0-foundation`:** os documentos deixam de estar no diretório. Se precisar deles lá, restaure a partir do backup externo (`cp "$BK"/*.md ...`) ou, preferencialmente, consulte-os pela tag (`git show backup/admin-evolution-baseline-docs:<caminho>`) sem alterar a árvore da tracking.
4. Antes de qualquer remoção de branch, confirme os **três** abrigos: tag, bundle e diretório de backup (`sha256sum -c MANIFEST.sha256`).

---

### Task 1: Vitest passa a descobrir testes `.tsx` (RF-OPS-03, T-OPS-U02)

**Files:**
- Modify: `vitest.config.ts`
- Create: `tests/unit/ops/vitestConfig.test.ts`

**Interfaces:**
- Produces: `include` = `["tests/unit/**/*.test.{ts,tsx}"]` e `exclude` contendo `"tests/e2e/**"` e `"tests/integration/**"`. Tasks 3 e seguintes dependem da exclusão de `tests/integration/**`.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/unit/ops/vitestConfig.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// RF-OPS-03 / T-OPS-U02: o `npm test` padrão precisa descobrir testes .tsx.
// Lemos o arquivo como texto: o que importa é o contrato declarado no config.
const config = readFileSync(resolve(process.cwd(), "vitest.config.ts"), "utf8");

describe("vitest.config.ts (RF-OPS-03)", () => {
  it("descobre testes .ts e .tsx em tests/unit", () => {
    expect(config).toContain('include: ["tests/unit/**/*.test.{ts,tsx}"]');
    // o teste .tsx que motivou a correção continua no repositório
    expect(
      existsSync(
        resolve(process.cwd(), "tests/unit/admin/security-page-sanitization.test.tsx"),
      ),
    ).toBe(true);
  });

  it("mantém e2e e integração fora do npm test padrão", () => {
    expect(config).toContain('"tests/e2e/**"');
    expect(config).toContain('"tests/integration/**"');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/ops/vitestConfig.test.ts`
Expected: FAIL (o config ainda tem `include: ["tests/unit/**/*.test.ts"]`).

- [ ] **Step 3: Alterar o config**

Em `vitest.config.ts`, trocar exatamente as duas linhas:

```ts
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["tests/e2e/**"],
```
por:
```ts
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "tests/integration/**"],
```

- [ ] **Step 4: Rodar e ver passar; conferir a descoberta**

Run:
```bash
npx vitest run tests/unit/ops/vitestConfig.test.ts
npx vitest list --filesOnly | grep -c "security-page-sanitization.test.tsx"
npx vitest list --filesOnly | grep -c "tests/integration" || true
```
Expected: 2 testes passam; `1`; `0`.

- [ ] **Step 5: Suíte completa**

Run: `npm test 2>&1 | tail -8`
Expected: verde, com **B_files + 2** arquivos e **B_tests + 4** testes (o `.tsx` adiciona 1 arquivo/2 testes; o teste novo, 1 arquivo/2 testes). Se algum teste do `.tsx` falhar, registre como achado e trate nesta task (sem corrigir código de produção além do estritamente necessário).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/unit/ops/vitestConfig.test.ts
git commit -m "test(vitest): descobrir testes .tsx e separar a suíte de integração

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

**Rollback:** `git revert HEAD`. **Gate A.**

---

### Task 2: Guarda anti-produção (RF-OPS-02, T-OPS-U01)

**Files:**
- Create: `tests/integration/support/guard.ts`
- Create: `tests/unit/ops/integrationGuard.test.ts`

**Interfaces:**
- Produces (usado por Tasks 3, 4 e 5):
  - `type GuardFailure = "missing_test_url" | "missing_test_ref" | "missing_allowlist" | "missing_production_ref" | "invalid_url" | "ref_mismatch" | "not_allowlisted" | "is_production" | "key_ref_mismatch" | "missing_keys" | "missing_marker"` (os dois últimos são lançados por `target.ts` e `clients.ts`)
  - `type GuardInput = { testUrl?: string; testProjectRef?: string; allowlist?: string; productionRef?: string; productionUrls?: Array<string | undefined>; keys?: Array<string | undefined> }`
  - `class IntegrationGuardError extends Error { readonly reason: GuardFailure }`
  - `assertSafeTestTarget(input: GuardInput): { projectRef: string }` (lança `IntegrationGuardError`)
  - `readGuardInputFromEnv(env: NodeJS.ProcessEnv): GuardInput`

- [ ] **Step 1: Escrever os testes que falham**

Create `tests/unit/ops/integrationGuard.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  IntegrationGuardError,
  assertSafeTestTarget,
  readGuardInputFromEnv,
  type GuardInput,
} from "../../integration/support/guard";

const TEST_REF = "abcdefghijklmnopqrst";
const PROD_REF = "uvwxyzabcdefghijklmn";

function jwtWithRef(ref: string): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ ref, role: "anon" })}.assinatura`;
}

function validInput(overrides: GuardInput = {}): GuardInput {
  return {
    testUrl: `https://${TEST_REF}.supabase.co`,
    testProjectRef: TEST_REF,
    allowlist: TEST_REF,
    productionRef: PROD_REF,
    productionUrls: [`https://${PROD_REF}.supabase.co`],
    keys: [],
    ...overrides,
  };
}

function reasonOf(input: GuardInput): string {
  try {
    assertSafeTestTarget(input);
  } catch (error) {
    expect(error).toBeInstanceOf(IntegrationGuardError);
    return (error as IntegrationGuardError).reason;
  }
  throw new Error("a guarda deveria ter recusado");
}

describe("guarda anti-produção (T-OPS-U01)", () => {
  it("aceita um alvo de teste válido e devolve o ref", () => {
    expect(assertSafeTestTarget(validInput())).toEqual({ projectRef: TEST_REF });
  });

  it("recusa quando falta a URL de teste", () => {
    expect(reasonOf(validInput({ testUrl: undefined }))).toBe("missing_test_url");
  });

  it("recusa quando falta o ref do projeto de teste", () => {
    expect(reasonOf(validInput({ testProjectRef: "  " }))).toBe("missing_test_ref");
  });

  it("recusa allowlist vazia", () => {
    expect(reasonOf(validInput({ allowlist: " , " }))).toBe("missing_allowlist");
  });

  it("recusa quando o ref de produção não foi declarado", () => {
    expect(reasonOf(validInput({ productionRef: undefined }))).toBe("missing_production_ref");
  });

  it("recusa URL que não seja https", () => {
    expect(reasonOf(validInput({ testUrl: `http://${TEST_REF}.supabase.co` }))).toBe("invalid_url");
  });

  it("recusa host que não seja <ref>.supabase.co (domínio próprio, localhost)", () => {
    expect(reasonOf(validInput({ testUrl: "https://db.rc2solucoes.com.br" }))).toBe("invalid_url");
    expect(reasonOf(validInput({ testUrl: "https://localhost:54321" }))).toBe("invalid_url");
  });

  it("recusa quando o ref informado difere do ref da URL", () => {
    expect(reasonOf(validInput({ testProjectRef: "zzzzzzzzzzzzzzzzzzzz", allowlist: "zzzzzzzzzzzzzzzzzzzz" }))).toBe(
      "ref_mismatch",
    );
  });

  it("recusa ref fora da allowlist", () => {
    expect(reasonOf(validInput({ allowlist: "outroprojetodeteste1" }))).toBe("not_allowlisted");
  });

  it("recusa quando o ref de teste é o de produção, mesmo que esteja na allowlist", () => {
    expect(
      reasonOf(
        validInput({
          testUrl: `https://${PROD_REF}.supabase.co`,
          testProjectRef: PROD_REF,
          allowlist: PROD_REF,
        }),
      ),
    ).toBe("is_production");
  });

  it("recusa quando a URL coincide com NEXT_PUBLIC_SUPABASE_URL de produção", () => {
    expect(
      reasonOf(
        validInput({
          productionRef: "naoeoprodutoreal0000",
          productionUrls: [`https://${TEST_REF}.supabase.co`],
        }),
      ),
    ).toBe("is_production");
  });

  it("recusa chave JWT cujo ref pertence a outro projeto", () => {
    expect(reasonOf(validInput({ keys: [jwtWithRef(PROD_REF)] }))).toBe("key_ref_mismatch");
  });

  it("ignora chaves que não são JWT (limitação documentada) e aceita JWT do próprio projeto", () => {
    // Chaves opacas (sb_publishable_/sb_secret_) não carregam o ref: a guarda não as
    // inspeciona. A verificação independente humana e o marcador cobrem esse caso.
    expect(
      assertSafeTestTarget(validInput({ keys: ["sb_secret_exemplo", undefined, jwtWithRef(TEST_REF)] })),
    ).toEqual({ projectRef: TEST_REF });
  });

  it("nunca inclui chaves nem URL na mensagem de erro", () => {
    const secret = jwtWithRef(PROD_REF);
    try {
      assertSafeTestTarget(validInput({ keys: [secret] }));
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain(secret);
      expect(message).not.toContain(".supabase.co");
    }
  });

  it("mapeia as variáveis de ambiente para a entrada da guarda", () => {
    expect(
      readGuardInputFromEnv({
        RC2_TEST_SUPABASE_URL: "u",
        RC2_TEST_PROJECT_REF: "r",
        RC2_TEST_PROJECT_REF_ALLOWLIST: "a",
        RC2_PRODUCTION_PROJECT_REF: "p",
        NEXT_PUBLIC_SUPABASE_URL: "n",
        RC2_TEST_SUPABASE_ANON_KEY: "k1",
        RC2_TEST_SUPABASE_SERVICE_ROLE_KEY: "k2",
      } as NodeJS.ProcessEnv),
    ).toEqual({
      testUrl: "u",
      testProjectRef: "r",
      allowlist: "a",
      productionRef: "p",
      productionUrls: ["n"],
      keys: ["k1", "k2"],
    });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/ops/integrationGuard.test.ts`
Expected: FAIL (módulo `guard` inexistente).

- [ ] **Step 3: Implementar a guarda**

Create `tests/integration/support/guard.ts`:

```ts
// Guarda anti-produção da suíte de integração (RF-OPS-02, T-OPS-U01).
// Falha fechada: qualquer dado ausente ou ambíguo recusa a execução, e isso
// acontece antes de qualquer conexão de rede. As mensagens nunca contêm URL
// nem chaves.
//
// LIMITES (declarados no plano E0a):
//  * A allowlist é configurada pelo operador: reduz, mas não elimina, o risco de
//    apontar para o projeto errado.
//  * Só chaves JWT legadas têm o claim `ref` conferido. Chaves opacas
//    (sb_publishable_/sb_secret_) não são inspecionáveis aqui; a verificação
//    independente humana e o marcador de ambiente (clients.ts) compensam.

export type GuardFailure =
  | "missing_test_url"
  | "missing_test_ref"
  | "missing_allowlist"
  | "missing_production_ref"
  | "invalid_url"
  | "ref_mismatch"
  | "not_allowlisted"
  | "is_production"
  | "key_ref_mismatch"
  | "missing_keys"
  | "missing_marker";

export type GuardInput = {
  testUrl?: string;
  testProjectRef?: string;
  /** Refs de projetos de teste permitidos, separados por vírgula. */
  allowlist?: string;
  /** Ref do projeto de produção, declarado de forma explícita. */
  productionRef?: string;
  /** URLs que representam produção (por exemplo, NEXT_PUBLIC_SUPABASE_URL). */
  productionUrls?: Array<string | undefined>;
  /** Chaves do ambiente de teste; as que forem JWT têm o claim `ref` conferido. */
  keys?: Array<string | undefined>;
};

export class IntegrationGuardError extends Error {
  constructor(public readonly reason: GuardFailure) {
    super(`Guarda anti-produção: execução recusada (${reason}).`);
    this.name = "IntegrationGuardError";
  }
}

const SUPABASE_HOST = /^([a-z0-9]+)\.supabase\.co$/;

function fail(reason: GuardFailure): never {
  throw new IntegrationGuardError(reason);
}

function refFromUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const match = SUPABASE_HOST.exec(url.hostname);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function refFromJwt(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      ref?: unknown;
    };
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

export function assertSafeTestTarget(input: GuardInput): { projectRef: string } {
  const testUrl = input.testUrl?.trim();
  if (!testUrl) fail("missing_test_url");

  const testRef = input.testProjectRef?.trim();
  if (!testRef) fail("missing_test_ref");

  const allowlist = (input.allowlist ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (allowlist.length === 0) fail("missing_allowlist");

  const productionRef = input.productionRef?.trim();
  if (!productionRef) fail("missing_production_ref");

  const urlRef = refFromUrl(testUrl);
  if (!urlRef) fail("invalid_url");

  const productionRefs = new Set<string>([productionRef]);
  for (const candidate of input.productionUrls ?? []) {
    const ref = refFromUrl(candidate);
    if (ref) productionRefs.add(ref);
  }
  if (productionRefs.has(urlRef) || productionRefs.has(testRef)) fail("is_production");

  if (urlRef !== testRef) fail("ref_mismatch");
  if (!allowlist.includes(testRef)) fail("not_allowlisted");

  for (const key of input.keys ?? []) {
    const keyRef = refFromJwt(key);
    if (keyRef && keyRef !== testRef) fail("key_ref_mismatch");
  }

  return { projectRef: testRef };
}

export function readGuardInputFromEnv(env: NodeJS.ProcessEnv): GuardInput {
  return {
    testUrl: env.RC2_TEST_SUPABASE_URL,
    testProjectRef: env.RC2_TEST_PROJECT_REF,
    allowlist: env.RC2_TEST_PROJECT_REF_ALLOWLIST,
    productionRef: env.RC2_PRODUCTION_PROJECT_REF,
    productionUrls: [env.NEXT_PUBLIC_SUPABASE_URL],
    keys: [env.RC2_TEST_SUPABASE_ANON_KEY, env.RC2_TEST_SUPABASE_SERVICE_ROLE_KEY],
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/ops/integrationGuard.test.ts`
Expected: 15 testes passam.

- [ ] **Step 5: Typecheck e lint**

Run: `npm run typecheck && npx eslint tests/integration tests/unit/ops`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add tests/integration/support/guard.ts tests/unit/ops/integrationGuard.test.ts
git commit -m "test(ops): guarda anti-produção da suíte de integração (T-OPS-U01)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

**Rollback:** `git revert HEAD`.

---

### Task 3: Carga restrita do env de teste, alvo verificado, configuração e `globalSetup` (RF-OPS-02)

**Files:**
- Create: `tests/integration/support/env.ts`
- Create: `tests/integration/support/target.ts`
- Create: `tests/integration/support/globalSetup.ts`
- Create: `vitest.integration.config.ts`
- Create: `tests/unit/ops/globalSetup.test.ts`
- Create: `tests/unit/ops/targetGuard.test.ts`
- Modify: `package.json` (scripts)
- Modify: `.env.example` (acrescentar bloco com **nomes**)

**Interfaces:**
- Consumes: `assertSafeTestTarget`, `readGuardInputFromEnv`, `IntegrationGuardError` (Task 2).
- Produces:
  - `loadTestEnvFile(): void` (carrega somente `.env.test.local`, ignora `ENOENT`)
  - `type VerifiedTarget = { readonly url: string; readonly projectRef: string; readonly anonKey: string; readonly serviceKey: string }` com **marca de tipo**: só `getVerifiedTarget` o produz
  - `getVerifiedTarget(env?: NodeJS.ProcessEnv): VerifiedTarget` (lança `IntegrationGuardError`, inclusive `missing_keys`)
  - `npm run test:integration`

- [ ] **Step 1: Escrever os testes que falham**

Create `tests/unit/ops/globalSetup.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("carga do env e globalSetup da suíte de integração", () => {
  it("carrega somente .env.test.local, nunca .env.local nem dotenv", () => {
    const env = read("tests/integration/support/env.ts");
    expect(env).toContain('process.loadEnvFile(".env.test.local")');
    expect(env).not.toMatch(/["'`]\.env\.local["'`]/);
    expect(env).not.toMatch(/dotenv/i);
  });

  it("o globalSetup carrega o env e valida o alvo, nesta ordem, sem abrir conexão", () => {
    const setup = read("tests/integration/support/globalSetup.ts");
    const loadIndex = setup.indexOf("loadTestEnvFile(");
    const targetIndex = setup.indexOf("getVerifiedTarget(");
    expect(loadIndex).toBeGreaterThan(-1);
    expect(targetIndex).toBeGreaterThan(loadIndex);
    expect(setup).not.toMatch(/createClient|fetch\(/);
  });
});
```

Create `tests/unit/ops/targetGuard.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { IntegrationGuardError } from "../../integration/support/guard";
import { getVerifiedTarget } from "../../integration/support/target";

const TEST_REF = "abcdefghijklmnopqrst";
const PROD_REF = "uvwxyzabcdefghijklmn";

function safeEnv(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    RC2_TEST_SUPABASE_URL: ` https://${TEST_REF}.supabase.co `,
    RC2_TEST_PROJECT_REF: TEST_REF,
    RC2_TEST_PROJECT_REF_ALLOWLIST: TEST_REF,
    RC2_PRODUCTION_PROJECT_REF: PROD_REF,
    RC2_TEST_SUPABASE_ANON_KEY: "anon-opaca",
    RC2_TEST_SUPABASE_SERVICE_ROLE_KEY: "service-opaca",
    ...overrides,
  } as NodeJS.ProcessEnv;
}

function reasonOf(env: NodeJS.ProcessEnv): string {
  try {
    getVerifiedTarget(env);
  } catch (error) {
    expect(error).toBeInstanceOf(IntegrationGuardError);
    return (error as IntegrationGuardError).reason;
  }
  throw new Error("deveria ter recusado");
}

describe("getVerifiedTarget", () => {
  it("devolve o alvo validado, com valores sem espaços", () => {
    const target = getVerifiedTarget(safeEnv());
    expect(target.projectRef).toBe(TEST_REF);
    expect(target.url).toBe(`https://${TEST_REF}.supabase.co`);
    expect(target.anonKey).toBe("anon-opaca");
    expect(target.serviceKey).toBe("service-opaca");
  });

  it("recusa um alvo que a guarda reconhece como produção", () => {
    expect(reasonOf(safeEnv({ RC2_PRODUCTION_PROJECT_REF: TEST_REF }))).toBe("is_production");
  });

  it("recusa quando falta qualquer chave", () => {
    expect(reasonOf(safeEnv({ RC2_TEST_SUPABASE_SERVICE_ROLE_KEY: undefined }))).toBe("missing_keys");
    expect(reasonOf(safeEnv({ RC2_TEST_SUPABASE_ANON_KEY: "  " }))).toBe("missing_keys");
  });

  it("revalida a cada chamada: mudar o ambiente depois de um sucesso é detectado", () => {
    const env = safeEnv();
    expect(getVerifiedTarget(env).projectRef).toBe(TEST_REF);
    env.RC2_PRODUCTION_PROJECT_REF = TEST_REF;
    expect(reasonOf(env)).toBe("is_production");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/ops/globalSetup.test.ts tests/unit/ops/targetGuard.test.ts`
Expected: FAIL (arquivos inexistentes).

- [ ] **Step 3: Criar `env.ts`, `target.ts` e `globalSetup.ts`**

Create `tests/integration/support/env.ts`:

```ts
// Carrega o env da suíte de integração. Somente o arquivo de teste (ignorado
// pelo git). O arquivo de ambiente principal pode conter credenciais de
// produção e nunca é lido por esta suíte. Variáveis já definidas no processo
// têm precedência (loadEnvFile não sobrescreve).
export function loadTestEnvFile(): void {
  try {
    process.loadEnvFile(".env.test.local");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
```

Create `tests/integration/support/target.ts`:

```ts
import { IntegrationGuardError, assertSafeTestTarget, readGuardInputFromEnv } from "./guard";

declare const verifiedBrand: unique symbol;

/**
 * Alvo já validado pela guarda. A marca de tipo impede construí-lo à mão: só
 * `getVerifiedTarget` o produz, e todo cliente do Supabase da suíte nasce dele.
 */
export type VerifiedTarget = {
  readonly [verifiedBrand]: true;
  readonly url: string;
  readonly projectRef: string;
  readonly anonKey: string;
  readonly serviceKey: string;
};

/** Única função da suíte que lê as chaves de teste. Lança IntegrationGuardError. */
export function getVerifiedTarget(env: NodeJS.ProcessEnv = process.env): VerifiedTarget {
  const { projectRef } = assertSafeTestTarget(readGuardInputFromEnv(env));
  const url = env.RC2_TEST_SUPABASE_URL?.trim();
  const anonKey = env.RC2_TEST_SUPABASE_ANON_KEY?.trim();
  const serviceKey = env.RC2_TEST_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !anonKey || !serviceKey) throw new IntegrationGuardError("missing_keys");
  return { url, projectRef, anonKey, serviceKey } as VerifiedTarget;
}
```

Create `tests/integration/support/globalSetup.ts`:

```ts
import { loadTestEnvFile } from "./env";
import { getVerifiedTarget } from "./target";

// Roda uma vez, antes da coleta de qualquer teste. Se a guarda recusar, o
// Vitest encerra com erro e nenhuma conexão é aberta. A mesma validação é
// repetida em cada criação de cliente e a cada acesso ao service_role
// (clients.ts): este é apenas o primeiro portão.
export default function setup(): void {
  loadTestEnvFile();
  const { projectRef } = getVerifiedTarget();
  console.info(`[integração] alvo de teste validado (ref ${projectRef.slice(0, 4)}…).`);
}
```

- [ ] **Step 4: Configuração da suíte de integração, script e variáveis de exemplo**

Create `vitest.integration.config.ts`:

```ts
import { defineConfig } from "vitest/config";

// Suíte de integração de RLS (RF-OPS-02). Só roda sob `npm run test:integration`
// e depois que a guarda anti-produção aprovar o alvo (globalSetup).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["./tests/integration/support/globalSetup.ts"],
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
```

Em `package.json`, dentro de `"scripts"`, logo depois de `"test:watch": "vitest",`, inserir:

```json
    "test:integration": "vitest run --config vitest.integration.config.ts",
```

Ao final de `.env.example`, acrescentar (somente nomes, sem valores):

```
# ─────────────────────────────────────────────
# Testes de integração de RLS (ambiente Supabase ISOLADO)
# NUNCA aponte para produção. Os valores reais ficam em .env.test.local
# (ignorado pelo git). A guarda recusa a execução se o alvo não for um
# projeto de teste da allowlist ou se for o de produção.
# ─────────────────────────────────────────────
RC2_TEST_SUPABASE_URL=
RC2_TEST_PROJECT_REF=
RC2_TEST_PROJECT_REF_ALLOWLIST=
RC2_PRODUCTION_PROJECT_REF=
RC2_TEST_SUPABASE_ANON_KEY=
RC2_TEST_SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 5: Rodar e ver passar; conferir a separação**

Run:
```bash
npx vitest run tests/unit/ops/globalSetup.test.ts tests/unit/ops/targetGuard.test.ts
npx vitest list --filesOnly | grep -c "tests/integration" || true
```
Expected: 6 testes passam (2 + 4); `0`.

- [ ] **Step 6: Ensaios da guarda (D1–D4), sem rede e sem credenciais reais**

Os valores abaixo são **fictícios**. Cada ensaio deve falhar **antes** de qualquer teste ou conexão (não pode haver teste executado nem erro de rede).

```bash
# D1: sem nenhuma variável (e sem .env.test.local)
env -u RC2_TEST_SUPABASE_URL npm run test:integration 2>&1 | tail -6
# esperado: "Guarda anti-produção: execução recusada (missing_test_url)."

# D2: alvo igual ao ref de produção declarado
RC2_TEST_SUPABASE_URL=https://aaaaaaaaaaaaaaaaaaaa.supabase.co RC2_TEST_PROJECT_REF=aaaaaaaaaaaaaaaaaaaa \
RC2_TEST_PROJECT_REF_ALLOWLIST=aaaaaaaaaaaaaaaaaaaa RC2_PRODUCTION_PROJECT_REF=aaaaaaaaaaaaaaaaaaaa \
npm run test:integration 2>&1 | tail -6
# esperado: "(is_production)"

# D3: URL igual a NEXT_PUBLIC_SUPABASE_URL de produção
NEXT_PUBLIC_SUPABASE_URL=https://bbbbbbbbbbbbbbbbbbbb.supabase.co \
RC2_TEST_SUPABASE_URL=https://bbbbbbbbbbbbbbbbbbbb.supabase.co RC2_TEST_PROJECT_REF=bbbbbbbbbbbbbbbbbbbb \
RC2_TEST_PROJECT_REF_ALLOWLIST=bbbbbbbbbbbbbbbbbbbb RC2_PRODUCTION_PROJECT_REF=cccccccccccccccccccc \
npm run test:integration 2>&1 | tail -6
# esperado: "(is_production)"

# D4: chave JWT de outro projeto
FAKEJWT="$(node -e "const e=o=>Buffer.from(JSON.stringify(o)).toString('base64url');console.log(e({alg:'HS256'})+'.'+e({ref:'cccccccccccccccccccc'})+'.x')")"
RC2_TEST_SUPABASE_URL=https://dddddddddddddddddddd.supabase.co RC2_TEST_PROJECT_REF=dddddddddddddddddddd \
RC2_TEST_PROJECT_REF_ALLOWLIST=dddddddddddddddddddd RC2_PRODUCTION_PROJECT_REF=cccccccccccccccccccc \
RC2_TEST_SUPABASE_ANON_KEY="$FAKEJWT" RC2_TEST_SUPABASE_SERVICE_ROLE_KEY=opaca npm run test:integration 2>&1 | tail -6
# esperado: "(key_ref_mismatch)"
```
Guarde as saídas para a evidência (C4). Nenhum `.env.test.local` pode existir durante D1. Com o `.env.test.local` presente, D2–D4 terminam em `env_conflict` (variáveis do shell divergem do arquivo), então D1–D4 **não se repetem** no repositório depois da EX-3: reaproveite as saídas arquivadas (CC-5). Se não houver saída arquivada, reproduza-os **fora do repositório**, num diretório temporário sem nenhum arquivo `.env*` (cópia de `vitest.integration.config.ts`, `package.json` e `tests/integration/support/`, `node_modules` por junção e um teste vazio no lugar de `baseline.test.ts`), sem copiar credenciais. Resultado de 2026-10-16: ver `docs/runbooks/evidence/E0a-C14-EX01-2026-10-16-pre-gate.md`.

- [ ] **Step 7: Typecheck e lint**

Run: `npm run typecheck && npx eslint vitest.integration.config.ts tests/integration tests/unit/ops`
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add vitest.integration.config.ts tests/integration/support/env.ts tests/integration/support/target.ts tests/integration/support/globalSetup.ts tests/unit/ops/globalSetup.test.ts tests/unit/ops/targetGuard.test.ts package.json .env.example
git commit -m "test(ops): env restrito, alvo verificado e globalSetup da suíte de integração

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

**Rollback:** `git revert HEAD`. **Gate B.** Contagem acumulada: **B + 5 arquivos / B + 25 testes**.

---

### Task 4: Clientes por papel com guarda no caminho de criação (RF-OPS-02)

**Files:**
- Create: `tests/integration/support/clients.ts`
- Create: `tests/unit/ops/clientsGuard.test.ts`

**Interfaces:**
- Consumes: `getVerifiedTarget`, `VerifiedTarget` (Task 3); `IntegrationGuardError` (Task 2); `loadTestEnvFile` (Task 3).
- Produces:
```ts
export const TEST_ENV_MARKER_KEY = "__rc2_isolated_test_env__";   // linha em public.settings
export type RoleClients = {
  tag: string;                           // sufixo único da execução (8 caracteres)
  anon: SupabaseClient;
  nonAdmin: SupabaseClient;
  admin: SupabaseClient;
  readonly service: SupabaseClient;      // GETTER: revalida o alvo a cada acesso
  adminUserId: string;
  nonAdminUserId: string;
  cleanup(): Promise<string[]>;          // devolve as falhas; [] = limpo e verificado
};
export async function createRoleClients(): Promise<RoleClients>;
```

**Regras de projeto (protegem o caminho de criação e as operações privilegiadas):**
1. `clients.ts` é o **único** arquivo da suíte que chama `createClient` (teste estático).
2. A ordem é fixa: `loadTestEnvFile()` → `getVerifiedTarget()` → cliente `anon` → **marcador de ambiente** → só então o cliente `service_role` é criado.
3. O acesso a `service` e as operações internas de setup/limpeza passam por `svc()`, que chama `getVerifiedTarget()` de novo; mudar o ambiente depois da criação é detectado.
4. O marcador é uma linha pública em `public.settings` (`key = __rc2_isolated_test_env__`, `value = <ref de teste>`), criada na EX-2. Sua leitura usa a chave `anon` e é a **única** requisição feita antes de existir cliente privilegiado.

- [ ] **Step 1: Escrever os testes que falham (rede simulada)**

Create `tests/unit/ops/clientsGuard.test.ts`:

```ts
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TEST_REF = "abcdefghijklmnopqrst";
const PROD_REF = "uvwxyzabcdefghijklmn";
const SERVICE_KEY = "service-key-opaca";

const h = vi.hoisted(() => ({
  calls: [] as Array<{ key: string }>,
  marker: { value: null as string | null },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (_url: string, key: string) => {
    h.calls.push({ key });
    return {
      from: () => ({
        select: () => ({
          eq: async () => ({
            data: h.marker.value === null ? [] : [{ value: h.marker.value }],
            error: null,
          }),
        }),
        insert: async () => ({ error: null }),
        delete: () => ({ eq: async () => ({ error: null }) }),
      }),
      auth: {
        signInWithPassword: async () => ({ error: null }),
        admin: {
          createUser: async () => ({
            data: { user: { id: `00000000-0000-4000-8000-${String(h.calls.length).padStart(12, "0")}` } },
            error: null,
          }),
          deleteUser: async () => ({ error: null }),
          listUsers: async () => ({ data: { users: [] }, error: null }),
        },
      },
    };
  },
}));

// Hermético: nunca ler o .env.test.local real durante o teste unitário.
vi.mock("../../integration/support/env", () => ({ loadTestEnvFile: () => {} }));

import { IntegrationGuardError } from "../../integration/support/guard";
import { createRoleClients } from "../../integration/support/clients";

function stubSafeEnv(): void {
  vi.stubEnv("RC2_TEST_SUPABASE_URL", `https://${TEST_REF}.supabase.co`);
  vi.stubEnv("RC2_TEST_PROJECT_REF", TEST_REF);
  vi.stubEnv("RC2_TEST_PROJECT_REF_ALLOWLIST", TEST_REF);
  vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", PROD_REF);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("RC2_TEST_SUPABASE_ANON_KEY", "anon-key-opaca");
  vi.stubEnv("RC2_TEST_SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY);
}

beforeEach(() => {
  h.calls.length = 0;
  h.marker.value = TEST_REF;
  stubSafeEnv();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("guarda no caminho de criação de clientes (RF-OPS-02)", () => {
  it("alvo reconhecido como produção: recusa e não cria nenhum cliente", async () => {
    vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", TEST_REF);
    await expect(createRoleClients()).rejects.toMatchObject({ reason: "is_production" });
    expect(h.calls).toHaveLength(0);
  });

  it("marcador ausente: recusa antes de criar o cliente service_role", async () => {
    h.marker.value = null;
    await expect(createRoleClients()).rejects.toMatchObject({ reason: "missing_marker" });
    expect(h.calls).toHaveLength(1); // somente o cliente anon, para ler o marcador
    expect(h.calls.some((call) => call.key === SERVICE_KEY)).toBe(false);
  });

  it("marcador com valor diferente do ref de teste: recusa antes do service_role", async () => {
    h.marker.value = PROD_REF;
    await expect(createRoleClients()).rejects.toBeInstanceOf(IntegrationGuardError);
    expect(h.calls.some((call) => call.key === SERVICE_KEY)).toBe(false);
  });

  it("o acesso ao service_role revalida o alvo: mudar o ambiente depois da criação é detectado", async () => {
    const clients = await createRoleClients();
    expect(() => clients.service).not.toThrow();

    vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", TEST_REF);
    expect(() => clients.service).toThrow(IntegrationGuardError);

    vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", PROD_REF);
    await expect(clients.cleanup()).resolves.toEqual([]);
  });
});

describe("varreduras estáticas da suíte de integração", () => {
  const root = resolve(process.cwd(), "tests/integration");

  function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? sources(full) : full.endsWith(".ts") ? [full] : [];
    });
  }

  it("somente support/clients.ts chama createClient", () => {
    const offenders = sources(root).filter(
      (file) => /createClient\s*\(/.test(readFileSync(file, "utf8")) && !file.endsWith("clients.ts"),
    );
    expect(offenders).toEqual([]);
  });

  it("a chave service_role só é referenciada em guard.ts e target.ts", () => {
    const offenders = sources(root).filter(
      (file) =>
        readFileSync(file, "utf8").includes("SERVICE_ROLE_KEY") &&
        !/[\\/]support[\\/](guard|target)\.ts$/.test(file),
    );
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/ops/clientsGuard.test.ts`
Expected: FAIL (módulo `clients` inexistente).

- [ ] **Step 3: Implementar**

Create `tests/integration/support/clients.ts`:

```ts
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadTestEnvFile } from "./env";
import { IntegrationGuardError } from "./guard";
import { getVerifiedTarget, type VerifiedTarget } from "./target";

// ÚNICO arquivo da suíte que chama createClient (verificado por teste estático).
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } } as const;

export const TEST_ENV_MARKER_KEY = "__rc2_isolated_test_env__";

export type RoleClients = {
  tag: string;
  anon: SupabaseClient;
  nonAdmin: SupabaseClient;
  admin: SupabaseClient;
  /** Getter: revalida o alvo a cada acesso. */
  readonly service: SupabaseClient;
  adminUserId: string;
  nonAdminUserId: string;
  /** Remove os usuários sintéticos e devolve as falhas. Lista vazia = limpo e verificado. */
  cleanup(): Promise<string[]>;
};

// O ambiente precisa se declarar de teste: uma linha pública em settings cujo
// valor é o ref do projeto de teste. Só leitura, com a chave anon, e só depois
// de a guarda estática aceitar o alvo.
async function assertIsolatedMarker(anon: SupabaseClient, target: VerifiedTarget): Promise<void> {
  const { data, error } = await anon.from("settings").select("value").eq("key", TEST_ENV_MARKER_KEY);
  const rows = (data as Array<{ value?: unknown }> | null) ?? [];
  if (error || rows.length !== 1 || rows[0].value !== target.projectRef) {
    throw new IntegrationGuardError("missing_marker");
  }
}

export async function createRoleClients(): Promise<RoleClients> {
  loadTestEnvFile();
  const target = getVerifiedTarget(); // 1) guarda estática, antes de qualquer cliente

  const anon = createClient(target.url, target.anonKey, clientOptions);
  await assertIsolatedMarker(anon, target); // 2) o ambiente se declara de teste

  const serviceClient = createClient(target.url, target.serviceKey, clientOptions); // 3) só agora
  // Toda operação privilegiada passa por aqui e revalida o alvo.
  const svc = (): SupabaseClient => {
    getVerifiedTarget();
    return serviceClient;
  };

  const tag = randomUUID().slice(0, 8);
  const password = `${randomUUID()}Aa1!`;
  const createdUserIds: string[] = [];

  async function makeUser(label: "admin" | "member") {
    const email = `e0a-${tag}-${label}@example.test`;
    const created = await svc().auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error || !created.data.user) {
      throw new Error(`Falha ao criar o usuário sintético (${label}): ${created.error?.message}`);
    }
    createdUserIds.push(created.data.user.id); // registrado imediatamente

    const client = createClient(target.url, target.anonKey, clientOptions);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error) {
      throw new Error(`Falha ao autenticar o usuário sintético (${label}): ${signedIn.error.message}`);
    }
    return { client, id: created.data.user.id, email };
  }

  async function cleanup(): Promise<string[]> {
    const failures: string[] = [];
    for (const id of createdUserIds) {
      const removedAdmin = await svc().from("admin_users").delete().eq("id", id);
      if (removedAdmin.error) {
        failures.push(`admin_users ${id.slice(0, 8)}: ${removedAdmin.error.code ?? removedAdmin.error.message}`);
      }
      const removedUser = await svc().auth.admin.deleteUser(id);
      if (removedUser.error) failures.push(`auth.users ${id.slice(0, 8)}: ${removedUser.error.message}`);
    }
    // Inspeção final (projeto de teste pequeno; uma página de 1000 usuários basta).
    const listed = await svc().auth.admin.listUsers({ perPage: 1000 });
    if (listed.error) {
      failures.push(`inspeção de usuários falhou: ${listed.error.message}`);
    } else {
      for (const user of listed.data.users) {
        if (user.email?.startsWith(`e0a-${tag}-`)) failures.push(`usuário sintético remanescente ${user.id.slice(0, 8)}`);
      }
    }
    return failures;
  }

  try {
    const admin = await makeUser("admin");
    const member = await makeUser("member");

    const registered = await svc().from("admin_users").insert({ id: admin.id, email: admin.email });
    if (registered.error) {
      throw new Error(`Falha ao registrar o admin sintético: ${registered.error.message}`);
    }

    return {
      tag,
      anon,
      nonAdmin: member.client,
      admin: admin.client,
      get service() {
        return svc();
      },
      adminUserId: admin.id,
      nonAdminUserId: member.id,
      cleanup,
    };
  } catch (error) {
    // Falha parcial de setup: limpa o que existir e nunca silencia a falha de limpeza.
    const failures = await cleanup();
    if (failures.length > 0) {
      throw new AggregateError(
        [error, new Error(`Falha de limpeza: ${failures.join(" | ")}`)],
        "O setup falhou e a limpeza também",
      );
    }
    throw error;
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/ops/clientsGuard.test.ts`
Expected: 6 testes passam.

- [ ] **Step 5: Typecheck e lint**

Run: `npm run typecheck && npx eslint tests/integration tests/unit/ops`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add tests/integration/support/clients.ts tests/unit/ops/clientsGuard.test.ts
git commit -m "test(ops): clientes por papel com guarda, marcador de ambiente e limpeza verificada

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

**Rollback:** `git revert HEAD`. Contagem acumulada: **B + 6 arquivos / B + 31 testes**.

---

### Task 5: Limpeza, sondas de efeito real e matriz de 67 verificações (RF-OPS-02)

**Files:**
- Create: `tests/integration/support/cleanup.ts`
- Create: `tests/integration/support/matrix.ts`
- Create: `tests/integration/support/probes.ts`
- Create: `tests/integration/support/fixtures.ts`
- Create: `tests/integration/rls/baseline.test.ts`
- Create: `tests/unit/ops/cleanupRegistry.test.ts`
- Create: `tests/unit/ops/probesDecision.test.ts`

**Interfaces:**
- Consumes: `createRoleClients` / `RoleClients` (Task 4).
- Produces:
```ts
// cleanup.ts
export type Tracked = { table: string; idColumn: string; id: string };
export class CleanupRegistry {
  track(table: string, idColumn: string, id: string): void;         // chamar ANTES de criar/tentar
  readonly size: number;
  run(service: SupabaseClient): Promise<string[]>;                   // remove em ordem inversa; devolve falhas
  inspectResidue(service: SupabaseClient): Promise<string[]>;        // nada registrado pode continuar existindo
}
// matrix.ts
export type Role = "anon" | "authenticated_non_admin" | "authenticated_admin" | "service_role";
export type Operation = "SELECT" | "INSERT" | "UPDATE" | "DELETE";
export type Outcome = "allow" | "deny";
export type MatrixEntry = { table: string; role: Role; operation: Operation; expected: Outcome; observed: Outcome | "error" };
export function recordEntry(entry: MatrixEntry): void;
export function matrixEntries(): MatrixEntry[];
export function mismatches(): MatrixEntry[];
export function writeMatrixReport(name: string, dir?: string): { json: string; md: string };
// probes.ts
export type Fixture = { table: string; idColumn: string; id: string };
export type WriteObservation = { operation: "INSERT" | "UPDATE" | "DELETE"; fixtureConfirmed: boolean; errorCode: string | null; changed: boolean };
export function classifyWrite(o: WriteObservation): Outcome | "error";
export function observeSelect(client, service, fx): Promise<Outcome | "error">;
export function observeInsert(client, service, registry, table, idColumn, row): Promise<Outcome | "error">;
export function observeUpdate(client, service, fx, column, newValue): Promise<Outcome | "error">;
export function observeDelete(client, service, fx): Promise<Outcome | "error">;
export function check(args: { table; role; operation; expected; observe }): Promise<Outcome | "error">;
// fixtures.ts
export function makePost(service, registry, tag, status): Promise<Fixture>;
export function makeSetting(service, registry, tag): Promise<Fixture>;
export function makeAuthor(service, registry, tag): Promise<Fixture>;
export function makeLead(service, registry, tag): Promise<Fixture>;
```
Tasks de E0b em diante **reutilizam** estes helpers.

**Semântica das sondas (corrige o plano v1):**
- `insert()` é feito **sem** `.select()`: a autorização de INSERT não depende de política de SELECT.
- O efeito é sempre confirmado por **leitura do cliente `service_role` do ambiente isolado**: INSERT = a linha passou a existir; UPDATE = a coluna passou a ter o valor novo (valor único, nunca igual ao anterior); DELETE = a linha deixou de existir.
- **Negação** só é concluída quando: (a) o cliente recebeu `42501`, **ou** (b) não houve erro, a **fixture foi confirmada como existente** antes da operação e o estado **permaneceu inalterado** (a única explicação, com filtro por chave primária, é a RLS ter ocultado a linha).
- Zero linhas afetadas **sem** confirmação da fixture = `error` (inconclusivo), nunca `deny`.
- Mudança efetiva acompanhada de erro, ou INSERT sem erro e sem linha = `error`.
- Qualquer outro código de erro (restrição, tipo, rede) = `error`.

**Cobertura E0a (tabelas de política estável):** `posts`, `settings`, `authors`, `admin_users` e `leads` (leitura e atualização). **Não** se fixa o INSERT anônimo em `leads` (R1, E0b.2), o DELETE de `leads` (sem policy hoje; E2) nem `admin_audit_logs` (E0b.3).

| Operação | Casos | Papéis | Verificações |
|---|---|---|---|
| SELECT | posts publicado, posts rascunho, settings, admin_users (linha própria), leads | 4 | 20 |
| INSERT | posts, settings, authors | 4 | 12 |
| UPDATE | posts, settings, authors, leads, admin_users | 4 | 20 |
| DELETE | posts, settings, authors (4 papéis) + admin_users (3 papéis; `service_role` excluído para não destruir o admin sintético) | 4 / 3 | 15 |
| **Total** | | | **67** |

- [ ] **Step 1: Testes unitários que falham — limpeza**

Create `tests/unit/ops/cleanupRegistry.test.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { CleanupRegistry } from "../../integration/support/cleanup";

type Row = { table: string; id: string };

// Cliente falso mínimo: guarda linhas e permite forçar erros.
function fakeService(options: { rows?: Row[]; deleteErrorFor?: string; selectError?: boolean } = {}) {
  const rows: Row[] = options.rows ?? [];
  const deleted: string[] = [];
  const service = {
    from: (table: string) => ({
      delete: () => ({
        eq: async (_column: string, id: string) => {
          deleted.push(`${table}:${id}`);
          if (options.deleteErrorFor === id) return { error: { code: "23503", message: "fk" } };
          return { error: null };
        },
      }),
      select: () => ({
        eq: async (_column: string, id: string) => {
          if (options.selectError) return { data: null, error: { code: "XX000", message: "boom" } };
          return { data: rows.filter((row) => row.table === table && row.id === id), error: null };
        },
      }),
    }),
  } as unknown as SupabaseClient;
  return { service, deleted };
}

describe("CleanupRegistry", () => {
  it("remove os recursos em ordem inversa e não duplica registros", async () => {
    const registry = new CleanupRegistry();
    registry.track("posts", "id", "a");
    registry.track("settings", "key", "b");
    registry.track("posts", "id", "a");
    expect(registry.size).toBe(2);
    const { service, deleted } = fakeService();
    expect(await registry.run(service)).toEqual([]);
    expect(deleted).toEqual(["settings:b", "posts:a"]);
  });

  it("não silencia erro de exclusão: devolve a falha", async () => {
    const registry = new CleanupRegistry();
    registry.track("posts", "id", "falha-1234567890");
    const { service } = fakeService({ deleteErrorFor: "falha-1234567890" });
    const failures = await registry.run(service);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("posts.id=falha-123456");
    expect(failures[0]).toContain("23503");
  });

  it("a inspeção final aponta recursos que continuam existindo", async () => {
    const registry = new CleanupRegistry();
    registry.track("leads", "id", "resto");
    const { service } = fakeService({ rows: [{ table: "leads", id: "resto" }] });
    const residue = await registry.inspectResidue(service);
    expect(residue).toHaveLength(1);
    expect(residue[0]).toContain("remanescente em leads");
  });

  it("a inspeção final reporta falha de leitura em vez de assumir que está limpo", async () => {
    const registry = new CleanupRegistry();
    registry.track("leads", "id", "x");
    const { service } = fakeService({ selectError: true });
    const residue = await registry.inspectResidue(service);
    expect(residue).toHaveLength(1);
    expect(residue[0]).toContain("inspeção falhou");
  });
});
```

- [ ] **Step 2: Testes unitários que falham — tabela de decisão**

Create `tests/unit/ops/probesDecision.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { classifyWrite } from "../../integration/support/probes";

describe("classifyWrite: decisão sobre o efeito real", () => {
  it("INSERT que passou a existir, sem erro: allow", () => {
    expect(classifyWrite({ operation: "INSERT", fixtureConfirmed: true, errorCode: null, changed: true })).toBe("allow");
  });

  it("INSERT recusado com 42501 e linha ausente: deny", () => {
    expect(classifyWrite({ operation: "INSERT", fixtureConfirmed: true, errorCode: "42501", changed: false })).toBe("deny");
  });

  it("INSERT sem erro e sem linha: inconclusivo, nunca deny", () => {
    expect(classifyWrite({ operation: "INSERT", fixtureConfirmed: true, errorCode: null, changed: false })).toBe("error");
  });

  it("UPDATE com mudança efetiva confirmada e sem erro: allow", () => {
    expect(classifyWrite({ operation: "UPDATE", fixtureConfirmed: true, errorCode: null, changed: true })).toBe("allow");
  });

  it("UPDATE com 42501 e estado inalterado: deny", () => {
    expect(classifyWrite({ operation: "UPDATE", fixtureConfirmed: true, errorCode: "42501", changed: false })).toBe("deny");
  });

  it("UPDATE sem erro, fixture confirmada e estado inalterado (linha oculta pela RLS): deny", () => {
    expect(classifyWrite({ operation: "UPDATE", fixtureConfirmed: true, errorCode: null, changed: false })).toBe("deny");
  });

  it("zero efeito SEM fixture confirmada não é negação: error", () => {
    expect(classifyWrite({ operation: "UPDATE", fixtureConfirmed: false, errorCode: null, changed: false })).toBe("error");
    expect(classifyWrite({ operation: "DELETE", fixtureConfirmed: false, errorCode: null, changed: false })).toBe("error");
  });

  it("erro diferente de 42501 (restrição, rede) é inconclusivo", () => {
    expect(classifyWrite({ operation: "DELETE", fixtureConfirmed: true, errorCode: "23503", changed: false })).toBe("error");
  });

  it("mudança efetiva acompanhada de erro é inconsistente: error", () => {
    expect(classifyWrite({ operation: "DELETE", fixtureConfirmed: true, errorCode: "42501", changed: true })).toBe("error");
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/unit/ops/cleanupRegistry.test.ts tests/unit/ops/probesDecision.test.ts`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 4: Implementar limpeza**

Create `tests/integration/support/cleanup.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type Tracked = { table: string; idColumn: string; id: string };

// Registro de recursos sintéticos. Registre ANTES de criar ou tentar, para que
// uma falha parcial nunca deixe um recurso sem dono. Nenhum método engole erro.
export class CleanupRegistry {
  private readonly items: Tracked[] = [];

  track(table: string, idColumn: string, id: string): void {
    const known = this.items.some((i) => i.table === table && i.idColumn === idColumn && i.id === id);
    if (!known) this.items.push({ table, idColumn, id });
  }

  get size(): number {
    return this.items.length;
  }

  /** Remove tudo, em ordem inversa, e devolve as falhas. */
  async run(service: SupabaseClient): Promise<string[]> {
    const failures: string[] = [];
    for (const item of [...this.items].reverse()) {
      const { error } = await service.from(item.table).delete().eq(item.idColumn, item.id);
      if (error) {
        failures.push(`${item.table}.${item.idColumn}=${item.id.slice(0, 12)}: ${error.code ?? error.message}`);
      }
    }
    return failures;
  }

  /** Inspeção final: nada do que foi registrado pode continuar existindo. */
  async inspectResidue(service: SupabaseClient): Promise<string[]> {
    const residue: string[] = [];
    for (const item of this.items) {
      const { data, error } = await service.from(item.table).select(item.idColumn).eq(item.idColumn, item.id);
      if (error) {
        residue.push(`inspeção falhou em ${item.table}: ${error.code ?? error.message}`);
      } else if ((data?.length ?? 0) > 0) {
        residue.push(`remanescente em ${item.table}: ${item.id.slice(0, 12)}`);
      }
    }
    return residue;
  }
}
```

- [ ] **Step 5: Implementar matriz**

Create `tests/integration/support/matrix.ts`:

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export type Role = "anon" | "authenticated_non_admin" | "authenticated_admin" | "service_role";
export type Operation = "SELECT" | "INSERT" | "UPDATE" | "DELETE";
export type Outcome = "allow" | "deny";
export type MatrixEntry = {
  table: string;
  role: Role;
  operation: Operation;
  expected: Outcome;
  observed: Outcome | "error";
};

const entries: MatrixEntry[] = [];

export function recordEntry(entry: MatrixEntry): void {
  entries.push(entry);
}

export function matrixEntries(): MatrixEntry[] {
  return [...entries];
}

/** Divergências: inclui qualquer `error`, pois o esperado nunca é "error". */
export function mismatches(): MatrixEntry[] {
  return entries.filter((entry) => entry.expected !== entry.observed);
}

function renderMarkdown(list: MatrixEntry[]): string {
  const rows = list.map(
    (e) =>
      `| ${e.table} | ${e.role} | ${e.operation} | ${e.expected} | ${e.observed} | ${
        e.expected === e.observed ? "ok" : "**DIVERGE**"
      } |`,
  );
  const divergent = list.filter((e) => e.expected !== e.observed).length;
  const inconclusive = list.filter((e) => e.observed === "error").length;
  return [
    "# Matriz de RLS: tabela × papel × operação",
    "",
    `Total: ${list.length} · divergências: ${divergent} · inconclusivos (error): ${inconclusive}`,
    "",
    "| Tabela | Papel | Operação | Esperado | Observado | Resultado |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

export function writeMatrixReport(
  name: string,
  dir = "test-results/integration",
): { json: string; md: string } {
  const folder = resolve(process.cwd(), dir);
  mkdirSync(folder, { recursive: true });
  const json = join(folder, `rls-matrix-${name}.json`);
  const md = join(folder, `rls-matrix-${name}.md`);
  writeFileSync(json, JSON.stringify(entries, null, 2));
  writeFileSync(md, renderMarkdown(entries));
  return { json, md };
}
```

- [ ] **Step 6: Implementar sondas**

Create `tests/integration/support/probes.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CleanupRegistry } from "./cleanup";
import { recordEntry, type Operation, type Outcome, type Role } from "./matrix";

export type Fixture = { table: string; idColumn: string; id: string };

export type WriteObservation = {
  operation: "INSERT" | "UPDATE" | "DELETE";
  /** UPDATE/DELETE: o cliente privilegiado confirmou que a linha existia antes da operação. */
  fixtureConfirmed: boolean;
  /** Código de erro devolvido ao cliente sob teste (null se não houve erro). */
  errorCode: string | null;
  /** O cliente privilegiado confirmou a mudança efetiva (linha inserida, coluna alterada, linha removida). */
  changed: boolean;
};

// Decisão pura sobre o EFEITO REAL. Zero linhas afetadas, sozinho, nunca é negação.
export function classifyWrite(o: WriteObservation): Outcome | "error" {
  if (o.operation !== "INSERT" && !o.fixtureConfirmed) return "error";
  if (o.changed) return o.errorCode ? "error" : "allow";
  if (o.errorCode === "42501") return "deny";
  if (o.errorCode) return "error";
  // Sem erro e sem mudança: num INSERT isso é inconsistente; em UPDATE/DELETE
  // com fixture confirmada e filtro por chave primária, só a RLS pode ter
  // ocultado a linha.
  return o.operation === "INSERT" ? "error" : "deny";
}

type DbError = { code?: string; message?: string } | null;

function errorCodeOf(error: DbError): string | null {
  return error ? (error.code ?? "unknown") : null;
}

// Leituras privilegiadas lançam em caso de erro: nunca viram "deny" por engano.
async function rowExists(service: SupabaseClient, fx: Fixture): Promise<boolean> {
  const { data, error } = await service.from(fx.table).select(fx.idColumn).eq(fx.idColumn, fx.id);
  if (error) throw new Error(`Leitura privilegiada falhou em ${fx.table}: ${error.code ?? error.message}`);
  return (data?.length ?? 0) > 0;
}

async function columnValue(service: SupabaseClient, fx: Fixture, column: string): Promise<unknown> {
  const { data, error } = await service.from(fx.table).select(column).eq(fx.idColumn, fx.id);
  if (error) throw new Error(`Leitura privilegiada falhou em ${fx.table}.${column}: ${error.code ?? error.message}`);
  const rows = data as unknown as Array<Record<string, unknown>> | null;
  return rows?.[0]?.[column] ?? null;
}

export async function observeSelect(
  client: SupabaseClient,
  service: SupabaseClient,
  fx: Fixture,
): Promise<Outcome | "error"> {
  const existed = await rowExists(service, fx);
  const { data, error } = await client.from(fx.table).select(fx.idColumn).eq(fx.idColumn, fx.id);
  if (!existed) return "error"; // sem fixture confirmada, "zero linhas" não prova negação
  if (error) return error.code === "42501" ? "deny" : "error";
  return (data?.length ?? 0) > 0 ? "allow" : "deny";
}

export async function observeInsert(
  client: SupabaseClient,
  service: SupabaseClient,
  registry: CleanupRegistry,
  table: string,
  idColumn: string,
  row: Record<string, unknown>,
): Promise<Outcome | "error"> {
  const id = String(row[idColumn]);
  registry.track(table, idColumn, id); // registrado ANTES de tentar
  // Sem .select(): a autorização de INSERT não pode depender de política de SELECT.
  const { error } = await client.from(table).insert(row);
  const changed = await rowExists(service, { table, idColumn, id });
  return classifyWrite({ operation: "INSERT", fixtureConfirmed: true, errorCode: errorCodeOf(error), changed });
}

export async function observeUpdate(
  client: SupabaseClient,
  service: SupabaseClient,
  fx: Fixture,
  column: string,
  newValue: string,
): Promise<Outcome | "error"> {
  const fixtureConfirmed = await rowExists(service, fx);
  const before = fixtureConfirmed ? await columnValue(service, fx, column) : null;
  const { error } = await client.from(fx.table).update({ [column]: newValue }).eq(fx.idColumn, fx.id);
  const after = fixtureConfirmed ? await columnValue(service, fx, column) : null;
  const changed = fixtureConfirmed && after === newValue && before !== newValue;
  return classifyWrite({ operation: "UPDATE", fixtureConfirmed, errorCode: errorCodeOf(error), changed });
}

export async function observeDelete(
  client: SupabaseClient,
  service: SupabaseClient,
  fx: Fixture,
): Promise<Outcome | "error"> {
  const fixtureConfirmed = await rowExists(service, fx);
  const { error } = await client.from(fx.table).delete().eq(fx.idColumn, fx.id);
  const changed = fixtureConfirmed && !(await rowExists(service, fx));
  return classifyWrite({ operation: "DELETE", fixtureConfirmed, errorCode: errorCodeOf(error), changed });
}

export async function check(args: {
  table: string;
  role: Role;
  operation: Operation;
  expected: Outcome;
  observe: () => Promise<Outcome | "error">;
}): Promise<Outcome | "error"> {
  const observed = await args.observe();
  recordEntry({
    table: args.table,
    role: args.role,
    operation: args.operation,
    expected: args.expected,
    observed,
  });
  return observed;
}
```

- [ ] **Step 7: Implementar fixtures**

Create `tests/integration/support/fixtures.ts`:

```ts
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CleanupRegistry } from "./cleanup";
import type { Fixture } from "./probes";

async function insertOrThrow(service: SupabaseClient, table: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await service.from(table).insert(row);
  if (error) throw new Error(`Falha ao semear ${table}: ${error.code ?? error.message}`);
}

// Todas registram o recurso ANTES de criá-lo.

export async function makePost(
  service: SupabaseClient,
  registry: CleanupRegistry,
  tag: string,
  status: "draft" | "published",
): Promise<Fixture> {
  const id = randomUUID();
  registry.track("posts", "id", id);
  await insertOrThrow(service, "posts", {
    id,
    slug: `e0a-${tag}-${id.slice(0, 8)}`,
    title: "E0a fixture",
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  });
  return { table: "posts", idColumn: "id", id };
}

export async function makeSetting(service: SupabaseClient, registry: CleanupRegistry, tag: string): Promise<Fixture> {
  const key = `__e0a_${tag}_${randomUUID().slice(0, 8)}`;
  registry.track("settings", "key", key);
  await insertOrThrow(service, "settings", { key, value: "" });
  return { table: "settings", idColumn: "key", id: key };
}

export async function makeAuthor(service: SupabaseClient, registry: CleanupRegistry, tag: string): Promise<Fixture> {
  const id = randomUUID();
  registry.track("authors", "id", id);
  await insertOrThrow(service, "authors", { id, name: `E0a author ${tag}` });
  return { table: "authors", idColumn: "id", id };
}

export async function makeLead(service: SupabaseClient, registry: CleanupRegistry, tag: string): Promise<Fixture> {
  const id = randomUUID();
  registry.track("leads", "id", id);
  await insertOrThrow(service, "leads", {
    id,
    name: "Teste E0a",
    company: "Sintético",
    email: `e0a-${tag}-${id.slice(0, 8)}@example.test`,
    whatsapp: "5500000000000",
    segment: "teste",
    size: "1",
    solution: "teste",
    message: "dado sintético da suíte E0a",
  });
  return { table: "leads", idColumn: "id", id };
}
```

- [ ] **Step 8: Rodar os testes unitários e ver passar**

Run: `npx vitest run tests/unit/ops/cleanupRegistry.test.ts tests/unit/ops/probesDecision.test.ts`
Expected: 4 + 9 = 13 testes passam.

- [ ] **Step 9: Escrever a matriz de 67 verificações**

Create `tests/integration/rls/baseline.test.ts`:

```ts
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CleanupRegistry } from "../support/cleanup";
import { createRoleClients, type RoleClients } from "../support/clients";
import { makeAuthor, makeLead, makePost, makeSetting } from "../support/fixtures";
import {
  matrixEntries,
  mismatches,
  writeMatrixReport,
  type Operation,
  type Outcome,
  type Role,
} from "../support/matrix";
import {
  check,
  observeDelete,
  observeInsert,
  observeSelect,
  observeUpdate,
  type Fixture,
} from "../support/probes";

// Matriz do harness (E0a) sobre tabelas de política estável. NÃO fixa o INSERT
// anônimo em `leads` (R1, E0b.2), o DELETE de `leads` (E2) nem
// `admin_audit_logs` (E0b.3). Todo efeito é confirmado pelo cliente service_role
// do ambiente isolado; negação exige fixture confirmada e estado inalterado.

type Expectation = [anon: Outcome, nonAdmin: Outcome, admin: Outcome, service: Outcome];
type Observation = Outcome | "error";

const ALLOW: Outcome = "allow";
const DENY: Outcome = "deny";
const ROLE_ORDER: Role[] = ["anon", "authenticated_non_admin", "authenticated_admin", "service_role"];

const registry = new CleanupRegistry();
let c: RoleClients | undefined;
let torn = false;
let adminEmail = "";
let fxPostPublished: Fixture;
let fxPostDraft: Fixture;
let fxSetting: Fixture;
let fxLead: Fixture;
let fxAdminUser: Fixture;

function clients(): RoleClients {
  if (!c) throw new Error("clientes não inicializados");
  return c;
}
const svc = (): SupabaseClient => clients().service;
const tag = (): string => clients().tag;

function roles(): Array<[Role, SupabaseClient]> {
  const k = clients();
  return [
    ["anon", k.anon],
    ["authenticated_non_admin", k.nonAdmin],
    ["authenticated_admin", k.admin],
    ["service_role", k.service],
  ];
}

// Limpeza idempotente. Nunca silenciosa: devolve todas as falhas.
async function teardown(): Promise<string[]> {
  if (torn || !c) return [];
  torn = true;
  const service = c.service;
  return [...(await registry.run(service)), ...(await registry.inspectResidue(service)), ...(await c.cleanup())];
}

type Case = {
  table: string;
  operation: Operation;
  expected: Expectation;
  only?: Role[];
  run: (role: Role, client: SupabaseClient) => Promise<Observation>;
};

async function runCases(cases: Case[]): Promise<void> {
  for (const spec of cases) {
    for (const [role, client] of roles()) {
      if (spec.only && !spec.only.includes(role)) continue;
      await check({
        table: spec.table,
        role,
        operation: spec.operation,
        expected: spec.expected[ROLE_ORDER.indexOf(role)],
        observe: () => spec.run(role, client),
      });
    }
  }
}

beforeAll(async () => {
  try {
    c = await createRoleClients();
    const k = clients();

    fxPostPublished = await makePost(k.service, registry, k.tag, "published");
    fxPostDraft = await makePost(k.service, registry, k.tag, "draft");
    fxSetting = await makeSetting(k.service, registry, k.tag);
    fxLead = await makeLead(k.service, registry, k.tag);
    fxAdminUser = { table: "admin_users", idColumn: "id", id: k.adminUserId };

    const adminRow = await k.service.from("admin_users").select("email").eq("id", k.adminUserId);
    if (adminRow.error || !adminRow.data?.[0]) throw new Error("admin sintético não encontrado");
    adminEmail = String(adminRow.data[0].email);
  } catch (error) {
    const problems = await teardown();
    if (problems.length > 0) {
      throw new AggregateError([error, new Error(problems.join(" | "))], "O setup falhou e a limpeza também");
    }
    throw error;
  }
});

afterAll(async () => {
  const problems = await teardown();
  writeMatrixReport("baseline");
  // Falha de limpeza reprova a suíte: nunca é silenciosa.
  if (problems.length > 0) throw new Error(`Falha de limpeza (${problems.length}): ${problems.join(" | ")}`);
});

describe("identidades do harness", () => {
  it("cria identidades coerentes para os quatro papéis", async () => {
    const k = clients();
    const adminRow = await k.service.from("admin_users").select("id").eq("id", k.adminUserId);
    const memberRow = await k.service.from("admin_users").select("id").eq("id", k.nonAdminUserId);
    expect(adminRow.data).toHaveLength(1);
    expect(memberRow.data).toHaveLength(0);
    expect((await k.anon.auth.getUser()).data.user).toBeNull();
    expect(registry.size).toBeGreaterThan(0);
  });
});

describe("matriz de RLS sobre tabelas de política estável (67 verificações)", () => {
  it("SELECT: 5 casos × 4 papéis", async () => {
    await runCases([
      { table: "posts", operation: "SELECT", expected: [ALLOW, ALLOW, ALLOW, ALLOW], run: (_r, cl) => observeSelect(cl, svc(), fxPostPublished) },
      { table: "posts", operation: "SELECT", expected: [DENY, DENY, ALLOW, ALLOW], run: (_r, cl) => observeSelect(cl, svc(), fxPostDraft) },
      { table: "settings", operation: "SELECT", expected: [ALLOW, ALLOW, ALLOW, ALLOW], run: (_r, cl) => observeSelect(cl, svc(), fxSetting) },
      { table: "admin_users", operation: "SELECT", expected: [DENY, DENY, ALLOW, ALLOW], run: (_r, cl) => observeSelect(cl, svc(), fxAdminUser) },
      { table: "leads", operation: "SELECT", expected: [DENY, DENY, ALLOW, ALLOW], run: (_r, cl) => observeSelect(cl, svc(), fxLead) },
    ]);
  });

  it("INSERT: 3 casos × 4 papéis", async () => {
    await runCases([
      {
        table: "posts",
        operation: "INSERT",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: (_r, cl) => {
          const id = randomUUID();
          return observeInsert(cl, svc(), registry, "posts", "id", {
            id,
            slug: `e0a-${tag()}-i-${id.slice(0, 8)}`,
            title: "E0a insert",
            status: "draft",
          });
        },
      },
      {
        table: "settings",
        operation: "INSERT",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: (_r, cl) =>
          observeInsert(cl, svc(), registry, "settings", "key", { key: `__e0a_${tag()}_i_${randomUUID().slice(0, 8)}`, value: "" }),
      },
      {
        table: "authors",
        operation: "INSERT",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: (_r, cl) => observeInsert(cl, svc(), registry, "authors", "id", { id: randomUUID(), name: "E0a author insert" }),
      },
    ]);
  });

  it("UPDATE: 5 casos × 4 papéis", async () => {
    const unique = () => `upd-${randomUUID().slice(0, 8)}`;
    await runCases([
      {
        table: "posts",
        operation: "UPDATE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeUpdate(cl, svc(), await makePost(svc(), registry, tag(), "draft"), "summary", unique()),
      },
      {
        table: "settings",
        operation: "UPDATE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeUpdate(cl, svc(), await makeSetting(svc(), registry, tag()), "value", unique()),
      },
      {
        table: "authors",
        operation: "UPDATE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeUpdate(cl, svc(), await makeAuthor(svc(), registry, tag()), "title", unique()),
      },
      {
        table: "leads",
        operation: "UPDATE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeUpdate(cl, svc(), await makeLead(svc(), registry, tag()), "message", unique()),
      },
      {
        // Política "block update" de admin_users: ninguém altera, exceto o service_role.
        table: "admin_users",
        operation: "UPDATE",
        expected: [DENY, DENY, DENY, ALLOW],
        run: async (role, cl) => {
          const outcome = await observeUpdate(cl, svc(), fxAdminUser, "email", `e0a-${tag()}-${randomUUID().slice(0, 6)}@example.test`);
          if (role === "service_role") {
            const restored = await svc().from("admin_users").update({ email: adminEmail }).eq("id", fxAdminUser.id);
            if (restored.error) throw new Error(`Falha ao restaurar o admin sintético: ${restored.error.code}`);
          }
          return outcome;
        },
      },
    ]);
  });

  it("DELETE: 3 casos × 4 papéis + admin_users × 3 papéis", async () => {
    await runCases([
      {
        table: "posts",
        operation: "DELETE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeDelete(cl, svc(), await makePost(svc(), registry, tag(), "draft")),
      },
      {
        table: "settings",
        operation: "DELETE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeDelete(cl, svc(), await makeSetting(svc(), registry, tag())),
      },
      {
        table: "authors",
        operation: "DELETE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeDelete(cl, svc(), await makeAuthor(svc(), registry, tag())),
      },
      {
        // Política "block delete": só a negação é observada; service_role fica de fora
        // para não destruir o admin sintético que sustenta o restante da suíte.
        table: "admin_users",
        operation: "DELETE",
        expected: [DENY, DENY, DENY, DENY],
        only: ["anon", "authenticated_non_admin", "authenticated_admin"],
        run: (_r, cl) => observeDelete(cl, svc(), fxAdminUser),
      },
    ]);
  });

  it("resumo: 67 verificações, sem divergência e sem resultado inconclusivo", () => {
    expect(matrixEntries()).toHaveLength(20 + 12 + 20 + 15);
    expect(mismatches()).toEqual([]);
  });
});
```

- [ ] **Step 10: Typecheck e lint (a execução real fica para a Task 8)**

Run: `npm run typecheck && npx eslint tests/integration tests/unit/ops && npm test 2>&1 | tail -6`
Expected: sem erros; contagem acumulada **B + 8 arquivos / B + 44 testes**. Sem `.env.test.local`, `npm run test:integration` continua abortando na guarda (D1 da Task 3).

- [ ] **Step 11: Commit**

```bash
git add tests/integration/support/cleanup.ts tests/integration/support/matrix.ts tests/integration/support/probes.ts tests/integration/support/fixtures.ts tests/integration/rls/baseline.test.ts tests/unit/ops/cleanupRegistry.test.ts tests/unit/ops/probesDecision.test.ts
git commit -m "test(ops): sondas de efeito real, limpeza verificada e matriz de RLS de 67 verificações

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

**Rollback:** `git revert HEAD`.

---

### Task 6: Runbook de migrations manuais e lint complementar de SQL somente leitura (RF-OPS-01, CHK-OPS-01)

**Files:**
- Create: `tests/integration/support/readOnlySql.ts`
- Create: `tests/unit/ops/readOnlySql.test.ts`
- Create: `tests/unit/ops/runbookTemplate.test.ts`
- Create: `docs/runbooks/README.md`
- Create: `docs/runbooks/migrations-manuais.md`
- Create: `docs/runbooks/migrations/REGISTRO.md`
- Create: `docs/runbooks/migrations/_template/README.md`
- Create: `docs/runbooks/migrations/_template/preflight.sql`
- Create: `docs/runbooks/migrations/_template/verify.sql`
- Create: `docs/runbooks/migrations/_template/rollback.sql`

**Interfaces:**
- Produces: `checkReadOnlySql(sql: string): { ok: true } | { ok: false; reason: string }`. Todas as entregas seguintes reutilizam este lint para os `preflight.sql`/`verify*.sql` das suas migrations.

**Limites do lint (documentados no código, no runbook e no template):** é uma análise estática por expressões regulares. **Não substitui** (1) a transação `BEGIN READ ONLY`, que é a garantia real, nem (2) a revisão humana do SQL. Ela é contornável por funções do usuário chamadas sem qualificação (via `search_path`), SQL dinâmico dentro de funções, extensões e efeitos externos que ela não conhece. Por isso ela falha fechada em construções suspeitas (`EXPLAIN ANALYZE`, funções com efeito externo, chamadas qualificadas fora de `pg_catalog`/`information_schema`) e **nunca** é motivo para dispensar a revisão.

- [ ] **Step 1: Testes do lint (falham)**

Create `tests/unit/ops/readOnlySql.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { checkReadOnlySql } from "../../integration/support/readOnlySql";

const wrap = (body: string) => `BEGIN READ ONLY;\n${body}\nROLLBACK;\n`;

describe("checkReadOnlySql (lint complementar de preflight e verify)", () => {
  it("aceita BEGIN READ ONLY, consultas SELECT e ROLLBACK", () => {
    expect(checkReadOnlySql(wrap("SELECT 1;"))).toEqual({ ok: true });
  });

  it("aceita WITH ... SELECT", () => {
    expect(checkReadOnlySql(wrap("WITH t AS (SELECT 1 AS n) SELECT n FROM t;"))).toEqual({ ok: true });
  });

  it("ignora comentários e literais que contenham palavras proibidas", () => {
    const sql = wrap("-- DELETE aqui é só comentário\nSELECT 'DROP TABLE x' AS texto; /* UPDATE */");
    expect(checkReadOnlySql(sql)).toEqual({ ok: true });
  });

  it("rejeita INSERT, UPDATE e DELETE", () => {
    for (const stmt of ["INSERT INTO t VALUES (1);", "UPDATE t SET a = 1;", "DELETE FROM t;"]) {
      expect(checkReadOnlySql(wrap(stmt)).ok).toBe(false);
    }
  });

  it("rejeita DDL e privilégios", () => {
    for (const stmt of [
      "CREATE TABLE t (a int);",
      "ALTER TABLE t ADD COLUMN b int;",
      "DROP POLICY p ON t;",
      "TRUNCATE t;",
      "GRANT SELECT ON t TO anon;",
      "REVOKE ALL ON t FROM anon;",
    ]) {
      expect(checkReadOnlySql(wrap(stmt)).ok).toBe(false);
    }
  });

  it("rejeita arquivo que não começa com BEGIN READ ONLY", () => {
    expect(checkReadOnlySql("SELECT 1;\nROLLBACK;").ok).toBe(false);
  });

  it("rejeita arquivo que não termina com ROLLBACK", () => {
    expect(checkReadOnlySql("BEGIN READ ONLY;\nSELECT 1;").ok).toBe(false);
    expect(checkReadOnlySql("BEGIN READ ONLY;\nSELECT 1;\nCOMMIT;").ok).toBe(false);
  });

  it("rejeita SELECT ... INTO, FOR UPDATE e CTE que escreve", () => {
    expect(checkReadOnlySql(wrap("SELECT a INTO novo FROM t;")).ok).toBe(false);
    expect(checkReadOnlySql(wrap("SELECT a FROM t FOR UPDATE;")).ok).toBe(false);
    expect(checkReadOnlySql(wrap("WITH d AS (DELETE FROM t RETURNING *) SELECT * FROM d;")).ok).toBe(false);
  });

  it("rejeita chamadas de funções com efeito colateral conhecido", () => {
    for (const call of [
      "SELECT cron.schedule('j', '* * * * *', 'select 1');",
      "SELECT set_config('a', 'b', false);",
      "SELECT nextval('s');",
      "SELECT pg_notify('c', 'p');",
      "SELECT net.http_post('https://x');",
    ]) {
      expect(checkReadOnlySql(wrap(call)).ok).toBe(false);
    }
  });

  it("rejeita COMMIT dentro do arquivo", () => {
    expect(checkReadOnlySql(wrap("SELECT 1;\nCOMMIT;")).ok).toBe(false);
  });

  it("rejeita EXPLAIN ANALYZE (executa a consulta), em qualquer forma", () => {
    expect(checkReadOnlySql(wrap("EXPLAIN ANALYZE SELECT 1;")).ok).toBe(false);
    expect(checkReadOnlySql(wrap("EXPLAIN (ANALYZE, BUFFERS) SELECT 1;")).ok).toBe(false);
  });

  it("aceita EXPLAIN simples e função qualificada de pg_catalog", () => {
    expect(checkReadOnlySql(wrap("EXPLAIN SELECT 1;"))).toEqual({ ok: true });
    expect(
      checkReadOnlySql(wrap("SELECT pg_catalog.has_table_privilege('anon', 'public.leads', 'SELECT');")),
    ).toEqual({ ok: true });
  });

  it("rejeita chamada qualificada fora de pg_catalog e information_schema (função do usuário ou extensão)", () => {
    expect(checkReadOnlySql(wrap("SELECT public.minha_funcao();")).ok).toBe(false);
    expect(checkReadOnlySql(wrap("SELECT cron.alter_job(1);")).ok).toBe(false);
  });

  it("rejeita funções com efeito externo ou de disponibilidade", () => {
    for (const call of ["SELECT pg_sleep(60);", "SELECT pg_read_file('/etc/passwd');", "SELECT http_get('https://x');"]) {
      expect(checkReadOnlySql(wrap(call)).ok).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/ops/readOnlySql.test.ts`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar o lint**

Create `tests/integration/support/readOnlySql.ts`:

```ts
// Lint COMPLEMENTAR para SQL de preflight e verify (RF-OPS-01).
//
// IMPORTANTE: é análise estática por expressões regulares. NÃO substitui:
//  1. a transação `BEGIN READ ONLY`, que é a garantia real de somente leitura;
//  2. a revisão humana do SQL.
// É contornável por funções do usuário chamadas sem qualificação (via
// search_path), por SQL dinâmico dentro de funções, por extensões e por efeitos
// externos que ela não conhece. Por isso falha fechado em construções suspeitas.

export type ReadOnlySqlResult = { ok: true } | { ok: false; reason: string };

const BLOCKED_WORDS =
  /\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|merge|call|copy|analyze|into|lock|vacuum|reindex|refresh|commit|savepoint|prepare|execute|do)\b/i;

const BLOCKED_LOCKING = /\bfor\s+(update|share|no\s+key)\b/i;

const BLOCKED_FUNCTIONS =
  /\b(cron\.schedule|cron\.unschedule|cron\.alter_job|net\.http_\w+|http_\w+|set_config|nextval|setval|pg_notify|pg_terminate_backend|pg_cancel_backend|pg_advisory_\w+|lo_\w+|dblink\w*|vault\.create_secret|vault\.update_secret|pg_reload_conf|pg_sleep\w*|pg_read_file|pg_read_binary_file|pg_ls_dir|pg_stat_file|pg_logical_emit_message|pg_create_restore_point)\s*\(/i;

// Chamada qualificada `schema.funcao(` fora do catálogo pode ser função do
// usuário ou de extensão com efeito colateral: exige revisão humana.
const QUALIFIED_CALL = /\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\s*\(/gi;
const SAFE_SCHEMAS = new Set(["pg_catalog", "information_schema"]);

function stripNoise(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"(?:[^"]|"")*"/g, '""');
}

function reject(reason: string): ReadOnlySqlResult {
  return { ok: false, reason };
}

export function checkReadOnlySql(sql: string): ReadOnlySqlResult {
  const statements = stripNoise(sql)
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  if (statements.length < 3) return reject("arquivo sem consultas");
  if (!/^begin\s+read\s+only$/i.test(statements[0])) return reject("deve começar com BEGIN READ ONLY");
  if (!/^rollback$/i.test(statements[statements.length - 1])) return reject("deve terminar com ROLLBACK");

  for (const statement of statements.slice(1, -1)) {
    const preview = statement.slice(0, 40);
    if (!/^(select|with|show|explain)\b/i.test(statement)) return reject(`instrução não permitida: ${preview}`);
    if (BLOCKED_WORDS.test(statement)) return reject(`palavra proibida em: ${preview}`);
    if (BLOCKED_LOCKING.test(statement)) return reject(`bloqueio de linhas em: ${preview}`);
    if (BLOCKED_FUNCTIONS.test(statement)) return reject(`função com efeito colateral em: ${preview}`);
    for (const match of statement.matchAll(QUALIFIED_CALL)) {
      if (!SAFE_SCHEMAS.has(match[1].toLowerCase())) {
        return reject(`chamada qualificada fora do catálogo (revisão humana): ${match[0]}`);
      }
    }
  }
  return { ok: true };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/ops/readOnlySql.test.ts`
Expected: 14 testes passam. Se algum caso falhar, ajuste a expressão regular correspondente (não afrouxe o teste).

- [ ] **Step 5: Teste do template do runbook (falha)**

Create `tests/unit/ops/runbookTemplate.test.ts`:

```ts
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkReadOnlySql } from "../../integration/support/readOnlySql";

// CHK-OPS-01 (parcial, automatizado): o template do runbook está completo e
// todo preflight/verify versionado em docs/runbooks/ passa no lint de SQL
// somente leitura. O lint é COMPLEMENTAR: não substitui BEGIN READ ONLY nem a
// revisão humana (ver readOnlySql.ts e migrations-manuais.md).
const runbooks = resolve(process.cwd(), "docs/runbooks");
const template = join(runbooks, "migrations/_template");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe("runbook de migrations manuais (RF-OPS-01)", () => {
  it("o template tem README, preflight, verify e rollback", () => {
    for (const file of ["README.md", "preflight.sql", "verify.sql", "rollback.sql"]) {
      expect(existsSync(join(template, file)), file).toBe(true);
    }
  });

  it("o template de preflight e de verify é somente leitura", () => {
    for (const file of ["preflight.sql", "verify.sql"]) {
      expect(checkReadOnlySql(readFileSync(join(template, file), "utf8")), file).toEqual({ ok: true });
    }
  });

  it("todo preflight*.sql e verify*.sql em docs/runbooks passa no lint", () => {
    const files = walk(runbooks).filter((f) => /[\\/](preflight|verify)[^\\/]*\.sql$/.test(f));
    expect(files.length).toBeGreaterThanOrEqual(2);
    for (const file of files) {
      expect(checkReadOnlySql(readFileSync(file, "utf8")), file).toEqual({ ok: true });
    }
  });
});
```

- [ ] **Step 6: Rodar e ver falhar**

Run: `npx vitest run tests/unit/ops/runbookTemplate.test.ts`
Expected: FAIL (a pasta `docs/runbooks` ainda não existe).

- [ ] **Step 7: Criar o template**

Create `docs/runbooks/migrations/_template/README.md`:

```markdown
# Migration NNN — <nome>

| Campo | Valor |
|---|---|
| Requisito(s) | RF-… |
| Decisão(ões) | DEC-… |
| Entrega | E… |
| Arquivo de aplicação (`apply`) | `supabase/migrations/NNN_<nome>.sql` (idempotente) |
| Depende de | NNN-… |
| Janela e impacto | … |
| Risco | … |
| Quem aplica | … |
| Quem autoriza | … |

## Autorização (preencher antes de aplicar em cada ambiente)

| Ambiente | Autorizado por | Data | Observação |
|---|---|---|---|
| Isolado (teste) | | | |
| Produção | | | |

## Ordem

1. `preflight.sql` (somente leitura, `BEGIN READ ONLY`) → estado esperado confirmado.
2. Revisão **humana** do `apply`, do `preflight`, do `verify` e do `rollback` por um segundo engenheiro. O lint automático de SQL é complementar e **não** substitui essa revisão nem a transação `READ ONLY`.
3. `apply` no ambiente isolado → `verify.sql` → testes de integração.
4. Autorização explícita → `apply` em produção → `verify.sql`.
5. Registro em `docs/runbooks/migrations/REGISTRO.md` e evidências anexadas.

## Evidências

Saídas de `preflight.sql` e `verify.sql` (sem segredos) e resultado dos testes.

## Reversão

Ver `rollback.sql`. Registre aqui se a reversão é **segura**, **parcial** ou **intencionalmente indisponível** (por exemplo, quando a migration remove uma permissão insegura: o rollback **não** recria a permissão). Declare também o **ponto de não retorno**.
```

Create `docs/runbooks/migrations/_template/preflight.sql`:

```sql
-- Preflight da migration NNN. SOMENTE LEITURA.
-- A garantia de somente leitura é a transação BEGIN READ ONLY abaixo. O lint
-- automático é complementar e não substitui a revisão humana.
-- Confirma o estado esperado ANTES de aplicar. Se qualquer resultado divergir
-- do esperado descrito nos comentários, NÃO aplique.
BEGIN READ ONLY;

-- 1. (exemplo) O objeto que a migration cria ainda não existe.
-- Esperado: 0 linhas.
SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'tabela_nova';

ROLLBACK;
```

Create `docs/runbooks/migrations/_template/verify.sql`:

```sql
-- Verificação pós-aplicação da migration NNN. SOMENTE LEITURA (BEGIN READ ONLY).
BEGIN READ ONLY;

-- 1. (exemplo) O objeto criado existe e tem RLS ativa.
-- Esperado: 1 linha com rowsecurity = true.
SELECT tablename, rowsecurity FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'tabela_nova';

ROLLBACK;
```

Create `docs/runbooks/migrations/_template/rollback.sql`:

```sql
-- Rollback da migration NNN.
--
-- REGRAS
--  * Escreva apenas desfazimentos seguros e idempotentes.
--  * Se a migration REMOVE uma permissão insegura (ex.: DEC-08, remoção de
--    leads_anon_insert), este arquivo NÃO recria a permissão. Documente aqui a
--    contingência segura (por exemplo, corrigir o consumidor) e deixe o
--    arquivo sem DDL.
--  * Rollback que apaga dados (tabelas com notas, consentimentos, tokens)
--    exige exportação prévia e autorização explícita; registre no README.
--  * Reverter o código vem ANTES de remover objetos de banco que ele usa.
--
-- BEGIN;
--   -- desfazimentos aqui
-- COMMIT;
```

- [ ] **Step 8: Criar o registro, o runbook e o índice**

Create `docs/runbooks/migrations/REGISTRO.md`:

```markdown
# Registro de migrations aplicadas manualmente

O histórico de migrations do Supabase **está vazio** (`supabase_migrations` não existe) porque tudo foi aplicado à mão (`docs/07-supabase-migration-baseline.md`). Este arquivo é o registro oficial a partir de agora.

Preencha **uma linha por aplicação por ambiente**, no mesmo PR da migration.

| Migration | Ambiente | Data | Aplicado por | Autorizado por | Preflight | Verify | Evidência |
|---|---|---|---|---|---|---|---|
| _(nenhuma aplicada ainda pelo novo processo)_ | | | | | | | |
```

Create `docs/runbooks/migrations-manuais.md`:

```markdown
# Runbook: migrations manuais

Aplica-se a toda migration de banco da evolução do painel (E0b em diante). Decisão de origem: DEC-02. O histórico remoto de migrations está vazio e o projeto não usa a CLI do Supabase nem Docker (`docs/07-supabase-migration-baseline.md`); este runbook é o processo oficial.

## Regras

1. **Nunca executar SQL remoto sem autorização explícita** do responsável pelo ambiente. Isso inclui consultas de catálogo em produção.
2. **Nunca** usar `supabase db push`, `supabase migration repair` nem `supabase db pull` (o baseline explica por que cada um é perigoso aqui).
3. **Ambiente isolado primeiro.** Toda migration é aplicada e verificada no ambiente isolado (`ambiente-supabase-isolado.md`) antes de produção.
4. **Idempotência.** O `apply` usa `IF NOT EXISTS` / `IF EXISTS` e pode rodar duas vezes sem efeito.
5. **Preflight e verify são somente leitura**: a garantia é a transação `BEGIN READ ONLY; ... ROLLBACK;`.
6. **O lint automático de SQL é complementar.** O teste `tests/unit/ops/runbookTemplate.test.ts` reprova `preflight*.sql` e `verify*.sql` com construções suspeitas, mas é análise estática por expressões regulares: **não substitui a transação `READ ONLY` nem a revisão humana**. Ele é contornável (função do usuário chamada sem qualificação, SQL dinâmico dentro de função, extensões, efeitos externos). Um SQL aprovado pelo lint ainda precisa de revisão por um segundo engenheiro.
7. **Rollback nunca recria permissão insegura** (DEC-08). Ver `migrations/_template/rollback.sql`.
8. **Ordem de implantação:** migration antes do código que a usa; na reversão, código antes da migration.
9. **Tabelas novas:** `ENABLE ROW LEVEL SECURITY` explícito, `REVOKE` explícito dos papéis sem necessidade e policies com `(select auth.uid())`. O `ensure_rls` existe só no remoto e não substitui isso.

## Artefatos por migration

| Artefato | Onde | Conteúdo |
|---|---|---|
| `apply` | `supabase/migrations/NNN_nome.sql` (numeração a partir de `012`) | DDL idempotente |
| README | `docs/runbooks/migrations/NNN-nome/README.md` | objetivo, ordem, risco, autorizações, evidências |
| `preflight.sql` | `docs/runbooks/migrations/NNN-nome/` | estado esperado, somente leitura |
| `verify.sql` | idem | resultado esperado, somente leitura |
| `rollback.sql` | idem | desfazimento seguro ou contingência documentada |

Para criar uma nova migration, copie `migrations/_template/` para `migrations/NNN-nome/`.

## Procedimento

1. **Preparar:** crie a pasta a partir do template e escreva o `apply` em `supabase/migrations/`.
2. **Preflight** no ambiente isolado: rode `preflight.sql`; confira o esperado.
3. **Revisão humana:** um segundo engenheiro revisa `apply`, `preflight`, `verify` e `rollback`.
4. **Aplicar no ambiente isolado:** execute o `apply` (SQL Editor do projeto de teste); rode `verify.sql`; rode `npm run test:integration` (e os testes da entrega).
5. **Autorização para produção:** o responsável preenche a tabela de autorização do README (quem, quando).
6. **Preflight em produção:** `preflight.sql` (somente leitura), com autorização. Se divergir, **pare**.
7. **Aplicar em produção:** `apply`, depois `verify.sql`. Em caso de falha, siga `rollback.sql` ou a contingência documentada.
8. **Registrar:** uma linha em `migrations/REGISTRO.md` por ambiente e anexar evidências ao PR.

## Quem faz o quê

| Papel | Responsabilidade |
|---|---|
| Autor | escreve `apply`, `preflight`, `verify`, `rollback` e README |
| Revisor | confere idempotência, privilégios, rollback e **lê o SQL** (o lint não basta) |
| Aplicador | executa os scripts no ambiente autorizado |
| Autorizador | libera cada ambiente por escrito (README) |

## Ponto de não retorno

Cada README declara o ponto a partir do qual o rollback deixa de ser seguro (por exemplo, depois de dados reais em tabelas novas). Depois dele, corrija para frente.
```

Create `docs/runbooks/README.md`:

```markdown
# Runbooks

| Documento | Finalidade |
|---|---|
| `migrations-manuais.md` | Processo de migrations manuais (preflight, aplicação, verificação, rollback) |
| `migrations/_template/` | Modelo para cada migration |
| `migrations/REGISTRO.md` | Registro das migrations aplicadas à mão |
| `ambiente-supabase-isolado.md` | Ambiente Supabase isolado para testes de RLS, verificação independente e uso da suíte `npm run test:integration` |
| `ambiente-teste/verify-baseline.sql` | Verificação somente leitura do snapshot histórico do ambiente isolado |
| `evidence/` | Evidências de conclusão de cada entrega (sem segredos) |

Especificação de origem: `docs/superpowers/specs/2026-10-13-*.md`.
```

- [ ] **Step 9: Rodar e ver passar**

Run: `npx vitest run tests/unit/ops/runbookTemplate.test.ts tests/unit/ops/readOnlySql.test.ts`
Expected: 3 + 14 testes passam. (O terceiro teste do runbook exige ≥ 2 arquivos `preflight|verify`: o template já fornece 2.)

- [ ] **Step 10: Suíte e lint**

Run: `npm test 2>&1 | tail -6 && npm run typecheck && npx eslint tests`
Expected: verde; contagem acumulada **B + 10 arquivos / B + 61 testes** (Task 6: +2 arquivos/+17 testes).

- [ ] **Step 11: Commit**

```bash
git add tests/integration/support/readOnlySql.ts tests/unit/ops/readOnlySql.test.ts tests/unit/ops/runbookTemplate.test.ts docs/runbooks
git commit -m "docs(runbook): migrations manuais, template e lint complementar de SQL somente leitura (RF-OPS-01)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

**Rollback:** `git revert HEAD`. **Gate C.**

---

### Task 7: Documento do ambiente Supabase isolado, verificação independente e `verify-baseline.sql` (RF-OPS-02, PV-15)

**Files:**
- Create: `docs/runbooks/ambiente-supabase-isolado.md`
- Create: `docs/runbooks/ambiente-teste/verify-baseline.sql`

**Interfaces:**
- Produces: o procedimento que o dono da infraestrutura executa (EX-1..EX-3), o marcador de ambiente exigido por `clients.ts`, o checklist de **verificação independente** (C14) e o `verify-baseline.sql` que a Task 8 roda no ambiente isolado. O teste da Task 6 cobre automaticamente o `verify-baseline.sql` (casa com `verify*.sql`).

- [ ] **Step 1: Criar `verify-baseline.sql`**

Create `docs/runbooks/ambiente-teste/verify-baseline.sql`:

```sql
-- Verificação do SNAPSHOT HISTÓRICO do AMBIENTE ISOLADO. SOMENTE LEITURA
-- (a garantia é BEGIN READ ONLY; o lint automático é complementar).
-- Rodar APENAS no projeto de teste (nunca em produção; a consulta equivalente
-- em produção pertence ao E0b.1 e exige autorização).
--
-- Os valores esperados refletem o snapshot histórico de docs/07-supabase-migration-baseline.md
-- (30/08) e os metadados de 13/10. Este arquivo NÃO afirma paridade atual com a
-- produção: ela só pode ser confirmada no preflight E0b.1. Divergência não é
-- erro por si só: registre-a na evidência.
BEGIN READ ONLY;

-- A. Seis tabelas com RLS ligado. Esperado: 6 linhas, rowsecurity = true.
SELECT tablename, rowsecurity FROM pg_catalog.pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('leads', 'posts', 'settings', 'admin_users', 'authors', 'admin_audit_logs')
ORDER BY tablename;

-- B. Policies por tabela.
-- Esperado: admin_users 4, authors 4, leads 3, posts 2, settings 2; admin_audit_logs AUSENTE (0 policies).
SELECT tablename, count(*) AS policies FROM pg_catalog.pg_policies
WHERE schemaname = 'public' GROUP BY tablename ORDER BY tablename;

-- C. A policy insegura do snapshot está reproduzida (R1). Esperado: 1.
SELECT count(*) AS leads_anon_insert FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'leads_anon_insert';

-- D. bootstrap_first_admin ausente, como no snapshot. Esperado: 0.
SELECT count(*) AS bootstrap_first_admin FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'bootstrap_first_admin';

-- E. Colunas de posts. Esperado: 34 (inclui faq_items e cta_block).
SELECT count(*) AS posts_columns FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'posts';

-- F. CHECK de status de posts inclui 'scheduled'.
SELECT pg_get_constraintdef(oid) AS definicao FROM pg_catalog.pg_constraint
WHERE conrelid = 'public.posts'::regclass AND conname = 'posts_status_check';

-- G. Índices de admin_audit_logs.
-- Esperado: apenas a chave primária e os dois índices da migration 010 (severity_idx e resource_idx);
-- sem created_at_idx, event_idx e actor_user_id_idx.
SELECT indexname FROM pg_catalog.pg_indexes
WHERE schemaname = 'public' AND tablename = 'admin_audit_logs' ORDER BY indexname;

-- H. Job de publicação agendada. Esperado: 1 linha ativa (requer pg_cron).
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'publish-scheduled-posts';

-- I. Extensões (informativo). O snapshot cita pg_cron e pgcrypto; pg_net: a verificar no E0b.1.
SELECT extname FROM pg_catalog.pg_extension
WHERE extname IN ('pg_cron', 'pgcrypto', 'pg_net') ORDER BY extname;

-- J. Objetos que, no snapshot, existem só no remoto (informativo).
-- Snapshot: ensure_rls = 1 e rls_auto_enable = 1. Se o projeto de teste não os tiver, registre a diferença.
SELECT
  (SELECT count(*) FROM pg_catalog.pg_event_trigger WHERE evtname = 'ensure_rls') AS ensure_rls,
  (SELECT count(*) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable') AS rls_auto_enable;

-- K. Marcador de ambiente de teste, exigido pela suíte. Esperado: 1 linha, com value = ref do projeto de teste.
SELECT key, value FROM public.settings WHERE key = '__rc2_isolated_test_env__';

ROLLBACK;
```

- [ ] **Step 2: Criar o documento do ambiente isolado**

Create `docs/runbooks/ambiente-supabase-isolado.md`:

```markdown
# Ambiente Supabase isolado para testes de RLS

Requisitos de origem: RF-OPS-02, DEC-16, BL-04, DEP-01, PV-15. **Este ambiente nunca contém dados de produção e nenhuma credencial de produção é usada com ele.**

## Limites da proteção anti-produção (leia antes de configurar)

1. A **allowlist é configurada pelo operador**: reduz o risco de apontar a suíte para o projeto errado, mas **não o elimina**.
2. As chaves no formato novo do Supabase (`sb_publishable_…`, `sb_secret_…`) são **opacas**: não carregam o ref do projeto e a guarda **não as inspeciona**. Só as chaves JWT legadas têm o claim `ref` conferido automaticamente.
3. Por isso existem quatro camadas: guarda estática (URL, ref, allowlist, ref de produção, `NEXT_PUBLIC_SUPABASE_URL`), o gateway do Supabase (chave de um projeto não vale contra a URL de outro), o **marcador de ambiente de teste** e a **verificação independente humana** abaixo.
4. Risco residual declarado: operador que lista produção na allowlist, omite o ref de produção **e** cria o marcador na produção. A verificação independente existe para cobrir esse caso.

## Opções (EX-1, decisão do dono da infraestrutura)

| Opção | Prós | Contras |
|---|---|---|
| **Projeto Supabase separado** (recomendada) | Isolamento total; não depende de plano pago nem de integração com GitHub (a confirmar) | Segundo projeto a administrar; limite de projetos do plano |
| Branch Supabase | Herda a estrutura do projeto | Pode exigir plano pago e integração com Git; a branch parte do estado de produção e não é independente |

Nome sugerido: `rc2-test-isolated`. Anote o **ref** do projeto (o trecho `<ref>` de `https://<ref>.supabase.co`). O ref **não** é segredo, mas não o grave em documentos do repositório.

## Snapshot histórico (EX-2)

O ambiente reproduz o **snapshot conhecido** do estado da produção, **incluindo o drift documentado**, e não aplica cegamente todas as migrations completas. É um **snapshot histórico** (`docs/07-supabase-migration-baseline.md` de 30/08 e metadados de 13/10), **sujeito à confirmação posterior no preflight E0b.1**. **Este ambiente não declara paridade atual com a produção.**

Aplicar no **SQL Editor do projeto de teste**, nesta ordem:

| # | Arquivo | Observação |
|---|---|---|
| 1 | `supabase/migrations/001_leads.sql` | inclui `leads_anon_insert` (estado do snapshot, R1) |
| 2 | `supabase/migrations/002_posts_settings.sql` | |
| 3 | `migrations/add_blog_seo_fields.sql` | **não** é idempotente; rodar uma só vez; precisa vir **antes** da 011 |
| 4 | `migrations/add_faq_cta_fields.sql` | |
| 5 | `supabase/migrations/003_admin_users.sql` | |
| 6 | `supabase/migrations/004_expand_settings.sql` | |
| 7 | `supabase/migrations/005_fix_admin_users_rls.sql` | |
| 8 | `supabase/migrations/006_add_postal_code_and_locality.sql` | |
| 9 | `supabase/migrations/007_create_authors.sql` | |
| 10 | **`009` parcial** | executar **somente** o `CREATE TABLE IF NOT EXISTS public.admin_audit_logs (...)` do início do arquivo. **Não** aplicar os `CREATE INDEX` (3), nem `ENABLE ROW LEVEL SECURITY` explícito, nem as 4 policies: no snapshot só a tabela existe, e a RLS veio do `ensure_rls`. Se o projeto de teste não ligar a RLS sozinho, execute `ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;` e registre o desvio. |
| 11 | `supabase/migrations/010_admin_audit_logs_hardening.sql` | integralmente (constraints e 2 índices) |
| 12 | `supabase/migrations/011_scheduled_publish_cron.sql` | exige a extensão `pg_cron` habilitada (Database → Extensions) |

**Não aplicar** `008_bootstrap_first_admin.sql` (no snapshot a função **não existe**).

### Marcador de ambiente de teste (obrigatório; exigido por `clients.ts`)

Depois do snapshot, no **SQL Editor do projeto de teste**, crie o marcador (o valor é o ref do projeto de teste):

```sql
INSERT INTO public.settings (key, value)
VALUES ('__rc2_isolated_test_env__', '<ref-de-teste>')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

A suíte lê esse valor com a chave `anon`, **antes** de criar o cliente `service_role`, e recusa a execução se ele não existir ou não for igual ao ref de teste. A tabela `settings` é de leitura pública; o ref não é segredo.

Depois, rodar `docs/runbooks/ambiente-teste/verify-baseline.sql` (somente leitura) e **arquivar a saída** na evidência. Divergências esperadas e documentáveis: itens I e J (extensões e objetos só do remoto), conforme o projeto de teste.

Perfil alternativo "estado dos arquivos" (aplicar `008` e `009` completos): só se a revisão decidir que o ambiente deve refletir os arquivos.

## Credenciais (EX-3)

1. No painel do projeto de teste, copie a URL, a chave `anon` e a chave `service_role` (ou as chaves equivalentes do novo formato).
2. Crie **`.env.test.local`** na raiz do repositório (ignorado pelo git) com:

```
RC2_TEST_SUPABASE_URL=https://<ref-de-teste>.supabase.co
RC2_TEST_PROJECT_REF=<ref-de-teste>
RC2_TEST_PROJECT_REF_ALLOWLIST=<ref-de-teste>
RC2_PRODUCTION_PROJECT_REF=<ref-de-producao>
RC2_TEST_SUPABASE_ANON_KEY=...
RC2_TEST_SUPABASE_SERVICE_ROLE_KEY=...
```

3. **Nunca** coloque essas chaves em `.env.local` (que pode apontar para produção), em commits, em logs ou em evidências.

## Verificação independente (C14, via padrão do gate da primeira execução real)

Feita pelo dono da infraestrutura **ou por uma segunda pessoa**, que não deve ser quem configurou o `.env.test.local`, e registrada na evidência (nome, data, resultado de cada item):

1. No painel, o nome e o **ref** do projeto de teste conferem com `RC2_TEST_PROJECT_REF`, e esse projeto **não** é o de produção (comparação com o projeto de produção conhecido pelo dono).
2. As chaves exibidas no painel **desse** projeto conferem com as do `.env.test.local` (compare os quatro últimos caracteres; **nunca** cole as chaves em lugar nenhum).
3. Se as chaves forem do formato novo (`sb_…`), registre que a guarda **não** as inspeciona e que este item é a única verificação direta delas.
4. `RC2_PRODUCTION_PROJECT_REF` contém o ref **real** de produção.
5. O `.env.test.local` não contém nenhuma URL de produção, e `RC2_TEST_PROJECT_REF_ALLOWLIST` contém somente refs de projetos de teste.
6. O marcador existe **no projeto de teste** com o valor correto (item K do `verify-baseline.sql`).

O gate da Task 8 tem duas vias: este checklist assinado por verificador independente **ou** a exceção `E0a-C14-EX01` com controles compensatórios (ver `docs/runbooks/ambiente-supabase-isolado.md`). Sem uma das duas, a Task 8 não começa; com qualquer uma, ainda é preciso a autorização expressa da execução.

## Como rodar

```bash
npm run test:integration
```

A guarda (`tests/integration/support/guard.ts`, `target.ts`) roda antes de qualquer conexão e é **reaplicada em cada criação de cliente e a cada acesso ao cliente `service_role`**. A suíte **não** faz parte do `npm test`.

Relatórios: `test-results/integration/rls-matrix-<nome>.{json,md}` (pasta ignorada pelo git). Anexe o `.md` à evidência.

## Dados sintéticos e limpeza

Os testes criam dois usuários (`e0a-<tag>-admin@example.test` e `…-member@example.test`) e linhas com prefixo `e0a-` ou `__e0a_`. **Cada recurso é registrado antes de ser criado**, removido no `afterAll` e inspecionado ao final; **qualquer falha de limpeza reprova a suíte**. Se uma execução for interrompida, remova pelo painel do **projeto de teste** os usuários `e0a-*` e as linhas com esses prefixos.

## Descarte

Apagar o projeto de teste no painel (ação do dono). Nada de produção depende dele.

## O que este ambiente não faz

Não recebe cópia de dados de produção; não serve de Preview da Vercel nesta entrega (EX-4 é opcional e posterior); **não substitui o preflight de produção** (E0b.1, autorizado à parte) e **não prova paridade atual** com a produção.
```

- [ ] **Step 3: Rodar o teste do runbook (cobre o novo `verify-baseline.sql`)**

Run: `npx vitest run tests/unit/ops/runbookTemplate.test.ts`
Expected: 3 testes passam (o terceiro agora varre 3 arquivos). Se o lint reprovar `verify-baseline.sql`, ajuste a consulta, não o lint.

- [ ] **Step 4: Commit**

```bash
git add docs/runbooks/ambiente-supabase-isolado.md docs/runbooks/ambiente-teste/verify-baseline.sql
git commit -m "docs(runbook): ambiente Supabase isolado, marcador, verificação independente e snapshot histórico

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

**Rollback:** `git revert HEAD`. **Gate D** (depois dele, solicitar EX-1..EX-3).

---

### Task 8: Execução no ambiente isolado e evidências (C4–C14)

**Files:**
- Create: `docs/runbooks/evidence/E0a-<AAAA-MM-DD>.md`

**Depende de:** Tasks 1–7 concluídas, EX-1, EX-2, EX-3 atendidas, **gate C14 resolvido** (via A ou via B, Step 1) **e** autorização expressa da execução real (AUT-EXEC). Sem elas, esta task não começa. A exceção E0a-C14-EX01 não libera a task isoladamente.

**Interfaces:** consome tudo; produz o arquivo de evidência com a tabela de critérios C1–C14.

- [ ] **Step 1: Confirmar pré-condições**

Run:
```bash
test -f .env.test.local && echo "env de teste presente" || echo "FALTA .env.test.local (EX-3)"
git check-ignore .env.test.local
```
Expected: `env de teste presente` e o caminho impresso por `check-ignore`. **Confirme com o dono** que EX-1 e EX-2 foram feitos (snapshot aplicado, marcador criado, `verify-baseline.sql` executado) e que o **gate C14** está resolvido por **uma** de duas vias: **(A)** checklist de verificação independente (C14) assinado por verificador independente; **ou (B)** exceção `E0a-C14-EX01` formalizada, com CC-1..CC-8 comprovados e CC-9a conforme (runbook, § "Exceção E0a-C14-EX01"). Sem A **ou** B, **pare**. A exceção, isoladamente, **não libera**. Mesmo com o gate resolvido, os Steps seguintes exigem **autorização expressa da execução real (AUT-EXEC)**, e o Step 3 exige ainda a **AUT-D5**, ambas separadas e específicas. Critério de liberação: `(A ∨ B) ∧ AUT-EXEC`.

- [ ] **Step 2: Arquivar a saída de `verify-baseline.sql`**

O dono (ou o executor com credenciais **só do projeto de teste**) roda `docs/runbooks/ambiente-teste/verify-baseline.sql` no SQL Editor **do projeto de teste** e cola o resultado na evidência (sem chaves). Compare com os valores esperados do arquivo e registre cada divergência (C7), **sem afirmar paridade com a produção**.

- [ ] **Step 3: Ensaio D5 (marcador ausente, ensaio real no ambiente isolado)**

D1–D4 são **offline** e já foram feitos na Task 3. D5 é **real**: toca o projeto de teste. Só pode ocorrer após (i) o gate C14 resolvido (A ou B), (ii) CC-1..CC-9a comprovados e (iii) **autorização específica do responsável para o D5 (AUT-D5)**, distinta da AUT-EXEC.

No **projeto de teste**: remova temporariamente o marcador (`DELETE FROM public.settings WHERE key = '__rc2_isolated_test_env__';`), rode a suíte **preservando o código de saída** (sem pipe para `tail`):
```bash
mkdir -p test-results/integration
LOG="test-results/integration/d5-$(date +%Y%m%dT%H%M%S).log"
npm run test:integration > "$LOG" 2>&1; STATUS=$?
echo "exit=$STATUS"; tail -8 "$LOG"
```
Aqui o esperado é `exit` diferente de 0 com `(missing_marker)`. Em seguida **restaure** o marcador com o `INSERT … ON CONFLICT` da Task 7 e **confirme a restauração** (item K do `verify-baseline.sql`: 1 linha, valor igual ao ref de teste). Se a restauração falhar ou não puder ser confirmada, **interrompa o processo**, não execute o Step 4 e aplique o procedimento de falha do Step 4.
Expected: falha com `(missing_marker)` **antes** de qualquer criação de usuário ou semeadura; nada novo no projeto de teste. Guarde a saída (C4).

- [ ] **Step 4: Rodar a suíte de integração**

Só com o gate C14 resolvido (A ou B) e a **AUT-EXEC**. Run, **preservando o código de saída** (não encadeie com `| tail`, que mascara o status do teste):
```bash
mkdir -p test-results/integration
LOG="test-results/integration/run-$(date +%Y%m%dT%H%M%S).log"
npm run test:integration > "$LOG" 2>&1; STATUS=$?
echo "exit=$STATUS"; tail -25 "$LOG"
```
Expected: `exit=0`, linha `[integração] alvo de teste validado`, 6 testes passam (1 de identidades + 4 grupos da matriz + 1 de resumo), sem erros e sem `Falha de limpeza`.

**Procedimento único diante de falha ou divergência relevante** (`exit` diferente de 0, `Falha de limpeza`, `error` ou divergência na matriz, `missing_marker` inesperado, falha de criação de usuário):
1. **Parar.** Não reexecutar.
2. **Registrar** o erro por categoria e código, nunca por mensagem bruta, sem chaves.
3. **Preservar** as evidências (`test-results/integration/`, incluindo o log, e a saída do terminal); não apagar.
4. **Inspecionar e tratar resíduos** somente no projeto de teste e apenas mediante a autorização aplicável (usuários `e0a-*`, `posts` com slug `e0a-*`, `settings` com chave `__e0a_*`, `authors` com nome `E0a author*`, `leads` com e-mail `e0a-*@example.test`). O marcador **deve** continuar existindo.
5. **Nova autorização expressa** antes de repetir qualquer teste real.

Causas prováveis, só para diagnóstico e sem ação automática: marcador ausente ou diferente do ref (Task 7); snapshot mal aplicado (`verify-baseline.sql`); chave que não é a `service_role` do projeto de teste.

Nota: a flag `--bail <n>` do Vitest pode ser usada como complemento, mas **não** é controle de interrupção. O cancelamento ocorre ao término de um teste que falhou, as divergências da matriz só reprovam o teste de resumo final e o efeito sobre o `afterAll` não foi verificado. O controle é o procedimento acima.

- [ ] **Step 5: Conferir a matriz (C6)**

Run: `head -12 test-results/integration/rls-matrix-baseline.md`
Expected: `Total: 67 · divergências: 0 · inconclusivos (error): 0`. Anexe o conteúdo completo à evidência.

- [ ] **Step 6: Confirmar a limpeza (C13)**

A suíte já executa a limpeza, a inspeção de resíduos e a inspeção de usuários e reprova em caso de falha. Além disso, **inspecione manualmente** o projeto de teste (painel ou SQL Editor do projeto de teste) e registre que não restaram: usuários de autenticação `e0a-*`, **linhas de `admin_users` associadas aos usuários sintéticos (e-mail `e0a-*@example.test`)**, linhas de `posts` com slug `e0a-*`, `settings` com chave `__e0a_*`, `authors` com nome `E0a author*` e `leads` com e-mail `e0a-*@example.test`. Esta lista cobre também resíduos de execuções anteriores interrompidas, que a reconciliação automática (restrita ao tag da execução) não alcança. O marcador **deve** continuar existindo. Apenas inspecione e registre; qualquer remoção exige a autorização aplicável (Step 4, item 4).

- [ ] **Step 7: Verificações do repositório (C1, C2, C3, C8–C12)**

Run:
```bash
npx vitest list --filesOnly | grep -c "security-page-sanitization.test.tsx"
npx vitest list --filesOnly | grep -c "tests/integration" || true
npx vitest run tests/unit/ops
npm run check
npm run audit:brand
git diff --stat main...HEAD
git rev-parse fix/tracking-p0-foundation
```
Varredura de segredos (**CC-9b**, depois da execução), **somente status**: use o procedimento do runbook (`docs/runbooks/ambiente-supabase-isolado.md`, § "Procedimento da varredura de segredos"), que carrega as funções `scan_secrets` e `scan_paths`. Nunca exiba correspondências, nunca use `-n`/`-o` fora das funções e **nunca** leia o `.env.test.local`. A exceção vale só para valores que contêm o marcador `FICTICIO` (fixtures de `tests/unit/ops`); não há exclusão por arquivo. Cobre o diff commitado, o diff não commitado (staged e unstaged), as evidências e os relatórios (arquivos não rastreados):
```bash
# (funções do runbook carregadas)
echo "diff commitado:";   git diff main...HEAD | scan_secrets
echo "diff não staged:";  git diff | scan_secrets
echo "diff staged:";      git diff --cached | scan_secrets
echo "evidências:";       scan_paths docs/runbooks/evidence/*.md
echo "relatórios:";       scan_paths test-results/integration/*
```
Expected: `1`; `0`; testes de `tests/unit/ops` verdes; `check` e `audit:brand` verdes; `--stat` somente com arquivos do mapa (nada em `src/`, `next.config.ts`, `supabase/migrations/`, PRD ou SDDs); `CONFORME` em todas as varreduras (qualquer `DIVERGENTE` ou `NÃO INSPECIONADO` bloqueia o commit da evidência); `bfc50d0c7a08221529b02cbc345f4a6c6dbd627c`. Contagem final de `npm test`: **B + 10 arquivos / B + 61 testes** (com B = 57/643 na ponta da tracking, isso daria 67/704).

- [ ] **Step 8: Escrever a evidência**

Create `docs/runbooks/evidence/E0a-<AAAA-MM-DD>.md` com:

```markdown
# Evidência de conclusão: E0a (Fundação)

Data: <AAAA-MM-DD> · Branch: feat/admin-e0a-foundation · Commit: <sha curto>

> O ambiente isolado reproduz um **snapshot histórico** do estado da produção. Este documento **não afirma paridade atual** com a produção; isso só pode ser confirmado no preflight E0b.1.

| Critério | Resultado | Evidência |
|---|---|---|
| C1 `.tsx` executa no `npm test` | ok/falha | saída de `vitest list --filesOnly` |
| C2 `tests/integration` fora do `npm test` | ok/falha | contagem 0 |
| C3 testes unitários de `tests/unit/ops` verdes | ok/falha | `vitest run tests/unit/ops` |
| C4 Guarda: D1–D4 (sem rede), testes do caminho de criação de clientes e D5 (marcador) | ok/falha | saídas coladas abaixo |
| C5 `test:integration` verde no ambiente isolado | ok/falha | saída |
| C6 Matriz: 67 verificações, 0 divergências, 0 inconclusivos | ok/falha | matriz anexa |
| C7 `verify-baseline.sql` e divergências do snapshot | ok/falha | saída e lista |
| C8 Runbook completo e lint (14 casos) com limites documentados | ok/falha | `runbookTemplate` e `readOnlySql` |
| C9 `npm run check` e `audit:brand` | ok/falha | saídas |
| C10 Diff restrito ao mapa | ok/falha | `git diff --stat` |
| C11 Sem segredos no diff nem aqui | ok/falha | grep |
| C12 Branch de tracking intacta | ok/falha | SHA |
| C13 Limpeza sem resíduo (automática e manual) | ok/falha | saída do afterAll e inspeção manual |
| C14 Verificação independente assinada (original) | **NÃO ATENDIDO** (fixo; só muda se o checklist abaixo for assinado por verificador independente) | checklist abaixo |
| C14-alt Exceção E0a-C14-EX01 com controles compensatórios | ok/falha | seção "Exceção C14" abaixo |

## Exceção C14 (E0a-C14-EX01)

| Campo | Valor |
|---|---|
| Resultado do C14 original | NÃO ATENDIDO |
| ID da exceção | E0a-C14-EX01, aprovada em 2026-10-16 |
| Aceitação do risco residual | registrada por <responsável> em <AAAA-MM-DD> |
| CC-1 a CC-8 e CC-9a (pré-execução) | uma linha por controle: ok/falha, data, evidência. Sem ref de produção, URL de produção nem chaves; CC-2 como "confirmado: sim/não" |
| CC-9b (pós-execução) | CONFORME/DIVERGENTE, data |
| Decisão do gate | `(A ∨ B)`: liberado / não liberado, motivo |
| AUT-D5 | <quem, quando>; registro separado |
| AUT-EXEC | <quem, quando>; registro separado |

## Verificação independente (C14)

Executada por: <nome> · Data: <AAAA-MM-DD> · (não foi quem configurou o `.env.test.local`: sim/não)

| Item | Resultado |
|---|---|
| 1. Ref e nome do projeto de teste conferem; não é o de produção | |
| 2. Chaves do painel conferem com o `.env.test.local` (últimos 4 caracteres) | |
| 3. Formato das chaves (JWT legado ou opaco `sb_…`); se opaco, registrado que a guarda não as inspeciona | |
| 4. `RC2_PRODUCTION_PROJECT_REF` contém o ref real de produção | |
| 5. Nenhuma URL de produção no `.env.test.local`; allowlist só com refs de teste | |
| 6. Marcador presente no projeto de teste com o valor correto | |

## Saídas dos ensaios D1–D5
(colar, sem chaves reais)

## Divergências do snapshot histórico
(colar)

## Observações e desvios
(registrar)
```

Preencha com as saídas reais; **nenhuma chave, URL de produção ou ref de produção** pode aparecer.

- [ ] **Step 9: Commit**

```bash
git add docs/runbooks/evidence
git commit -m "docs(runbook): evidência de conclusão da E0a

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

**Rollback:** `git revert HEAD` (a evidência é apenas documental). Se o ambiente isolado precisar ser refeito, apague e recrie o projeto de teste (ação do dono). **Gate E.**

---

### Task 9: Fechamento (CHANGELOG, PR, handoff para E0b)

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Entrada no CHANGELOG**

Em `CHANGELOG.md`, dentro de `## [Unreleased]` → `### Adicionado`, acrescentar:

```markdown
- Fundação E0a da evolução do painel: runbook de migrations manuais (`docs/runbooks/`), ambiente Supabase isolado documentado (snapshot histórico, marcador e verificação independente), suíte de integração de RLS com guarda anti-produção reaplicada na criação de clientes (`npm run test:integration`) e descoberta de testes `.tsx` no Vitest
```

- [ ] **Step 2: Validação final**

Run: `npm run check && npm run audit:brand`
Expected: verdes.

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs(changelog): registrar a fundação E0a

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Descrição do PR (rascunho; abrir somente com autorização)**

Conteúdo mínimo: escopo (RF-OPS-01..03), nada em produção, nada em `src/`, link para a evidência, lista C1–C14, riscos (ambiente isolado precisa existir para rodar a suíte; limites da proteção anti-produção; snapshot histórico sem paridade declarada), e a linha de rodapé `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 5: Handoff**

Registrar que E0b.1 (preflight remoto, **com autorização**), E0b.2, E0b.3 e E0b.4 reutilizam `guard.ts`, `target.ts`, `clients.ts`, `cleanup.ts`, `matrix.ts`, `probes.ts`, `fixtures.ts`, `readOnlySql.ts` e o template do runbook; que o primeiro caso de E0b.2 a acrescentar à matriz é "`anon` não consegue `INSERT` em `leads`" (usando `observeInsert`, que confirma o efeito pelo `service_role`); e que o E0b.1 deve confirmar ou corrigir o snapshot histórico.

**Rollback da fase:** ver "Procedimento de rollback da fase" e o rollback seguro da Task 0.

---

## Autoverificação do plano

**Cobertura da especificação**

| Requisito ou decisão | Task |
|---|---|
| RF-OPS-01 Runbook com preflight, apply, verify, rollback e README | 6 (template, runbook, registro, lint e seus limites), 7 (verify do snapshot) |
| RF-OPS-02 Ambiente isolado + suíte + guarda | 2, 3, 4, 5, 7, 8 |
| RF-OPS-03 Vitest `.tsx` | 1 |
| T-OPS-U01 Guarda | 2 e 3 (+ caminho de criação de clientes na 4; ensaios D1–D5 em 3 e 8) |
| T-OPS-U02 `npm test` executa `.tsx` | 1 |
| CHK-OPS-01 | 6 (automatizado parcial) + revisão manual no Gate C |
| DEC-01 branch de tracking preservada | 0 (branch a partir de `main`, rollback sem perda), C12 |
| DEC-02 migrations manuais, nunca SQL remoto sem autorização | 6 (runbook), 7 (SQL só no projeto de teste), Global Constraints |
| DEC-16 testes reais de RLS em ambiente isolado | 3, 4, 5, 8 |
| PV-15 ambiente isolado disponível | 7, 8 (EX-1) |
| DEP-01 | EX-1 |
| BL-04 (suíte verde) | 8 (C5, C6) |

**Correções do parecer de engenharia e onde estão**

| Correção | Onde |
|---|---|
| Rollback da Task 0 sem perda da baseline documental | Task 0 (backup externo, tag, bundle, hash, rollback seguro) |
| Guarda no caminho de criação de clientes e nas operações privilegiadas; sem `service_role` sem validação | Tasks 3 e 4 (`target.ts`, `clients.ts`, getter `service`, marcador, varreduras estáticas) |
| Limitação das chaves opacas e verificação independente; sem alegar eliminação do risco | "Limites da proteção anti-produção", Task 2 (comentário), Task 7 (checklist), C14 |
| `observeInsert` sem `insert().select()`; escrita separada da leitura; efeito confirmado por cliente privilegiado | Task 5 (`probes.ts`, `classifyWrite`) |
| UPDATE e DELETE com os quatro papéis e fixtures controladas; ausência de mudança nas negadas e mudança efetiva nas permitidas; zero linhas não é negação sem confirmação | Task 5 (matriz de 67; tabela de decisão testada em 9 casos) |
| Registro imediato de IDs, limpeza após falha parcial, erros de exclusão verificados, inspeção final, limpeza nunca silenciosa | Tasks 4 e 5 (`CleanupRegistry`, `cleanup()` retorna falhas, `afterAll` reprova), C13 |
| Lint de SQL mantido, com limites documentados e casos EXPLAIN ANALYZE e funções com efeito externo | Task 6 (14 casos; comentário, runbook, template) |
| Quantidade da matriz, expectativas, evidências e documentação atualizadas | 28 → **67**; Task 8 e critérios C1–C14 |
| Baseline como snapshot histórico, sem declarar paridade | Decisões confirmadas, Task 7, C7, evidência |

**Varredura de pendências:** nenhum "TBD", nenhum passo sem comando ou código; os únicos valores a preencher são os dados reais de evidência (Task 8, Step 8), por natureza produzidos na execução.

**Consistência de nomes:** `assertSafeTestTarget`, `readGuardInputFromEnv`, `IntegrationGuardError`, `GuardInput`, `loadTestEnvFile`, `getVerifiedTarget`, `VerifiedTarget`, `createRoleClients`, `RoleClients`, `TEST_ENV_MARKER_KEY`, `CleanupRegistry`, `recordEntry`, `matrixEntries`, `mismatches`, `writeMatrixReport`, `classifyWrite`, `observeSelect`, `observeInsert`, `observeUpdate`, `observeDelete`, `check`, `makePost`, `makeSetting`, `makeAuthor`, `makeLead`, `checkReadOnlySql` são usados com a mesma assinatura em todas as tasks.

**Contagens acumuladas de `npm test`, relativas à baseline `B`:** Task 1 `+2 arquivos/+4 testes`; Task 2 `+3/+19`; Task 3 `+5/+25`; Task 4 `+6/+31`; Task 5 `+8/+44`; Task 6 `+10/+61` (final). Na ponta de tracking (B = 57/643) o total final seria 67/704; em `main`, é `B + (10/61)`. A suíte de integração (fora do `npm test`) tem 6 testes e **67 verificações de matriz**.

**Pontos para a aprovação final:** (1) confirmar que o marcador de ambiente (leitura de uma linha pública com a chave `anon` no projeto de teste, antes de qualquer cliente privilegiado) é aceitável como camada adicional, dado que é a única leitura feita antes da verificação humana; (2) confirmar a exclusão de `service_role` do DELETE de `admin_users` na matriz (para não destruir o admin sintético); (3) EX-0 a EX-3.
