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
