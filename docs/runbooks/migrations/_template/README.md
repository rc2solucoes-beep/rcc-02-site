# Migration NNN — <nome>

| Campo | Valor |
|---|---|
| Requisito(s) | RF-… |
| Decisão(ões) | DEC-… |
| Entrega | E… |
| Arquivo de aplicação (`apply`) | `supabase/migrations/NNN_<nome>.sql` (idempotente) |
| Depende de | NNN-… |
| Janela e impacto | … |
| Risco | … |
| Quem aplica | … |
| Quem autoriza | … |

## Autorização (preencher antes de aplicar em cada ambiente)

| Ambiente | Autorizado por | Data | Observação |
|---|---|---|---|
| Isolado (teste) | | | |
| Produção | | | |

## Ordem

1. `preflight.sql` (somente leitura, `BEGIN READ ONLY`) → estado esperado confirmado.
2. Revisão **humana** do `apply`, do `preflight`, do `verify` e do `rollback` por um segundo engenheiro. O lint automático de SQL é complementar e **não** substitui essa revisão nem a transação `READ ONLY`.
3. `apply` no ambiente isolado → `verify.sql` → testes de integração.
4. Autorização explícita → `apply` em produção → `verify.sql`.
5. Registro em `docs/runbooks/migrations/REGISTRO.md` e evidências anexadas.

## Evidências

Saídas de `preflight.sql` e `verify.sql` (sem segredos) e resultado dos testes.

## Reversão

Ver `rollback.sql`. Registre aqui se a reversão é **segura**, **parcial** ou **intencionalmente indisponível** (por exemplo, quando a migration remove uma permissão insegura: o rollback **não** recria a permissão). Declare também o **ponto de não retorno**.
