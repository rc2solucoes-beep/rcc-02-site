# Migration 018 — Núcleo da newsletter (E3, fundação N1)

**ESTADO: APLICADA, VERIFICADA E HOMOLOGADA NO ISOLADO (`pyhhygvdjokddphftuua`, 27/10/2026). PRODUÇÃO: NÃO APLICADA. NÃO REAPLICAR (guard de primeira aplicação estrita). NÃO EXECUTAR SQL EM PRODUÇÃO SEM AUTORIZAÇÃO ESPECÍFICA.**

| Campo | Valor |
|---|---|
| Requisito(s) | RF-NL-01 a RF-NL-09, RF-NL-15, RF-SEG-05 (reuso) |
| Decisão(ões) | DEC-12, DEC-19 (revisada), DEC-23, DEC-26, DEC-27; PRP-09 |
| Entrega | E3 (migration **N1** do SDD §18.2) |
| Arquivo de aplicação (`apply`) | `supabase/migrations/018_newsletter_core.sql` (primeira aplicação estrita: o guard aborta se algo já existir) |
| Depende de | migration 017 (rate limit, E0c), `public.admin_users`, papéis `anon`/`authenticated`/`service_role`. **Não** depende de `leads` nem de `pg_net`; não usa `pg_cron` |
| Natureza | Aditiva: 5 tabelas, 9 funções, 3 policies, 1 trigger helper. Não toca `leads`, notas, atividade, posts, 017 nem os jobs da 011/017 |
| Janela e impacto | Sem lock em tabela existente; `lock_timeout` 5 s. Qualquer horário |
| Risco | Baixo no banco (objetos novos, sem consumidor público enquanto as flags estiverem desligadas) |
| Quem aplica / autoriza | Operador, com autorização específica por ambiente |

## Autorização (preencher antes de aplicar em cada ambiente)

| Ambiente | Autorizado por | Data | Observação |
|---|---|---|---|
| Isolado (`pyhhygvdjokddphftuua`) | Operador, autorização específica (isolado somente) | 27/10/2026 | Aplicada uma única vez pelo ChatGPT. Ver "Homologação no isolado" |
| Produção (`ymfcepzwhiemgkxzmbdm`) | | | Só depois do isolado, da E4-essencial (N4) e das aprovações do §18.3 do SDD |

## Homologação no isolado

Projeto `pyhhygvdjokddphftuua`, 27/10/2026. **O que cada ferramenta executou** (o Claude Code não tem conexão que selecione o projeto para SQL; o apply, o preflight e o verify foram do ChatGPT e foram **informados**):

| Etapa | Resultado | Executado por |
|---|---|---|
| `preflight.sql` | 17/17 `APROVADO` | ChatGPT (informado) |
| `supabase/migrations/018_newsletter_core.sql` (apply) | sucesso, aplicada uma única vez | ChatGPT (informado) |
| `verify.sql` | 40/40 `APROVADO` | ChatGPT (informado) |
| Produção | **não acessada** | — |
| `tests/integration/rls/e3-newsletter.test.ts` | **31/31 aprovados** (alvo `pyhh…` validado pela guarda do harness; `RC2_RUN_E3_NEWSLETTER=1`) | Claude Code (executado e verificado) |

Resultado dos 31 testes de integração (T-NL-I01 a I06):

- **Concorrência real (PostgREST, conexões separadas):** 10 inscrições paralelas do mesmo e-mail geram 1 assinante, 1 `consent_requested` e 1 item de confirmação; 6 confirmações paralelas do mesmo token dão exatamente 1 `confirmed` e 5 `invalid`, com 1 evento; 5 descadastros paralelos dão 1 `unsubscribed`, 4 `already_unsubscribed` e 1 evento; 4 claims paralelos sobre 8 itens reivindicam cada item exatamente uma vez (`SKIP LOCKED`).
- **Regras transacionais:** cooldowns de 10 min, de 3 confirmações por 24 h e de 7 dias após o descadastro; índice parcial do outbox; confirmação de uso único com as versões do **pedido original**; descadastro idempotente com token que continua válido; recuperação de lease vencido (`attempts` + 1, `outcome_unknown`, mesma chave de idempotência); `prepare` idempotente e `complete` por comparação e troca; `expire` sem tocar `sending` com lease válido; CASCADE na exclusão do assinante.
- **Privilégios reais:** `anon` sem leitura, escrita nem `EXECUTE`; usuário autenticado comum vê 0 linhas nas 3 tabelas liberadas (RLS), nada em tokens/payload e não executa funções; admin lê as 3 tabelas, não lê tokens/payload, não escreve e não executa funções; `service_role` lê, escreve e executa tudo.
- **Isolamento de leads:** o mesmo e-mail existe nas duas tabelas sem relação; excluir um lado não afeta o outro; não há coluna `lead_id`.
- **Limpeza:** a suíte registra os assinantes sintéticos (`e3-<tag>-*@example.com`) antes de usá-los e os remove no `afterAll`, seguido de inspeção de resíduos (que lança erro se sobrar algo); não lançou. Fixture da E2 e demais registros não foram tocados. Nenhum e-mail foi enviado (não existe dispatcher).
- **Histórico da execução:** a primeira execução passou 30/31. A falha era do **setup do teste** (o item de confirmação ficava `sending` e a regra "item em aberto" corretamente bloqueava o novo pedido, o que o teste não pretendia exercitar). O teste foi corrigido; a migration **não foi alterada**. A segunda execução passou 31/31.

## O que a migration cria

| Objeto | Especificação |
|---|---|
| `newsletter_subscribers` | `email_normalized` único; `status` `pending/active/unsubscribed` com CHECKs de coerência entre estado e datas |
| `newsletter_outbox` | fila persistente; índice parcial único `(subscriber_id, kind)` para mensagens em aberto; `idempotency_key` gerada (`'nl-' \|\| id`); `last_error_code` em lista fechada (sem texto livre) |
| `newsletter_tokens` | **somente o SHA-256** do token; `confirm` exige `expires_at` e as versões do consentimento do pedido original; `unsubscribe` não expira; FK `ON DELETE SET NULL` para o outbox |
| `newsletter_outbox_payload` | token bruto **transitório**, apagado no estado terminal; só `service_role` |
| `newsletter_consents` | eventos de consentimento; `ip_hash` pseudonimizado; `source_path` sem query; sem `user_agent` |
| Funções (9) | `SECURITY INVOKER`, `search_path` fixo, sem SQL dinâmico, `EXECUTE` só para `service_role`: `newsletter_request_subscription`, `_request_unsubscribe_link`, `_confirm`, `_unsubscribe`, `_outbox_claim/_prepare/_complete/_expire` e o helper `_touch_updated_at` |
| Policies (3) | `SELECT` para `authenticated` admin em subscribers, consents e outbox. **tokens e payload não têm policy nem privilégio para o admin** |

## O que NÃO cria (de propósito)

| Não cria | Por quê | Onde entra |
|---|---|---|
| Jobs `pg_cron` / `pg_net` de dispatch e manutenção | Mecanismo de processamento ainda não demonstrado (BL-03, PV-04, LC-01) | migration N2 |
| Jobs de purga (`P-RET-01/02/04`) | Prazos pendentes de validação jurídica (BL-01); até lá **nenhum dado é apagado automaticamente** | migration N3 |
| Papel `newsletter_ops` e funções administrativas `SECURITY DEFINER` | Pertencem à E4-essencial; PV-26 ainda não validada | migration N4 (precisa estar aplicada **antes** da ativação pública, BL-11) |

## Decisão técnica: guard de primeira aplicação estrita × "apply idempotente" (SDD §18.2)

O SDD §18.2 prevê, para cada migration da newsletter, "`preflight`, `apply` idempotente, `verify` e `rollback`". A 018 **não é idempotente no sentido de convergir**: é de **primeira aplicação estrita**, igual à 017.

**Decisão:** manter o guard estrito. **O contrato do SDD não foi alterado em silêncio**; a divergência fica registrada aqui e exige revisão do texto do SDD (ver "Pendências").

Motivos:
1. **Precedente já aprovado e em produção:** a 017 usa o mesmo guard e a mesma regra operacional ("aborto = nada aplicado; não contornar editando o SQL"). Manter um único modelo de apply evita dois comportamentos para o mesmo operador.
2. **Idempotência convergente esconderia desvio:** tabelas com RLS, policies, constraints e funções por `CREATE … IF NOT EXISTS`/`CREATE OR REPLACE` aceitariam silenciosamente um objeto pré-existente com definição diferente (por exemplo, uma `newsletter_tokens` antiga com coluna de token bruto). O guard força o desvio a aparecer como erro.
3. **A reexecução é segura mesmo assim:** a migration roda em **uma transação**; a segunda execução aborta no guard (`018 ABORTADA — … já existem`) **sem nenhum efeito**. Isso cobre o objetivo prático do requisito (poder repetir o comando sem dano).
4. **O ciclo completo continua existindo:** `preflight.sql` (estado anterior), `apply`, `verify.sql` (estado posterior) e `rollback.sql`.

Se o responsável pelo SDD preferir a idempotência convergente, será **outra migration/versão** (com `IF NOT EXISTS` e verificação de definição), não uma edição silenciosa desta.

## Ordem de execução (por ambiente, com autorização)

1. Confirmar o ref do projeto na URL do painel/conexão. Em **isolado**, o marcador `__rc2_isolated_test_env__` deve conter o ref isolado (o preflight confere).
2. **Preflight** (`preflight.sql`, READ ONLY). Esperado: `RESULTADO = APROVADO` (**17 checks**). Arquivar a saída. Para produção, trocar a linha `alvo` para `'ausente'` (não há marcador em produção).
3. **Apply** (`supabase/migrations/018_newsletter_core.sql`) no SQL Editor. Esperado: `Success. No rows returned`. Aborto = nada aplicado; **não contornar editando o SQL**.
4. **Verify** (`verify.sql`, READ ONLY). Esperado: `RESULTADO = APROVADO` (**40 checks**). Arquivar a saída.
5. Testes de integração da newsletter no **isolado** (T-NL-I*, **ainda a escrever**).
6. Nada de deploy público: `NEWSLETTER_SIGNUP_ENABLED` e `NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED` permanecem **desligados**.

A migration pode ser aplicada **antes** do código: nenhuma rota existente depende dela. O código novo da newsletter, com as flags desligadas, também não a exige, **exceto** os endpoints de manutenção (`/api/newsletter/unsubscribe`, `/api/newsletter/unsubscribe-request` e as páginas de token), que respondem 503/500 enquanto as funções não existirem.

## Variáveis de ambiente

`NEWSLETTER_SIGNUP_ENABLED=false` e `NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED=false` (padrão). `RATE_LIMIT_PEPPER` já existe (E0c). `NEWSLETTER_DISPATCH_SECRET` só será necessária com o dispatch (N2). **Não existe segredo de token.**

## Dados pessoais

E-mail e `ip_hash` são dados pessoais (o hash é pseudonimizado, não anônimo, DEC-23). Os `P-RET-*` estão **pendentes** (BL-01): não há purga automática. Texto de consentimento e política (`draft-1`) são **provisórios**.

## Verificação já feita (sem banco do projeto)

Aplicada em Postgres efêmero (PGlite) com stubs de `auth.uid()`, `admin_users`, `cron.job`, `settings`: migration e autoverificação; fluxo completo (inscrição, cooldowns de 10 min / 3 por 24 h / 7 dias, confirmação de uso único com versões do pedido original, descadastro idempotente, outbox com recuperação de lease e expiração); privilégios por papel e RLS; CHECKs; cascade; reaplicação abortada pelo guard (55/55). `preflight.sql` (17 checks) aprova antes e reprova depois; `verify.sql` (40 checks) aprova depois; `rollback.sql` remove tudo e o preflight volta a aprovar. **Não prova** concorrência real entre conexões, o `pg_cron` nem o comportamento do Supabase hospedado: por isso o passo 5 existe.

## Reversão

`rollback.sql` remove funções, as cinco tabelas e o helper. **Ponto de não retorno:** se já houver assinantes reais, o rollback elimina consentimentos e a supressão (a linha `unsubscribed` é a supressão, SDD §10.1) — **não executar sem decisão jurídica (BL-01)**. Antes: manter as flags desligadas. Com as funções removidas, a inscrição responde 500 e o one-click responde 503.

## Pendências para a E3 (após a homologação no isolado)

1. Aplicar em **produção** só com autorização específica, depois do isolado, da E4-essencial (migration N4) e das aprovações do §18.3 do SDD. O preflight de produção usa `alvo = 'ausente'`.
2. Migrations **N2** (jobs de dispatch e manutenção, depende de BL-03/PV-04/LC-01) e **N3** (purgas, depende de BL-01 e dos `P-RET-*`).
3. Dispatcher, e-mail e remetente (Resend/DNS, BL-02), formulário da Home, textos jurídicos e de consentimento definitivos (`draft-1` é provisório).
4. Decisão do responsável pela tracking sobre `/admin`, `error.tsx` e o `not-found` global sem rastreadores (DEC-27), e coordenação com a branch de tracking (DEP-07).
5. A aplicação no isolado está registrada em `docs/runbooks/migrations/REGISTRO.md`; a de produção só entra depois de executada.
