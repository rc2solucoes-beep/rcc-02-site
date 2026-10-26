# Migration 016 — Suspender a exclusão definitiva de leads (E2)

**ESTADO: APLICADA MANUALMENTE EM PRODUÇÃO (`RCC-02`), por declaração do operador (verify 16/16). No isolado, só o estado pós-016 foi verificado; a origem da aplicação lá não foi comprovada. NÃO EXECUTAR SQL SEM AUTORIZAÇÃO ESPECÍFICA POR AMBIENTE; NÃO REAPLICAR (o guard aborta).**

| Campo | Valor |
|---|---|
| Escopo | Mitigação P1-2 da PR #43 (E2): impedir exclusão de leads pelo papel `authenticated` |
| Apply único | `supabase/migrations/016_leads_disable_delete.sql` |
| Dependências de SQL | **015** aplicada (e, por consequência, a **012**). O guard aborta se o estado final da 015 não estiver presente |
| Natureza | Subtrativa: `REVOKE DELETE … FROM authenticated` e `DROP POLICY leads_e2_admin_delete`. Nada é criado, concedido ou alterado em dados |
| Não toca | `SELECT`, UPDATE por coluna, RLS, triggers, funções, `lead_notes`, `lead_activity`, `anon`, `service_role`, o formulário de contato e nenhuma linha |
| Migration 015 | **Inalterada.** Seu `verify.sql` e suas evidências são o histórico do estado anterior |
| Alvos | Isolado primeiro; produção só após autorização própria |

## Por que existe

A 015 concedeu `DELETE` a `authenticated` e criou `leads_e2_admin_delete`. Um administrador autenticado poderia
excluir leads direto pela API do Supabase, **contornando a Server Action**. Como não há backup completo/PITR em produção,
e a exclusão leva notas e histórico por `ON DELETE CASCADE`, a exclusão definitiva fica suspensa **no banco** (esta migration)
e **na aplicação** (`LEADS_DELETE_ENABLED`, padrão bloqueado). As duas camadas são independentes: a variável sozinha não
reabilita nada.

## Ordem de execução (cada passo com autorização própria)

1. **Preflight** (`preflight.sql`, READ ONLY). Esperado: `RESULTADO = APROVADO` (14 checks). Arquivar a saída (inclui os
   `DIGEST-*` e `EVD-POLICY-DELETE-DEFINICAO`, o snapshot para recuperação). Não há dado pessoal na saída.
2. **Apply** (`016_leads_disable_delete.sql`), manual no SQL Editor, **em janela de baixo tráfego**. Esperado:
   `Success. No rows returned`. Qualquer aborto da transação (guard, `lock_timeout` de 5 s ou autoverificação) não aplica
   nada: **não contornar editando o SQL**; investigar o estado do alvo.
3. **Verify** (`verify.sql`, READ ONLY). Esperado: `RESULTADO = APROVADO` (16 checks). Arquivar a saída.
4. Registrar no `REGISTRO.md` **somente depois** de executada, com a autorização, o ambiente e o resultado informados.
5. Só então, no caso da produção: merge e deploy do código da E2.

## Integridade dos dados (leads existentes)

- A migration toma `ACCESS EXCLUSIVE` em `public.leads`, calcula **dentro da própria transação** a contagem e um hash
  (`md5` de cada linha, ordenado por `id`) antes e depois, e **aborta** se qualquer um mudar. Também compara as ACLs e policies
  de `lead_notes` e `lead_activity`, os triggers de `leads`, as policies preservadas e os privilégios de `service_role`.
- **Não comparar totais entre o preflight e o verify.** O formulário de contato pode receber leads legítimos entre as duas
  execuções. As linhas `VOLUME-LEADS` são informativas e não são critério de aprovação.
- Nenhum dado pessoal é lido para fora: só contagens e hashes.

## Compatibilidade com o verify histórico da 015

O `verify.sql` da **015 descreve o estado anterior à 016**. Depois dela ele **reprova de propósito** em dois checks:
`POS-23` (policies exatas de `leads`) e `POS-47` (`authenticated` só com `SELECT,DELETE`). **Não o reutilize como critério de
aprovação após a 016** e não altere seus resultados históricos. O critério da 016 é o `verify.sql` desta pasta.

## Impacto

- `ACCESS EXCLUSIVE` por milissegundos: o INSERT do `/api/contact` fica em fila nesse intervalo. Se o lock não vier em 5 s
  a migration falha (`55P03`) e nada é aplicado; repetir em janela de menor tráfego.
- A aplicação deixa de poder excluir leads pelo painel (e pela API). Arquivar e restaurar continuam funcionando.
- `service_role` mantém todos os privilégios (formulário de contato e limpeza de fixtures nos testes do isolado).

## Reabilitação futura do DELETE

A reabilitação **não** é um rollback e **não** se faz só com `LEADS_DELETE_ENABLED=true`. Exige, nesta ordem:

1. Decisão e autorização específicas (e, em produção, backup/PITR ou exportação verificada antes de excluir).
2. Uma **migration 017 nova**, com revisão, preflight e verify próprios, que recrie o `GRANT DELETE` e a policy, usando a
   definição guardada em `EVD-POLICY-DELETE-DEFINICAO` do preflight desta pasta (e `015_leads_management.sql`, linhas do
   `GRANT` e da policy `leads_e2_admin_delete`).
3. Aplicação da 017 por ambiente, com autorização separada.
4. Só então `LEADS_DELETE_ENABLED=true` no ambiente e redeploy.

## Testes

- Unitários estáticos: `tests/unit/ops/e2Migration016.test.ts` (conteúdo da migration, ausência de `GRANT`, `anon` e de dados) e
  `tests/unit/ops/runbookTemplate.test.ts` (lint READ ONLY de `preflight.sql` e `verify.sql`).
- Integração (**somente no isolado**, depois de aplicar a 016 lá, com autorização): `RC2_E2_PHASE=post016`. Cobre DELETE negado
  para admin e não-admin (negação efetiva, registro preservado), `service_role` preservada, e as demais verificações da E2
  (notas, histórico, arquivamento, restauração, isolamento de usuários, UPDATE limitado). A fase `post015` continua válida
  **antes** da 016 e **não** deve ser executada depois dela.

## Evidências

- **Produção (`RCC-02`):** `docs/runbooks/evidence/E2-producao-016-2026-10-26.md` (verify 16/16, SHA-256 `2ca3d94cbca1f8a04fcf04c92e917df63a3c40908638e49b750372da5dc81265`; informado pelo operador, sem verificação independente).
- **Isolado:** estado pós-016 verificado (verify 16/16 e suíte `post016` 20 aprovados), sem prova de quem aplicou a 016 lá; ver a mesma evidência, §5.
