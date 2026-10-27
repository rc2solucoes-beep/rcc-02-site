# Migration 019 (N2) — Jobs de dispatch e manutenção da newsletter (E3)

**ESTADO: PROPOSTA — NÃO APLICADA EM NENHUM AMBIENTE. NÃO EXECUTAR SQL SEM AUTORIZAÇÃO ESPECÍFICA POR AMBIENTE. NENHUMA EXTENSÃO FOI INSTALADA, NENHUM SEGREDO FOI CRIADO NO VAULT, NENHUM JOB EXISTE.**

| Campo | Valor |
|---|---|
| Requisito(s) | RF-NL-08, RF-NL-16 (processamento confiável do outbox) |
| Decisão(ões) | SDD Newsletter §8.8, §8.9 (BL-03, PV-04), §18.2 |
| Entrega | E3 (migration **N2** do SDD §18.2) |
| Arquivo de aplicação (`apply`) | `supabase/migrations/019_newsletter_dispatch_jobs.sql` (primeira aplicação estrita: o guard aborta se algo já existir) |
| Depende de | migration 018 (outbox e `newsletter_outbox_expire`), `pg_cron`, **`pg_net`**, **Vault**, e os segredos do Vault criados antes. Preserva os jobs da 011 e da 017 |
| Natureza | Cria **2 jobs** `pg_cron`. Não cria tabelas, funções nem extensões; não escreve no Vault |
| Gate | **LC-01** (SDD §8.9): o mecanismo precisa ser demonstrado antes de integrar ou ligar (BL-03) |
| Quem aplica / autoriza | Operador, com autorização específica por ambiente. A instalação do `pg_net` é uma autorização **à parte** |

## Autorização (preencher antes de cada passo)

| Passo | Ambiente | Autorizado por | Data | Observação |
|---|---|---|---|---|
| Instalar `pg_net` | Isolado (`pyhhygvdjokddphftuua`) | | | |
| Criar segredos no Vault | Isolado | | | |
| Apply da 019 | Isolado | | | Só depois do LC-01 etapa A |
| Apply da 019 | Produção (`ymfcepzwhiemgkxzmbdm`) | | | Só depois do isolado, da E4-essencial (N4) e das aprovações do §18.3 do SDD |

## Estado da infraestrutura (leitura direta do isolado informada em 27/10/2026)

| Item | Estado | PV |
|---|---|---|
| `pg_cron` | **instalado** | — |
| `pg_net` | **disponível, NÃO instalado** | PV-04 **parcial**: falta instalar e demonstrar o `http_post` |
| Vault (`supabase_vault`) | **não verificado** | verificar no preflight (PRE-10/PRE-11) |
| Segredos `newsletter_dispatch_url` e `newsletter_dispatch_secret` | **não criados** | criados pelo operador, nunca por agente nem por migration |

Por isso o preflight **reprova hoje, de propósito** (PRE-09, PRE-10, PRE-12): é o portão da N2.

## O que a migration faz

| Job | Horário | Comando |
|---|---|---|
| `newsletter-dispatch` | `* * * * *` (P = 60 s) | `net.http_post` para `POST /api/internal/newsletter/dispatch`. **URL e segredo lidos do Vault a cada execução**; corpo `{}` (ignorado pela rota); `timeout_milliseconds := 125000` (> `maxDuration` de 120 s) |
| `newsletter-maintenance` | `*/5 * * * *` | `SELECT public.newsletter_outbox_expire()` (redundante com o `expire` do dispatch; mantém o prazo de 20 h funcionando com o dispatch pausado) |

**Nenhuma credencial literal** no SQL: o `Authorization` é `'Bearer ' ||` o valor do Vault; o cabeçalho de bypass, se existir, também vem do Vault. A autoverificação reprova a migration se o comando contiver credencial literal.

O guard exige: 018 aplicada; `pg_cron`, `pg_net` e `supabase_vault` instalados; jobs 011 e 017 presentes; jobs da 019 **ausentes**; URL do Vault no formato `https://<host>/api/internal/newsletter/dispatch` (sem query nem credencial); segredo com ≥ 32 caracteres; bypass, se existir, com ≥ 32 caracteres. Os valores são validados **sem nunca serem exibidos**.

## Segredos do Vault (criados pelo operador, antes do apply)

| Nome | Conteúdo | Observação |
|---|---|---|
| `newsletter_dispatch_url` | URL HTTPS completa da rota de dispatch do ambiente | Produção: `https://www.rc2solucoes.com.br/api/internal/newsletter/dispatch`. Isolado/Preview: ver "Acesso ao Preview protegido" |
| `newsletter_dispatch_secret` | **idêntico** ao `NEWSLETTER_DISPATCH_SECRET` da Vercel **do mesmo ambiente** | ≥ 32 caracteres aleatórios; **distinto entre Preview e Production**; nunca reutilizar |
| `newsletter_dispatch_bypass` | (opcional) segredo de *Protection Bypass for Automation* da Vercel | Só no isolado/Preview; **ausente em Production**. Ver abaixo |

## Acesso ao Preview protegido pela Vercel (análise; nada foi criado)

Situação verificada (projeto `rcc-02-site`): **SSO ativo, escopo `all_except_custom_domains`**. Logo:

- **Production:** o domínio próprio `www.rc2solucoes.com.br` **não é protegido**. O `pg_net` chega à rota só com o bearer `NEWSLETTER_DISPATCH_SECRET`. **Nenhum bypass é necessário nem deve existir.**
- **Preview (`*.vercel.app`):** protegido por SSO. Uma requisição do `pg_net` recebe a página de login (HTTP 401/302) e **nunca** alcança a rota. Opções:

| Opção | Como funciona | Prós | Contras |
|---|---|---|---|
| **A. Protection Bypass for Automation (recomendada para o isolado)** | O projeto gera um segredo de bypass; o `pg_net` o envia no cabeçalho `x-vercel-protection-bypass`. O job da 019 já inclui o cabeçalho **se** o segredo `newsletter_dispatch_bypass` existir no Vault | Sem alterar o SSO; funciona com a mesma migration; cabeçalho, não URL | O segredo é **do projeto** (vale para todos os deployments protegidos, não só um); precisa de **autorização específica** para ser gerado; fica no Vault e transita na fila do `pg_net` |
| B. Domínio próprio para o Preview (ex.: um subdomínio de homologação atribuído à branch) | Domínios próprios ficam fora da proteção (`all_except_custom_domains`) | Sem segredo de bypass; só o bearer protege | Exige DNS (Cloudflare) e atribuição de domínio: mudança de infraestrutura, autorização à parte |
| C. Desativar o SSO do projeto | — | — | **Descartada**: expõe todos os previews; fora do que foi autorizado |
| D. Testar só o processador em processo (LC-01 etapa A) | Dispensa o salto `pg_net` → Vercel | Executável com a 018, sem extensões nem bypass | Não prova o agendador nem a autenticação ponta a ponta (etapa B) |

**Requisitos de segurança, qualquer que seja a opção:**
1. **Cabeçalho HTTP, nunca token na URL** (a query vai para logs e histórico). A 019 só envia o bypass por cabeçalho e o verify reprova bypass literal.
2. **Segregação:** o bypass e o `NEWSLETTER_DISPATCH_SECRET` do Preview **nunca** são reutilizados em Production, e Production **não tem** `newsletter_dispatch_bypass`.
3. **Exposição transitória no `pg_net` (risco residual aceito só com os gates abaixo):** a requisição (inclusive `Authorization` e o bypass) fica em `net.http_request_queue` até ser enviada; a resposta (só contagens, sem PII) fica em `net._http_response`. Quem puder ler essas tabelas lê o bearer. **No Supabase hospedado não é possível restringir isso por `REVOKE`:** as tabelas pertencem a `supabase_admin` com SELECT concedido a `PUBLIC`, o `postgres` não assume esse papel e o worker do `pg_net` roda como `postgres` (KB Supabase: *revoking access to pg_net objects has no effect* e *database roles can read request headers queued by pg_net*). Por isso o preflight **não** exige `SELECT = false`; exige os controles compensatórios de "Controles de acesso ao `pg_net`". Nenhum `REVOKE` nem troca de proprietário é tentado.
4. **Rotação:** trocar o segredo = atualizar o Vault e a variável da Vercel do mesmo ambiente (o job lê o Vault a cada execução, sem nova migration). O bypass é revogado/regenerado no painel da Vercel.
5. Sem bypass, sem cookie e sem exceção de proteção criados **nesta etapa**.

## Controles de acesso ao `pg_net` (Supabase hospedado)

Quem consegue ler as tabelas `net` precisa antes **conectar-se ao banco** ou **alcançar o schema `net` pela Data API**. Os controles fecham esses dois caminhos e documentam o que sobra.

| Check (preflight / verify) | Exige | Fecha |
|---|---|---|
| `PRE-15B` / `POS-15B` | `anon` e `authenticated` **sem `LOGIN`** (0 papéis) | conexão direta com os papéis públicos |
| `PRE-15C` / `POS-15C` | **nenhum** papel com `LOGIN` fora da lista prevista (`postgres`, `supabase_admin`, `authenticator`, `pgbouncer`, `supabase_auth_admin`, `supabase_storage_admin`, `supabase_read_only_user`, `supabase_replication_admin`, `supabase_etl_admin`; `pg_*` ignorados). Qualquer outro nome aparece em `actual` e **reprova** | contas de conexão não previstas |
| `PRE-15D` / `POS-15D` | `pgrst.db_schemas` do papel `authenticator` (configuração efetiva do PostgREST) **sem `net`** → `nao_exposto`. Valor ausente ou ilegível → `nao_verificavel` = **REPROVADO** | leitura de `net` por `/rest/v1` |

Papéis fora da lista só entram nela por decisão registrada no `REGISTRO.md` (nome, motivo, quem criou); a lista não é ampliada para fazer o check passar.

### Gates manuais (evidência ANTES do apply)

SQL não prova tudo. Cada gate exige evidência registrada no `REGISTRO.md`; sem ela **não há apply**, mesmo com o preflight `APROVADO`.

| Gate | Evidência exigida |
|---|---|
| **G-1. Data API** | Captura/descrição do painel Supabase (*Settings → API → Exposed schemas*) mostrando que `net` **não** está exposto. **Obrigatório** quando `PRE-15D` der `nao_verificavel`; recomendado também quando der `nao_exposto` (a configuração efetiva do painel é a fonte; o papel `authenticator` é um reflexo dela) |
| **G-2. Papéis com `LOGIN`** | Se `PRE-15C` listar nomes: a identificação de cada um (origem e finalidade) e a decisão de manter ou remover, tomada pelo operador. Nenhum nome é presumido seguro |
| **G-3. Segredos segregados** | Confirmação de que o `NEWSLETTER_DISPATCH_SECRET` (e o bypass, se existir) do **Preview/isolado** é distinto do de **Production**, que o Vault do isolado não contém o segredo de Production e que Production **não tem** `newsletter_dispatch_bypass`. Verificar por existência e comprimento, **nunca** exibindo valores |

### Risco residual (documentado, aceito para o isolado e o Preview)

- Os cabeçalhos da requisição (inclusive `Authorization: Bearer ...` e o bypass) ficam legíveis em `net.http_request_queue` até o envio e a resposta em `net._http_response` (retenção do `pg_net`, ordem de horas). Leem essas tabelas `supabase_admin`, `postgres` e qualquer papel com `LOGIN` ou acesso pela Data API ao schema `net`; `service_role` só chegaria a elas se `net` estivesse exposto.
- Mitigações: segredo **só dá acesso à rota interna** (que devolve contagens, sem PII); rotação simples (Vault + variável da Vercel do mesmo ambiente); segredos de Preview e Production **nunca compartilhados**; resposta sem dados pessoais; fila `net` sem requisições pendentes antes da 019.
- Se um dos controles não puder ser demonstrado, a 019 **não é aplicada** e a alternativa é o SDD §8.9 (opção B/C), não o enfraquecimento do gate.

## Ordem de execução (por ambiente, cada passo com autorização)

1. **LC-01 etapa A** (não depende da 019 nem do `pg_net`): `RC2_RUN_LC01=1 npm run test:integration -- tests/integration/lc01/lc01.test.ts` no isolado, com a 018 aplicada. Processador + fila reais, provedor = simulador em loopback.
2. Instalar `pg_net` (e confirmar Vault) no isolado.
3. Criar os segredos no Vault (operador). Na Vercel Preview: `NEWSLETTER_DISPATCH_SECRET` (igual ao do Vault). **Sem `RESEND_API_KEY`** no Preview: o dispatch responde `503 not_configured` e nada é reivindicado (essa é a resposta **esperada e correta** da etapa B; não usar credencial real para forçar um 200).
4. **Gates G-1 a G-3** com evidência registrada, depois **Preflight** (`preflight.sql`, READ ONLY): esperado `APROVADO` (**18 checks**). Para produção, trocar a linha `alvo` para `'ausente'`.
5. **Apply** (`019_newsletter_dispatch_jobs.sql`): `Success. No rows returned`. Aborto = nada aplicado; **não contornar editando o SQL**.
6. **Verify** (`verify.sql`, READ ONLY): esperado `APROVADO` (**18 checks**).
7. **LC-01 etapa B** (o salto): ver abaixo. Critério de aceite: 401 sem bearer válido e 503 `not_configured` com bearer válido, mais o job disparando a cada minuto.
8. Só depois, e só em produção com autorização: nada de ativar flags antes da E4-essencial (BL-11).

## LC-01 — status

| Etapa | Status | Data | Resultado |
|---|---|---|---|
| **A. Processador em processo** | **APROVADA** | 27/10/2026 | **8/8** no Supabase isolado (`pyhhygvdjokddphftuua`), RPCs reais da 018 e `ResendProvider` real → simulador em loopback; executado pelo Claude Code com `RC2_RUN_LC01=1`. Detalhes abaixo |
| **B. Salto `pg_cron` → `pg_net` → Preview** | **PENDENTE** | — | Depende de: `pg_net` instalado, segredos no Vault, decisão do acesso ao Preview protegido, apply da 019 (todos com autorização específica) |

### Etapa A — resultado (27/10/2026)

Alvo validado pela guarda do harness (ref `pyh…`); `RESEND_API_KEY` e `RESEND_BASE_URL` ausentes do ambiente; o adaptador usou a chave sintética `re_sim_*` contra `127.0.0.1`; o simulador não registrou nenhuma violação (destinatário não sintético ou chave fora do padrão). Pré-condições lidas pelo ChatGPT antes da execução: outbox vazio, nenhum job da newsletter, nenhum segredo de dispatch ou bypass no Vault.

| # | Cenário | Evidência observada |
|---|---|---|
| 1 | Envio normal | 2 itens (confirmação e link de descadastro) enviados; 2 entregas no simulador; cabeçalhos RFC 8058 só na confirmação; `provider_message_id` do banco = id da entrega; payload apagado |
| 2 | Falha ao gravar o resultado depois do envio | entrega aceita e item preso em `sending`; nenhum outro worker o reivindica com o lease válido; após o vencimento, **outro** worker recupera (`attempts` = 2) e reenvia com a **mesma chave** `nl-<id>` e **corpo idêntico**; o simulador reconhece o replay e há **1 entrega só** |
| 3 | 5xx e conexão derrubada após aceitar | 5xx: `retry` com `outcome_unknown`, 0 entregas; segunda tentativa entrega 1 vez com a mesma chave e o mesmo corpo. Conexão derrubada **depois** de aceitar: o retry recebe a resposta original (replay) e a chave tem **uma** entrega |
| 3b | Timeout do cliente | `timeout` ambíguo; com a original ainda em voo a repetição recebe `concurrent_idempotent_requests` (retry curto); após liberar, entrega 1 vez, sempre com a mesma chave |
| 4 | Indisponibilidade prolongada | 3 tentativas com backoff, 0 entregas; após o prazo nenhuma nova tentativa; `expire` leva a `dead(deadline_elapsed)` preservando `outcome_unknown = true`; payload apagado |
| 5 | Dispatcher parado | item pronto há 20 min: `oldest_ready_age_seconds` > 900 e a sonda alerta (`queue_stalled`); sonda falhando alerta (`probe_failed`); depois de processar, normaliza e `health` não tem PII |
| 6 | Dois workers concorrentes | 6 itens processados por 2 invocações simultâneas: 6 enviados, 0 conclusões obsoletas, **cada chave enviada exatamente 1 vez**, 6 entregas, nenhum replay (`SKIP LOCKED` real) |
| 7 | Falha permanente | exatamente **12** requisições; depois o claim não reivindica mais e `expire` marca `dead(attempts_exhausted)`; chamadas extras de dispatch não enviam nada |

Limpeza (verificada por leitura de contagens no isolado depois da execução): `newsletter_subscribers`, `newsletter_outbox`, `newsletter_outbox_payload`, `newsletter_tokens` e `newsletter_consents` com **0** registros; nenhum assinante com prefixo `lc01-` ou `e3-`; `leads` com **1** registro (a fixture da E2, preservada). Nenhum e-mail foi enviado a terceiros (simulador em loopback).

## LC-01 — o que cada etapa prova

| Etapa | Ambiente | Prova | Não prova |
|---|---|---|---|
| **A. Processador em processo** | isolado, RPCs reais da 018, `ResendProvider` real → simulador em loopback | os 7 cenários do SDD §8.9: envio normal, recuperação de lease, 5xx com retry idempotente (e conexão derrubada após aceitar), deadline, sonda, dois workers, `attempts_exhausted` | o agendador, o `pg_net` e a autenticação ponta a ponta |
| **B. Salto `pg_cron` → `pg_net` → Preview** | isolado, com a 019 aplicada | o job dispara a cada minuto e a requisição chega à rota: **sem bearer válido → HTTP 401**; **com bearer válido e sem `RESEND_API_KEY` → HTTP 503 `not_configured`** (nada é reivindicado); `net._http_response` registra essas respostas; `health` (com bearer) coerente com a fila vazia | **HTTP 200 com `claimed = 0`** (isso exige provedor configurado e a execução da rota; **não está previsto para o Preview atual**, que não terá `RESEND_API_KEY`) · envio com o provedor simulado através da Vercel · duplicação em invocações sobrepostas (provada na etapa A) |
| C. Ponta a ponta com simulador via Vercel | — | — | **Não planejada:** exigiria o simulador publicamente acessível e `RESEND_BASE_URL` fora de loopback, que o código **recusa** de propósito. Só com decisão explícita |

`RESEND_BASE_URL` é lida pelo SDK **na carga do módulo** e redireciona **todo** envio do Resend. Por isso: **proibida em Production** e, fora dela, só loopback (`resendBaseUrlProblem` / `createProviderFromEnv`; testes em `lc01Safety.test.ts`). Nunca configurar na Vercel.

## Consistência dos parâmetros (verificada em teste)

| Parâmetro | Valor | Relação |
|---|---|---|
| Timeout do `pg_net` | 125 s | **>** `maxDuration` da rota (120 s) |
| `maxDuration` | 120 s | **≥** B·T + M = 5·15 + 30 = 105 s |
| Lease | 180 s | **>** `maxDuration` (nenhum item perde o lease com a invocação viva) |
| Varredura | 60 s | = P; recuperação máxima = L + P = 240 s |
| Prazo do item | 20 h | **<** janela de idempotência do provedor (24 h) |

Invocações **sobrepostas** são esperadas (o dispatch pode durar até 120 s e o job roda a cada 60 s): são seguras por construção (claim com `SKIP LOCKED`, lease e comparação e troca na conclusão).

## Verificação já feita (sem banco do projeto)

PGlite com stubs de `cron`, `net` e `vault`: a 019 **aborta** sem `pg_net`/Vault, sem segredos, com URL fora do formato, com segredo ou bypass curtos; o preflight reprova (e **não dá erro**) quando o Vault ainda não existe; aplica; o verify aprova (com e sem bypass); o comando do job executa lendo o Vault e o cabeçalho de bypass só aparece quando o segredo existe; nenhum segredo vaza para o comando; jobs 011 e 017 intactos; reaplicação aborta sem duplicar; rollback remove só os dois jobs (26/26). **Não prova** o `pg_cron`/`pg_net` reais, o Vault real nem a Vercel: por isso o LC-01.

## Reversão

`rollback.sql` desagenda os dois jobs. **Proibido** com `unsubscribe_link` pendente ou aceitação de pedidos de novo link (SDD §18.4): para pausar a confirmação use `NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED=false`. Não toca no Vault nem desinstala o `pg_net`.

## Pendências para autorizar

1. Autorização específica para **instalar o `pg_net`** no isolado (e confirmar o Vault).
2. Decisão sobre o acesso ao Preview protegido: **A** (bypass; exige autorização para gerá-lo) ou **B** (domínio próprio; exige DNS).
3. Operador cria os segredos no Vault e a variável da Vercel do Preview.
4. Executar o LC-01 etapa A e registrar o resultado (calibração do PRP-11: duração real, taxa, latência de recuperação).
5. Registrar a aplicação em `docs/runbooks/migrations/REGISTRO.md` **somente depois** de executada.
