# Execução da AUT-EXEC-E1 no isolado — 19/10/2026

> **Duas execuções, uma por autorização.** Execução 1 (AUT-EXEC-E1): `exit=1`, suíte E1 não carregou (seções 1 a 7). Execução 2 (AUT-EXEC-E1-02, após a correção do alias em `c6a2b5c`): **`exit=0`**, 39 testes aprovados (seção 8). Seções 1 a 7 descrevem a execução 1 e ficam como registro histórico.

Branch `feat/admin-e1-cms`, HEAD de partida `e911ca0`. Sem refs, URLs, chaves nem valores de variáveis. O log bruto fica em `test-results/integration/` (ignorado pelo Git) e passou pela varredura de segredos antes de ser lido.

## Resultado em uma linha

**Execução realizada uma única vez. `exit=1`. A homologação da E1 NÃO foi obtida:** o arquivo `e1-posts-sort-at.test.ts` falhou **ao carregar**, antes de qualquer teste. Nenhum T-CMS-I01 a I08 foi executado. A regressão RLS (baseline e e0b-security) passou.

## 1. Autorização e natureza do registro

AUT-EXEC-E1 concedida expressamente pelo responsável em 19/10/2026 (declaração ao agente, sem assinatura). O campo de confirmação do documento `AUT-EXEC-E1-2026-10-19.md` não foi preenchido pelo agente. REV-1 e REV-2 foram confirmados pelo responsável **depois** da aplicação da 014; registrados como revisão posterior, **não** como anteriores ao apply.

## 2. Gate pré-execução (automatizado, sem rede, imediatamente antes)

| Controle | Resultado |
|---|---|
| Branch / HEAD / árvore | `feat/admin-e1-cms` / `e911ca0` / limpa |
| CC-5 (`tests/unit/ops`) | 16 arquivos, 133 testes aprovados |
| Guarda estática anti-produção | CONFORME |
| Seis variáveis `RC2_*` | 6/6 presentes (valores não exibidos) |
| Conflito com o shell (`env_conflict`) | Nenhum; 0 variáveis `RC2_*` no shell |
| `.env.test.local` | Ignorado e não rastreado: CONFORME |
| CC-9a | CONFORME (diff commitado, não staged, staged, evidências, documentos da 014); `test-results/` ignorado |
| Identidade do projeto isolado | CONFORME por declaração do responsável; a guarda confirmou ref, allowlist e claims; o marcador foi lido pelo harness só na execução |
| Escopo do comando | `vitest run --config vitest.integration.config.ts --bail 1`; só `tests/integration/**/*.test.ts` |

## 3. Execução

Comando (uma vez, sem repetição): `npm run test:integration -- --bail 1 > "$LOG" 2>&1`. **`exit=1`.**

| Arquivo | Resultado |
|---|---|
| `baseline.test.ts` | Aprovado |
| `e0b-security.test.ts` | Aprovado |
| `e1-posts-sort-at.test.ts` | **FALHOU AO CARREGAR** (0 testes coletados) |

Resumo do Vitest: **3 arquivos (1 reprovado, 2 aprovados); 9 testes executados, 9 aprovados, 0 reprovados.** Os 9 testes são só da regressão RLS. O guarda validou o alvo no `globalSetup` (mensagem com ref truncado, sem expor valor).

Erro (do log, sem dado sensível): `Cannot find package '@/lib/datetime' imported from src/lib/admin/postList.ts`, importado por `e1-posts-sort-at.test.ts:8`.

### Causa provável (evidência × hipótese)

- **Evidência:** `vitest.config.ts` define `alias: { "@": ./src }`; `vitest.integration.config.ts` **não define alias**. `src/lib/admin/postList.ts` importa `@/lib/datetime`. O teste E1 importa `postList.ts`. O erro é de resolução de módulo, não de banco nem de rede.
- **Por que passou despercebido:** os testes unitários usam o outro config (com alias), e o `tsc` resolve `@/` pelo `tsconfig`. Nenhuma verificação local carregava o arquivo E1 sob o config de integração.
- **Hipótese (não verificada):** adicionar o alias ao config de integração resolve o carregamento. **Não foi aplicado** (a correção altera o harness e uma nova execução exige nova autorização).

## 4. Matriz de homologação (só o observado)

| Item | Resultado |
|---|---|
| T-CMS-I01 | **NÃO EXECUTADO** (arquivo não carregou) |
| T-CMS-I02 | **NÃO EXECUTADO** |
| T-CMS-I03 / D2 | **NÃO EXECUTADO. D2 permanece ABERTA** |
| T-CMS-I04 | **NÃO EXECUTADO** |
| T-CMS-I05 / PV-14 | **NÃO EXECUTADO. PV-14 permanece PARCIAL** |
| T-CMS-I06 | **NÃO EXECUTADO** |
| T-CMS-I07 | **NÃO EXECUTADO** |
| T-CMS-I08 / D3 | **NÃO EXECUTADO. D3 permanece ABERTA** |
| PV-17 | **NÃO EXECUTADA. Permanece ABERTA** |
| BL-04 (regressão RLS) | **Aprovada**: baseline 67 verificações, 0 divergências, 0 inconclusivos; e0b-security 29 verificações, 0 divergências, 0 inconclusivos (relatórios `rls-matrix-*.md`). Natureza: automatizada |

## 5. Limpeza das fixtures

- Baseline e e0b-security: os dois arquivos terminaram aprovados. Como o `afterAll` reprova o arquivo se qualquer remoção ou inspeção falhar (`Falha de limpeza`), isso indica limpeza concluída pelo próprio harness. É **inferência do comportamento do harness**, não prova no banco.
- `e1-posts-sort-at.test.ts`: falhou na importação, antes do `beforeAll`; **não criou posts nem usuários** (por inspeção do código). Não é prova no banco.
- `--bail 1` não foi o fator: a falha foi de carregamento; a compatibilidade do bail com o `afterAll` **não foi exercitada** em falha de teste.
- **E1-CC-12 (consulta de resíduos nas sete tabelas): NÃO EXECUTADA.** Essas consultas são SQL a rodar no SQL Editor do isolado pelo responsável (`AUT-EXEC-E1-2026-10-19.md`, seção 7.2). O agente não tem editor de SQL do isolado e não usou nenhuma ferramenta de banco para não arriscar um projeto não identificado. Pendente.

## 6. Pós-execução

| Controle | Resultado |
|---|---|
| CC-9b (log, relatórios `rls-matrix-*`, evidências, diff) | CONFORME (saída só de status; limites do runbook valem) |
| `.env.test.local` | Ignorado e não rastreado |
| Git | Sem arquivos sensíveis rastreados; `test-results/` ignorado |

## 7. Pendências e bloqueios

1. T-CMS-I01 a I08, PV-17, D2, D3, PV-14: **não responderam**. Exigem corrigir o alias e **nova autorização** para nova execução (a AUT-EXEC-E1 era de uma execução).
2. E1-CC-12: consulta de resíduos pendente, a cargo do responsável.
3. E1 **não concluída**. Fase B **não liberada**. Incidente de credenciais **ABERTO**.

## 8. Execução 2 — AUT-EXEC-E1-02 (19/10/2026, após `c6a2b5c`)

AUT-EXEC-E1-02 concedida expressamente pelo responsável (declaração ao agente; sem documento próprio no repositório). Uma execução. A AUT-EXEC-E1 original não foi reutilizada.

**Gate imediato (automatizado, sem rede):** `feat/admin-e1-cms`, HEAD `c6a2b5c`, árvore limpa; CC-5: 16 arquivos, 133 testes; guarda estática CONFORME; 6/6 variáveis `RC2_*`; sem `env_conflict`; `.env.test.local` ignorado e não rastreado; CC-9a CONFORME; `test-results/` ignorado.

**Comando (uma vez):** `npm run test:integration -- --bail 1 > "$LOG" 2>&1`. **`exit=0`.**

**Resumo do Vitest (log, 57 s):** 3 arquivos aprovados (3/3); **39 testes aprovados, 0 reprovados, 0 ignorados**. O log não é verboso, então a divisão por teste abaixo é **por contagem, não por listagem**: 9 testes da regressão RLS (execução 1) + 7 testes únicos da E1 (I01, I02, I04, I05, I06, I07, I08) + 23 casos de I03 (`it.each` com 14 termos hostis + 9 de regex) = 39. A contagem fecha exatamente; se algum teste não tivesse rodado, não fecharia.

| Item | Resultado (observado) |
|---|---|
| T-CMS-I01 a I08 | **APROVADOS** (I03 com os 23 casos); ver ressalvas |
| D2 (busca literal, inclusive `*`) | I03 aprovado: os 23 termos devolveram só correspondências literais e o post-alvo. **Evidência técnica para encerrar D2**; a decisão de encerrar é do responsável. Limite: dataset sintético pequeno; a contingência 015 não é necessária segundo este resultado |
| D3 (página fora do intervalo) | I08 aprovado. O teste aceita `PGRST103` **ou** lista vazia; qual dos dois ocorreu **não foi observado** (log não verboso) |
| PV-17 (`sort_at` pelo PostgREST) | I01, I04, I06 e I07 aprovados: `sort_at` é lido, ordenado e rejeitado na escrita via PostgREST. **Evidência técnica de exposição** sem `NOTIFY` |
| PV-14 | **Continua PARCIAL**: I05 aprovado prova que o `UPDATE` equivalente ao cron recalcula `sort_at`; "o cron não revalida o cache do blog" segue por leitura |
| BL-04 (regressão RLS) | **Aprovada**: baseline e e0b-security passaram; relatórios com 67 e 29 verificações, 0 divergências, 0 inconclusivos |
| Setup / teardown / limpeza | Nenhuma falha de setup nem de limpeza (o `afterAll` reprovaria o arquivo). Inferência do harness; não é prova no banco |
| CC-9b (log, relatórios, evidências) | CONFORME |

**Resíduos (E1-CC-12).** Da execução 1: sete consultas feitas pelo responsável, todas com zero (declaração). **Da execução 2: consulta manual PENDENTE.** A execução criou dezenas de posts sintéticos; o agente não consultou o banco. O responsável deve rodar as sete consultas da seção 7.2 do `AUT-EXEC-E1-2026-10-19.md` no isolado. Não houve falha de limpeza que indique resíduo.

**Ressalvas.** (a) Resultados por teste vêm da contagem e do exit code, não de listagem. (b) `--bail 1` não foi acionado. (c) Não é revisão humana nem decisão de homologação: a E1 não é declarada concluída e a Fase B não é liberada por este registro. (d) Incidente de credenciais: ABERTO.

## 9. Consolidação das decisões e fechamento de D3 (19/10/2026, sem acesso a banco)

**Contrato (SDD `2026-10-13-admin-cms-listing-design.md`, seções 6.1 e 9):** página acima do total redireciona para a última página. PGRST103/416 e lista vazia são resultados possíveis da camada de dados; nenhum define sozinho o comportamento da interface. I08 (integração) só prova a camada de dados.

**Inspeção:** a implementação já cumpria o contrato; **nenhum código de produção foi alterado.** `listAdminPosts` devolve `ok:true` com `total` e `pageCount` tanto para lista vazia além do alcance quanto para PGRST103 (uma contagem `head` adicional, só nesse caso); falha vira `ok:false`. `posts/page.tsx` redireciona com `postListHref(params, { page: pageCount })` quando `total > 0 && page > pageCount`. A lacuna era de teste: o redirecionamento da página não tinha cobertura.

**Prova (automatizada, unitária, sem rede):** `tests/unit/admin/postsPagePagination.test.tsx`, 8 testes, renderiza a página real com a camada de dados real e cliente falso: page=99/3 páginas → `/admin/posts?page=3` (lista vazia e PGRST103); page=3 permanece; total=0 com page=5 (vazia e PGRST103) → estado vazio, sem redirecionar nem laço; `q`, `status`, `from`, `to` e `dir` preservados; erro real e PGRST103 seguido de falha na contagem → alerta de erro, não vazio. Ao desativar temporariamente a condição de redirecionamento, 3 testes falharam (sensibilidade confirmada); a alteração foi revertida.

| Decisão | Estado |
|---|---|
| D2 | Encerrada pelos 23 casos de I03 (execução 2) |
| PV-17 | Encerrada pelos testes PostgREST I01, I04, I06, I07 |
| BL-04 | Aprovada (67 + 29 verificações, 0 divergências) |
| E1-CC-12 (execução 2) | Sete consultas manuais, todas zero: **declaração do responsável** |
| D3 | **Encerrada**: contrato de redirecionamento provado pelos testes de página (unitários) e camada de dados por I08 e `listAdminPosts.test.ts`. Limite: qual resposta do PostgREST ocorre no isolado (PGRST103 ou lista vazia) segue não observada; ambas estão cobertas |
| PV-14 | **PARCIAL**: I05 prova o recálculo de `sort_at` no `UPDATE` equivalente ao cron; o cron real **não** foi executado nem observado |

E1 não declarada concluída; Fase B não liberada; incidente de credenciais ABERTO.

## 10. EX-4 — preparação do E2E isolado (20/10/2026, local, sem servidor, sem navegador, sem banco)

**Risco identificado no `playwright.config.ts` atual (NÃO seguro para o isolado):** o `webServer` roda `npm run dev` com `reuseExistingServer: !CI`. O Next lê `.env.local` (credenciais de produção) para toda variável que o processo não definiu, e o Playwright pode **reaproveitar um servidor já aberto na porta 3000** com esse ambiente. O spec antigo só dependia de `RC2_E2E_ISOLATED=1`, uma flag sem relação com o alvo real do servidor, e usava `ADMIN_EMAIL` do shell.

**Preparado (nada executado):**
- `playwright.isolated.config.ts` + `npm run test:e2e:isolated`: recusa sem `RC2_E2E_ISOLATED=1`; carrega só `.env.test.local`; chama a guarda existente (`getVerifiedTarget`: URL, ref, allowlist, ref de produção, claims, `env_conflict`) **antes** de montar o servidor; porta própria 3100, `reuseExistingServer: false`; ambiente do servidor **explícito** (`tests/e2e-support/isolatedEnv.ts`): Supabase do alvo verificado e valores neutros para todas as demais variáveis lidas em `src/` ou documentadas em `.env.example` (processo definido não é sobrescrito pelos `.env*`; teste unitário falha se surgir variável nova); sem trace, vídeo nem captura.
- `playwright.config.ts` padrão passa a ignorar `admin-posts-list.spec.ts`.
- Segunda camada no navegador: `installSupabaseGuard` aborta e reprova qualquer requisição a Supabase de outro projeto (sem registrar o host).
- `isolatedGlobalSetup.ts`: reusa `createRoleClients` (guarda + marcador `__rc2_isolated_test_env__` + service revalidado); cria admin sintético `e0a-<tag>-e2eadmin@example.test` (+ `admin_users`) e semeia 45 posts publicados (3 meses) e 1 rascunho com prefixo `e0a-e2e-<tag>`, cada id registrado **antes** de criar. Teardown (também com testes falhando): remove registrados, reconcilia por prefixo os posts criados pela interface, inspeciona resíduos e remove usuários; falha de limpeza reprova a execução.
- Spec: E01 a E05 sem depender de posts existentes (E02 usa o seed: 3 páginas; E04 usa o rascunho semeado; E05 cria/edita/visualiza/exclui sob o prefixo).

**Estado:** E01, E02, E03 (vazio filtrado, busca hostil), E04 e E05 **escritos, PENDENTES de execução**. E03 estado de erro e lista vazia sem filtros: cobertos só por teste unitário (`postsPagePagination.test.tsx`). Seletores de E04/E05 foram escritos por leitura do código e podem exigir ajuste na primeira execução.

**Validação local:** 15 testes novos (`tests/unit/ops/e2eIsolated.test.ts`; inclui recusa de produção, ref divergente, fora da allowlist e `NEXT_PUBLIC_SUPABASE_URL` do shell); `tests/unit/admin` + `ops`: 38 arquivos, 318 testes; `tsc` e eslint limpos; `playwright test --list` lista os 9 testes só no config isolado e recusa sem a flag. Nenhum servidor, navegador ou conexão.

**Limites.** (a) A proteção do servidor depende de definir todas as variáveis que o app lê; variável nova exige atualizar `isolatedEnv.ts` (o teste unitário avisa). (b) Morte forçada do processo (Ctrl+C, queda) não roda o teardown: reconciliar com as consultas da seção 7.2 de `AUT-EXEC-E1-2026-10-19.md`. (c) Uma execução real exige autorização específica, que não existe.

**Comando futuro (uma vez):** `RC2_E2E_ISOLATED=1 npm run test:e2e:isolated > "$LOG" 2>&1` (Git Bash; mesmo padrão de log e exit code da suíte de integração), com nenhum servidor na porta 3100 e `.env.test.local` presente.

## 11. Execução AUT-E2E-E1-01 (20/10/2026, uma vez, launcher isolado)

Autorização expressa do responsável (declaração ao agente). HEAD `011c711` (inclui `ba20af8`).

**Gate (automatizado, local):** branch correta e árvore limpa; CC-5 verde em execução normal (148 testes; uma falha inicial era timeout de 5 s no meu teste novo do launcher sob carga, corrigida com timeout de 30 s e commitada antes da execução; sob 5 execuções simultâneas artificiais até um teste antigo estoura 5 s, artefato do estresse); CC-9a CONFORME; guarda estática, 6/6 variáveis e ausência de `env_conflict` CONFORMES; `.env.test.local` ignorado/não rastreado; porta 3100 livre e nada na 3000 usado; Chromium já instalado. O marcador de isolamento é validado **dentro** do `globalSetup` (`createRoleClients`), depois que o Playwright sobe o servidor; não existe validação do marcador anterior ao servidor neste desenho.

**Comando (uma vez):** `RC2_E2E_ISOLATED=1 npm run test:e2e:isolated > test-results/e2e/run-….log`. **`exit=1`.**

**LOG PERDIDO (defeito do procedimento, não do isolamento).** O Playwright apaga o `outputDir` padrão `test-results/` ao iniciar; o log estava dentro dele e foi removido. Não há contagem oficial de aprovados/reprovados nem saída do teardown. Não foi repetida a execução.

**O que sobrou como evidência (CC-9b CONFORME sobre isso):** `test-results/.last-run.json` (`status: failed`, **2 testes reprovados**, nenhum outro listado) e o `error-context.md` dos dois. Como houve falhas reportadas, o spec não foi pulado (`canRun` verdadeiro) e o setup/semeadura funcionou. **Inferência, não observação:** os outros 7 testes não aparecem como reprovados; aprovação deles **não está comprovada** sem o log.

| Teste | Resultado | Causa (evidência do `error-context.md`) |
|---|---|---|
| T-CMS-E01 busca/status/período na URL | **REPROVADO** | Defeito do seletor: `getByLabel("De")` casou 5 elementos (modo estrito: "Ordem", seções de mês, botão do Next DevTools). Corrigir com `{ exact: true }`. Não indica defeito do CMS |
| T-CMS-E03 busca hostil | **REPROVADO** | `getByRole("alert")` achou 1 elemento: um `alert` vazio na raiz da página (anunciador de rota do Next); a página mostrava "Nenhum post encontrado", sem a mensagem de erro do app. Seletor amplo demais; filtrar pelo texto "Não foi possível carregar os posts" |
| E01 (2 outros), E02 (2), E03 vazio filtrado, E04, E05 | **INCONCLUSIVOS** | Sem log: não observados como aprovados nem reprovados em evidência. Não contam como comprovados |

**Teardown e limpeza: NÃO COMPROVADOS.** Sem o log não há evidência de que o teardown rodou nem do resultado da inspeção de resíduos do harness. Servidor encerrado (nada escutando na 3100; sem processo `next`). **Limpeza manual necessária:** o responsável deve rodar as sete consultas de resíduos (seção 7.2 de `AUT-EXEC-E1-2026-10-19.md`; `e0a-%` cobre `e0a-e2e-<tag>` e `e0a-<tag>-e2eadmin@example.test`). Se houver resíduo, nenhuma exclusão sem autorização.

**Correções necessárias antes de qualquer nova AUT (não aplicadas):** (1) seletor "De"/"Até"/"Status" com `exact`; (2) seletor de alerta de erro; (3) log fora de `test-results/` (ex.: `e2e-logs/`, ignorado pelo Git) ou `outputDir` próprio no config isolado; (4) conferir E04/E05, ainda não observados.

E1 não encerrada; Fase B não liberada; incidente de credenciais ABERTO.

## 12. Correções locais pós AUT-E2E-E1-01 (20/10/2026, sem Playwright, sem servidor, sem banco)

E1-CC-12 da AUT-E2E-E1-01: sete consultas READ ONLY feitas pelo responsável, todas zero (**declaração**).

| Ponto | Causa | Correção |
|---|---|---|
| E01 | `getByLabel("De")` é por substring e casou "Ordem", seções de mês e o botão do Next DevTools | Locators escopados em `getByRole("search", { name: "Filtrar posts" })` com `exact: true` para Status, De e Até; botão "Filtrar" exato. Sem índices. Componentes do CMS não alterados. Mesmo problema potencial em E04: `#status` (id estável) |
| E03 | `getByRole("alert")` pegou o `alert` vazio do anunciador de rota do Next | Falha real = `alert` com texto "Não foi possível carregar os posts" (page.tsx) ou "Algo deu errado ao abrir os posts" (error.tsx), contagem 0; mais: título "Posts" visível e lista ou "Nenhum post encontrado" visível. Critério não enfraquecido (agora também exige o estado legítimo). "período invertido" usa `getByRole("status")` filtrado por texto |
| Log | `test-results/` é apagado pelo Playwright ao iniciar | Destino `e2e-logs/` (ignorado pelo Git, fora do outputDir). Launcher e proteções não alterados |

**Validação local:** locators conferidos contra a marcação real do `PostsFilterBar` em teste unitário (`postsFilterBarLocators.test.tsx`: cada campo único dentro do `search`; spec sem os seletores genéricos); contrato do diretório de logs em `e2eIsolated.test.ts`; 39 arquivos, 321 testes; `tsc` e eslint limpos; `playwright test --list`: 9 testes (lista não inicia servidor, navegador nem setup). Nenhuma conexão com Supabase.

**Comando para a futura AUT-E2E-E1-02 (não executado):**
```bash
cd /d/Projetos/RC2-2026-e1
mkdir -p e2e-logs
LOG="e2e-logs/run-$(date +%Y%m%dT%H%M%S).log"
RC2_E2E_ISOLATED=1 npm run test:e2e:isolated > "$LOG" 2>&1
STATUS=$?
echo "exit=$STATUS"
```
Limites: E04/E05 seguem nunca observados (seletores de leitura de código); morte forçada do processo pula o teardown. EX-4 e E1 não concluídos; Fase B não liberada; incidente de credenciais ABERTO.
