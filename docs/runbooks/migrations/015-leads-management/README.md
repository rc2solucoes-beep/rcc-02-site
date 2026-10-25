# Migration 015 — Gestão operacional de Leads (E2)

**ESTADO: RASCUNHO TÉCNICO. NÃO EXECUTAR SQL ANTES DE REVISÃO, PREFLIGHT E AUTORIZAÇÃO DO AMBIENTE ISOLADO.**

| Campo | Valor |
|---|---|
| Escopo | E2 — RF-LEAD-01..11 / SDD Leads Parte II |
| Apply único | `supabase/migrations/015_leads_management.sql` |
| Pré-requisitos do esquema | `public.leads`, `public.admin_users`, `auth.users`, `public.update_updated_at()`, extensões/funções existentes conferidas |
| Dependências de SQL | **012** (estado técnico exigido pelo guard da própria 015), 002 (`update_updated_at()`), 003/005 (`admin_users`). A **013 não é exigida pelo SQL** — ver *Dependências SQL × código* |
| Dependências de segurança | Testes baseline E0b no isolado; para produção, 012/013 têm **GOs próprios** e o PV-20 condiciona a 012 |
| Natureza | Aditiva sobre leads, cria notas/atividades e modifica os grants/RLS de leads |
| Alvos | Isolado primeiro; produção só após autorização própria |
| Revisão SQL | **PENDENTE** — revisão independente de apply/preflight/verify/contingência |
| Execução | **NÃO EXECUTADA** (criação documental e de código da F1) |

## Fases e evidência esperada

1. Confirmar o alvo e a baseline; executar `preflight.sql` em transação **READ ONLY** apenas após autorização expressa para aquele ambiente.
2. Comparar **definições**, não apenas nomes, de constraints, índices, policies, funções, schemas, triggers e grants; inspecionar dependências sobre `leads`. **NO-GO** se divergirem.
3. Revisão por segundo engenheiro da segurança: grants de coluna, RLS de todas as tabelas, autorização do `SECURITY DEFINER`, schema não exposto, `PUBLIC EXECUTE`, trigger ordenado e ausência de políticas legadas permissivas. Verificar acesso `anon` efetivamente revogado (012) antes de executar.
4. Aplicar no Supabase **isolado** manualmente com autorização explícita. Rodar `verify.sql` READ ONLY e suíte RLS com `T-LEAD-I01..I16`, incluindo PV-06 e PV-28.
5. Homologar o código E2 e regressão do formulário de contato no isolado. Preparar evidências de limpeza dos dados sintéticos.
6. Para produção: autorizar preflight próprio de 012/013/015, resolver PV-20, avaliar backup íntegro/recuperação, **autorizar cada apply separadamente**, verificar cada migration e só depois liberar eventual merge/deploy do código.
7. Registrar execução no `docs/runbooks/migrations/REGISTRO.md`. Não editar o registro como se a migration estivesse aplicada antes de executar.

## Regras NO-GO

- Qualquer intenção de executar o SQL sem revisão ou autorização.
- Resultado de preflight inesperado, incluindo policies legadas permissivas, trigger preexistente na tabela `leads`, divergência da função `update_updated_at()`, índices equivalentes com outros nomes ou schema externo driftado.
- `anon` ainda com acesso/INSERT em `leads`: o guard da 015 aborta, mas ele não substitui o GO da 012 nem o PV-20.
- Qualquer aborto do guard ou da autoverificação: não contornar editando o SQL; investigar o estado do alvo.
- Falhas em testes de grants por coluna (PRP-01/PV-06), no-op/ordem dos triggers (PV-28), integridade do histórico, FK cascade, concorrência e RLS.
- Banco de produção ou Preview como alvo de teste de escrita.
- Falta de cópia íntegra e recuperação adequada para produção.

## Guard 012 × 015 e primeira aplicação estrita

A 015 abre com dois blocos `DO` que **abortam a transação inteira** (nada é aplicado) antes de qualquer DDL, listando todos os problemas de uma vez:

- **Pré-requisitos:** papéis `anon`/`authenticated`, `public.leads`, `public.admin_users`, `auth.users`, `gen_random_uuid()` e `public.update_updated_at()` com a definição esperada (trigger, `SECURITY INVOKER`, `new.updated_at = now()`).
- **Gate da 012 (estado técnico):** sem a policy `leads_anon_insert`, sem policy que alcance `anon`/`public` e sem privilégio de tabela ou de coluna de `anon` em `leads`.
- **Preexistência:** policies desconhecidas em `leads`, qualquer trigger de usuário em `leads`, colunas/constraints/índices/tabelas/schema da 015 já existentes, as 12 colunas históricas, views/regras e FKs externas dependentes de `leads`, e o executor ser o dono de `public.leads`.

A migration **não é idempotente**: reaplicar numa base onde a 015 já existe aborta. Os `CREATE` não usam `IF NOT EXISTS`/`OR REPLACE` e não há `DROP TRIGGER`, como segunda barreira. Os únicos `DROP POLICY IF EXISTS` são os das quatro policies legadas de admin que a 015 substitui.

**O que o guard NÃO comprova.** Ele atesta apenas o estado técnico do banco. **Não comprova que inexistem consumidores externos da chave `anon`** (scripts, automações, n8n). Essa confirmação é o **PV-20**, aprovação humana obrigatória **antes da 012 em produção**. A 015 não altera nenhum grant de `anon` em `leads`: em produção, a ordem é 012 (após PV-20) → 015, cada uma com autorização própria.

Ao final, um terceiro bloco `DO` autoverifica na mesma transação (impressão das colunas históricas, `updated_at = created_at`, nenhuma atividade ou nota, três triggers, grants de `anon`/`authenticated` e acesso ao schema interno) e reverte tudo se algo divergir. Não expõe PII. Os limites de espera e a duração do lock estão separados na seção "Lock: espera, duração, limites e efeito no `/api/contact`"; se o lock não vier, repetir em janela de baixo tráfego.

## Lock: espera, duração, limites e efeito no `/api/contact`

Logo depois do Guard 1, a migration executa `LOCK TABLE public.leads IN ACCESS EXCLUSIVE MODE`, **antes** de ler o estado (Guard 2) e de capturar o fingerprint das colunas históricas. Sem isso, um INSERT do formulário público confirmado entre o fingerprint e o `ALTER TABLE` faria a autoverificação abortar por uma diferença legítima de contagem. A estratégia de lock **não muda** nesta documentação; abaixo está o que cada número significa e o que **não** garante.

| # | O que é | Valor / limite | O que acontece no limite |
|---|---|---|---|
| 1 | **Tempo máximo de espera para adquirir o lock** | `SET LOCAL lock_timeout = '5s'` | A espera termina com erro 55P03, a transação aborta e **nada** é aplicado. Só vale enquanto a migration **espera**; não limita nada depois que o lock é obtido |
| 2 | **Duração do lock depois de adquirido** | **Sem limite próprio.** O lock é mantido até o `COMMIT` (ou `ROLLBACK`) da transação | É a soma do tempo de Guard 2 + fingerprint, DDL, backfill, triggers, autoverificação e do `COMMIT`. Medida **somente** na validação isolada (abaixo); não há medição prévia |
| 3 | **Tempo limite total da transação** | **Não existe.** A migration não define `transaction_timeout` nem `idle_in_transaction_session_timeout`. O `statement_timeout = '60s'` vale **por comando**, não pela transação | Cada comando que passar de 60 s aborta a transação inteira. Mas vários comandos abaixo de 60 s podem somar mais que isso, e uma sessão que parar entre comandos (por exemplo, o operador colando blocos) mantém o lock até alguém dar `COMMIT`/`ROLLBACK` ou a conexão cair |
| 4 | **Efeito sobre `/api/contact`** | Os INSERTs em `public.leads` esperam o lock, na espera e na duração | O INSERT **não falha por causa da migration**: fica em fila e termina depois do `COMMIT`. Mas o tempo de resposta do formulário cresce pelo tempo da fila, e um timeout da função, do cliente ou do proxy antes disso pode devolver erro ao visitante. A rota de contato é quem insere em `leads` |

Consequências para a execução (sem alterar o SQL): executar com **um único comando de sessão** (arquivo inteiro, `ON_ERROR_STOP`), não colar em blocos; só em baixo tráfego; conferir antes que não há transação longa aberta sobre `leads` (isso é o que faz o item 1 estourar); se abortar por 55P03, repetir depois, sem alterar a migration. O lock também bloqueia **leituras** (ACCESS EXCLUSIVE): o painel admin e qualquer consulta a `leads` esperam igualmente.

**Como observar a duração real no isolado** (procedimento manual, autorizado à parte; nada disto foi executado). Em uma segunda sessão, **somente leitura**, e com dados sintéticos:

1. Antes: registrar `SHOW lock_timeout`, `SHOW statement_timeout`, `SHOW deadlock_timeout` e se `log_lock_waits` está ligado. Em um isolado descartável, ligar `log_lock_waits` para registrar as esperas acima de `deadlock_timeout`.
2. Durante: amostrar `pg_locks` (relação `public.leads`, `mode = 'AccessExclusiveLock'`, `granted`) e `pg_stat_activity` (`xact_start`, `state`, `wait_event_type`/`wait_event`) da sessão da migration. O instante em que o lock passa a `granted` até o fim da transação é a duração do item 2.
3. Efeito no formulário: com a janela de teste combinada, medir a latência de **um INSERT sintético** (domínio `example.test`) emitido durante a migration, com `\timing` no `psql`. Registrar também quantas tentativas esperaram além de 1 s (`log_lock_waits`).
4. Depois: registrar o tempo total do arquivo (saída de `\timing`) e anexar tudo à evidência da etapa "Apply isolado". O resultado vale para o volume do isolado; **não** é projeção para produção, e o volume do isolado precisa ser declarado junto.

Critério de decisão: a duração medida (item 2) e a latência do INSERT (item 3) são evidência para a decisão humana de janela, não aprovação automática. Se o item 2 for relevante diante do timeout do `/api/contact`, a janela deve ser de manutenção ou o desenho deve ser reavaliado em revisão própria.

## Locks em `auth.users` (FKs de `lead_notes` e `lead_activity`) — Gate B1

`lead_notes.author_id` e `lead_activity.actor_id` referenciam `auth.users(id)` (`015_leads_management.sql`, linhas 256 e 267). Criar uma tabela com FK exige `SHARE ROW EXCLUSIVE` na tabela **referenciada** (documentação do PostgreSQL, `ALTER TABLE ... ADD FOREIGN KEY`). Isso é esperado, **não foi observado** (nenhum SQL foi executado) e deve ser confirmado em `pg_locks` no isolado.

| Item | `public.leads` | `auth.users` |
|---|---|---|
| Modo do lock | `ACCESS EXCLUSIVE` (linha 81) | `SHARE ROW EXCLUSIVE` (esperado; confirmar) |
| Quando é pedido | Logo depois do Guard 1 | No `CREATE TABLE public.lead_notes` (e de novo, sem custo novo, no `lead_activity`), **depois** de `leads` já estar travada |
| **Espera** (tempo até obter) | `lock_timeout` 5 s | `lock_timeout` 5 s, **novamente**: o limite é por aquisição, não cumulativo |
| **Retenção** (tempo mantido) | Do instante da aquisição até o `COMMIT` | Do `CREATE TABLE lead_notes` até o `COMMIT`: **menor** que a de `leads`, mas sem limite próprio |
| Quem fica em fila | `INSERT`/`SELECT`/`UPDATE`/`DELETE` em `leads`: `/api/contact` e painel admin | Escritas em `auth.users` (`INSERT`/`UPDATE`/`DELETE`). Leituras comuns (`SELECT`, `SELECT ... FOR UPDATE`) **não** conflitam |

**Três durações distintas** (não confundir): (a) **espera** — quanto a migration aguarda cada lock, no máximo 5 s por aquisição; (b) **retenção** — quanto cada lock permanece depois de obtido, sem limite próprio; (c) **duração total da transação** — da primeira instrução ao `COMMIT`, sem limite total (`statement_timeout` é por comando). A retenção de `leads` é sempre ≥ à de `auth.users`.

**Impacto na autenticação.** Operações que gravam em `auth.users` — por exemplo, o `UPDATE` de `last_sign_in_at` em um login por senha, criação/convite/exclusão de usuário e alteração de e-mail ou senha — esperam na fila durante a retenção em `auth.users`. O login do próprio admin pode demorar ou, se estourar o timeout do serviço de autenticação, falhar; o visitante público do formulário não autentica e não é afetado por esse lock específico. Renovação de token e leitura de sessão **não** gravam em `auth.users` e, em princípio, não esperam (a confirmar na medição).

**Efeito composto (P1-01).** Se a migration precisar esperar por `auth.users` (uma escrita em curso), ela faz isso **segurando `ACCESS EXCLUSIVE` em `leads`**: o bloqueio de `leads` cresce até 5 s além da conta que o item 2 da seção anterior descreve. Se a espera estourar, a transação aborta com 55P03 (nada é aplicado) depois de ter bloqueado `leads` durante esse tempo. **A ordem dos locks não foi alterada nesta etapa**; reordenar (por exemplo, pedir `auth.users` antes de `leads`) é uma alteração de migration que exige decisão e revisão próprias, e só deve ser considerada se a medição abaixo reprovar o critério G3.

### Medição no isolado (somente leitura; autorizada à parte; NÃO EXECUTADA)

Em uma segunda sessão, com dados sintéticos e **sem** alterar nada. As consultas abaixo são modelos para o operador autorizado:

```sql
-- Executar UMA consulta por vez com \watch 0.5 (o \watch repete só a última consulta
-- do buffer; o bloco inteiro abaixo não vira laço). Ver pg_stat_activity de outras
-- sessões exige o papel pg_read_all_stats/pg_monitor (ou superusuário).
BEGIN READ ONLY;
SELECT now() AS amostra_em,
       l.pid,
       l.relation::regclass AS relacao,
       l.mode,
       l.granted,
       a.state,
       a.wait_event_type,
       a.wait_event,
       now() - a.xact_start  AS idade_da_transacao,
       now() - a.query_start AS idade_do_comando,
       pg_blocking_pids(l.pid) AS bloqueada_por
FROM pg_locks l
JOIN pg_stat_activity a ON a.pid = l.pid
WHERE l.locktype = 'relation'
  AND l.relation IN (to_regclass('public.leads'), to_regclass('auth.users'),
                     to_regclass('public.lead_notes'), to_regclass('public.lead_activity'))
  AND a.pid <> pg_backend_pid()
ORDER BY l.relation::regclass::text, l.granted DESC, l.pid;

-- Sessões em fila e quem as bloqueia (inclui o INSERT sintético e o login sintético).
SELECT a.pid, a.usename, a.state, a.wait_event_type, a.wait_event,
       now() - a.query_start AS esperando_ha,
       pg_blocking_pids(a.pid) AS bloqueada_por,
       left(a.query, 80) AS comando
FROM pg_stat_activity a
WHERE a.datname = current_database()
  AND a.pid <> pg_backend_pid()
  AND cardinality(pg_blocking_pids(a.pid)) > 0;
ROLLBACK;
```

Antes do apply, registrar também: `SHOW lock_timeout`, `SHOW statement_timeout`, `SHOW idle_in_transaction_session_timeout`, os `statement_timeout`/`lock_timeout` configurados para os papéis do PostgREST (`pg_roles.rolconfig` de `authenticator`, `anon`, `authenticated`, `service_role`) e o timeout do serviço de autenticação e da função do `/api/contact` na plataforma de hospedagem. Sem esses números, os critérios abaixo não podem ser avaliados. Medições obrigatórias:

1. **T_leads** — instante em que o lock de `leads` passa a `granted` até o fim da transação (`pg_locks` + `\timing` do arquivo).
2. **T_auth_espera** e **T_auth_retenção** — espera e retenção do lock em `auth.users` (mesmas fontes). Incluir um cenário com **escrita sintética concorrente** em `auth.users` (login de um usuário sintético em `example.test`) iniciada antes do apply, para exercitar a espera composta.
3. **L_insert** — latência de um `INSERT` sintético em `leads` emitido durante a janela, e **L_login** — latência de um login sintético emitido durante a janela. Registrar o pior caso de N ≥ 5 tentativas.
4. Existência de deadlock (`log_lock_waits`, log do servidor) e de sessões `idle in transaction` ligadas à migration: esperado **zero**.
5. Volume do isolado (leads, notas, atividades, usuários) declarado junto com os números. O resultado **não** é projeção para produção.

### Critérios operacionais GO/NO-GO (propostos; o responsável confirma os limites antes do Gate C)

Os limites numéricos abaixo são **propostas conservadoras**, não medições nem requisitos de negócio já aprovados. Se o timeout efetivo apurado em `Medições obrigatórias` for menor que o limite proposto, vale o menor.

| ID | Critério | GO | Revisão humana obrigatória | NO-GO |
|---|---|---|---|---|
| G1 | Execução completa | Sai com código 0; `verify.sql` = `APROVADO` | — | Qualquer outro resultado |
| G2 | T_leads (retenção em `leads`) | ≤ 10 s | > 10 s e ≤ 30 s: exige janela de manutenção combinada | > 30 s, ou cresce de forma não linear com o volume |
| G3 | Espera em `auth.users` e retenção composta | T_auth_espera ≤ 1 s e L_login ≤ 5 s com a escrita concorrente | T_auth_espera > 1 s: avaliar reordenar locks (revisão própria da migration) | 55P03 por espera em `auth.users`, ou login sintético falhou/expirou |
| G4 | Latência do formulário | L_insert ≤ T_leads + 1 s **e** < metade do menor timeout efetivo conhecido (função, PostgREST, cliente) | L_insert entre metade e 100% do menor timeout | L_insert ≥ menor timeout efetivo (lead perdido) |
| G5 | Higiene | Nenhum deadlock, nenhuma sessão ociosa em transação, `lock_timeout`/`statement_timeout` observados iguais aos da migration | Divergência explicada e documentada | Deadlock, transação ociosa retendo lock, ou timeout diferente do esperado sem explicação |
| G6 | Cobertura da medição | Todos os itens 1 a 5 acima registrados com o volume | — | Qualquer item ausente: nenhum GO é válido |

Esses critérios alimentam o **Gate C** (ver o relatório do Gate B1). Nenhum deles autoriza produção; a decisão de janela e de apply em produção continua humana e separada.

## Procedimento de execução da migration (modelo; NÃO EXECUTADO)

A migration controla a própria transação (`BEGIN` … `COMMIT`) e depende de `set_config(..., true)` (GUC local da transação) para levar o fingerprint do Guard 2 até a autoverificação. Por isso:

- Use **uma única sessão PostgreSQL** (conexão direta ou pooler em modo de **sessão**; **evitar** o modo de transação do pooler: dentro de um `BEGIN` explícito a conexão é mantida, mas o risco real é o arquivo chegar em partes fora de uma transação e o GUC local do fingerprint se perder) e envie o **arquivo integral** de uma vez com `-f`. **Não** cole em blocos, **não** use `-c` com trechos, **não** use o editor SQL da interface web e **não** use `--single-transaction`/`-1` (aninharia o `BEGIN` do arquivo e o `COMMIT` interno encerraria a transação externa).
- Interrompa no primeiro erro: `-v ON_ERROR_STOP=1`. Sem isso o `psql` continua depois de um erro e a sessão ficaria em transação abortada executando comandos que falham em cascata. Com a opção, o `psql` termina com código diferente de 0 e o encerramento da sessão desfaz a transação aberta.
- Ignore o `~/.psqlrc` (`-X`) e use um `PGOPTIONS` limpo; não defina `lock_timeout` ou `statement_timeout` por fora: a migration os define com `SET LOCAL`.

Modelo (os valores entre `<>` são do operador; credenciais vêm do ambiente, nunca do comando):

```bash
# Alvo: SOMENTE o Supabase isolado autorizado. Conferir o alvo antes (ref de teste, marcador).
psql "$ISOLATED_DB_URL" -X -v ON_ERROR_STOP=1 \
  -c '\timing on' \
  -f supabase/migrations/015_leads_management.sql 2>&1 | tee "apply-015-$(date +%Y%m%dT%H%M%S).log"
STATUS=${PIPESTATUS[0]}   # o código do psql, não o do tee
echo "psql_exit=$STATUS"
```

Regras de leitura: `psql_exit=0` **e** ausência de `ERROR`/`ROLLBACK` no log é o único sucesso; qualquer outro resultado é NO-GO (não repetir automaticamente, não editar o SQL). Em seguida, e só então, rodar `verify.sql` pelo mesmo mecanismo (`-X -v ON_ERROR_STOP=1 -f`) e exigir a linha `RESULTADO = APROVADO`. Este procedimento é **documentação**: não foi executado e não autoriza execução.

## Limpeza das fixtures sintéticas da fase `pre015` (se a `post015` não for concluída)

A fase `pre015` (`e2-leads-pre015.test.ts`) insere leads históricos sintéticos no isolado e grava `test-results/integration/e2-legacy-seed.json`; a fase `post015` os usa no I07 e os remove. Se a `post015` **não** for concluída (a 015 não foi aplicada, abortou ou a execução foi interrompida), os leads permanecem. Procedimento (só no isolado, só com autorização; nada executado):

1. Conferir o alvo (ref/marcador de teste) e que o manifesto existe. **Não** usar o filtro por padrão de e-mail como único critério.
2. Conferir os leads, em transação `READ ONLY`, pelos **ids do manifesto** e pelas marcas sintéticas, e comparar a contagem com `seeded` no manifesto:

```sql
BEGIN READ ONLY;
SELECT count(*) FROM public.leads
WHERE id IN ('<ids do manifesto>')
  AND source = 'e2-legacy-seed'
  AND email LIKE 'e2-legacy-%@example.test';
ROLLBACK;
```

3. Se a contagem for igual à do manifesto, remover pelo mesmo predicado (ids + `source` + e-mail), com autorização de escrita própria e transação explícita, e conferir que a contagem restante é 0. Se for diferente, **parar**: há linha ausente ou estranha; não apagar por aproximação.
4. Se a 015 já foi aplicada, `lead_notes` e `lead_activity` ligados a esses leads são removidos por `ON DELETE CASCADE`; conferir também as contagens dessas tabelas para os ids removidos.
5. Remover o manifesto local. Registrar a limpeza (contagens antes/depois) na evidência. Usuários de teste `e0a-*@example.test` são tratados pelo registro de limpeza do harness, não por este procedimento.

## Normalização de `next_action`: `btrim` (PostgreSQL) × `trim()` (JavaScript)

No banco (`015_leads_management.sql:352`), a normalização é `nullif(btrim(next_action), '')`. `btrim(texto)` remove **apenas espaços ASCII (U+0020)** nas pontas; **não** remove tabulação, quebra de linha, `\r`, espaço sem quebra (U+00A0) nem outros espaços Unicode. O `String.prototype.trim()` do JavaScript remove **todos** esses (tabulação, quebras, U+00A0, U+FEFF e demais espaços Unicode). Consequência: o mesmo texto pode ser "vazio" para o JavaScript e **não vazio** para o banco (por exemplo, `"\t"`), e um comprimento calculado após `trim()` pode diferir do medido pelo CHECK.

Requisito para a futura action da E2 (**não implementada nesta etapa**): aplicar a **mesma** regra do banco antes de enviar — remover somente U+0020 das pontas (por exemplo, `value.replace(/^ +| +$/g, "")`) e tratar `""` como `null` — ou, se a UX exigir `trim()` completo, validar explicitamente que o valor resultante continua satisfazendo o CHECK e o teste I12 (sem mudança real). A divergência não deve ser resolvida alterando só um lado sem teste. Entrada com apenas tabulação ou quebra de linha, se enviada sem tratamento, é gravada como texto (não vira `NULL`) e conta como mudança real.

## `LeadRecord` e o estado do esquema

`LeadRecord` (`src/lib/types/lead.ts`) descreve a tabela `public.leads` **depois** da migration 015: os campos de gestão (`status`, `status_updated_at`, `next_action`, `next_action_at`, `archived_at`, `updated_at`) só existem no banco depois dela. Antes da 015 (inclusive em produção hoje), o tipo declara colunas inexistentes. `src/app/admin/(protected)/leads/page.tsx` ainda faz `select("*")` e converte o resultado para `LeadRecord[]`; o comportamento da página **não** foi alterado e ela não lê os campos novos, então a divergência é inerte hoje. Regra para o código E2: não ler nem exibir os campos de gestão antes de a 015 estar aplicada e verificada no ambiente correspondente; a ordem de rollout é banco (012 → 015) e só depois o código que depende do tipo completo.

## Pendências que continuam para o isolado (Gate B1)

| Pendência | Situação |
|---|---|
| P2-04 — formatos textuais dos catálogos PostgreSQL (`pg_get_*def`, `format_type`, `indexdef`) usados pelo `verify.sql` | Não verificável estaticamente; ajuste revisado no primeiro uso. Falha segura |
| P2-07 — testes unitários/estáticos são análise de texto (regex) | Não provam sintaxe nem comportamento em PostgreSQL; nenhum substitui o parse da migration |
| P2-08 — `rc2.e2_containment_authorized` é um GUC declarado pelo próprio executor | **Não é controle de segurança**: só atrito contra execução acidental; qualquer derivado do `containment.sql` exige revisão independente |
| Sonda de exposição de `rc2_internal` (I11) | Escrita para esperar `PGRST106` (schema fora de `db-schemas`) via `.schema("rc2_internal")`; o código real devolvido pelo PostgREST não foi observado. Se divergir, ajustar a sonda **sem** relaxar a exigência de erro de schema. Conferir também manualmente a lista de schemas expostos no painel/config da API |
| M-1 a M-5 — cenários manuais | PENDENTES; nenhum executado |
| Build e testes de integração | PENDENTES; nenhum executado |

## Autoverificação da função `SECURITY DEFINER`

O bloco final confere, com falha explícita e **sem nenhum `GRANT` para contornar**: o dono da função de atividade é o executor e o dono de `lead_activity` (sem FORCE RLS); esse dono executa `auth.uid()`, tem USAGE em `auth` e `public` e INSERT em `lead_activity`; a função é `SECURITY DEFINER` com `search_path` vazio e a `leads_before_update()` é `INVOKER` com `search_path` vazio. NULL conta como falha.

## Backfill de `updated_at`

- `updated_at` nasce nulável, **sem default**; `UPDATE public.leads SET updated_at = created_at` roda **antes** de existir qualquer trigger em `leads` (não gera atividade e não passa por `update_updated_at()`); só então vêm `SET DEFAULT now()` e `SET NOT NULL`.
- **Semântica:** em lead histórico, `updated_at` = momento da criação, a única data conhecida. Não é "data da migration". Para o lock otimista isso é indiferente (o valor é opaco, com microssegundos).
- `status_updated_at` permanece `NULL` nos históricos (nenhuma transição ocorreu). Status `new`, `next_action`, `next_action_at` e `archived_at` ficam no padrão.
- Nenhuma coluna histórica é escrita; a autoverificação compara a impressão (contagem + hash) antes e depois.

## Constraint de `lead_activity`

`lead_activity_status_values_check` agora rejeita explicitamente NULL: `status_changed` exige `from_value` e `to_value` **não nulos e válidos**; os demais eventos exigem ambos **nulos**. (Um CHECK que avalia NULL é tratado como satisfeito, e a versão anterior aceitava `status_changed` sem valores.) Isso alinha o banco ao tipo `LeadActivity` de `src/lib/types/lead.ts`.

## Dependências SQL × código

| Dependência | SQL da 015 | Código E2 |
|---|---|---|
| 012 (anon sem acesso a `leads`) | **Exigida** (guard) | Exigida |
| 013 (SELECT de admin em `admin_audit_logs`) | Não exigida | Necessária para ler os eventos de auditoria em `/admin/security` |
| 014 (`posts.sort_at`) | Independente | Independente |
| 002 `update_updated_at()`, 003/005 `admin_users` | Exigidas (guard) | — |

## Testes de integração E2 (ESCRITOS, NÃO EXECUTADOS)

Numeração **oficial** do SDD (T-LEAD-I01 a I16), sem renumerar. Arquivos: `tests/integration/rls/e2-leads.test.ts` (fase pós-015), `e2-leads-pre015.test.ts` (semeadura da fase pré-015) e `tests/integration/support/e2Fixtures.ts`. Só dados sintéticos (`example.test`). O harness fala só PostgREST: **nenhum teste executa SQL** nem aplica a migration.

| ID | Cobertura |
|---|---|
| I01 / I02 | `anon` e `authenticated` não-admin sem acesso às três tabelas (SELECT, INSERT, UPDATE, DELETE) |
| I03 | Admin lê e atualiza `leads`; colunas fora da PRP-01 rejeitadas (**PV-06**, lado negativo) |
| I04 | Admin exclui pela sessão (sucesso só com 1 linha); não-admin não exclui |
| I05 | Notas: `author_id` alheio, nulo e não-admin negados; UPDATE e DELETE negados |
| I06 | CASCADE ao excluir lead, com RLS ativa (**PV-05**) |
| I07 | Backfill sobre linhas existentes (duas fases, abaixo) |
| I08 | Atividade para status, próxima ação, arquivar e restaurar; o trigger grava `updated_at`/`status_updated_at` sem privilégio do admin (**PV-06**, lado positivo) |
| I09 | Constraints e nulabilidade, incluindo NULL e combinações inválidas em `lead_activity_status_values_check` |
| I10 | Remover o usuário zera `author_id`/`actor_id` e preserva nota e histórico |
| I11 | Admin não escreve em `lead_activity` pela API; só o trigger escreve |
| I12 | UPDATE sem mudança real (mesmo valor, `''`/espaços → NULL, mesmo texto) não gera atividade nem altera `updated_at`/`status_updated_at`. Caso distinto: `archived_at` de um não nulo para **outro** não nulo é mudança real — atualiza `updated_at`, não altera `status_updated_at`, não gera `archived`/`restored` (esclarecido no SDD §9.3 na A5) |
| I13 | `next_action` e `next_action_at` juntos geram um único evento |
| I14 | Concorrência com `expectedUpdatedAt` opaco; no-op não causa conflito falso |
| I15 | Fases dos triggers (**PV-28**): WHEN após a normalização, service_role, `update_updated_at()` em `posts`/`settings` |
| I16 | Admin não grava `updated_at` nem `status_updated_at` diretamente |

Também: regressão do formulário público no nível do banco (INSERT da rota e consulta de rate limit) e a pré-condição técnica do guard (`anon` barrado por privilégio, 42501).

**Como executar (somente no isolado, com autorização expressa; nunca no trabalho local):** nada roda sem `RC2_E2_PHASE`.

1. Antes da 015: `RC2_E2_PHASE=pre015` semeia leads históricos sintéticos e grava o manifesto (`test-results/integration/e2-legacy-seed.json`).
2. Preflight, apply e verify da 015 pelo operador, manualmente.
3. Depois: `RC2_E2_PHASE=post015` roda I01 a I16; o I07 compara com o manifesto e remove os leads semeados.

**Não automatizável pelo harness (exige executor de SQL):** abortar a 015 contra alvo com `leads_anon_insert` ou privilégio de `anon`, e abortar na reaplicação. Ficam como `it.todo` explícitos e como procedimento manual no isolado: reexecutar a 015 já aplicada deve abortar com a lista de objetos existentes e o `verify.sql` seguir `APROVADO`; o caso da 012 deve ser feito em banco descartável sem a 012, **nunca** reabrindo `anon` no isolado.

### Suítes legadas e fase explícita (A5)

A 015 muda exatamente **duas** linhas da matriz de `leads` das suítes anteriores. Em vez de apagar asserções ou detectar permissões para escolher a expectativa, `baseline.test.ts` e `e0b-security.test.ts` exigem a variável `RC2_E2_PHASE` (`pre015` ou `post015`) e **falham** se ela faltar ou tiver outro valor (`requireLegacyLeadPhase`). Nada é inferido do estado do banco: um estado divergente da fase declarada reprova a matriz.

| Suíte / verificação | Papel | `pre015` (015 NÃO aplicada) | `post015` (015 aplicada) |
|---|---|---|---|
| `baseline` — UPDATE de `leads.message` | anon / não-admin / admin / service | DENY / DENY / **ALLOW** / ALLOW | DENY / DENY / **DENY (42501, PRP-01)** / ALLOW |
| `e0b-security` — DELETE de `leads` | anon / não-admin / admin / service | DENY / DENY / **DENY** / ALLOW | DENY / DENY / **ALLOW** / ALLOW |

Todas as demais linhas são idênticas nas duas fases, inclusive `leads` SELECT, INSERT (só service_role) e `anon` sem nenhum acesso. As contagens (67 e 29 verificações) não mudam. Nenhuma garantia de segurança foi removida: o `post015` do `baseline` é mais restritivo para o admin (PRP-01), e o DELETE do admin passa a ser coberto também por I04.

| Fase declarada | Suítes que devem rodar | Suítes que se ignoram |
|---|---|---|
| `pre015` | `baseline` e `e0b-security` (matriz anterior) + `e2-leads-pre015` (semeadura) | `e2-leads` (I01 a I16) |
| `post015` | `baseline` e `e0b-security` (matriz pós-015) + `e2-leads` (I01 a I16) | `e2-leads-pre015` |

`e2-leads.test.ts` e `e2-leads-pre015.test.ts` seguem exigindo a fase correspondente para sequer iniciar (sem a variável, são ignorados). Executar `baseline`/`e0b-security` com a fase errada deve **reprovar**: é o comportamento esperado, não um defeito. Nada disto foi executado.
**Decisão (A3):** a numeração oficial do SDD é preservada. Além dos I01 a I16: PV-06, PV-28 e o teste negativo do guard.

## Preflight e verify com asserções

`preflight.sql` (estado anterior, com a 012 aplicada) e `verify.sql` (estado posterior) devolvem **uma linha por check** (`check_id, expected, actual, pass`) e uma linha final `RESULTADO`: só `actual = 'APROVADO'` é aprovação. Check ausente, NULL e erro de catálogo contam como **falha**; o `PRE-01`/`POS-01` falha fora de `BEGIN READ ONLY`. Os dois são mutuamente exclusivos por construção (um exige a ausência dos objetos que o outro exige). Em ambos, as consultas `EVD-*` e `DIGEST-*` formam o snapshot para recuperação; nenhuma lê dado pessoal. Os checks `POS-JANELA-*` só valem logo após o apply. `POS-57` e `POS-58` (Gate B1) conferem os privilégios **efetivos** de `service_role` (SELECT/INSERT/UPDATE/DELETE nas três tabelas e `BYPASSRLS`), que dependem dos default privileges do Supabase e não são concedidos pela migration; o verify tem 58 checks. **Não executados**; a garantia real é a transação READ ONLY, o lint (`checkReadOnlySql`) é complementar. O verify compara formatos do catálogo (definições de índice, trigger e constraint), então o primeiro uso no isolado pode exigir ajuste revisado de algum check: falha segura, nunca falso aprovado.

## Recuperação (artefatos A3 — nenhum executado)

| Arquivo | Papel |
|---|---|
| `rollback.sql` | Marcador de bloqueio, **inalterado**: não existe rollback automático |
| `recovery-triage.sql` | Triagem somente leitura; nunca classifica rollback como seguro |
| `containment.sql` | **Modelo protegido, NÃO autorizado para execução.** Contenção não destrutiva (só revoga escrita de `authenticated`); exige autorização declarada na transação e termina em `ROLLBACK` |
| `rollback-structural.sql` | **Modelo protegido, NÃO autorizado para execução**; aborta na 1ª instrução e não pode ser acionado automaticamente |
| `export-procedure.md` | Matriz de recuperação, atestados A1..A7, exportação, snapshots e quando usar backup |

`containment.sql` e `rollback-structural.sql` **não estão autorizados para execução** e não devem ser promovidos a scripts executáveis: o script de um incidente é sempre um derivado específico do alvo, revisado e autorizado à parte.

Reverter estruturalmente exige: triagem completa, atestados A1..A7, backup testado, revisão independente e autorização separada. **Nunca** reabrir `anon`.

## Segurança da função de histórico

`rc2_internal.leads_record_activity()` é `SECURITY DEFINER` para permitir inserir histórico sem conceder INSERT direto à API. Precisa de **revisão especial** do papel proprietário e eventuais privilégios efetivos, porque executa com permissões do proprietário. O schema `rc2_internal` deve ficar fora da configuração de schemas expostos da Data API. O SQL fixa `search_path` vazio, qualifica objetos e revoga EXECUTE de PUBLIC/anon/authenticated; **não presumir que isto basta sem verificar no alvo e nos testes**.

## Reversão / recuperação

`rollback.sql` é um **marcador READ ONLY de contingência**, não um DROP automático: destruir `lead_notes` ou `lead_activity` elimina dados e histórico. Em incidente, parar escritas, reverter o código antes de alterações de banco, preservar/exportar os dados, elaborar script de retorno compatível com o estado real e obter autorização separada. **Nunca reabrir grants/policy INSERT para anon**. A migration 015 não altera nem reaplica a 014.

## Cenários manuais obrigatórios (FORMALIZADOS, NÃO EXECUTADOS)

Estes cenários **não** são cobertos por teste automatizado (o harness só fala PostgREST) e **não foram executados**. Enquanto não houver evidência anexada, o estado de cada um é **PENDENTE** e **não pode ser apresentado como aprovado**. Todos usam dados sintéticos. Os que criam estado inseguro (G-1 e a variante destrutiva de M-3) ocorrem **somente em banco descartável separado**, criado só para o cenário e destruído depois; **nunca** no isolado compartilhado, em produção ou em qualquer ambiente com dados reais, e **nunca** reabrindo acesso `anon`.

| ID | Cenário | Ambiente | Pré-condição | Resultado esperado | Estado |
|---|---|---|---|---|---|
| M-1 | **Guard negativo com a 012 ausente.** Aplicar a 015 a um alvo com `leads_anon_insert` ou com privilégio de `anon` em `leads` | **Banco descartável separado**; nunca o isolado compartilhado | Banco criado só para o cenário, com a 014 e o estado anterior à 012 | A migration aborta no Guard 1 com a lista de problemas, nada é aplicado, nenhuma tabela nova existe e o grant de `anon` não foi alterado pela 015 | PENDENTE |
| M-2 | **Reaplicação da 015** num alvo onde ela já foi aplicada | Isolado, depois do apply e do `verify.sql` aprovado | `verify.sql` = `APROVADO` | Aborta antes de qualquer alteração com a lista de objetos preexistentes; `verify.sql` continua `APROVADO`; contagem de leads, notas e atividades idêntica | PENDENTE |
| M-3 | **Falha de aquisição do lock** | Isolado (ou descartável) | Uma segunda sessão mantém transação aberta sobre `public.leads` (por exemplo, `SELECT` dentro de `BEGIN`), com dados sintéticos | Aborta com 55P03 em torno de 5 s; nada aplicado (colunas, tabelas e triggers ausentes); depois de liberar a sessão, uma nova execução conclui. Registrar o tempo até o erro | PENDENTE |
| M-4 | **Rejeição de objetos preexistentes** | **Banco descartável separado** | Criar manualmente, um por vez, no descartável: `public.lead_notes`; `public.lead_activity`; o schema `rc2_internal`; um trigger `leads_20_set_updated_at`; uma coluna `status` em `leads` | Para cada caso, a migration aborta com mensagem identificando o objeto e nada é aplicado; o descartável é recriado entre os casos | PENDENTE |
| M-5 | **Rollback transacional em caso de erro** | Descartável separado | Provocar falha tardia (por exemplo, uma linha sintética em `leads` que viole a nova constraint, ou falha forçada da autoverificação) | A transação inteira reverte: sem colunas novas em `leads`, sem tabelas, sem triggers, sem funções, grants e policies idênticos aos do estado anterior (comparação por `preflight.sql`) e sem mudança em `updated_at` | PENDENTE |

Regras comuns: cada cenário tem executor, autorizador e data registrados na tabela de autorizações; a evidência é a saída literal dos comandos (sem PII), anexada à etapa; um cenário só passa a "aprovado" com essa evidência e revisão independente; falha em qualquer cenário **bloqueia** o apply. Os `it.todo` de `e2-leads.test.ts` (`GUARD-012-EXECUCAO`, `GUARD-REAPLICACAO`) correspondem a M-1 e M-2 e **continuam pendentes**.

## Autorizações (a preencher)

| Etapa | Executor | Autorizador | Data | Evidência |
|---|---|---|---|---|
| Preflight isolado READ ONLY | — | — | — | Pendente |
| Apply isolado | — | — | — | Pendente |
| Preflight produção READ ONLY | — | — | — | Pendente |
| Apply produção | — | — | — | Pendente |
| Merge/deploy do código E2 | — | — | — | Pendente |
