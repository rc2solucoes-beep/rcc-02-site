# Newsletter (E3) — estado da implementação

Fonte: `docs/superpowers/specs/2026-10-13-newsletter-design.md`. Migration `018_newsletter_core.sql` aplicada e homologada **somente no Supabase isolado** (runbook em `docs/runbooks/migrations/018-newsletter-core/`). Production não foi acessada.

**Flags (todas desligadas):** `NEWSLETTER_SIGNUP_ENABLED=false`, `NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED=false`. Nenhum agendador, job ou envio real existe.

## O que está pronto

| Camada | Arquivos | Observação |
|---|---|---|
| Fundação N1 | `tokens.ts`, `consent.ts`, `rateLimit.ts`, `schemas.ts`, `service.ts`, `publicRequest.ts` | tokens `nlt_` (só o hash é persistido), consentimento versionado no servidor, buckets sobre o `rate_limit_hit` da E0c |
| Rotas e páginas públicas | `src/app/api/newsletter/*`, `src/app/(newsletter)/*` | inscrição (503 com a flag desligada), pedido de novo link, one-click RFC 8058, confirmação e descadastro com token no fragmento; grupo `(newsletter)` sem rastreadores (DEC-27) |
| **Processador do outbox** | `processor.ts`, `store.ts` | orquestra as RPCs `newsletter_outbox_*` da 018: claim (com recuperação de lease), revalidação, prepare, envio, complete, retry com backoff, expire. **Não reimplementa estado de fila** |
| **Adaptador de e-mail** | `provider.ts` | interface `EmailProvider`; `ResendProvider` (não chamado em teste) e `ScriptedProvider` (sucesso, erro permanente, rate limit, transitório, timeout, ambíguo); classificação do SDD §8.3 sobre a lista fechada de `last_error_code` |
| **Templates** | `templates.ts` | confirmação e link de descadastro, HTML e texto, versão fixa por mensagem, sem imagem remota, sem rastreamento, cabeçalhos RFC 8058 na confirmação, remetente e Reply-To do SDD §9 |
| **Endpoints internos** | `src/app/api/internal/newsletter/dispatch`, `.../health` | bearer `NEWSLETTER_DISPATCH_SECRET` em tempo constante; segredo ausente ou < 32 caracteres nega tudo; só contagens |
| Alertas | `alerts.ts` | no máximo 1 alerta por tipo por hora (throttle com `rate_limit_hit`); demais viram evento de auditoria sem e-mail |

## Processador (SDD §8.5, PRP-11 — valores provisórios, calibrar em LC-01)

`T` = 15 s por chamada ao provedor · `B` = 5 itens por lote, em sequência · `D` = 120 s (`maxDuration`) · `L` = 180 s de lease · `P` = 60 s de varredura · `M` = 30 s de margem · teto de 12 tentativas · prazo de 20 h.

Invariantes verificados em teste (`checkProcessorInvariants`): `D ≥ B·T + M` (120 ≥ 105), `L > D` (180 > 120), `deadline (20 h) < janela de idempotência (24 h)` e latência de recuperação `L + P = 240 s`.

Fluxo de cada item reivindicado: `loadContext` (leituras) → **revalida** (SDD §8.2: confirmação só para `pending`/`unsubscribed` e sem descadastro posterior ao pedido, com o token C ainda vivo; link de descadastro só para `pending`/`active`) → `prepare` idempotente (a retentativa **reutiliza** o payload; nunca gera tokens novos) → renderiza pela **versão de template fixada** no payload → envia com a chave `nl-<id>` (estável entre tentativas) → `complete` por comparação e troca.

| Resultado do provedor | Ação |
|---|---|
| 2xx com id | `sent` (payload apagado pela RPC) |
| permanente (chave, remetente, parâmetro) | `dead(permanent_error)` + alerta de configuração |
| rate limit / cota | `retry` com backoff (cota também alerta) |
| repetição concorrente de idempotência | `retry` em ~30 s, `outcome_unknown` |
| idempotência inválida | `dead(invalid_state)` + alerta (bug) |
| 5xx, rede, timeout, exceção | `retry` com a **mesma chave**, `outcome_unknown = true` |

Backoff: 1 min, 5 min, 15 min, 1 h, 3 h e a cada 3 h, ±10%. Depois de 20 h a RPC não reivindica mais e `expire` marca `dead(deadline_elapsed)`, preservando `outcome_unknown`. Com `NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED` desligada só `unsubscribe_link` é reivindicado.

## Endpoints internos

- `POST /api/internal/newsletter/dispatch` — expira o que venceu, reivindica lotes enquanto `restante ≥ B·T + M` e processa. Sem `RESEND_API_KEY` responde **503 sem reivindicar nada** (itens não morrem por falta de configuração). Devolve só contagens.
- `GET /api/internal/newsletter/health` — `{queued, retry, sending, sending_lease_expired, dead_24h, oldest_ready_age_seconds}`.
- Ambos: `Authorization: Bearer <NEWSLETTER_DISPATCH_SECRET>`; 401 sem corpo, com alerta limitado a 1 por hora.
- **Nenhum agendador chama estas rotas** e as rotas públicas **não** disparam o processamento (teste estático).

## Verificação de PV-04 (`pg_net`) — parcial

Leitura direta do Supabase isolado: **`pg_cron` instalado; `pg_net` disponível, mas NÃO instalado.** PV-04 fica **parcialmente verificada**: a disponibilidade está confirmada; falta instalar e demonstrar o `http_post` no isolado. **Instalar `pg_net` depende de autorização específica.**

## Migration N2 (019) e LC-01 — 019 NÃO aplicada; LC-01 etapa A aprovada, etapa B pendente

- **Proposta:** `supabase/migrations/019_newsletter_dispatch_jobs.sql` e runbook em `docs/runbooks/migrations/019-newsletter-dispatch/` (README, preflight 16 checks, verify 16 checks, rollback). Primeira aplicação estrita; exige 018, `pg_cron`, **`pg_net`**, Vault e segredos criados antes pelo operador; **nenhuma credencial literal**; preserva os jobs da 011 e da 017. O preflight **reprova hoje de propósito** (`pg_net` não instalado, Vault e segredos não verificados/criados).
- **Acesso ao Preview protegido** (SSO `all_except_custom_domains`): análise no README da 019. Production usa o domínio próprio (sem proteção, só o bearer); o isolado/Preview precisa do *Protection Bypass for Automation* (cabeçalho, opcional no job, lido do Vault) ou de um domínio próprio. Nada foi criado.
- **Harness LC-01** (`tests/lc01/`): `scenarios.ts` define os 7 cenários do SDD §8.9 contra a interface `Lc01Backend`, com o `ResendProvider` **real** (SDK) apontado por `RESEND_BASE_URL` para o **simulador em loopback** (`resendSimulator.ts`: sucesso, 429, 5xx, timeout, conexão derrubada, replay de `Idempotency-Key`, recusa de destinatário não sintético e de chave de API real).
  - **Ensaio** em memória: `tests/unit/newsletter/lc01.dryrun.test.ts` (roda no conjunto unitário).
  - **Execução real no isolado:** `tests/integration/lc01/lc01.test.ts` com `RC2_RUN_LC01=1` (RPCs reais da 018). **Etapa A APROVADA em 27/10/2026 (8/8)**; **etapa B (salto `pg_cron` → `pg_net` → Preview) PENDENTE.** Resultado detalhado no README da 019.
- **Trava de `RESEND_BASE_URL`:** o SDK a lê na carga do módulo e redireciona todo envio; por isso é proibida em Production e, fora dela, só loopback (`resendBaseUrlProblem`).
- **Sonda:** `probe.ts` (`evaluateProbe`): alerta se a sonda falhar, se o item pronto mais antigo passar de 15 min ou se o lease vencido persistir em duas observações.

## Dependências remanescentes antes de qualquer ativação

BL-02 (domínio, DNS e remetente no Resend; tracking de abertura/clique desativado, PV-25 e PV-11) · BL-03/LC-01 (N2 e demonstração) · DEP-04 (sonda externa) · BL-01 (jurídico, retenção `P-RET-*`, texto de consentimento definitivo) · BL-05 (isolamento verificado em navegador) · BL-10 (copy da Home) · BL-11 (E4-essencial e a migration N4) · DEP-07 (integração com a branch de tracking).
