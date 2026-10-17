# Migration 012 — remover acesso `anon` a `leads`

| Campo | Valor |
|---|---|
| Requisito(s) | RF-SEG-01 |
| Decisão(ões) | DEC-08 |
| Entrega | E0b.2 |
| Arquivo de aplicação (`apply`) | `supabase/migrations/012_leads_remove_anon_access.sql` (idempotente) |
| Depende de | E0b.1 (preflight remoto) executado e interpretado |
| Janela e impacto | Instantâneo. `anon` perde qualquer acesso a `public.leads`. `POST /api/contact` não é afetado (usa `service_role`) |
| Risco | Baixo no código (EV-07: nenhum código usa a chave anônima para `leads`). **Bloqueio de aplicação: PV-20** |
| Quem aplica | A definir pelo responsável |
| Quem autoriza | Responsável pelo ambiente |

## Bloqueio de aplicação — PV-20

Antes de aplicar em **qualquer** ambiente com dados reais, o dono confirma por escrito que nenhum script, automação ou integração externa (por exemplo n8n) insere em `leads` com a chave anônima. A busca no repositório já foi feita (EV-07); falta a confirmação do que está fora dele.

## Autorização (preencher antes de aplicar em cada ambiente)

| Ambiente | Autorizado por | Data | Observação |
|---|---|---|---|
| Isolado (teste) | Operador | 17/10/2026 | Aplicada manualmente no SQL Editor de `rc2-test-isolated` |
| Produção | | | |

## Ordem

1. `preflight.sql` (somente leitura) → estado esperado. Anexe a saída abaixo, como evidência do estado anterior.
2. Revisão humana de `apply`, `preflight`, `verify` e `rollback`.
3. `apply` no ambiente isolado → `verify.sql` → `npm run test:integration` (inclui `tests/integration/rls/e0b-security.test.ts`).
4. Confirmação de PV-20 e autorização explícita → `apply` em produção → `verify.sql`.
5. Registro em `migrations/REGISTRO.md`.

## Evidências

**Ambiente isolado (`rc2-test-isolated`), 17/10/2026** — aplicada manualmente pelo operador no SQL Editor; sem erro. `verify.sql`: `relrowsecurity=true`, `auth_sel=true`, `auth_upd=true`. `npm run test:integration`: 2 arquivos, 9 testes aprovados; matriz E0b 29/29 sem divergência.

**Produção: NÃO aplicada.** Bloqueio: PV-20 pendente.

Evidência completa: `docs/runbooks/evidence/E0b-2026-10-17.md`.

Saída do preflight (estado anterior, só para auditoria — **nunca** usada para restaurar permissões):

## Reversão

**Intencionalmente indisponível.** O `rollback.sql` não executa DDL e não recria `leads_anon_insert` nem qualquer escrita para `anon`. Se um consumidor inesperado quebrar, corrija-o para usar a rota do servidor (`service_role`). Escrita pública excepcional exige nova decisão registrada e um mecanismo de menor privilégio, nunca `WITH CHECK (true)`.

Ponto de não retorno: não há; reverter o PR de código não depende do banco.
