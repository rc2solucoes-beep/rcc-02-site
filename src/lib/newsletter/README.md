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

## Especificação objetiva da migration N2 (não criada)

Escopo: jobs do dispatch e da manutenção. **Só depois de LC-01 e com autorização específica.** Primeira aplicação estrita (guard), com `preflight`, `apply`, `verify` e `rollback` próprios, como a 017 e a 018.

1. **Pré-requisitos (preflight):** 018 aplicada; `pg_cron` ligado; `pg_net` instalado (autorização à parte); extensão Vault disponível; **segredos criados pelo operador no Vault, nunca na migration:** URL do dispatch (`newsletter_dispatch_url`) e `NEWSLETTER_DISPATCH_SECRET` (`newsletter_dispatch_secret`), idêntico ao da Vercel do mesmo ambiente; jobs `newsletter-dispatch` e `newsletter-maintenance` ausentes; jobs 011 e 017 presentes.
2. **Job `newsletter-dispatch`** (`* * * * *`, P = 60 s): `net.http_post(url := <Vault url>, headers := jsonb('Authorization', 'Bearer ' || <Vault secret>), timeout_milliseconds := 125000)`. O corpo é ignorado. O segredo é lido do Vault em tempo de execução; **nenhum segredo literal na migration**.
3. **Job `newsletter-maintenance`** (`*/5 * * * *`): `SELECT public.newsletter_outbox_expire()`. Redundante com o `expire` do dispatch, mas mantém o prazo funcionando se o dispatch estiver pausado.
4. **Fora da N2:** purgas (N3, depois de BL-01), funções administrativas (N4, E4) e a sonda externa de `health` (DEP-04, fora do banco).
5. **Rollback:** `cron.unschedule` dos dois jobs. **Proibido** com `unsubscribe_link` pendente (SDD §18.4); usar a pausa de `confirmation` (flag) no lugar.
6. **Verify:** jobs com os horários e o alvo esperados, sem segredo no `command`, 011 e 017 intactos; invocação autenticada manual devolve 200 e sem segredo devolve 401.

## Especificação dos testes LC-01 (gate de lançamento do processador, SDD §8.9)

Ambiente: **isolado**, com a N2 e o `pg_net` já autorizados, e **sem e-mail real**: o provedor aponta para um servidor simulado compatível com a API do Resend (o SDK aceita `RESEND_BASE_URL`; a verificar na LC-01), que também injeta falhas. Cada cenário registra as linhas do outbox antes e depois.

| # | Cenário | Como provocar | Critério de aceite |
|---|---|---|---|
| 1 | Envio normal | enfileirar `unsubscribe_link`; aguardar a varredura | `sent` em ≤ P + T, 1 chamada ao simulador, payload apagado |
| 2 | Processo encerrado no meio do envio | simulador segura a resposta e a invocação é encerrada | lease vence (L); **outro** worker recupera antes do prazo; `attempts` + 1, `outcome_unknown`, **mesma chave**; 1 e-mail no simulador |
| 3 | 5xx injetado | simulador responde 500 uma vez | `retry` com a mesma chave; um único e-mail entregue |
| 4 | Provedor fora do ar além de 20 h | simulador recusa por 20 h (ou prazo reduzido só no isolado) | `dead(deadline_elapsed)` e alerta; `outcome_unknown` preservado |
| 5 | Dispatcher parado | pausar o job | a sonda de `health` alerta (idade do mais antigo > 15 min) |
| 6 | Dois workers concorrentes | duas invocações simultâneas | nenhum item processado duas vezes (`SKIP LOCKED`) |
| 7 | Item que derruba o processo | simulador derruba a conexão a cada tentativa | chega a `attempts_exhausted` sem laço infinito |

Também medir (calibração do PRP-11): duração real das invocações, taxa do simulador e latência de recuperação (esperada ≤ 240 s).

## Dependências remanescentes antes de qualquer ativação

BL-02 (domínio, DNS e remetente no Resend; tracking de abertura/clique desativado, PV-25 e PV-11) · BL-03/LC-01 (N2 e demonstração) · DEP-04 (sonda externa) · BL-01 (jurídico, retenção `P-RET-*`, texto de consentimento definitivo) · BL-05 (isolamento verificado em navegador) · BL-10 (copy da Home) · BL-11 (E4-essencial e a migration N4) · DEP-07 (integração com a branch de tracking).
