# Registro de migrations aplicadas manualmente

O histórico de migrations do Supabase **está vazio** (`supabase_migrations` não existe) porque tudo foi aplicado à mão (`docs/07-supabase-migration-baseline.md`). Este arquivo é o registro oficial a partir de agora.

Preencha **uma linha por aplicação por ambiente**, no mesmo PR da migration.

| Migration | Ambiente | Data | Aplicado por | Autorizado por | Preflight | Verify | Evidência |
|---|---|---|---|---|---|---|---|
| 012_leads_remove_anon_access | isolado (`rc2-test-isolated`) | 17/10/2026 | Operador (SQL Editor, manual) | Operador | informado (E0b.1) | ok (`relrowsecurity`, `auth_sel`, `auth_upd`) | `docs/runbooks/evidence/E0b-2026-10-17.md` |
| 013_admin_audit_logs_admin_select | isolado (`rc2-test-isolated`) | 17/10/2026 | Operador (SQL Editor, manual) | Operador | informado (E0b.1) | ok (3 índices) | `docs/runbooks/evidence/E0b-2026-10-17.md` |
| 012 e 013 | **produção** | — | **não aplicadas** | — | — | — | Bloqueio: PV-20 (012); autorização pendente |
| 014_posts_sort_at | isolado (`rc2-test-isolated`) | 19/10/2026 | Responsável (SQL Editor, manual) — **declaração do responsável, sem verificação do agente** | AUT-READ-E1 e AUT-APPLY-014 (utilizadas, por declaração) | aprovado, 0 posts (declarado) | 9 de 9 satisfatórias; policies: 2, `impressao_md5` 8953fc15d02f1bf67b61807687eb8e32 (declarado) | `docs/runbooks/evidence/E1-migration-014-isolado-2026-10-19.md`. PV-17, D2 e D3 encerradas em 19/10/2026 (ver evidência de execução); PV-14 parcial |
| 014_posts_sort_at | **produção** | 20/10/2026 (somente preflight) | **não aplicada** | AUT-READ-PROD-014 (só preflight READ ONLY; apply NÃO autorizado) | executado pelo responsável (declarado); item 03 confirmado pelo responsável (declarado) | — | `docs/runbooks/evidence/E1-preflight-producao-014-2026-10-20.md` — GO técnico preliminar, apply não autorizado. Dispensa formal PROD-014-REV-EX01 (20/10/2026, só 014/RCC-02; revisão independente NÃO realizada); backup PENDENTE |
