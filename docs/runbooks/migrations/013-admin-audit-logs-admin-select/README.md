# Migration 013 — leitura administrativa de `admin_audit_logs`

| Campo | Valor |
|---|---|
| Requisito(s) | RF-SEG-02 |
| Decisão(ões) | DEC-03 |
| Entrega | E0b.3 |
| Arquivo de aplicação (`apply`) | `supabase/migrations/013_admin_audit_logs_admin_select.sql` (idempotente) |
| Depende de | E0b.1 (preflight remoto). Independente da 012 |
| Janela e impacto | Instantâneo. Admin passa a ver os eventos em `/admin/security` (que lê com a sessão do usuário); `anon` e não-admin continuam sem acesso; `anon` e `authenticated` perdem escrita |
| Risco | Baixo. A escrita do aplicativo usa `service_role` (`auditLog.ts`, `securityAlerts.ts`) e não é afetada |
| Quem aplica | A definir pelo responsável |
| Quem autoriza | Responsável pelo ambiente |

## Pontos de atenção

- **Índices duplicados:** o `apply` cria os três índices pelo **nome** da migration 009. Se o preflight mostrar índices equivalentes com outro nome, não aplique sem decidir; `IF NOT EXISTS` não detecta equivalência por definição.
- **Tabela `idx02_links_backup_*`:** fora do escopo (DT-07). Não é tocada.
- **Policies de bloqueio da 009** (INSERT/UPDATE/DELETE com `false`), se existirem, ficam como estão; a revogação de privilégios as torna redundantes.

## Autorização (preencher antes de aplicar em cada ambiente)

| Ambiente | Autorizado por | Data | Observação |
|---|---|---|---|
| Isolado (teste) | Operador | 17/10/2026 | Aplicada manualmente no SQL Editor de `rc2-test-isolated` |
| Produção (`RCC-02`) | Operador, autorização específica | 25/10/2026 | Aplicada manualmente no SQL Editor; `verify.sql` conforme (valores informados). Evidência: `docs/runbooks/evidence/E2-producao-012-013-015-2026-10-25.md` |

## Ordem

1. `preflight.sql` (somente leitura) → estado esperado; anexe a saída.
2. Revisão humana de `apply`, `preflight`, `verify` e `rollback`.
3. `apply` no ambiente isolado → `verify.sql` → `npm run test:integration` (inclui `tests/integration/rls/e0b-security.test.ts`).
4. Autorização explícita → `apply` em produção → `verify.sql` → abrir `/admin/security` como admin.
5. Registro em `migrations/REGISTRO.md`.

## Evidências

**Ambiente isolado (`rc2-test-isolated`), 17/10/2026** — aplicada manualmente pelo operador no SQL Editor; sem erro. `verify.sql`: índices `actor_user_id`, `created_at` e `event` presentes. `npm run test:integration`: 2 arquivos, 9 testes aprovados; matriz E0b 29/29 sem divergência.

**Produção (`RCC-02`): APLICADA em 25/10/2026**, por declaração do operador. Ver `docs/runbooks/evidence/E2-producao-012-013-015-2026-10-25.md` e `migrations/REGISTRO.md`.

Evidência completa: `docs/runbooks/evidence/E0b-2026-10-17.md`.

## Reversão

**Segura e parcial.** O `rollback.sql` remove apenas a policy de `SELECT` (volta ao deny-all, estado seguro) e **não** restaura os privilégios de escrita revogados nem recria índices removidos. Efeito: o painel deixa de listar eventos até a policy voltar. Ponto de não retorno: não há.
