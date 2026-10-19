# Migration 014 — pacote para revisão humana (segundo engenheiro)

| Campo | Valor |
|---|---|
| Branch | `feat/admin-e1-cms` |
| Estado | **PREPARADA. NÃO APLICADA em nenhum ambiente.** Nenhum SQL deste diretório foi executado |
| Revisão humana independente | **PENDENTE** |
| C14 Via A (verificação independente do ambiente isolado) | **PENDENTE** |
| E1-REV-EX01 (exceção ao gate de revisão) | **PROPOSTA — NÃO APROVADA** (`E1-REV-EX01.md`) |
| E1-C14-EX01 (C14 Via B para a E1) | **PROPOSTA — NÃO APROVADA** (`E1-C14-EX01.md`) |
| Revisão técnica por IA (Fase A) | Feita; checagem adicional, **não** é revisão humana independente |
| Validação no banco (PV-17, D2, PV-14, D3) | **PENDENTE** (nada foi executado em banco) |

## Três coisas diferentes (não confundir)

| Camada | O que é | Estado |
|---|---|---|
| Revisão técnica por IA | Leitura e testes unitários/estáticos feitos pelo agente em 2026-10-19 | Concluída; não satisfaz o gate |
| Exceções propostas | E1-REV-EX01 e E1-C14-EX01: pedidos formais de dispensa, com controles compensatórios | Propostas; só valem após decisão formal do responsável |
| Validação no banco | Preflight, apply, verify e testes de integração no isolado | Não iniciada; Fase B bloqueada |

Uma exceção aprovada substitui o gate correspondente com risco aceito; **não** o transforma em "atendido" e **não** substitui a validação no banco.

Este documento não contém identificadores de produção, credenciais nem valores de variáveis de ambiente.

## 1. O que a migration faz

Arquivo: `supabase/migrations/014_posts_sort_at.sql`. Dois objetos em `public.posts`:

1. Coluna `sort_at timestamptz GENERATED ALWAYS AS (…) STORED NOT NULL`:
   - `published` → `coalesce(published_at, created_at)`
   - `scheduled` → `coalesce(scheduled_publish_at, updated_at)`
   - demais → `updated_at`
2. Índice `posts_sort_at_id_idx (sort_at DESC, id DESC)`.

`sort_at` é dado derivado e não é gravável. Tudo roda em `BEGIN … COMMIT`, com `SET LOCAL lock_timeout = '5s'`.

## 2. Dependência histórica de `add_blog_seo_fields.sql`

`scheduled_publish_at` e o CHECK de `status` com `'scheduled'` **não** vêm de `supabase/migrations/001–013`. Vêm de `migrations/add_blog_seo_fields.sql` (raiz do repo, não idempotente, aplicada fora da pasta de migrations). A migration 002 cria o CHECK apenas com `draft/published/archived`.

Consequências:
- Se o alvo não tiver essa dependência, o `ALTER` falha por coluna inexistente e a transação reverte sem dano.
- O preflight itens 2 e 4 detectam a ausência. O item 7 abortaria a transação `READ ONLY` (falha fechada).
- O runbook do ambiente isolado já coloca esse arquivo no passo 3 do snapshot. Confirmar que foi aplicado.

## 3. Riscos de lock e transação

- `ADD COLUMN … GENERATED … STORED` reescreve a tabela com `ACCESS EXCLUSIVE`. O volume é pequeno (18 posts no snapshot de 13/10). `lock_timeout` de 5 s evita ficar na fila atrás de uma transação longa, como o job do cron. Se estourar, repetir.
- `CREATE INDEX` não é `CONCURRENTLY`: bloqueia escritas durante a construção, o que é irrelevante nesse volume. `CONCURRENTLY` não é possível dentro de transação.
- `IF NOT EXISTS` não valida a definição de uma coluna ou índice preexistente. O preflight exige que ambos não existam.
- A tabela é reescrita: validar a execução do `BEGIN/COMMIT` explícito no SQL Editor do Supabase. **Depende do PostgreSQL real.**
- Efeito de ordem: a migration deve ir **antes** do código que a usa.

## 4. Estratégia de rollback

`rollback.sql`: `DROP INDEX IF EXISTS` e depois `DROP COLUMN IF EXISTS sort_at`, em transação com `lock_timeout`. Nada se perde (dado derivado). **Ordem obrigatória: reverter o deploy do código antes**, senão a listagem do CMS passa ao estado de erro. Não há ponto de não retorno. Em caso de falha do verify, não aplicar o rollback sem decisão registrada.

## 5. Preservação de policies, grants, triggers e cron

Por inspeção, a migration não contém `POLICY`, `GRANT`, `REVOKE`, `DROP`, DML nem referência a `cron.` (também travado por `tests/unit/ops/e1Migrations.test.ts`).

- Trigger `posts_updated_at` (`BEFORE UPDATE`): colunas geradas são calculadas depois dos triggers `BEFORE`, então `sort_at` fica coerente com o `updated_at` final.
- Cron `publish-scheduled-posts`: o `UPDATE` do job continua válido; ao publicar, `sort_at` é recalculado.
- Comprovação em banco: `preflight.sql` itens 5, 10 e 11 (antes) contra `verify.sql` itens 7, 8 e 9 (depois). Comparação manual, sem diff automático.

## 6. Testes de integração previstos

`tests/integration/rls/e1-posts-sort-at.test.ts`, via `npm run test:integration`, só após o verify. **Escrevem no banco isolado** (posts e usuários sintéticos, com limpeza registrada).

| Teste | Cobre |
|---|---|
| T-CMS-I01 | `sort_at` conforme a tabela de verdade, nunca nulo (PV-17) |
| T-CMS-I02 | desempate por `id` na mesma direção |
| T-CMS-I03 | busca literal com entradas hostis, inclusive 9 casos de regex com `*` e falsos positivos (D2) |
| T-CMS-I04 | seleção da lista não devolve `content` |
| T-CMS-I05 | `UPDATE` equivalente ao do cron recalcula `sort_at` (PV-14, parcial) |
| T-CMS-I06 | RLS com a coluna nova |
| T-CMS-I07 | `sort_at` não é gravável |
| T-CMS-I08 | página além do total (D3) |

Mais a regressão RLS existente. Os testes E2E de escrita continuam pendentes (EX-4).

## 7. Pendências

| ID | Situação |
|---|---|
| D2 | **Aberta.** A premissa de que o `ilike` do PostgREST converte `*` em `%` sem escape é hipótese. Só T-CMS-I03 no banco decide. Se falhar: contingência RPC (`contingencia-rpc-busca.sql`) vira migration 015, **somente com decisão expressa**. Ver `DECISAO-D2.md` |
| PV-17 | Aberta. Aceitação do DDL pelo PostgreSQL e exposição de `sort_at` pelo PostgREST (se `PGRST204`: `NOTIFY pgrst, 'reload schema';`) |
| PV-14 | Aberta, parcial. O I05 reproduz o `UPDATE` via supabase-js, não executa o job real |
| D3 | Aberta. Esperado `PGRST103` (416) ou lista vazia |
| PV-13 | Só em produção. **Não autorizado** |

## 8. Checklist para o revisor humano

Marcar cada item no momento da revisão. Nenhum está marcado por quem preparou o pacote.

### 8.1 `supabase/migrations/014_posts_sort_at.sql` (apply)
- [ ] Nomes de objetos e schema (`public.posts`, `posts_sort_at_id_idx`) corretos
- [ ] Expressão imutável (sem cast timestamptz→texto, sem função volátil)
- [ ] `NOT NULL` coerente com `created_at`/`updated_at` `NOT NULL`
- [ ] `lock_timeout` dentro da transação; `COMMIT` presente
- [ ] Nenhuma policy, grant, trigger, função ou cron tocados
- [ ] Sem conflito com 001–013 e com `add_blog_seo_fields.sql`
- [ ] Idempotência entendida, inclusive o limite do `IF NOT EXISTS`

### 8.2 `preflight.sql`
- [ ] Transação `BEGIN READ ONLY` e `ROLLBACK` final
- [ ] Itens 2 e 4 batem com o esquema esperado (6 colunas; CHECK com `draft, scheduled, published`)
- [ ] Item 3 detecta `sort_at` e índice já existentes
- [ ] Item 11 registra a definição completa das policies (nome, permissividade, papéis, comando, qual, with_check) e o `impressao_md5`
- [ ] Contagens sem ler `content`

### 8.3 `verify.sql`
- [ ] Transação `READ ONLY`
- [ ] Itens 1 a 4 comprovam geração, `NOT NULL`, expressão, divergência zero e índice válido
- [ ] Itens 5 a 9 comprovam índices antigos, total de linhas, cron e trigger
- [ ] Item 7 devolve `total_policies` e `impressao_md5` iguais ao item 11 do preflight (definição completa, não só nome e comando)
- [ ] Reconhecido: exposição pelo PostgREST **não** é verificada aqui (vem de I01, I04, I06)

### 8.4 `rollback.sql`
- [ ] Ordem índice → coluna
- [ ] Ordem de implantação exigida (código antes) documentada e aceita
- [ ] Sem `DROP TABLE` nem perda de dados

### 8.5 Geral
- [ ] README e `DECISAO-D2.md` coerentes com o que será executado
- [ ] Decisão registrada: onde o resultado do preflight será arquivado (sem IPs, tokens ou dados pessoais)

Revisor: ____________ Data: ____________ Resultado: ____________

## 9. Checklist C14 Via A (verificação independente do ambiente isolado)

Feita pelo dono da infraestrutura **ou por uma segunda pessoa que não configurou o `.env.test.local`**, conforme `docs/runbooks/ambiente-supabase-isolado.md`. Registrar só resultados, nunca refs de produção, URLs de produção ou chaves.

- [ ] 1. Nome e ref do projeto de teste conferem com `RC2_TEST_PROJECT_REF`; não é o projeto de produção
- [ ] 2. Chaves do painel desse projeto conferem com as do `.env.test.local` (quatro últimos caracteres; nunca colar chaves)
- [ ] 3. Chaves `sb_…` (opacas): registrado que a guarda não as inspeciona e que este item é a única verificação direta
- [ ] 4. `RC2_PRODUCTION_PROJECT_REF` contém o ref real de produção
- [ ] 5. `.env.test.local` sem URL de produção; allowlist só com refs de teste
- [ ] 6. Marcador `__rc2_isolated_test_env__` existe no projeto de teste com o valor correto (item K do `verify-baseline.sql`)
- [ ] 7. `add_blog_seo_fields.sql` aplicado no isolado (dependência da seção 2)
- [ ] 8. Sem variáveis `RC2_*` divergentes no shell (a suíte recusa com `env_conflict`)

Verificador: ____________ Data: ____________ Resultado: ____________

A Via A não dispensa a autorização expressa e separada da execução da suíte.
