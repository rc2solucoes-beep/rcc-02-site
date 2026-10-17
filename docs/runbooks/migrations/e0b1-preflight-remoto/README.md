# E0b.1 — Preflight remoto (somente leitura)

**Estado: EXECUTADO (resultado informado pelo operador).** PV-01 e PV-02 confirmadas; PV-03: cron presente e ativo, `bootstrap_first_admin` ausente; PV-04: `pg_cron` e `pgcrypto` presentes, **`pg_net` ausente**; **PV-20 pendente** (impede a 012 em produção). Detalhes em `docs/runbooks/evidence/E0b-2026-10-17.md`.

| Campo | Valor |
|---|---|
| Premissas cobertas | PV-01, PV-02, PV-03, PV-04 (PV-20 e PV-07 dependem do dono) |
| Arquivo | `preflight.sql` (`BEGIN READ ONLY` … `ROLLBACK`; passa no lint do runbook) |
| Quem executa | Responsável, ou agente com autorização explícita, no SQL Editor |
| Onde | Produção (para confirmar o snapshot histórico) e, se desejado, o ambiente isolado (para compará-lo) |

## Como usar

1. Obtenha autorização explícita por escrito para executar consultas de catálogo no ambiente.
2. Execute `preflight.sql` inteiro. Se o bloco 8 falhar por ausência de `pg_cron`, remova esse bloco e registre a PV-04 como divergente.
3. Guarde a saída (sem segredos) no README da 012 e da 013, como evidência do estado anterior. **Nunca** use a saída para restaurar permissões.

## Como interpretar

| Bloco | Esperado | Se divergir |
|---|---|---|
| 1 | `leads_anon_insert` em `leads`; nenhuma policy de SELECT em `admin_audit_logs` | A 012/013 são idempotentes; registre o que existe |
| 2 | RLS ligado em todas | Parar: RLS desligado é achado de segurança separado |
| 3 e 4 | Grants padrão do Supabase | Informativo; alvo da 012/013 |
| 5 | `bootstrap_first_admin` e `rls_auto_enable` presentes | Registrar; não bloqueia 012/013 |
| 6 | `ensure_rls` presente | Informativo (EV-10) |
| 7 e 8 | `pg_cron`, `pg_net`, `pgcrypto`; job `publish-scheduled-posts` ativo a cada 5 min | `pg_cron` ausente bloqueia a E0c, não a 012/013 |
| 9 | Índices parciais (EV-09) | Se houver índice equivalente com outro nome, decidir antes da 013 |
| 10 e 11 | Informativos | — |

## O que depende do resultado

- **012:** bloco 1 (existência de `leads_anon_insert`) e bloco 3 (privilégios) para a evidência anterior. Bloqueio de aplicação: PV-20.
- **013:** blocos 1, 9 e a policy de `admin_users` (bloco 1) que sustenta o subselect.
- **E0c:** blocos 7 e 8 (`pg_cron`).
- **Snapshot histórico:** blocos 1 a 8 confirmam ou corrigem `docs/07-supabase-migration-baseline.md`.
