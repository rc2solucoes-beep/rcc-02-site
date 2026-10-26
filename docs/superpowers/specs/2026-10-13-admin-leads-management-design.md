# SDD — Leads: gestão operacional e fundação de segurança

**Data:** 2026-10-13
**Status:** Rascunho para revisão final de engenharia. **Sem autorização de implementação.**
**PRD:** `2026-10-13-admin-evolution-prd.md`
**Entregas:** E0a, E0b, E0c (fundação, Parte I) e E2 (módulo de leads, Parte II)
**Requisitos:** RF-OPS-01..03, RF-SEG-01..05, RF-LEAD-01..11

As especificações de esquema são **descritivas**, não scripts executáveis. Nenhuma migration foi criada nem executada.

Este SDD também abriga a fundação de segurança, porque `leads` é a tabela mais afetada e o SDD de Newsletter depende da E0c (função de rate limit).

## 1. Decisões aprovadas aplicáveis

DEC-01, DEC-02, DEC-03, DEC-07, DEC-08, DEC-09, DEC-10, DEC-12, DEC-14, DEC-16, DEC-20, DEC-21. Definições no PRD §4.

## 2. Evidências verificadas

| ID | Evidência |
|---|---|
| EV-05 | `leads/page.tsx`: `select *` ordenado por `created_at`, sem filtro nem paginação, erro engolido; texto "solicitações de diagnóstico". |
| EV-06 | `api/contact/route.ts` (`isRateLimited`): conta linhas de `leads` com `email` ou `ip_hash` na última hora; limite 3; falha de banco bloqueia. |
| EV-07 | A rota grava com `createServiceClient()`. Nenhum código em `src/` ou `scripts/` insere em `leads` pela anon key. Usos de `leads`: rota de contato, dashboard (contagens) e listagem. |
| EV-08 | `001_leads.sql` cria `leads_anon_insert FOR INSERT TO anon WITH CHECK (true)`. `003` troca as policies de leitura/atualização por versões restritas a admin. O baseline de 30/08 confirma 3 policies em `leads` no remoto. |
| EV-09 | `admin_audit_logs`: RLS ligado, nenhuma policy (advisor de 13/10); 195 linhas. A migration `009` previa 1 policy de leitura, 3 de bloqueio e 3 índices, aplicados só em parte. |
| EV-10 | Histórico de migrations remoto vazio; aplicação manual; event trigger `ensure_rls` só no remoto. |
| EV-11 | `leads` remoto: 12 colunas (`id, name, company, email, whatsapp, segment, size, solution, message, source, ip_hash, created_at`), 9 linhas. Não há `status`, `updated_at`, notas nem arquivo. `ip_hash` é nulável (o tipo TS `Lead` o declara obrigatório). |
| EV-12 | `verifyTurnstile`: se `TURNSTILE_SECRET_KEY` for ausente ou `xxxx`, retorna `true` mesmo em produção. A chamada a `siteverify` não tem timeout. |
| EV-13 | `getIp`: prioridade `cf-connecting-ip`, depois `x-forwarded-for`, depois `x-real-ip`. |
| EV-14 | O e-mail de notificação é disparado sem `await`/`after()`; texto "Novo diagnóstico solicitado". |
| EV-15 | `vitest.config.ts` só inclui `*.test.ts`; `security-page-sanitization.test.tsx` não roda. |
| EV-18 | A branch de tracking altera `api/contact/route.ts` (origin check) e `next.config.ts` (CSP). |
| EV-19 | O `ContactForm` não registra consentimento. |
| EV-21 | `writeAdminAuditLog` engole falhas por design, hasheia e-mail do ator e IP, e as Server Actions não passam IP. |
| EV-22 | As tabelas públicas carregam os grants padrão do Supabase (`anon`/`authenticated` com `arwdDxtm`); a RLS é a única barreira (baseline). |

## 3. Premissas ainda não validadas

| ID | Premissa | Validação |
|---|---|---|
| PV-01 | `leads_anon_insert` existe hoje no remoto. | Preflight E0b.1 |
| PV-02 | `admin_audit_logs` continua sem policies. | Preflight E0b.1 |
| PV-03 | Estado de `bootstrap_first_admin` e do job de cron. | Preflight E0b.1 |
| PV-04 | `pg_net` e `pg_cron` disponíveis. | Preflight E0b.1 |
| PV-05 | `ON DELETE CASCADE` ignora RLS nas tabelas filhas. | T-LEAD-I06 |
| PV-06 | Privilégio de coluna `UPDATE` funciona com os grants padrão. | T-LEAD-I08 |
| PV-07 | Domínio proxiado ou não pelo Cloudflare. | Dono do domínio |
| PV-16 | Segredos reais do Turnstile em Production e Preview. | BL-06 |
| PV-19 | A Vercel sobrescreve `x-real-ip` e `x-forwarded-for` com o IP do cliente, sem aceitar valor enviado pelo cliente. | Documentação da Vercel + teste em deploy isolado |
| PV-20 | Nenhum outro consumidor (script, automação, n8n) insere em `leads` pela anon key. | Preflight: busca nos logs/automações pelo dono; ver §5.2 |
| PV-28 | Em triggers `BEFORE UPDATE` do Postgres, a cláusula `WHEN` do segundo trigger enxerga o `NEW` já alterado pelo primeiro (disparo em ordem alfabética do nome). | T-LEAD-I15, ambiente isolado |

---

# Parte I — Fundação (E0a, E0b, E0c)

## 4. E0a: runbook, ambiente isolado e Vitest

### 4.1 Runbook de migrations manuais (RF-OPS-01, DEC-02)

Documento único `docs/runbooks/migrations-manuais.md` e uma pasta por migration em `docs/runbooks/migrations/<NNN>-<nome>/`:

| Artefato | Regra |
|---|---|
| `README.md` | objetivo, ordem, dependências, janela, risco, quem aplica, requisitos de autorização |
| `preflight.sql` | **somente leitura**; confere o estado esperado e aborta a aplicação se divergir |
| `apply.sql` | idempotente (`IF NOT EXISTS`/`IF EXISTS`); uma transação quando possível |
| `verify.sql` | somente leitura; confere o resultado e a ausência de efeitos colaterais |
| `rollback.sql` | desfaz o que for seguro; quando o desfazer for inseguro, o arquivo documenta a contingência e **não** recria permissão (ver §5.3) |

**Onde cada artefato mora:** o `apply` é o próprio arquivo da migration, `supabase/migrations/NNN_nome.sql` (numeração continua em `012_*`, convenção atual); `README`, `preflight`, `verify` e `rollback` ficam na pasta do runbook e o `README` aponta para o `apply`. Assim existe uma única fonte do que é aplicado. Duas pastas legadas (`migrations/` e `supabase/migrations/`) não são reorganizadas (fora do escopo). Nenhum artefato é executado sem autorização explícita do responsável, e a aplicação em produção sempre vem depois da aplicação no ambiente isolado.

### 4.2 Ambiente isolado e suíte de RLS (RF-OPS-02, DEC-16)

- Projeto ou branch Supabase dedicado a testes (DEP-01). Aplica as mesmas migrations na mesma ordem.
- Suíte em `tests/integration/`, **fora** do `npm test` padrão; script próprio (`test:integration`).
- **Guarda anti-produção:** a suíte lê `RC2_TEST_SUPABASE_URL` e `RC2_TEST_PROJECT_REF`; recusa executar se a URL não estiver na allowlist de projetos de teste ou se coincidir com `NEXT_PUBLIC_SUPABASE_URL` de produção. Falha antes de qualquer conexão.
- Papéis cobertos: `anon`, `authenticated` sem registro em `admin_users`, `authenticated` admin, `service_role`.
- Usuários de teste criados pela API de administração do próprio projeto de teste; dados sintéticos, nunca cópias de produção.
- Relatório: matriz tabela × papel × operação (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) com o resultado esperado e o observado.

### 4.3 Vitest com `.tsx` (RF-OPS-03)

`include` passa a cobrir `tests/unit/**/*.test.{ts,tsx}`. Efeito esperado: `security-page-sanitization.test.tsx` passa a rodar; qualquer falha latente que apareça é registrada e tratada na própria E0a, sem corrigir código de produção fora do necessário.

## 5. E0b: segurança prioritária

### 5.1 E0b.1 — Preflight remoto (somente leitura)

Consultas de catálogo a executar **somente com autorização explícita** (ou pelo responsável, a partir de script):

| Objetivo | Fonte |
|---|---|
| Policies e papéis de `leads`, `admin_audit_logs`, `posts` | catálogo de policies |
| Privilégios de tabela de `anon`/`authenticated` | privilégios de tabela |
| Existência de `bootstrap_first_admin`, `rls_auto_enable` | catálogo de funções |
| Job `publish-scheduled-posts` ativo | tabela de jobs do `pg_cron` |
| Extensões instaladas (`pg_cron`, `pg_net`, `pgcrypto`) | catálogo de extensões |

A saída é registrada no README da migration como evidência do estado anterior. **Não se usa essa saída para restaurar permissões.**

### 5.2 E0b.2 — Remover acesso `anon` a `leads` (RF-SEG-01, DEC-08)

**Antes de aplicar:** confirmar PV-20 (nenhum consumidor legítimo usa a anon key para inserir). Busca no repositório já feita (EV-07); falta o dono confirmar scripts e automações externas.

**Aplicação (descrição):**

1. Remover a policy `leads_anon_insert` (se existir).
2. Revogar de `anon` todos os privilégios em `public.leads`.
3. Manter inalteradas as policies de admin (`SELECT`, `UPDATE`).

**Pós-verificação:** em ambiente isolado e depois em produção, `anon` não consegue `INSERT`, `SELECT`, `UPDATE` nem `DELETE` em `leads`; `POST /api/contact` continua gravando (service role); o dashboard e a listagem do admin continuam lendo.

### 5.3 Rollback seguro (ajuste obrigatório 1)

**O rollback não recria `leads_anon_insert` nem qualquer permissão de escrita para `anon`.**

| Situação | Tratamento |
|---|---|
| `rollback.sql` | contém apenas a verificação do estado e um aviso que explica que a reversão é intencionalmente indisponível; não executa DDL |
| Consumidor inesperado quebra após a remoção | corrigir o consumidor para usar a rota do servidor (`service_role`); **não** reabrir `anon` |
| Necessidade de escrita pública excepcional | exige nova decisão registrada e um mecanismo de menor privilégio (por exemplo, função restrita chamada pelo servidor), nunca uma policy `WITH CHECK (true)` |
| Evidência do estado anterior | preservada no README (saída do preflight), apenas para auditoria |

O desfazer do código (reverter o PR) não depende do banco, porque nenhum caminho de código usa a escrita `anon`.

### 5.4 E0b.3 — Leitura administrativa de `admin_audit_logs` (RF-SEG-02, DEC-03)

| Item | Especificação |
|---|---|
| Policy `SELECT` | `authenticated` cujo `auth.uid()` esteja em `admin_users`, com `(select auth.uid())` |
| `INSERT`/`UPDATE`/`DELETE` | sem policy para `authenticated`; revogar os privilégios correspondentes de `anon` e `authenticated` |
| Escrita | continua por `service_role`, inalterada |
| Índices | recriar, se ausentes, `created_at DESC`, `event` e `actor_user_id` (idempotente) |
| Tabela de backup `idx02_links_backup_*` | fora do escopo (DT-07) |

**Pós-verificação:** admin vê eventos em `/admin/security`; não-admin autenticado e `anon` recebem zero linhas; nenhum papel não-serviço escreve.
**Rollback:** remover a policy `SELECT` (volta ao deny-all, estado seguro) e os privilégios revogados não são restaurados.

### 5.5 E0b.4 — Turnstile e IP do cliente (RF-SEG-03, RF-SEG-04, DEC-14)

**Helper de Turnstile** (um módulo, usado por contato e newsletter):

| Ambiente | Segredo | Token | Resultado |
|---|---|---|---|
| `VERCEL_ENV=production` | real (não vazio, ≠ `xxxx`) | presente e válido | permitir |
| `VERCEL_ENV=production` | ausente/placeholder | qualquer | **negar** e registrar `turnstile_misconfigured` |
| `VERCEL_ENV=preview` | ausente/placeholder | qualquer | **negar** (Preview deve ter segredo, real ou de teste do Cloudflare) |
| `VERCEL_ENV` indefinido e `NODE_ENV≠production` (dev local, Playwright com `npm run dev`) | ausente/placeholder | qualquer | permitir (bypass local) |
| qualquer | real | ausente ou inválido | negar |
| qualquer | real | `siteverify` não-OK, erro de rede ou timeout (5 s) | negar |

Usa `VERCEL_ENV`, não `NODE_ENV`, porque builds de preview também têm `NODE_ENV=production`.

**Helper de IP:** ordem `x-real-ip`, depois primeiro item de `x-forwarded-for`. `cf-connecting-ip` só entra se PV-07 confirmar o proxy do Cloudflare. Sem IP determinável, o bucket de IP é ignorado e o limite por e-mail continua valendo (§6).

**Rota de contato:** passa a usar os dois helpers. O restante da rota não muda (origin check da tracking, honeypot, gravação, e-mail). A mudança é construída sobre a versão da rota presente na ponta da branch de tracking (PR empilhado, R-10), sem alterar essa branch.

**Preflight obrigatório (BL-06):** antes do deploy, o dono confirma que `TURNSTILE_SECRET_KEY` e `NEXT_PUBLIC_TURNSTILE_SITE_KEY` existem e são válidos em Production **e** Preview. Sem isso o formulário deixa de funcionar (R-01).

**Rollback:** reverter o PR. Sem alteração de banco.

## 6. E0c: rate limit atômico e desacoplamento do contato (RF-SEG-05, DEC-12)

### 6.1 Problema

O limite do contato conta linhas de `leads` (EV-06). Consequências: excluir ou anonimizar leads (Parte II) reduz a contagem e reabre a janela; só tentativas bem-sucedidas contam; e-mail e `ip_hash` do titular ficam acoplados à tabela de negócio.

### 6.2 Modelo

| Objeto | Especificação |
|---|---|
| Tabela `rate_limit_counters` | `key text`, `window_start timestamptz`, `count int`; chave primária `(key, window_start)`; RLS ligado sem policies; `REVOKE ALL` de `anon` e `authenticated` |
| Função `rate_limit_hit(p_key, p_limit, p_window_seconds)` | `INSERT … ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1 RETURNING count`; devolve `allowed`, `count` e `reset_at`; `allowed = count ≤ limit`; `SECURITY INVOKER`; `search_path` fixo; `EXECUTE` só para `service_role` |
| Janela | fixa, alinhada ao múltiplo de `p_window_seconds` desde a época; borda conhecida: até 2× o limite numa virada de janela (aceito) |
| Purga | job `pg_cron` horário remove linhas com `window_start` mais antigo que 2 dias |
| Chaves | `contact:email:<hmac>`, `contact:ip:<hmac>`; para a newsletter ver o SDD Newsletter §5 |
| Hash das chaves | HMAC-SHA256 com `RATE_LIMIT_PEPPER` (DEP-05) sobre o valor normalizado |

O hash de e-mail ou IP é **dado pessoal pseudonimizado**, não anônimo (DEC-23). Retenção máxima das linhas: 2 dias. Aparece na política de privacidade como contador antiabuso.

### 6.3 Contrato na rota de contato

1. Após origem, validação, honeypot e Turnstile, chama `rate_limit_hit` para o e-mail (limite 3/h) e para o IP (limite 3/h), valores iniciais iguais aos atuais (PRP-02).
2. Qualquer bucket excedido → 429 com a mensagem atual.
3. Erro do banco → **fecha** (429), como hoje.
4. Tentativas rejeitadas por rate limit também contam (diferença deliberada de hoje).
5. A tabela `leads` deixa de ser consultada para limitar.

**Compatibilidade:** contadores começam vazios no deploy (janela efetivamente reiniciada, risco aceito). A lógica antiga é removida no mesmo PR.

### 6.4 Migração e rollback

`preflight` (tabela ausente, `pg_cron` presente) · `apply` · `verify` (função executável só por `service_role`) · `rollback`: remover job, função e tabela, **depois** de reverter o código que as usa.

## 7. Testes da Parte I

| ID | Teste | Requisito |
|---|---|---|
| T-OPS-U01 | Guarda anti-produção recusa URL fora da allowlist e URL igual à de produção | RF-OPS-02 |
| T-OPS-U02 | `npm test` inclui e executa `.tsx` | RF-OPS-03 |
| T-SEG-U01 | Matriz do helper de Turnstile (ambiente × segredo × token × erro de rede/timeout) | RF-SEG-03 |
| T-SEG-U02 | Helper de IP com cabeçalhos forjados e ausentes | RF-SEG-04 |
| T-SEG-I01 | `anon` não faz `SELECT/INSERT/UPDATE/DELETE` em `leads` | RF-SEG-01 |
| T-SEG-I02 | `POST /api/contact` grava lead (service role) após a remoção | RF-SEG-01 |
| T-SEG-I03 | Admin lê `admin_audit_logs`; não-admin e `anon` não leem; ninguém escreve exceto `service_role` | RF-SEG-02 |
| T-SEG-E01 | `/admin/security` lista eventos para o admin | RF-SEG-02 |
| T-RL-I01 | `rate_limit_hit` incrementa de forma atômica sob concorrência (N chamadas paralelas, contagem exata) | RF-SEG-05 |
| T-RL-I02 | Excluir leads não altera contadores | RF-SEG-05 |
| T-RL-I03 | Função não executável por `anon`/`authenticated` | RF-SEG-05 |
| T-RL-U01 | Rota de contato: 429 ao exceder; fecha em erro de banco; tentativa rejeitada conta | RF-SEG-05 |

---

# Parte II — Módulo de leads (E2)

## 8. Arquitetura

### 8.1 Atual

`leads/page.tsx` (Server Component) → `select *` sem filtro → tabela e cards. Sem detalhe, status, notas, ações.

### 8.2 Proposta

```
/admin/leads?q&status&solution&archived&from&to&page&sort
   page.tsx → parseLeadListParams() → listAdminLeads() → LeadsList + Pagination
/admin/leads/[id]
   page.tsx → getLeadDetail(id) → LeadDetail
        ├─ LeadStatusForm       (updateLeadStatus)
        ├─ LeadNextActionForm   (setLeadNextAction)
        ├─ LeadNotes            (addLeadNote)  — append-only
        ├─ LeadTimeline         (lead_activity, somente leitura)
        ├─ ArchiveButton        (archiveLead / restoreLead)
        └─ DeleteLeadDialog     (deleteLead, confirmação digitada)
```

Reaproveita `parse…`, `escapeSearchTerm` e `Pagination` descritos no SDD CMS §4.2. Sem framework genérico.

## 9. Modelo de dados

### 9.1 `leads` (migration aditiva, DEC-10)

| Coluna | Tipo | Regra |
|---|---|---|
| `status` | `text NOT NULL DEFAULT 'new'` | CHECK em `new, in_review, contacted, qualified, closed` |
| `status_updated_at` | `timestamptz` | atualizado **somente** quando o status realmente muda, pelo trigger `BEFORE UPDATE` (§9.3); não é gravável pelo admin |
| `next_action` | `text` | ≤ 280 caracteres |
| `next_action_at` | `timestamptz` | opcional |
| `archived_at` | `timestamptz` | nulo = ativo |
| `updated_at` | `timestamptz NOT NULL DEFAULT now()` | atualizado pelo `update_updated_at()` **existente, sem alteração**, disparado por trigger `BEFORE UPDATE ... WHEN (OLD.* IS DISTINCT FROM NEW.*)`, de modo que uma atualização sem mudança real **não** altera `updated_at` (§9.3); não é gravável pelo admin |

`ADD COLUMN` com default constante é só de metadados: as 9 linhas existentes ficam `new`. **Nota de implementação (E2/A2, 23/10/2026):** `updated_at` é criado nulável, recebe `created_at` nos leads históricos por um único `UPDATE` executado antes de existir qualquer trigger (sem atividade, sem passar por `update_updated_at()`) e só então ganha `DEFAULT now()` e `NOT NULL`; o estado final é o da tabela acima. `status_updated_at` permanece `NULL` nos históricos. A migration também aborta (guard) se a 012 não tiver removido o acesso `anon`, sem substituir o PV-20. O CHECK é criado como `NOT VALID` e depois validado, para evitar varredura com bloqueio longo. Nenhuma coluna existente é alterada. `POST /api/contact` não muda (RF-LEAD-09).

Rótulos: Novo, Em análise, Contatado, Qualificado, Encerrado.

### 9.2 `lead_notes` (DEC-07)

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `lead_id` | `uuid NOT NULL` | FK → `leads(id)` **`ON DELETE CASCADE`** |
| `author_id` | `uuid` | FK → `auth.users(id)` `ON DELETE SET NULL` |
| `body` | `text NOT NULL` | CHECK `1 ≤ length ≤ 2000` |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | — |

Índice `(lead_id, created_at DESC)`.

### 9.3 `lead_activity` (histórico operacional)

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | `uuid` PK | — |
| `lead_id` | `uuid NOT NULL` | FK → `leads(id)` `ON DELETE CASCADE` |
| `actor_id` | `uuid` | FK → `auth.users(id)` `ON DELETE SET NULL` |
| `kind` | `text NOT NULL` | CHECK em `status_changed, next_action_changed, archived, restored` |
| `from_value`, `to_value` | `text` | preenchidos só para `status_changed` (valores de enum, não PII) |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | — |

**Separação em duas fases.** A atualização das colunas da própria linha (`status_updated_at`, `updated_at`, normalização) acontece na fase `BEFORE UPDATE`, que pode alterar `NEW`. A gravação de `lead_activity` acontece na fase `AFTER UPDATE`, que enxerga a linha final já com todas as alterações e restrições aplicadas e não pode mais modificá-la. Assim o histórico descreve exatamente o que foi gravado.

| Ordem | Trigger (nome ordena a execução) | Fase | Função | Condição | Faz |
|---|---|---|---|---|---|
| 1 | `leads_10_before_update` | `BEFORE UPDATE`, por linha, `SECURITY INVOKER` | função própria de `leads` | sempre | normaliza `next_action` (`trim`; vazio vira `NULL`); se `OLD.status IS DISTINCT FROM NEW.status`, `NEW.status_updated_at := now()`; caso contrário `NEW.status_updated_at := OLD.status_updated_at` |
| 2 | `leads_20_set_updated_at` | `BEFORE UPDATE`, por linha | **`update_updated_at()` existente, sem alteração** | `WHEN (OLD.* IS DISTINCT FROM NEW.*)` | `NEW.updated_at := now()` |
| 3 | `leads_30_activity` | `AFTER UPDATE`, por linha, `SECURITY DEFINER` | função própria de `leads` | `WHEN (OLD.* IS DISTINCT FROM NEW.*)` | insere as linhas de atividade (tabela abaixo) |

**Compatibilidade com `update_updated_at()`.** A função existente atribui `updated_at = now()` incondicionalmente; sozinha, tornaria toda escrita uma "mudança". A condição `WHEN (OLD.* IS DISTINCT FROM NEW.*)` do trigger 2 é avaliada **depois** do trigger 1 (os `BEFORE` rodam em ordem alfabética do nome e a cláusula `WHEN` enxerga o `NEW` já alterado pelo anterior), então `''` → `NULL`, mesmo valor e demais não-mudanças deixam `OLD` igual a `NEW` e `updated_at` intacto. A função existente não é modificada (ela continua servindo `posts` e `settings`). A ordem dos nomes e o comportamento do `WHEN` são validados por T-LEAD-I15 (PV-28).

**Cenários cobertos**

| Cenário | `updated_at` | `status_updated_at` | `lead_activity` |
|---|---|---|---|
| Mudança real de status | muda | muda | 1 `status_changed` |
| `UPDATE` sem nenhuma mudança (mesmos valores) | **não muda** | não muda | **nenhuma** |
| `next_action` `''` → `NULL` (ou espaços) | não muda | não muda | nenhuma |
| Mudança de `next_action` e `next_action_at` na mesma atualização | muda | não muda | 1 `next_action_changed` |
| Arquivar / restaurar | muda | não muda | `archived` / `restored` |
| `archived_at` de um valor não nulo para outro não nulo | muda | não muda | nenhuma |
| Escrita de `service_role` em coluna não monitorada (por exemplo, correção de `message`) | muda | não muda | nenhuma |
| Duas edições concorrentes com o mesmo `expectedUpdatedAt` | a primeira muda; a segunda recebe 0 linhas (conflito) | — | só a da primeira |

O trigger 3 insere a linha de atividade usando `auth.uid()` como `actor_id`. Isso impede que uma alteração aconteça sem histórico. O texto da próxima ação **não** é copiado para a atividade.

**Somente mudança real gera evento (RN-14).** A função do trigger 3 compara `OLD` e `NEW` com `IS DISTINCT FROM`, uma coluna por vez, e insere uma linha por mudança efetiva:

| Condição | Evento |
|---|---|
| `OLD.status IS DISTINCT FROM NEW.status` | `status_changed` (com `from_value` e `to_value`); o `status_updated_at` já foi ajustado na fase `BEFORE` |
| `OLD.next_action IS DISTINCT FROM NEW.next_action` ou `OLD.next_action_at IS DISTINCT FROM NEW.next_action_at` | **um** `next_action_changed` por atualização |
| `OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL` | `archived` |
| `OLD.archived_at IS NOT NULL AND NEW.archived_at IS NULL` | `restored` |
| `archived_at` passando de um valor não nulo para outro valor não nulo | nenhum (`archived`/`restored` exigem transição entre nulo e não nulo). É **mudança real**: `updated_at` é atualizado pelo trigger 2 e `status_updated_at` não muda |
| nenhuma coluna monitorada mudou | **nenhum evento** |

**Normalização antes de comparar:** `next_action` com apenas espaços ou vazio é gravado como nulo (a action e o trigger 1 normalizam do mesmo modo), de modo que `''` → `NULL` não conta como mudança. **A action não escreve** quando o valor pedido é igual ao atual: devolve `{ ok, unchanged: true }` sem `UPDATE`, sem mexer em `updated_at` e sem invalidar a trava otimista de quem está editando em paralelo. Os triggers são a segunda barreira, para escritas que não passem pela action.

**Trava otimista e precisão do `updated_at`.** O `updated_at` é `timestamptz` com **microssegundos**. O valor esperado (`expectedUpdatedAt`) trafega como **texto opaco**, exatamente como o PostgREST o devolveu, e é reenviado sem conversão; passar por `Date` do JavaScript (milissegundos) truncaria e causaria falso conflito. O `UPDATE ... WHERE updated_at = $expected` é serializado pelo bloqueio de linha: sob `READ COMMITTED`, a segunda transação reavalia o `WHERE` depois do commit da primeira e encontra 0 linhas.

**A função do trigger 3 é `SECURITY DEFINER`** (dono privilegiado, `search_path` fixo, sem `EXECUTE` para API; funções de trigger não são chamáveis como RPC). Motivo: se fosse `SECURITY INVOKER`, o admin precisaria de `INSERT` direto em `lead_activity`, e a tabela deixaria de ser confiável (um admin poderia fabricar histórico pela API). Com `DEFINER`, o `authenticated` **não** tem `INSERT` na tabela. É a única função `DEFINER` do módulo (os triggers 1 e 2 são `INVOKER`), escolha deliberada que contraria o padrão `INVOKER` por esse motivo (verificada por T-LEAD-I11).

### 9.4 RLS e privilégios

| Tabela | `anon` | `authenticated` admin | `authenticated` não-admin | `service_role` |
|---|---|---|---|---|
| `leads` | nada | `SELECT`, `UPDATE`, `DELETE` | nada | tudo |
| `lead_notes` | nada | `SELECT`, `INSERT` (com `author_id = (select auth.uid())`) | nada | tudo |
| `lead_activity` | nada | `SELECT` apenas (o `INSERT` é feito pelo trigger `DEFINER`) | nada | tudo |

- Admin = `(select auth.uid()) IN (SELECT id FROM public.admin_users)`.
- Não há policy de `UPDATE` nem de `DELETE` em `lead_notes` e `lead_activity` para `authenticated`; os privilégios `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` e `TRIGGER` são revogados explicitamente (imutabilidade em duas camadas). Em `lead_activity`, `INSERT` também é revogado.
- Nenhuma policy `INSERT` para `authenticated` em `leads` (leads só entram pelo servidor); o privilégio `INSERT`, `TRUNCATE`, `REFERENCES` e `TRIGGER` de tabela também é revogado de `authenticated` em `leads`, por menor privilégio.
- **PRP-01:** `authenticated` perde o `UPDATE` de tabela em `leads` e recebe `UPDATE` apenas em `status, next_action, next_action_at, archived_at`. `status_updated_at` e `updated_at` **saem da lista**: são mantidos pelos triggers `BEFORE UPDATE` (que alteram `NEW` independentemente dos privilégios de coluna, já que estes valem para os alvos do comando e não para os triggers). Impede que um admin comprometido altere `name`, `email`, `message` ou forje as datas de controle. O princípio da PRP-01 (aprovada, condicionada à validação) não muda; a lista só foi ajustada à separação das fases.
- `ensure_rls` do remoto liga RLS em tabelas novas, mas não substitui as policies acima (EV-10).

## 10. Interfaces

### 10.1 Parâmetros de listagem

| Param | Regra | Padrão |
|---|---|---|
| `q` | 2–80 caracteres; busca em `name`, `company`, `email`, `message` (`ilike`, escape do SDD CMS §6.3) | vazio |
| `status` | um dos cinco valores | todos |
| `solution` | valores do formulário de contato; valores históricos fora da lista aparecem como "Outros" | todos |
| `archived` | `no` \| `only` \| `all` | `no` |
| `from`, `to` | datas de Brasília sobre `created_at` | vazio |
| `page` | como no CMS | 1 |
| `sort` | `recent` (`created_at DESC`) \| `next_action` (`next_action_at ASC NULLS LAST`) | `recent` |

Desempate por `id`. Página de 20 (PRP-03). Estados de tela: carregando, vazio, vazio filtrado, erro e normal, como no SDD CMS §6.6.

### 10.2 Server Actions

Todas: `requireAdmin()` → Zod com lista fixa de campos → sessão do admin e RLS → auditoria → `revalidatePath`.

| Action | Entrada | Saída |
|---|---|---|
| `updateLeadStatus` | `{ id, status, expectedUpdatedAt }` | `{ ok }` \| `{ conflict }` \| `{ error }` |
| `setLeadNextAction` | `{ id, nextAction?, nextActionAt?, expectedUpdatedAt }` | idem |
| `addLeadNote` | `{ id, body }` | `{ ok }` \| `{ error }` |
| `archiveLead` / `restoreLead` | `{ id, expectedUpdatedAt }` | idem |
| `deleteLead` | `{ id, confirmation }` | `{ ok }` \| `{ error }` (redireciona à lista em sucesso) |

**Sem mudança, sem escrita:** antes do `UPDATE`, a action compara o valor pedido (normalizado) com o atual; se igual, retorna `unchanged` sem escrever e sem auditar.

**Concorrência (RF-LEAD-10):** `UPDATE … WHERE id = $1 AND updated_at = $expected` com `.select('id')`; zero linhas → reler o lead; inexistente = "não encontrado", existente = conflito ("este lead foi alterado por outra pessoa; recarregue").

### 10.3 Exclusão permanente (RF-LEAD-07, DEC-09)

1. A tela de detalhe tem "Excluir permanentemente" (disponível com o lead ativo ou arquivado). Abre um diálogo que mostra o contexto e exige digitar a palavra **`EXCLUIR`** (maiúsculas, literal).
2. `deleteLead` valida a confirmação **no servidor** (não só no cliente).
3. Executa `delete().eq('id', id).select('id')` com a **sessão do admin** (nova policy `DELETE`).
4. **Sucesso = exatamente 1 linha devolvida.** Qualquer outro resultado é falha.
5. Só então grava `admin_lead_deleted`. Em falha grava `admin_lead_delete_failed` e mostra erro.
6. `lead_notes` e `lead_activity` saem por `CASCADE` (verificado por T-LEAD-I06).

Sem arquivamento prévio obrigatório (DEC-09, RN-05).

**Cópias residuais após a exclusão**

| Local | Conteúdo | Tratamento |
|---|---|---|
| `admin_audit_logs` | UUID do lead e nomes de campos; hash do e-mail do admin | Não identifica o titular. Retenção do log existente (dívida: política de retenção não definida) |
| `rate_limit_counters` | HMAC de e-mail/IP | Pseudonimizado; purga em até 2 dias |
| E-mail de notificação enviado ao RC2 via Resend | dados do lead | Fora do controle do banco; tratar na política de retenção (BL-01/L8) |
| Backups do Supabase | linhas excluídas até a rotação | Declarar na política de privacidade |
| Logs da Vercel | metadados de requisição | Declarar na política |

## 11. Segurança e autorização

- Sessão admin + RLS; **nenhum `service_role` no módulo de leads** (DEC-09).
- Toda action chama `requireAdmin()` e registra `admin_lead_action_denied` em negação.
- Lista fixa de campos por action (Zod) e privilégio de coluna (PRP-01) como defesa em profundidade.
- Busca com escape rigoroso (SDD CMS §6.3).
- Auditoria não contém nome, e-mail, telefone nem texto de nota; contém `resource_type='lead'`, `resource_id` e nomes de campos.
- Eventos: `admin_lead_status_changed`, `admin_lead_next_action_changed`, `admin_lead_note_added`, `admin_lead_archived`, `admin_lead_restored`, `admin_lead_deleted`, `admin_lead_delete_failed`, `admin_lead_action_denied`. Severidade `info`, exceto exclusão (`warn`) e falhas (`error`). O sanitizador de metadados existente deve ser conferido contra estas chaves no plano.
- O telefone continua abrindo `wa.me` como canal auxiliar. Nenhuma integração com Zapbox.

## 12. Integridade

- `lead_notes` e `lead_activity` sempre ligadas a um lead existente (FK obrigatória).
- Imutabilidade garantida por ausência de policy e privilégio revogado.
- Uma alteração em `leads` sem linha de atividade é impossível (trigger na mesma transação).
- Autoria: `author_id` forçado pela policy; se o usuário for removido, fica nulo e a nota permanece.
- Estado de arquivo e status são independentes (RN-04).

## 13. Falhas e recuperação

| Falha | Comportamento |
|---|---|
| Consulta de lista falha | estado de erro, nunca lista vazia |
| Conflito de edição | mensagem de conflito, sem sobrescrever |
| Exclusão devolve 0 linhas ou erro | erro ao usuário; `admin_lead_delete_failed`; sem evento de sucesso |
| Escrita de auditoria falha | engolida por design (EV-21); a operação não é desfeita; `console.error` sem PII |
| Trigger de atividade falha | a alteração inteira é revertida (mesma transação) |
| Nota excede limite | validação Zod, mensagem de campo |
| Admin removido da tabela | RLS nega; action registra negação |

## 14. Observabilidade

Eventos de auditoria do §11; `console.error` com código do Postgres e `resource_id`, nunca conteúdo; indicador de leads com próxima ação vencida na lista (RF-LEAD-05). O dashboard de contagens não muda.

## 15. Matriz de testes da Parte II

### Unitários

| ID | Teste | Requisito |
|---|---|---|
| T-LEAD-U01 | Zod: status, tamanho de `next_action`, tamanho e conteúdo de nota | RF-LEAD-03..05 |
| T-LEAD-U02 | Conflito otimista: 0 linhas + lead existente = conflito; inexistente = não encontrado | RF-LEAD-10 |
| T-LEAD-U03 | `deleteLead`: exige `EXCLUIR` literal; 0 linhas e erro não geram sucesso | RF-LEAD-07 |
| T-LEAD-U04 | `parseLeadListParams` e escape de busca | RF-LEAD-01 |
| T-LEAD-U05 | Metadados de auditoria não contêm PII (nome, e-mail, telefone, texto de nota) | RF-LEAD-08 |
| T-LEAD-U06 | Rótulos da tela de leads sem "diagnóstico" | RF-LEAD-11 |
| T-LEAD-U07 | Indicador de próxima ação vencida | RF-LEAD-05 |
| T-LEAD-U08 | Action com valor igual ao atual retorna `unchanged` sem `UPDATE` e sem auditoria; normalização de `next_action` | RF-LEAD-08 |
| T-LEAD-U09 | `expectedUpdatedAt` trafega como texto opaco: um valor com microssegundos é reenviado sem perda e nunca passa por `Date` | RF-LEAD-10 |

### Integração (ambiente isolado)

| ID | Teste | Requisito |
|---|---|---|
| T-LEAD-I01 | `anon` sem acesso a `leads`, `lead_notes`, `lead_activity` | RF-SEG-01, RF-LEAD-04 |
| T-LEAD-I02 | `authenticated` não-admin sem acesso às três tabelas | RF-LEAD-04 |
| T-LEAD-I03 | Admin lê e atualiza `leads`; coluna fora da lista de PRP-01 é rejeitada | RF-LEAD-03 |
| T-LEAD-I04 | Admin exclui lead pela sessão; não-admin não exclui | RF-LEAD-07 |
| T-LEAD-I05 | Notas: `INSERT` com `author_id` alheio é negado; `UPDATE` e `DELETE` negados | RF-LEAD-04 |
| T-LEAD-I06 | Excluir lead remove `lead_notes` e `lead_activity` (cascade com RLS ativa) | RF-LEAD-07 |
| T-LEAD-I07 | Migration sobre linhas existentes: todas `new`, nenhuma coluna antiga alterada | RF-LEAD-09 |
| T-LEAD-I08 | Trigger registra atividade para status, próxima ação, arquivar e restaurar | RF-LEAD-08 |
| T-LEAD-I12 | `UPDATE` sem mudança real (mesmo status, mesma próxima ação, `''` → `NULL`, mesmo valor após normalização) não gera nenhum evento de atividade **e não altera `updated_at` nem `status_updated_at`**. Caso distinto, na mesma verificação: `archived_at` de um valor não nulo para **outro** não nulo é mudança real — **atualiza `updated_at`**, não altera `status_updated_at` e não gera `archived` nem `restored` | RF-LEAD-08 |
| T-LEAD-I13 | Mudança simultânea de `next_action` e `next_action_at` gera um único `next_action_changed` | RF-LEAD-08 |
| T-LEAD-I14 | **Concorrência:** duas atualizações paralelas com o mesmo `expectedUpdatedAt` — uma tem sucesso, a outra recebe 0 linhas (conflito) e não sobrescreve; um `UPDATE` sem mudança feito entre a leitura e a escrita **não** causa conflito falso | RF-LEAD-10 |
| T-LEAD-I15 | **Compatibilidade das fases:** a ordem `leads_10` → `leads_20` → `leads_30` se mantém; a cláusula `WHEN` do trigger 2 enxerga a normalização do trigger 1; mudança real de status ajusta `status_updated_at` e `updated_at` e gera 1 atividade; escrita de `service_role` em coluna não monitorada ajusta `updated_at` sem atividade; `update_updated_at()` continua servindo `posts` e `settings` sem alteração | RF-LEAD-08 |
| T-LEAD-I16 | O admin não consegue gravar `updated_at` nem `status_updated_at` diretamente (privilégio de coluna, PRP-01) | RF-LEAD-03 |
| T-LEAD-I09 | Constraint rejeita status inválido | RF-LEAD-03 |
| T-LEAD-I10 | Remover usuário zera `author_id` e preserva a nota | RF-LEAD-04 |
| T-LEAD-I11 | Admin **não** consegue inserir, alterar nem excluir linhas de `lead_activity` pela API; só o trigger escreve | RF-LEAD-08 |

### E2E

| ID | Teste | Requisito |
|---|---|---|
| T-LEAD-E01 | Filtros, busca e paginação na URL; arquivados fora da visão padrão | RF-LEAD-01 |
| T-LEAD-E02 | Detalhe: mudar status, nota, próxima ação | RF-LEAD-02..05 |
| T-LEAD-E03 | Arquivar e restaurar mantêm o status | RF-LEAD-06 |
| T-LEAD-E04 | Exclusão sem confirmação não exclui; com confirmação exclui sem arquivamento prévio | RF-LEAD-07 |
| T-LEAD-E05 | Formulário de contato continua criando lead e e-mail | RF-LEAD-09 |

## 16. Migração, operação e rollback (E2)

| Artefato | Conteúdo |
|---|---|
| `preflight` | colunas atuais de `leads` conferem com EV-11; ausência das novas colunas e tabelas; contagem de linhas; função `update_updated_at()` presente |
| `apply` | colunas, constraint `NOT VALID` + validação, tabelas, índices, os três triggers de `leads` (`leads_10_before_update`, `leads_20_set_updated_at`, `leads_30_activity`), policies, privilégios, privilégio de coluna |
| `verify` | todas as linhas com `status='new'`; policies e privilégios esperados; constraint validada |
| `rollback` | remover os três triggers, policies, `lead_activity`, `lead_notes` e colunas novas (a função `update_updated_at()` permanece, pois serve `posts` e `settings`) |

**Ordem de implantação:** ambiente isolado + T-LEAD-I* → produção (autorizada) → deploy. **Rollback:** reverter o deploy, depois executar `rollback`. Atenção: remover as tabelas apaga notas e histórico; o `README` exige exportar antes, se já houver uso real. O rollback **não** restaura permissão `anon` (§5.3).

## 17. Dependências e bloqueios

| Item | Situação |
|---|---|
| DEP-01 ambiente isolado | necessário (E0a) |
| **E1 → E2** | E2 usa os utilitários de lista (parâmetros, escape de busca, paginação) entregues pela E1 (SDD CMS §4.2). E2 só começa depois da E1. |
| **E0b.2 e E0b.3 → E2** | Os testes de RLS de E2 assumem `anon` sem acesso a `leads` e auditoria legível; ambas precisam estar aplicadas no ambiente de teste. Não é dependência de código. |
| **E0b.1 → E0c** | E0c cria job de `pg_cron`; o preflight confirma a extensão. |
| **E0b.4 → E0c** | Ambas alteram `api/contact/route.ts`; E0c vem depois, sobre o resultado de E0b.4. |
| BL-04 suíte de RLS verde | bloqueia o merge de E0b, E0c e E2 |
| BL-06 Turnstile em Production e Preview | bloqueia E0b.4 |
| BL-09 preflight remoto | bloqueia E0b |
| PV-20 consumidores externos da anon key | bloqueia E0b.2 |
| Política de retenção de leads (L8, no BL-01) | **não** bloqueia E2; exclusão manual existe, expurgo automático está fora do escopo |
| PRP-01 | **aprovada, condicionada à validação dos privilégios** (PV-06, T-LEAD-I03): o merge da E2 depende desse teste verde |
| PRP-02 | **aprovada provisoriamente**; valores de contato (3/h) mantêm o comportamento atual e se calibram depois |
| PRP-03 | aprovada |
| Branch de tracking | E0b.4 e E0c alteram `api/contact/route.ts`, que a branch de tracking também altera; empilhar sem alterá-la |

## 18. Alternativas descartadas

| Alternativa | Motivo |
|---|---|
| Uma coluna de texto para notas | sem histórico nem autoria |
| Registrar status e notas em `admin_audit_logs` | mistura histórico operacional com log de segurança (sanitizado, sem PII, retenção própria) |
| Excluir com `service_role` | amplia a superfície; a sessão admin com RLS basta (DEC-09) |
| Exigir arquivamento antes de excluir | rejeitado pela revisão de engenharia |
| Manter o limite de contato contando `leads` | exclusão reabre a janela e acopla dado pessoal à tabela de negócio |
| Reverter a remoção de `anon` recriando a policy | proibido por DEC-08 |
| Pipeline, responsável, SLA, e-mail pelo painel | fora do escopo (não é CRM) |
| Reorganizar as duas pastas de migrations | fora do escopo |
