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
