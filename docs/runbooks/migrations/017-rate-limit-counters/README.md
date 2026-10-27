# Migration 017 — Rate limit atômico do contato (E0c)

**ESTADO: APLICADA E HOMOLOGADA NO ISOLADO (`pyhhygvdjokddphftuua`). PRODUÇÃO: NÃO APLICADA. NÃO EXECUTAR SQL EM PRODUÇÃO SEM AUTORIZAÇÃO ESPECÍFICA.**

| Campo | Valor |
|---|---|
| Requisito(s) | RF-SEG-05 |
| Decisão(ões) | DEC-12 (PV-21: incremento atômico sob concorrência) |
| Entrega | E0c |
| Arquivo de aplicação (`apply`) | `supabase/migrations/017_rate_limit_counters.sql` (primeira aplicação estrita: o guard aborta se algo já existir) |
| Depende de | `pg_cron` habilitado (criado pela 011) e papéis `anon`, `authenticated`, `service_role`. Independente de `leads` |
| Natureza | Aditiva: tabela, função e job novos. Não toca `leads`, notas, atividade nem o job da 011 |
| Janela e impacto | Sem lock em tabela existente; `lock_timeout` 5 s. Qualquer horário |
| Risco | Baixo no banco; **alto na ordem de publicação** (ver "Ordem com o código") |
| Quem aplica / autoriza | Operador, com autorização específica por ambiente |

## Autorização (preencher antes de aplicar em cada ambiente)

| Ambiente | Autorizado por | Data | Observação |
|---|---|---|---|
| Isolado (`pyhhygvdjokddphftuua`) | Operador (aplicação executada pelo ChatGPT no projeto isolado, por instrução do operador) | Ver "Homologação no isolado" | Aplicada uma única vez; não reaplicar (guard de primeira aplicação estrita) |
| Produção (`ymfcepzwhiemgkxzmbdm`) | | | **NÃO aplicada.** Exige autorização específica |

## Homologação no isolado

Projeto `pyhhygvdjokddphftuua`. Resultados informados pelo operador (a aplicação foi feita fora do agente); apenas os testes de integração foram executados e verificados neste fluxo.

| Etapa | Resultado | Fonte |
|---|---|---|
| `preflight.sql` | 8/8 `APROVADO` | informado |
| `017_rate_limit_counters.sql` (apply) | Sucesso | informado |
| `verify.sql` | 23/23 `APROVADO` | informado |
| Objetos | tabela `rate_limit_counters`, função `rate_limit_hit`, job `purge-rate-limit-counters` (`17 * * * *`); job `publish-scheduled-posts` preservado | informado |
| `tests/integration/rls/e0c-rate-limit.test.ts` | **9/9 aprovados** (alvo `pyhh…`, guarda anti-produção ativa) | executado pelo agente |
| Concorrência real (T-RL-I01) | contagens exatas sob N chamadas paralelas, sem repetição nem perda; exatamente `limit` permitidas no limite | executado pelo agente |
| Privilégios (T-RL-I03) | `anon`, `authenticated` não-admin e `authenticated` admin sem EXECUTE e sem acesso à tabela | executado pelo agente |
| Independência de `leads` (T-RL-I02) | excluir lead não altera o contador | executado pelo agente |
| Resíduos sintéticos | chaves `e0c-<tag>` removidas e inspeção de resíduos sem falha no `afterAll` | executado pelo agente |

**Produção (`ymfcepzwhiemgkxzmbdm`): a 017 NÃO foi aplicada.** O código da E0c não pode ir a Production antes de `RATE_LIMIT_PEPPER` e da migration (ver "Ordem com o código").

## O que a migration cria

| Objeto | Especificação |
|---|---|
| `public.rate_limit_counters` | `key text`, `window_start timestamptz`, `count integer`; PK `(key, window_start)`; RLS ligado **sem policies**; `REVOKE ALL` de `PUBLIC`, `anon`, `authenticated`; `service_role` com SELECT/INSERT/UPDATE/DELETE; índice em `window_start` |
| `public.rate_limit_hit(p_key, p_limit, p_window_seconds)` | `INSERT … ON CONFLICT (key, window_start) DO UPDATE`; devolve `allowed` (`count <= limit`), `count`, `reset_at`; `SECURITY INVOKER`; `search_path = pg_catalog, public`; `EXECUTE` só para `service_role`; valida `p_key` (1–200), `p_limit` (1–10000) e `p_window_seconds` (1–86400) com erro `22023` |
| Job `purge-rate-limit-counters` | `pg_cron`, `17 * * * *`: remove linhas com `window_start` há mais de 2 dias |

Janela **fixa** alinhada ao múltiplo de `p_window_seconds` desde a época. Borda conhecida e aceita: até 2× o limite numa virada de janela.

A migration termina com uma **autoverificação** dentro da transação (RLS, ausência de policies, privilégios de `anon`/`authenticated`/`PUBLIC`, `SECURITY INVOKER`, `search_path`, job). Qualquer divergência reverte tudo.

## Dados pessoais

As chaves são `contact:email:<hmac>` e `contact:ip:<hmac>`, com HMAC-SHA256 do valor normalizado e `RATE_LIMIT_PEPPER` (calculado na aplicação; **o pepper nunca chega ao banco**). É dado **pseudonimizado**, não anônimo (DEC-23), com retenção máxima de 2 dias. Deve constar na política de privacidade como contador antiabuso.

## Variável de ambiente nova (DEP-05) — NÃO configurada ainda

| Variável | Onde | Regra |
|---|---|---|
| `RATE_LIMIT_PEPPER` | Vercel **Preview** e **Production** (e `.env.local` de desenvolvimento, já gerada localmente) | Aleatória, **≥ 32 caracteres** (ex.: 32 bytes em hex), **distinta por ambiente**, sem reaproveitar valor de outro ambiente. Trocar o valor reinicia os contadores |

**Sem a variável (ou com menos de 32 caracteres) a rota de contato FECHA com HTTP 429 para todos.** Configurá-la é pré-requisito do deploy do código, não da migration.

## Ordem com o código (obrigatória)

1. Configurar `RATE_LIMIT_PEPPER` no ambiente (Preview e/ou Production).
2. **Preflight** (`preflight.sql`, READ ONLY). Esperado: `RESULTADO = APROVADO` (8 checks). Arquivar a saída.
3. **Apply** (`017_rate_limit_counters.sql`) no SQL Editor. Esperado: `Success. No rows returned`. Aborto = nada aplicado; **não contornar editando o SQL**.
4. **Verify** (`verify.sql`, READ ONLY). Esperado: `RESULTADO = APROVADO` (23 checks). Arquivar a saída.
5. Testes de integração no **isolado** (`tests/integration/rls/e0c-rate-limit.test.ts`, ver abaixo).
6. Só então: deploy do código da E0c no mesmo ambiente.

A migration vem **antes** do código: a rota nova fecha em 429 se `rate_limit_hit` não existir. O código antigo continua funcionando com a migration aplicada (ele ignora a tabela). Os contadores começam vazios no deploy: a janela efetivamente reinicia (risco aceito pelo SDD).

## Testes de integração (executados no isolado: 9/9)

```
npm run test:integration -- tests/integration/rls/e0c-rate-limit.test.ts
```

Cobrem T-RL-I01 (incremento atômico, N chamadas paralelas), T-RL-I02 (excluir/arquivar leads não altera contadores), T-RL-I03 (`anon`/`authenticated` sem EXECUTE e sem acesso à tabela) e a validação de parâmetros. Limpam apenas as chaves sintéticas que criaram. Não rodam contra produção (guarda anti-produção do harness).

## Verificação já feita (sem banco do projeto)

Aplicada em um Postgres 17 efêmero (PGlite) com stub de `cron`: migration, autoverificação, `verify.sql` (23/23), `preflight.sql`, privilégios por papel, validação de parâmetros, contagem 1..N, purga e rollback. **Não prova** concorrência real entre conexões nem o `pg_cron` do Supabase; por isso o passo 5 existe.

## Reversão

`rollback.sql` remove job, função e tabela. **Ponto de não retorno:** nenhum de dados de negócio (os contadores são descartáveis). **Ordem:** reverter o código da E0c **antes**; com a função removida e o código novo no ar, o contato fecha em 429. Depois do rollback, a rota anterior (que conta linhas de `leads`) volta a funcionar sozinha.

## Registro

O isolado já consta em `docs/runbooks/migrations/REGISTRO.md`. A linha de produção só entra **depois** de executada, com ambiente, autorização e resultado.
