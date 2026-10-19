# Registro de migrations aplicadas manualmente

O histórico de migrations do Supabase **está vazio** (`supabase_migrations` não existe) porque tudo foi aplicado à mão (`docs/07-supabase-migration-baseline.md`). Este arquivo é o registro oficial a partir de agora.

Preencha **uma linha por aplicação por ambiente**, no mesmo PR da migration.

| Migration | Ambiente | Data | Aplicado por | Autorizado por | Preflight | Verify | Evidência |
|---|---|---|---|---|---|---|---|
| 012_leads_remove_anon_access | isolado (`rc2-test-isolated`) | 17/10/2026 | Operador (SQL Editor, manual) | Operador | informado (E0b.1) | ok (`relrowsecurity`, `auth_sel`, `auth_upd`) | `docs/runbooks/evidence/E0b-2026-10-17.md` |
| 013_admin_audit_logs_admin_select | isolado (`rc2-test-isolated`) | 17/10/2026 | Operador (SQL Editor, manual) | Operador | informado (E0b.1) | ok (3 índices) | `docs/runbooks/evidence/E0b-2026-10-17.md` |
| 012 e 013 | **produção** | — | **não aplicadas** | — | — | — | Bloqueio: PV-20 (012); autorização pendente |
| 014_posts_sort_at | isolado e produção | — | **não aplicada** (preparada) | — | — | — | `docs/runbooks/migrations/014-posts-sort-at/README.md`; preflight de produção NÃO autorizado |
