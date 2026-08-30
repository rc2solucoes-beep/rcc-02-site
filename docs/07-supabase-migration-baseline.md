# Supabase Migration Baseline

> **BASELINE TYPE: MCP metadata snapshot**
>
> **LIMITAÇÃO:** não existe `pg_dump` canônico nesta etapa. O projeto optou
> deliberadamente por **não instalar Docker**, e a Supabase CLI usa um container
> com `pg_dump` para `db dump`, `db diff` e `db lint --linked`. Todo o conteúdo
> deste documento foi obtido por **introspecção de metadata via Supabase MCP em
> `read_only=true`** — não por dump do banco.
>
> Consequência prática: este documento descreve o schema remoto com precisão
> suficiente para auditoria e decisão, mas **não é um artefato reexecutável** e
> **não serve como migration de baseline**. Essa limitação é intencional e não
> deve ser omitida em leituras posteriores.

> Documento de auditoria produzido pelas tarefas #00033 e #00036. **Read-only**:
> nenhuma alteração foi feita no banco remoto, no histórico de migrations ou nos
> arquivos SQL legados.
>
> Este documento não contém `project_ref`, URL de banco, connection string,
> senha, token ou qualquer dado de negócio.

---

## Decisão de infraestrutura

Decisão do projeto, tomada em 2026-08-30:

- **Docker não será instalado neste momento.**
- **Não haverá stack Supabase local nesta fase** — sem `supabase start`, sem
  `db reset`, sem ambiente de verificação local.
- **O Supabase MCP em `read_only=true` é a fonte operacional** para schema,
  tabelas, RLS, policies, funções, triggers e event triggers, advisors,
  metadata de migrations e documentação oficial.
- **Nenhuma alteração de schema será feita sem tarefa específica de
  remediação.** Discovery e auditoria não autorizam escrita.

Isto é uma escolha consciente de trade-off: abre-se mão da captura canônica e
da verificação local em troca de não carregar Docker enquanto o volume de
mudanças de banco for baixo. A decisão é revisável — ver *Migration strategy*.

---

## Estado remoto

- **Captura:** 2026-08-30
- **Projeto:** Supabase project-scoped, acessado via MCP oficial em
  `read_only=true`, `features=database,docs,debugging`. Identificador do projeto
  deliberadamente omitido deste documento.
- **Escopo capturado:** schema `public` apenas, somente metadata. Nenhuma linha
  de dado foi lida.
- **Método:** introspecção de `pg_catalog` / `information_schema` via MCP
  read-only.

### `REMOTE_MIGRATION_HISTORY_COUNT = 0`

Mais forte do que "zero linhas": o schema `supabase_migrations` **não existe**
no banco.

```
schema_exists = 0
objects_in_schema = 0
```

Schemas presentes: `auth`, `cron`, `extensions`, `graphql`, `graphql_public`,
`public`, `realtime`, `storage`, `vault`.

Conclusão: a Supabase CLI **nunca foi usada** contra este projeto. Todo o schema
foi aplicado manualmente (SQL Editor ou equivalente).

### Objetos principais em `public`

| Tipo | Objetos |
|---|---|
| Tabelas (6) | `leads`, `posts`, `settings`, `admin_users`, `authors`, `admin_audit_logs` |
| Funções (2) | `rls_auto_enable()` (SECURITY DEFINER, `search_path=pg_catalog`), `update_updated_at()` (INVOKER, sem `search_path`) |
| Triggers (2) | `posts_updated_at`, `settings_updated_at` → `update_updated_at()` |
| Event triggers (1) | `ensure_rls` → `rls_auto_enable()`, em `ddl_command_end`, tags `CREATE TABLE`/`CREATE TABLE AS`/`SELECT INTO` |
| Policies (15) | `admin_users` 4 · `authors` 4 · `leads` 3 · `posts` 2 · `settings` 2 · **`admin_audit_logs` 0** |
| RLS | habilitado nas 6 tabelas; `FORCE RLS` em nenhuma |
| Índices | 21 em `public` |
| Extensões | `pgcrypto`, `uuid-ossp`, `pg_stat_statements` (schema `extensions`); `pg_cron`, `plpgsql` (`pg_catalog`); `supabase_vault` (`vault`) |
| Cron jobs | `publish-scheduled-posts`, `*/5 * * * *`, **active** |

Sem dados: nenhuma linha de `leads`, `posts`, `settings`, `authors`,
`admin_users`, `admin_audit_logs` ou `auth.users` foi consultada.

---


### Advisors — `EVIDÊNCIA MCP`

Capturados via `get_advisors` em 2026-08-30. Nenhum foi corrigido nesta tarefa.

**Segurança — 5 lints**

| Lint | Nível | Objeto |
|---|---|---|
| `rls_enabled_no_policy` | INFO | `public.admin_audit_logs` — RLS on, zero policies |
| `function_search_path_mutable` | WARN | `public.update_updated_at` |
| `anon_security_definer_function_executable` | WARN | `public.rls_auto_enable()` |
| `authenticated_security_definer_function_executable` | WARN | `public.rls_auto_enable()` |
| `auth_leaked_password_protection` | WARN | Auth — proteção contra senha vazada desabilitada |

**Performance — 28 lints**

| Lint | Nível | Ocorrências |
|---|---|---|
| `auth_rls_initplan` | WARN | 9 — policies que reavaliam `auth.<fn>()` por linha em `posts`, `settings`, `leads` (2), `admin_users`, `authors` (4) |
| `unused_index` | INFO | 9 — `leads_email_idx`, `admin_users_email_idx`, `idx_posts_category`, `idx_posts_content_type`, `idx_posts_scheduled_publish_at`, `idx_posts_seo_keyword_primary`, `idx_posts_author_id`, `admin_audit_logs_severity_idx`, `admin_audit_logs_resource_idx` |
| `multiple_permissive_policies` | WARN | 10 — `posts` e `settings`, ação `SELECT`, 5 roles cada |

Nenhum lint de performance é bloqueante hoje: `auth_rls_initplan` só pesa em
escala, e os `unused_index` refletem baixo volume de uso, não índice errado.

## Estado local legado

### Convenções encontradas — duas, incompatíveis entre si

| Diretório | Convenção | Arquivos |
|---|---|---|
| `supabase/migrations/` | `NNN_nome.sql`, numeração sequencial manual | 11 |
| `migrations/` | `nome.sql`, sem ordem explícita | 2 |

Nenhuma das duas é a convenção da Supabase CLI, que exige
`<timestamp>_<nome>.sql` (14 dígitos, `YYYYMMDDHHMMSS`).

### Lista

| Arquivo | Objetos principais |
|---|---|
| `supabase/migrations/001_leads.sql` | tabela `leads`, 2 índices, RLS, 3 policies |
| `supabase/migrations/002_posts_settings.sql` | tabelas `posts` e `settings`, função `update_updated_at()`, 2 triggers, RLS, 4 policies, 2 índices, seed de `settings` |
| `supabase/migrations/003_admin_users.sql` | tabela `admin_users`, índice, RLS, policy; substitui policies de `posts`, `settings` e `leads` |
| `supabase/migrations/004_expand_settings.sql` | 8 colunas em `settings`, seed |
| `supabase/migrations/005_fix_admin_users_rls.sql` | substitui policy de `admin_users` por 4 policies |
| `supabase/migrations/006_add_postal_code_and_locality.sql` | 2 colunas em `settings`, comentários |
| `supabase/migrations/007_create_authors.sql` | extensão `pgcrypto`, tabela `authors`, índice, RLS, 4 policies |
| `supabase/migrations/008_bootstrap_first_admin.sql` | função `bootstrap_first_admin(uuid,text)` SECURITY DEFINER + REVOKE/GRANT |
| `supabase/migrations/009_admin_audit_logs.sql` | tabela `admin_audit_logs`, **3 índices**, RLS, **4 policies** |
| `supabase/migrations/010_admin_audit_logs_hardening.sql` | 4 `UPDATE` de normalização, 2 CHECK constraints, 2 índices |
| `supabase/migrations/011_scheduled_publish_cron.sql` | extensão `pg_cron`, job `publish-scheduled-posts` |
| `migrations/add_blog_seo_fields.sql` | 21 colunas em `posts`, troca de CHECK de `status`, 6 índices, comentários |
| `migrations/add_faq_cta_fields.sql` | colunas `faq_items`, `cta_block` em `posts`, comentários |

### Incompatibilidades com a CLI

1. **Nomes fora do padrão** — nenhum dos 13 arquivos é reconhecido pela CLI como
   migration. `supabase migration list` não os enumera.
2. **Diretório fora do padrão** — `migrations/` (raiz) não é lido pela CLI, que
   só olha `supabase/migrations/`.
3. **Ordem entre os dois diretórios é implícita** — `migrations/add_blog_seo_fields.sql`
   precisa rodar depois de `002` (cria `posts`) e antes de `011` (o job de cron
   depende de `status='scheduled'` e de `scheduled_publish_at`). Essa dependência
   não está expressa em lugar nenhum.
4. **`010` contém `UPDATE` de dados**, não só DDL — reaplicar num ambiente limpo
   é inofensivo (afeta 0 linhas), mas o arquivo mistura migração de schema e
   correção de dados.
5. **`migrations/add_blog_seo_fields.sql` não é idempotente** — usa
   `ALTER TABLE posts DROP CONSTRAINT posts_status_check` e `ADD COLUMN` sem
   `IF NOT EXISTS`. Falha na segunda execução.

---

## Drift remoto × local

Classificação: **A** `REMOTE_AND_LOCAL` · **B** `REMOTE_ONLY` ·
**C** `LOCAL_ONLY` · **D** `DIFFERENT_DEFINITION`.

`EVIDÊNCIA MCP` — toda linha desta tabela foi determinada por introspecção de
`pg_catalog` / `information_schema` via MCP read-only, **não** por `pg_dump`.
O lado "Local" vem da leitura direta dos 13 arquivos SQL, sem execução.

Limite conhecido desta evidência: a comparação cobre a **existência e a
definição dos objetos**, que a metadata expõe de forma confiável. Ela não
substitui um dump em detalhes que só um `pg_dump` normaliza — ordem de criação,
storage parameters, e formatação exata de expressões. Nenhum desses afeta as
conclusões abaixo.

| Objeto | Tipo | Remoto | Local | Classificação | Observação |
|---|---|---|---|---|---|
| `public.leads` | tabela | ✅ | `001` | **A** | 12 colunas, coincidem |
| `public.posts` | tabela | ✅ | `002` + `add_blog_seo_fields` + `add_faq_cta_fields` | **A** | 32 colunas; todas as fases aplicadas |
| `public.settings` | tabela | ✅ | `002` + `004` + `006` | **A** | 12 colunas, coincidem |
| `public.admin_users` | tabela | ✅ | `003` | **A** | FK para `auth.users` presente |
| `public.authors` | tabela | ✅ | `007` | **A** | |
| `public.admin_audit_logs` | tabela | ✅ | `009` | **A** | tabela sim; índices e policies não — ver abaixo |
| RLS das 6 tabelas | estado | ✅ enabled | declarado | **A** | `FORCE RLS` em nenhuma, nem local nem remoto |
| `leads` — 3 policies | policy | ✅ | `001` + `003` | **A** | `leads_anon_insert`, `Only admins can read leads`, `Only admins can update leads` |
| `posts` — 2 policies | policy | ✅ | `002` + `003` | **A** | |
| `settings` — 2 policies | policy | ✅ | `002` + `003` | **A** | |
| `admin_users` — 4 policies | policy | ✅ | `005` | **A** | |
| `authors` — 4 policies | policy | ✅ | `007` | **A** | |
| `public.update_updated_at()` | função | ✅ | `002` | **A** | INVOKER, sem `search_path`, idêntica nos dois lados |
| `posts_updated_at`, `settings_updated_at` | trigger | ✅ | `002` | **A** | |
| CHECKs de `posts` | constraint | ✅ | `002` + `add_blog_seo_fields` | **A** | `status` já com `'scheduled'` |
| CHECKs de `admin_audit_logs` | constraint | ✅ | `010` | **A** | `severity`, `actor_type` |
| `admin_audit_logs_severity_idx`, `_resource_idx` | índice | ✅ | `010` | **A** | |
| `pg_cron` + job `publish-scheduled-posts` | extensão/job | ✅ active | `011` | **A** | |
| `pgcrypto`, `uuid-ossp`, `pg_stat_statements` | extensão | ✅ | `007` cita só `pgcrypto` | **A** | instaladas em `extensions`; `007` criaria em `public` — no-op na prática |
| **`public.rls_auto_enable()`** | função | ✅ | ❌ | **B** | SECURITY DEFINER, `search_path=pg_catalog`; **não versionada** |
| **event trigger `ensure_rls`** | event trigger | ✅ | ❌ | **B** | **não versionado**; habilita RLS automaticamente em toda tabela nova de `public` |
| **`public.bootstrap_first_admin(uuid,text)`** | função | ❌ | `008` | **C** | **a função não existe no banco**, mas `src/app/api/admin/init/route.ts:114` a chama via RPC |
| **`admin_audit_logs` — 4 policies** | policy | ❌ | `009` | **C** | `admin select`, `block insert`, `block update`, `block delete` |
| **`admin_audit_logs_created_at_idx`** | índice | ❌ | `009` | **C** | |
| **`admin_audit_logs_event_idx`** | índice | ❌ | `009` | **C** | |
| **`admin_audit_logs_actor_user_id_idx`** | índice | ❌ | `009` | **C** | |
| Grants de tabela (`anon`/`authenticated`/`service_role` = `arwdDxtm`) | grant | ✅ | ❌ | **B** | padrão do Supabase, nunca declarado localmente |
| Grants de função (`EXECUTE` a PUBLIC em `rls_auto_enable`/`update_updated_at`) | grant | ✅ | ❌ | **B** | default do PostgreSQL, não declarado |
| `supabase_migrations.schema_migrations` | schema | ❌ | ❌ | — | não existe em nenhum lado |

**Contagem:** A = 19 · B = 4 · C = 5 · D = 0.

Nenhum `DIFFERENT_DEFINITION` encontrado: onde o objeto existe dos dois lados, a
definição coincide.

---

## Findings conhecidos relacionados

### `rls_auto_enable()` — `REMOTE_ONLY` ✅ confirmado

Existe remotamente, ausente do Git. SECURITY DEFINER com `search_path` já fixado
em `pg_catalog`. Retorna `event_trigger` (pseudo-tipo), portanto **não é
invocável via RPC do Data API** — os advisors `0028`/`0029` são falso positivo
estrutural.

### `ensure_rls` — `REMOTE_ONLY` ✅ confirmado

Event trigger em `ddl_command_end`, owner `postgres`, enabled. Ausente do Git.

**Este objeto explica o drift de `009`** — ver abaixo. Também significa que
qualquer `CREATE TABLE` em `public` ganha RLS automaticamente, o que muda o
resultado esperado de qualquer migration futura.

### `admin_audit_logs` — tabela `REMOTE_AND_LOCAL`, policies `LOCAL_ONLY` ✅ confirmado

A evidência aponta para **aplicação parcial da migration `009`**: apenas o
`CREATE TABLE` foi executado. Os 3 índices e as 4 policies que vêm depois no
arquivo não existem. O RLS **está** habilitado, mas não por causa do
`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` do arquivo — e sim porque o event
trigger `ensure_rls` disparou no `CREATE TABLE`.

A migration `010`, posterior, está integralmente aplicada (2 CHECKs, 2 índices).

Consequência funcional já mapeada em #00032: a escrita usa `service_role`
(bypassa RLS, funciona), a leitura usa a sessão do usuário (`authenticated`,
sujeita a RLS). Com zero policies, a leitura retorna sempre vazio e a página de
segurança do admin nunca mostra evento algum.

### `update_updated_at()` — `REMOTE_AND_LOCAL` ✅ confirmado

Definição idêntica nos dois lados, inclusive a ausência de `SET search_path`
que gera o advisor `0011`. INVOKER, retorna `trigger`: risco muito baixo.

### Drift novo, não previsto em #00032

**`bootstrap_first_admin(uuid, text)` está declarada em `008` e não existe no
banco.** `src/app/api/admin/init/route.ts:114` chama essa RPC; a rota falharia
com erro de função inexistente. Há coberturas em
`tests/unit/admin/init-route.test.ts` que mockam a RPC, então os testes passam
sem tocar no banco real. O único admin existente foi provavelmente criado por
outro caminho (`scripts/add-admin-user.ts`).

Isso eleva `008` de "legado aplicado" para **"legado não aplicado"**, e é a
segunda migration parcialmente/não aplicada do conjunto.

---

## Bugs funcionais confirmados

Registrados, **não corrigidos**. A remediação exige tarefa própria.

### `admin_audit_logs` — trilha de auditoria não legível

`EVIDÊNCIA MCP`

| Fato | Estado |
|---|---|
| Tabela existe remotamente | ✅ sim |
| RLS habilitado | ✅ sim |
| Policies | ❌ **zero** |
| Leitura por `authenticated` | **deny-all** — RLS ligado sem policy nega tudo |
| `INSERT` por `service_role` | ✅ funciona — `service_role` bypassa RLS |
| Migration `009` declara | 4 policies + 3 índices — **nenhum presente no remoto** |

Efeito: a escrita da trilha funciona (rota server-side usa `service_role`), mas
a leitura usa a sessão do usuário (`authenticated`, sujeita a RLS). Com zero
policies, **a página de segurança do admin tende a exibir zeros ou lista
vazia**, mesmo havendo eventos gravados na tabela.

Não é vazamento: deny-all erra para o lado seguro. É perda de função.

O RLS desta tabela está ligado **pelo event trigger `ensure_rls`**, não pelo
`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` do arquivo `009` — o que é a
evidência mais forte de que `009` foi aplicada apenas parcialmente (só o
`CREATE TABLE`).

### `bootstrap_first_admin` — RPC chamada e inexistente

`EVIDÊNCIA MCP`

| Fato | Estado |
|---|---|
| Função no remoto | ❌ **ausente** (`pg_proc` em `public` = 0 ocorrências) |
| Declarada em | `supabase/migrations/008_bootstrap_first_admin.sql` |
| Chamada pelo código | `src/app/api/admin/init/route.ts:114` via RPC |
| Cobertura de teste | `tests/unit/admin/init-route.test.ts:221,244` — **mocka o RPC** |

Efeito: a rota real de bootstrap do primeiro admin **falharia** contra o banco,
com erro de função inexistente. Os testes passam porque nunca tocam o banco —
o mock esconde o defeito.

O admin existente foi provavelmente criado por outro caminho
(`scripts/add-admin-user.ts`), o que explica o bug nunca ter aparecido em uso.

---

## Segurança

`EVIDÊNCIA MCP`

### `rls_auto_enable()` — SECURITY DEFINER, `search_path` fixado

- `SECURITY DEFINER` ✅
- `SET search_path = pg_catalog` ✅ — **já fixado**, portanto não vulnerável ao
  vetor clássico de sequestro de `search_path`.
- Retorna o pseudo-tipo `event_trigger`.

Os advisors `0028` e `0029` apontam que `anon` e `authenticated` podem executar
a função via `/rest/v1/rpc/rls_auto_enable`. Na prática, **uma função que
retorna `event_trigger` não é invocável como RPC** — o PostgREST não consegue
materializar o pseudo-tipo, e fora de um contexto de event trigger a função
falharia de qualquer forma. Tratamos os dois advisors como **falso positivo
estrutural**.

Ainda assim, `REVOKE EXECUTE ... FROM anon, authenticated` permanece
recomendado como **hardening** — reduz superfície e zera os advisors sem custo
funcional. Não é urgente e não é corrigido aqui.

### Event trigger `ensure_rls`

Em `ddl_command_end`, tags `CREATE TABLE` / `CREATE TABLE AS` / `SELECT INTO`,
habilitado, owner `postgres`, aponta para `public.rls_auto_enable()`.

Existe **apenas no remoto**. É um mecanismo de proteção útil — toda tabela nova
em `public` ganha RLS automaticamente — mas por não estar versionado:

1. ninguém que leia só o Git sabe que ele existe;
2. ele **altera o resultado esperado de qualquer migration futura** que crie
   tabela, e essa diferença é invisível na revisão de código.

### Grants default

Todas as 6 tabelas de `public` carregam os grants padrão do Supabase
(`anon`, `authenticated`, `service_role` com `arwdDxtm`), e as 2 funções
carregam `EXECUTE` para `PUBLIC`. São o default da plataforma, nunca declarados
localmente — e são a origem de parte dos advisors.

**Consequência que precisa ficar explícita:** com esses grants, **RLS é a única
proteção real** das tabelas de `public`. Não há defesa em profundidade. Toda
tabela nova depende do `ensure_rls` — ou de policy escrita à mão — para não
nascer aberta.

### `update_updated_at()` sem `search_path`

Advisor `0011`. Risco baixo: é `SECURITY INVOKER` e retorna `trigger`, então
não há escalonamento de privilégio. Hardening desejável, não urgente.

---

## Risco

**Por que não rodar `db push` agora.**

`db push` aplicaria ao banco tudo o que a CLI considerar pendente. Como o
histórico remoto está vazio, a CLI trata *todo* arquivo válido em
`supabase/migrations/` como não aplicado. Os arquivos legados não têm nome
válido hoje, mas assim que forem renomeados para o padrão timestamped, um
`db push` tentaria reexecutar os 13 arquivos contra um banco que já contém
quase tudo. `migrations/add_blog_seo_fields.sql` não é idempotente e falharia
em `DROP CONSTRAINT` / `ADD COLUMN`; `010` reexecutaria `UPDATE` sobre dados
reais.

**Por que não rodar `migration repair` agora.**

`repair --status applied` marcaria as migrations como aplicadas. Isso seria
**mentira verificável** para pelo menos duas delas: `008` (função ausente) e
`009` (índices e policies ausentes). O histórico passaria a afirmar um estado
que o banco não tem, e o drift ficaria permanentemente invisível — exatamente o
oposto do objetivo. Qualquer ambiente novo criado a partir desse histórico
divergiria de produção em silêncio.

**Por que não rodar `db pull`.**

`db pull` gera uma migration a partir do remoto *e* escreve no histórico remoto.
Além de estar fora do escopo autorizado, ele consolidaria o estado atual —
incluindo os objetos ausentes — antes de decidirmos o que é intencional.

**O risco central:** os arquivos locais **não descrevem** o banco remoto, em
ambas as direções. Há 4 objetos remotos não versionados e 5 objetos versionados
que não existem remotamente. Qualquer baseline construído por suposição — em
vez de por captura — produz uma migration destrutiva ou um histórico falso.

---

## Estado das ferramentas

| Item | Resultado |
|---|---|
| Supabase CLI | `2.116.0` confirmada via `npx -y supabase@2.116.0 --version` |
| Autenticação CLI | válida — `projects list` retornou exit 0 (lista não reproduzida) |
| Docker | **ausente** — não está no PATH (Bash nem PowerShell) e não há diretório do Docker Desktop |
| Link do projeto | **não executado** — bloqueado pela ausência de Docker em #00033; **não será executado** por decisão em #00036 |
| `supabase/config.toml` | template padrão de `supabase init`, gerado em 2026-08-29 (**antes** de #00033); `project_id` = nome do diretório local, **não** é o ref real; sem segredos literais, apenas 10 interpolações `env(...)` |
| `supabase/.gitignore` | gerado junto, mesma data; ignora `.branches`, `.temp`, `.env*` |
| `migration list` | falhou com `LegacyProjectNotLinkedError` (esperado, sem link) |
| `db dump` | **não executado** — requer Docker |
| `db lint --linked` | **não executado** — requer link e Docker |

Nenhum arquivo SQL legado foi alterado pela CLI.

Em #00036 a Supabase CLI **não foi usada** — a linha acima é o registro
histórico de #00033. `supabase/config.toml` e `supabase/.gitignore` continuam
**não versionados**: são artefatos de uma tentativa anterior de fluxo CLI e não
têm função no fluxo MCP-only. Ficam no disco, fora do Git, até haver decisão
explícita sobre eles.

---

## Migration strategy

> **Estratégia provisória e deliberada.** Substitui a recomendação anterior
> (#00033), que dependia de Docker.

### O que muda e por quê

#00033 recomendou a **Estratégia A** — gerar uma migration de baseline a partir
de `supabase db dump` e marcá-la como aplicada. Essa recomendação **fica
suspensa**, porque seu primeiro passo era instalar Docker, e o projeto decidiu
não instalar.

O ponto inegociável da Estratégia A continua válido e é justamente o que impede
adotá-la agora: **o baseline tem de vir do banco, nunca dos arquivos.** Sem
`pg_dump` não há captura canônica; declarar um baseline a partir deste snapshot
MCP seria transformar uma leitura de metadata em fonte de verdade executável —
exatamente o erro que a auditoria existe para evitar.

Por isso: **não se declara um "baseline migration oficial" nesta fase.**

### Estratégia vigente

1. **Preservar as migrations legadas como histórico.** Os 13 arquivos ficam
   onde estão, sem renomear, mover, editar ou consolidar. Valem como registro
   do que se pretendeu, não como fluxo executável.
2. **Documentar o drift** — este documento. Ele é a referência de estado
   enquanto não houver dump canônico.
3. **Correções futuras como migrations incrementais**, pequenas e
   **explicitamente verificadas contra metadata MCP** antes e depois. Uma
   correção por finding, cada uma com evidência de que o objeto realmente
   mudou no remoto.
4. **Não usar `migration repair` para fingir que `008` e `009` foram
   aplicadas.** Estão comprovadamente incompletas; registrá-las como aplicadas
   tornaria o drift permanentemente invisível.
5. **Reconsiderar o baseline via CLI/Docker** somente se o volume de alterações
   de banco crescer — vários objetos por sprint, mais de um ambiente, ou
   necessidade de CI com verificação de schema.

### Custo aceito conscientemente

Esta estratégia tem limitações reais, aceitas por decisão:

- **Não há verificação local** — cada migration incremental é validada direto
  contra o remoto, via MCP, sem ensaio prévio em ambiente descartável.
- **Não há reprodutibilidade** — não é possível recriar o banco do zero a
  partir do Git. Um ambiente novo teria de ser construído manualmente.
- **O histórico remoto continua vazio**, e a CLI segue sem enxergar o projeto.

O gatilho para revisitar a decisão é o item 5. Enquanto as mudanças forem
poucas e pontuais, o custo de Docker não se paga; quando deixarem de ser, esta
estratégia passa a ser o gargalo.

---

## Apêndice — comparação de estratégias (#00033, suspensa)

> Mantida como registro. A recomendação abaixo depende de Docker e está
> **suspensa** pela decisão de infraestrutura. Serve de ponto de partida
> caso o gatilho do item 5 da estratégia vigente seja atingido.

### Estratégia A — snapshot remoto como novo baseline oficial

Arquivar os 13 arquivos legados, gerar uma única migration timestamped a partir
do dump do banco real, marcar só ela como aplicada, e seguir incrementalmente.

| Critério | Avaliação |
|---|---|
| Risco | **baixo** — o baseline é gerado do próprio banco; nada é reexecutado contra produção |
| Rastreabilidade | boa — o legado é preservado intacto em diretório histórico, e o baseline declara o estado verdadeiro, drift incluído |
| Reaplicar localmente | **funciona** — `db reset` local reproduz produção fielmente |
| CI | simples — um baseline + migrations incrementais é o fluxo que a CLI espera |
| Migration destrutiva | risco mínimo — nenhum `DROP` inferido |
| Trabalho | moderado — depende de Docker e de uma revisão do dump |

### Estratégia B — reparar o histórico para cada migration legada

Renomear os 13 arquivos para o padrão timestamped e marcar cada um como
aplicado via `migration repair`.

| Critério | Avaliação |
|---|---|
| Risco | **alto** — exige afirmar "aplicada" para `008` e `009`, que **comprovadamente não estão** |
| Rastreabilidade | **enganosa** — o histórico passaria a descrever um estado que o banco não tem; o drift some do radar |
| Reaplicar localmente | **quebra** — `add_blog_seo_fields.sql` não é idempotente; a ordem entre os dois diretórios não está expressa |
| CI | frágil — qualquer ambiente novo diverge de produção em silêncio |
| Migration destrutiva | risco real se alguém depois rodar `db push` confiando no histórico |
| Trabalho | alto — 13 renomeações, 13 repairs, e ainda sobra o drift para tratar |

### Estratégia C — considerada e descartada

`db pull` para gerar o baseline automaticamente. Descartada porque escreve no
histórico remoto (fora do escopo autorizado) e consolidaria o estado atual
**antes** de decidirmos o que no drift é intencional e o que é defeito.

### Recomendação: **Estratégia A**

O fator decisivo é que a B exige registrar uma afirmação falsa. `008` e `009`
não estão aplicadas; marcá-las como aplicadas tornaria o drift permanentemente
invisível e é exatamente o oposto do objetivo desta auditoria. A A parte de uma
captura, não de uma suposição, e mantém o legado auditável sem torná-lo
executável.

Observação importante para a próxima etapa: o baseline deve refletir o banco
**como está**, com o drift dentro. As correções dos findings de #00032
(policies de `admin_audit_logs`, `bootstrap_first_admin`, `search_path` de
`update_updated_at`) vêm **depois**, como migrations incrementais e revisáveis
uma a uma — nunca embutidas no baseline.

---

---

## Verificação final — zero alteração remota

Revalidado ao fim de #00036, por metadata read-only:

| Verificação | #00033 | #00036 |
|---|---|---|
| `supabase_migrations` (schema existe) | 0 | 0 |
| `REMOTE_MIGRATION_HISTORY_COUNT` | 0 | 0 |
| Tabelas em `public` | 6 | 6 |
| Tabelas com RLS habilitado | 6 | 6 |
| Tabelas com `FORCE RLS` | 0 | 0 |
| Policies em `public` | 15 | 15 |
| Policies em `admin_audit_logs` | 0 | 0 |
| Funções em `public` | 2 | 2 |
| `bootstrap_first_admin` | ausente | ausente |
| Índices em `public` | 21 | 21 |
| Índices em `admin_audit_logs` | 3 | 3 |
| Triggers em `public` | 2 | 2 |
| Event trigger `ensure_rls` | presente | presente |
| Cron jobs ativos | 1 | 1 |
| Lints de segurança | 5 | 5 |

Schemas presentes (inalterados): `auth`, `cron`, `extensions`, `graphql`,
`graphql_public`, `public`, `realtime`, `storage`, `vault`.

Os 3 índices de `admin_audit_logs` são `admin_audit_logs_pkey`,
`admin_audit_logs_severity_idx` e `admin_audit_logs_resource_idx` — todos da
migration `010`. Os 3 declarados em `009` (`created_at_idx`, `event_idx`,
`actor_user_id_idx`) continuam **ausentes**.

Nenhum SQL de escrita foi executado. Nenhuma linha de tabela de negócio foi
lida. `auth.users` não foi consultada. Nenhum `db dump`, `db pull`, `db push`,
`migration repair`, `migration up/down`, `db reset` ou `apply_migration` foi
executado. Docker não foi instalado. A Supabase CLI não foi usada em #00036.
