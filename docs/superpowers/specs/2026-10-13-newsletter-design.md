# SDD — Newsletter: inscrição com double opt-in, descadastro e administração

**Data:** 2026-10-13 (revisão 2, após a revisão externa de engenharia)
**Status:** Rascunho para revisão final de engenharia. **Sem autorização de implementação.**
**PRD:** `2026-10-13-admin-evolution-prd.md` · **Entregas:** E3 (núcleo público) e E4 (admin: essencial e complementar) · **Requisitos:** RF-NL-01 a RF-NL-19
**Depende de:** E0a, E0b.4 e E0c (SDD Leads, Parte I). A E4 também depende dos utilitários de lista da E1. Para **ativar publicamente**, depende da integração da branch de tracking (DEP-07) e da administração essencial (E4-essencial, BL-11).

As especificações de esquema e de funções são **descritivas**, não scripts executáveis. Nenhuma migration foi criada.

**Escopo.** Inscrição, confirmação, descadastro, consentimento rastreável, fila de e-mail, administração e remoção de dados. **Fora:** editor, campanhas, disparo em massa, automações, segmentação e qualquer vínculo com `leads`.

## 1. Decisões aplicáveis

**Aprovadas:** DEC-11, DEC-12, DEC-13, DEC-14, DEC-15, DEC-16, DEC-17, **DEC-19 (revisada)**, DEC-20, DEC-21, DEC-22, DEC-23, DEC-24, **DEC-25, DEC-26 e DEC-27 (novas, da revisão externa)**. Definições no PRD §4.

**Propostas:** PRP-02 (provisória), PRP-04 (condicionada ao isolamento de rastreadores), PRP-05, PRP-06, **PRP-09** (tokens opacos persistentes), **PRP-10** (opção de isolamento), **PRP-11** (dimensionamento do processador). **PRP-08 foi rejeitada** e substituída por PRP-09 (§6).

**Estado das propostas desta SDD (terceira revisão externa):** PRP-09 (tokens opacos persistentes), PRP-10 (isolamento, opção O5) e PRP-11 (dimensionamento do processador) estão **aprovadas**; a PRP-11 como configuração inicial sujeita a validação operacional (LC-01).

Decisões de produto: remetente `newsletter@rc2solucoes.com.br` (sujeito a DNS); seção da Home antes do CTA final; temas de automação, integração de sistemas e IA aplicada a operações; **nenhuma promessa de frequência**.

## 2. Evidências verificadas

| ID | Evidência |
|---|---|
| EV-07 | A rota de contato usa `service_role`; padrão de origin check, honeypot, Turnstile e Zod em `api/contact/route.ts`. |
| EV-12, EV-13 | Turnstile fail-open sem segredo; prioridade de IP por `cf-connecting-ip` (corrigidos na E0b.4). |
| EV-14 | O envio de e-mail do contato é sem `await` nem `after()` (não serve de modelo). |
| EV-16 | GTM (`DelayedGtm`), `PageViewTracker` e o script de bootstrap de consentimento estão no **layout raiz** (`src/app/layout.tsx`). `page_location` = origem + caminho, sem query nem hash. |
| EV-17 | Resend 6.12.2 aceita `idempotencyKey` e `headers` no envio. |
| EV-18 | A branch de tracking altera `Footer.tsx`, `privacidade/page.tsx`, `next.config.ts` e a rota de contato. |
| EV-22 | RLS é a única barreira das tabelas `public`; tabelas novas precisam de `REVOKE` explícito. |
| EV-23 | O Resend já envia e-mail de lead e alertas de segurança (`securityAlerts.ts`); a cota da conta é compartilhada. |
| EV-24 | `pg_cron` está em uso (job de publicação, 011). `pg_net` não foi verificado. |
| EV-25 | O CSP atual permite `connect-src 'self'`, Turnstile (script e frame) e `form-action 'self'`; uma rota própria não exige mudança, a confirmar no plano. |
| EV-26 | `ContactForm.tsx` usa `@marsidev/react-turnstile`; o padrão de widget já existe. |
| EV-27 | `sendSecurityAlert` e `ALERT_EVENT_WHITELIST` existem em `src/lib/admin`. |
| EV-28 | `DelayedGtm` carrega o GTM no primeiro `scroll`, `pointerdown`, `keydown` ou `touchstart`, ou 2,5 s depois do `load`. O layout `(public)` já hospeda `ConsentManager`, `Header`, `Footer` e `FloatingWhatsApp`. |
| EV-29 | Next 16 (docs locais): múltiplos *root layouts* exigem remover o `layout.js` de topo e usar um por grupo de rotas; navegar entre eles causa *full page load*; com vários *root layouts* é preciso `global-not-found`. |

## 3. Premissas ainda não validadas

| ID | Premissa | Validação |
|---|---|---|
| PV-04 | `pg_net` disponível no projeto Supabase. | **Parcialmente verificada (27/10/2026, leitura direta do isolado): `pg_cron` instalado; `pg_net` disponível, mas NÃO instalado.** Falta instalar (autorização específica) e demonstrar o `http_post` (LC-01); senão, §8.9 (alternativas). Especificação da N2 e do LC-01: `src/lib/newsletter/README.md`. |
| PV-05 | `ON DELETE CASCADE` ignora RLS nas tabelas filhas. | T-NL-I19 |
| PV-08 | Plano da Vercel permite `maxDuration` de 120 s e o cron escolhido. | Painel da Vercel |
| PV-09 | Scripts de terceiros não executam nas páginas de token após o isolamento. | LC-03, T-NL-E06 |
| PV-10 | Logs da Vercel registram a query string. | LC-03 |
| PV-11 | O DKIM do Resend assina `List-Unsubscribe` e `List-Unsubscribe-Post`. | E-mail real, LC-02 |
| PV-12 | Chaves de idempotência do Resend valem 24 h (informado pela revisão de engenharia). | Documentação do provedor |
| PV-19 | A Vercel sobrescreve `x-real-ip`/`x-forwarded-for` com o IP do cliente. | Documentação + deploy isolado |
| PV-21 | `ON CONFLICT … DO UPDATE` com contador é atômico sob concorrência. | T-RL-I01 |
| PV-22 | Cota diária do plano Resend e impacto de picos no e-mail de leads e nos alertas. | DEP-02 |
| PV-23 | Clientes de e-mail e scanners não removem o fragmento `#t=` do link. | Teste com Gmail/Outlook, LC-03 |
| PV-24 | `after()` roda após a resposta em Route Handlers na Vercel (só caminho rápido). | Documentação + teste |
| PV-25 | O rastreamento de abertura e de clique do Resend pode ser desativado. | LC-02 |
| PV-26 | É possível criar um papel `NOLOGIN` dono das funções `SECURITY DEFINER` no Supabase hospedado, com o inventário de privilégios do §11.4 (inclusive `SELECT (id)` em `admin_users` com *policy* própria e acesso a `auth.uid()` ou leitura equivalente dos *claims*). Se não for viável, aplica-se o fallback condicionado do §11.5. | Ambiente isolado, T-NL-I16, T-NL-I17, T-NL-I30 |
| PV-27 | Timeout de requisição e limites de taxa do Resend compatíveis com os valores do §8.5. | Documentação + LC-01 |

## 4. Arquitetura e modelo de dados

### 4.1 Visão

```
Home <NewsletterSignup>  (só se NEWSLETTER_SIGNUP_ENABLED)     /newsletter/descadastro (sem token: pedido de link)
   │ POST /api/newsletter/subscribe                                │ POST /api/newsletter/unsubscribe-request
   ▼                                                               ▼
 origem → Zod → honeypot → Turnstile → rate limit ─────────────────┐
   ▼                                                               │ resposta uniforme
 RPC newsletter_request_subscription / _request_unsubscribe_link   │
   │ grava assinante + consentimento + outbox (1 transação)        │
   ▼                                                               │
 after(dispatchOnce)  +  pg_cron → pg_net → /api/internal/newsletter/dispatch
   ▼  claim (inclui recuperação de lease vencido) → prepare (emite tokens) → Resend
 e-mail com links
   ▼
 PÁGINAS DE TOKEN (layout sem rastreadores):
   /newsletter/confirmar#t=…    → botão → Server Action → RPC newsletter_confirm(hash)
   /newsletter/descadastro#t=…  → botão → Server Action → RPC newsletter_unsubscribe(hash)
 POST /api/newsletter/unsubscribe?t=… (RFC 8058 one-click) → RPC newsletter_unsubscribe(hash)
```

Unidades: `lib/newsletter/tokens` (gerar, formatar, calcular hash) · `lib/newsletter/email` (montagem com versão de template) · `lib/newsletter/dispatch` (processador) · `lib/newsletter/consent` (versões de texto) · rotas e actions finas. Nenhuma importa de `lib/leads` nem de componentes de leads (RF-NL-10).

### 4.2 Tabelas

Todas com RLS ligado e, **explicitamente**, `REVOKE ALL` de `anon` e `authenticated` antes de conceder o mínimo (RNF-09).

**`newsletter_subscribers`**

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `email` | `text NOT NULL` | como digitado, trim, ≤ 254 |
| `email_normalized` | `text NOT NULL UNIQUE` | minúsculas + trim; não remove `+tag` nem pontos |
| `status` | `text NOT NULL` | CHECK em `pending, active, unsubscribed` |
| `created_at`, `updated_at` | `timestamptz NOT NULL` | `updated_at` por trigger |
| `confirmed_at` | `timestamptz` | — |
| `unsubscribed_at` | `timestamptz` | base do cooldown pós-descadastro (§5.3) |
| `last_request_at` | `timestamptz` | última vez que um pedido gerou e-mail de confirmação |

CHECKs de coerência: `pending` ⇒ `confirmed_at IS NULL`; `active` ⇒ `confirmed_at IS NOT NULL AND unsubscribed_at IS NULL`; `unsubscribed` ⇒ `unsubscribed_at IS NOT NULL`.

**`newsletter_tokens`** (credenciais persistentes; ver §6)

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | `uuid` PK | — |
| `subscriber_id` | `uuid NOT NULL` | FK → `newsletter_subscribers(id)` **`ON DELETE CASCADE`** |
| `kind` | `text NOT NULL` | CHECK em `confirm, unsubscribe` |
| `token_hash` | `text NOT NULL UNIQUE` | SHA-256 (hex) do token bruto; o token bruto **não** é guardado aqui |
| `expires_at` | `timestamptz` | obrigatório para `confirm` (CHECK); nulo para `unsubscribe` |
| `consent_text_version` | `text` | **obrigatório para `confirm`** (CHECK); a versão do texto de consentimento apresentada no pedido que originou o token; nula para `unsubscribe` |
| `policy_version` | `text` | idem, para a política de privacidade |
| `last_used_at` | `timestamptz` | apenas observabilidade do `unsubscribe` |
| `outbox_id` | `uuid` | FK → `newsletter_outbox(id)` `ON DELETE SET NULL` (os tokens sobrevivem à purga do outbox) |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | — |

**A tabela guarda apenas credenciais vivas.** Não existe `used_at` nem `revoked_at`: um token de confirmação é **removido** ao ser consumido ou revogado; um token de descadastro é removido ao ser revogado ou quando o assinante sai (cascade). Um token removido é indistinguível de um token que nunca existiu, o que dá a resposta neutra do §7.5 sem armazenar tokens revogados. Índice `(subscriber_id, kind)`.

**`newsletter_outbox_payload`** (material bruto transitório, somente `service_role`)

| Coluna | Tipo | Regra |
|---|---|---|
| `outbox_id` | `uuid` PK | FK → `newsletter_outbox(id)` **`ON DELETE CASCADE`** |
| `confirm_token` | `text` | token bruto de confirmação (só no tipo `confirmation`) |
| `unsubscribe_token` | `text NOT NULL` | token bruto de descadastro |
| `template_version` | `text NOT NULL` | versão do template fixada na preparação |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | — |

A linha existe só enquanto a mensagem está em aberto e é **apagada** quando o item chega a `sent` ou `dead`. Nenhum papel além de `service_role` tem acesso, nem o admin.

**`newsletter_consents`** (append-only)

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | `uuid` PK | — |
| `subscriber_id` | `uuid NOT NULL` | FK → `newsletter_subscribers(id)` **`ON DELETE CASCADE`** |
| `event` | `text NOT NULL` | CHECK em `consent_requested, consent_confirmed, unsubscribed_link, unsubscribed_one_click, unsubscribed_admin` |
| `consent_text_version` | `text` | obrigatório em `consent_requested` e `consent_confirmed`; em `consent_confirmed` é **sempre a versão do pedido original**, copiada do token (§7.2), nunca um valor recebido do cliente nem a versão vigente no momento da confirmação |
| `policy_version` | `text` | idem |
| `source_path` | `text` | só o caminho (≤ 200), sem query |
| `ip_hash` | `text` | HMAC com pepper e prefixo `consent-ip`; **pseudonimizado, não anônimo** |
| `reason` | `text` | CHECK em `titular_request, bounce_or_complaint, other` (só `unsubscribed_admin`) |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | — |

Sem `user_agent` (RNF-07). A FK obrigatória impede evento órfão (RF-NL-09).

**`newsletter_outbox`**

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | `uuid` PK | — |
| `subscriber_id` | `uuid NOT NULL` | FK `ON DELETE CASCADE` |
| `kind` | `text NOT NULL` | CHECK em `confirmation, unsubscribe_link` |
| `consent_text_version` | `text` | obrigatório quando `kind = confirmation` (CHECK): versão do texto do **pedido original**, fixada no enfileiramento e copiada para o token C na preparação |
| `policy_version` | `text` | idem, para a política |
| `status` | `text NOT NULL DEFAULT 'queued'` | CHECK em `queued, sending, retry, sent, dead` |
| `attempts` | `integer NOT NULL DEFAULT 0` | também é o token de comparação na conclusão (§8.1) |
| `first_attempt_at` | `timestamptz` | definido no primeiro claim |
| `next_attempt_at` | `timestamptz NOT NULL DEFAULT now()` | — |
| `lease_until` | `timestamptz` | — |
| `deadline_at` | `timestamptz NOT NULL DEFAULT now() + interval '20 hours'` | equivale a `created_at + 20 h` (PRP-05); default do banco |
| `idempotency_key` | `text GENERATED ALWAYS AS ('nl-' \|\| id::text) STORED, UNIQUE` | estável entre tentativas; não escolhida por quem insere |
| `provider_message_id` | `text` | id devolvido pelo Resend |
| `last_error_code` | `text` | CHECK numa lista fechada de códigos; **sem texto livre** |
| `outcome_unknown` | `boolean NOT NULL DEFAULT false` | verdadeiro se a última tentativa foi ambígua |
| `dead_reason` | `text` | CHECK em `deadline_elapsed, attempts_exhausted, permanent_error, superseded, invalid_state` |
| `created_at`, `updated_at`, `sent_at` | `timestamptz` | — |

Índice único parcial `(subscriber_id, kind) WHERE status IN ('queued','sending','retry')`: no máximo uma mensagem em aberto por assinante e tipo. Índice `(next_attempt_at) WHERE status IN ('queued','retry')` e índice `(lease_until) WHERE status = 'sending'` para o processador.

**Contadores de rate limit:** tabela e função genéricas da E0c (SDD Leads §6). Não há tabela própria da newsletter.

### 4.3 Independência de leads

Nenhuma FK, nenhuma coluna `lead_id`, nenhum JOIN, nenhuma importação de módulo de leads, nenhuma cópia automática. O mesmo e-mail pode existir nas duas tabelas sem relação entre elas (RN-06). Dois testes garantem: T-NL-U10 (estático) e T-NL-I23 (catálogo do banco).

## 5. Anti-abuso e rate limit

### 5.1 Ordem de validação (inscrição e pedido de descadastro)

1. Sinalizador: inscrição só se `NEWSLETTER_SIGNUP_ENABLED`; o **pedido de descadastro nunca é desligado** (§18.5).
2. Origem (mesma regra do contato; helper compartilhado só depois da integração da tracking, DEP-07).
3. Corpo JSON com tamanho máximo e Zod (formato de e-mail; consentimento obrigatório na inscrição).
4. Honeypot: se preenchido, devolve a **mesma resposta uniforme** sem fazer nada.
5. Turnstile (helper da E0b.4, fail-closed em produção).
6. Rate limit (`rate_limit_hit`).
7. Uma única chamada RPC.
8. Resposta uniforme.

### 5.2 Buckets (valores iniciais, provisórios, PRP-02)

Chaves = HMAC com `RATE_LIMIT_PEPPER` do valor normalizado (IP ou e-mail). São **dados pessoais pseudonimizados**, retidos até 2 dias.

| Bucket | Limite | Janela |
|---|---|---|
| `nl:sub:ip` | 5 | 1 h |
| `nl:sub:email` | 3 | 24 h |
| `nl:unreq:ip` | 5 | 1 h |
| `nl:unreq:email` | 3 | 24 h |
| `nl:tok:ip`: conta **somente tentativas com token malformado ou não encontrado** (confirmar, descadastrar, one-click); token encontrado nunca conta | 30 | 1 h |
| `nl:global` | derivado da cota diária do Resend, deixando folga para e-mail de leads e alertas (PV-22) | 24 h |

**Token válido nunca é limitado por IP.** O POST de RFC 8058 sai dos servidores do provedor de e-mail do destinatário, com IP compartilhado por muitos titulares; um limite por IP bloquearia descadastros legítimos, o que um opt-out não pode sofrer. A mesma regra vale para confirmação e descadastro pela página, para não bloquear titulares atrás de NAT corporativo.

Como os tokens têm 256 bits (§6), a força bruta é inviável; o contador serve para **sinalização, alerta e contenção de carga**, não como defesa criptográfica. Acima do limite, requisições com token malformado ou **não encontrado** recebem 429 (na página e no one-click); requisições com token encontrado continuam sendo atendidas. Um token de assinante já excluído é "não encontrado" (§7.5): conta, mas é raro e inofensivo.

Sem IP determinável: o bucket de IP é ignorado e os demais continuam. Falha do banco: **fecha** com 429 genérico na inscrição e no pedido de descadastro; no one-click e no descadastro por token a falha do banco responde **503** (nunca 429). Excedeu: 429 com mensagem genérica, idêntica para qualquer endereço.

### 5.3 Cooldowns por assinante (dentro da RPC, nunca visíveis ao cliente)

Uma nova confirmação só é enfileirada quando **todas** as condições do estado são verdadeiras:

| Estado | Condições |
|---|---|
| novo | sempre |
| `pending` | `now ≥ last_request_at + 10 min`; menos de 3 linhas de confirmação **criadas** nas últimas 24 h (em qualquer estado, inclusive `dead`); nenhum item de confirmação em aberto |
| `unsubscribed` | **`now ≥ unsubscribed_at + 7 dias`** (protege quem saiu de reenvio por terceiros); e, para pedidos seguintes enquanto continua `unsubscribed`, as mesmas condições de `pending` (10 min, 3 por 24 h, nenhum item em aberto) |
| `active` | nunca gera e-mail |

Ao ser bloqueado por cooldown, a RPC não faz nada e a resposta ao cliente continua idêntica. Isso previne reenvios duplicados, mail-bomb contra terceiros e reinscrição indevida (R-03).

**Consequência (proposta de aceitação, §6.7):** quem clicou "não fui eu" por engano passa a `unsubscribed` e só se reinscreve 7 dias depois, contados de `unsubscribed_at` (a interface continua mostrando a mensagem uniforme). Após uma **eliminação** (§10.3) o endereço volta a ser tratado como novo, sujeito aos buckets.

### 5.4 Resposta uniforme (RF-NL-03)

Inscrição, para qualquer estado do endereço (novo, pendente, ativo, descadastrado) e para honeypot: HTTP `202`, mesmo corpo (`{"status":"received"}`), mesmos cabeçalhos relevantes, mesmo texto de interface: "Se o endereço for válido, você receberá um e-mail para confirmar a inscrição." Pedido de descadastro: mesma ideia, texto próprio. Erros que podem aparecer independentemente do endereço: formato inválido (400), Turnstile (400), rate limit (429), falha interna (500 genérico), inscrição desativada (503).

Para reduzir diferença de tempo entre os estados, todas as ramificações da RPC executam poucas instruções e o envio de e-mail acontece fora do caminho da requisição (outbox). T-NL-U03 compara respostas; a medição de tempo é indicativa, não garantia criptográfica.

## 6. Tokens

### 6.1 Requisitos e alternativas avaliadas (substitui PRP-08)

Requisitos: links antigos continuam funcionando; descadastro idempotente; nenhuma credencial global de longa vida cuja revogação quebre links; rotação e revogação seguras; reenvio previsível; vazamento do banco não entrega credenciais utilizáveis.

| Alternativa | Avaliação |
|---|---|
| **A. Tokens assinados com HMAC e chaveiro** (desenho anterior) | **Rejeitada.** Depende de chaves globais: para manter links antigos é preciso guardar chaves antigas indefinidamente como credenciais válidas, e revogar uma chave quebra todos os links dela (PRP-08 rejeitada pela revisão). |
| **B. Tokens opacos aleatórios de 256 bits, só o hash persistido, validação por consulta ao banco, token bruto transitório no outbox** | **Escolhida (PRP-09).** Sem segredo global; validade decidida pela linha no banco; revogação individual; links antigos funcionam enquanto a linha existir; vazamento do banco expõe apenas hashes. |
| C. Um token fixo por assinante, cifrado em repouso | Rejeitada: reintroduz uma chave global (de cifra) e um token único cuja revogação quebra todos os links. |
| D. Guardar o token bruto no banco | Rejeitada: vazamento do banco entrega credenciais válidas. |

Custo da alternativa B (a aprovar junto com PRP-09; risco R-11): o token bruto precisa existir até o envio (para o payload ser idêntico entre tentativas e preservar a idempotência no provedor). Ele fica na tabela transitória `newsletter_outbox_payload`, acessível só ao `service_role`, apagada no estado terminal.

### 6.2 Formato, geração e armazenamento

- Token = `nlt_` + base64url de **32 bytes** de CSPRNG (47 caracteres). O prefixo permite varredura de segredos e rejeição rápida de entradas malformadas.
- Gerado pelo servidor da aplicação no **primeiro claim** do item (passo *prepare*, §8.1), não no enfileiramento.
- Persistido apenas como **SHA-256 (hex)** em `newsletter_tokens`. A consulta é por igualdade do hash (índice único); com 256 bits de entropia, comparar o hash sem tempo constante não vaza informação utilizável.
- Dois tipos:

| Token | Finalidade | Validade | Uso |
|---|---|---|---|
| **C** (`confirm`) | `pending`/`unsubscribed` → `active` | `expires_at` = criação do outbox + 48 h | **uso único**: a linha é removida ao consumir |
| **U** (`unsubscribe`) | descadastrar | **sem expiração** | idempotente, reutilizável |

- Formato máximo aceito: 64 caracteres, charset base64url com prefixo `nlt_`; entradas fora disso são rejeitadas antes de tocar no banco.

### 6.3 Ciclo de vida, rotação, revogação e reenvio

| Evento | Efeito |
|---|---|
| Emissão | cada mensagem enviada recebe seu próprio par: `confirmation` leva C e U; `unsubscribe_link` leva só U |
| Uso de C | **remove a linha do token**; ativa o assinante; remove os demais C pendentes do assinante |
| Uso de U | descadastra (idempotente); atualiza `last_used_at`; o token **continua válido** |
| Novo pedido de confirmação | remove os C anteriores; **não** remove nenhum U |
| Descadastro de assinante `pending` | remove os C pendentes (não dá para confirmar depois de "não fui eu") |
| Reinscrição | usa C novo; U antigos continuam válidos |
| **Rotação** | **não existe segredo para rotacionar.** A rotação é a emissão contínua de tokens novos por mensagem; os antigos permanecem até o assinante ser excluído ou purgado |
| **Revogação individual** | **remove a linha** do token específico (suspeita de vazamento de uma mensagem); não se guarda registro do token revogado |
| **Revogação em lote** | função administrativa por assinante (remove todos os U dele); incidente de segurança em massa não depende de nenhuma chave, só de remover linhas |
| Token removido, expirado, consumido ou nunca existente | **indistinguíveis**: resposta neutra (§7.5) e, na página, "link inativo ou já utilizado" com o formulário de **novo link** (§7.4) |
| Exclusão/purga do assinante | os tokens saem por `CASCADE`; o link passa a ser "não encontrado" e recebe a resposta neutra e idempotente do §7.5; nenhum e-mail será enviado a esse endereço |
| Limpeza | C expirados há mais de 7 dias são apagados; tokens de mensagens `dead` sem `outcome_unknown` são apagados na purga do outbox |

**Estratégia de reenvio:**
- *Confirmação:* cada reenvio é uma nova linha de outbox, um novo C e um novo U; só o último C vale.
- *Descadastro:* cada e-mail de `unsubscribe_link` traz um U novo; os anteriores continuam funcionando. Crescimento limitado pelos buckets do §5.2 (no máximo 3 por dia por e-mail); sem teto adicional.
- *Retentativa técnica (mesma linha de outbox):* **reutiliza** os tokens guardados em `newsletter_outbox_payload`; nunca gera tokens novos.
- *Falha do envio:* tokens de uma mensagem que terminou `dead` sem `outcome_unknown` são descartados; com `outcome_unknown`, permanecem, porque a mensagem pode ter sido entregue.

### 6.4 Como o token chega à página

| Link | Forma | Onde o token aparece |
|---|---|---|
| Confirmar | `https://www.rc2solucoes.com.br/newsletter/confirmar#t=<C>` | **fragmento**: não vai ao servidor, a logs, a `Referer` nem ao `page_location` |
| Descadastrar (página) | `…/newsletter/descadastro#t=<U>` | fragmento |
| One-click (cabeçalho `List-Unsubscribe`) | `https://www.rc2solucoes.com.br/api/newsletter/unsubscribe?t=<U>` | **query**, inevitável: o cliente de e-mail faz o POST direto nessa URL |

Comportamento das páginas de token (PRP-04, **condicionada ao isolamento do §6.5**):

1. Um componente cliente lê `location.hash`, guarda o token em memória e executa `history.replaceState` para remover o fragmento imediatamente.
2. Mostra o botão ("Confirmar inscrição" / "Confirmar descadastro"). O clique chama uma Server Action com o token no corpo (POST).
3. `GET` nunca altera estado (scanners de e-mail seguem links).
4. Cabeçalhos e metadados: `robots: noindex, nofollow`, `referrer: no-referrer`, `Cache-Control: no-store`, fora do sitemap.
5. Sem token no fragmento, a página mostra o formulário de **pedido de novo link** (com Turnstile, carregado somente neste ramo, depois que a ausência de token foi confirmada).
6. Sem JavaScript, a página mostra instrução para habilitar ou pedir novo link.

**Alternativa de contingência para PV-23 (cookie-bridge):** o link vai para `GET /n/c/<token>`, que só grava um cookie `HttpOnly; Secure; SameSite=Lax; Path=/newsletter; Max-Age=600` e responde `303` para a página limpa. Funciona sem JS, mas o token passa pelo log de requisições da plataforma. Adotar apenas se PV-23 mostrar que clientes de e-mail removem o fragmento.

### 6.5 Isolamento de rastreadores de terceiros (requisito arquitetural, DEC-27)

**Requisito.** As páginas e rotas que recebem token (`/newsletter/confirmar`, `/newsletter/descadastro` e `/api/newsletter/*`) **não podem carregar nem executar** nenhum script de terceiros de medição: nem GTM/`gtm.js`, nem GA4, nem Meta Pixel, nem Ahrefs Analytics, nem o script de bootstrap de consentimento que alimenta o `dataLayer`, nem `PageViewTracker`, nem `ConsentManager`. O isolamento é garantido **pela estrutura de layouts**, de modo que o código de rastreamento não seja sequer enviado ao navegador nessas páginas. Uma checagem em tempo de execução dentro dos componentes de rastreamento **não satisfaz** o requisito sozinha.

**Por que não basta testar depois:** hoje o GTM está no layout raiz (EV-16) e pode carregar a qualquer interação ou 2,5 s após o `load` (EV-28); a ordem frente à remoção do fragmento não é garantida.

**Critérios de aceite (independentes da opção escolhida):**
1. Nas páginas de token, nenhuma requisição a domínios de medição (`googletagmanager.com`, `google-analytics.com`, `analytics.google.com`, `googleadservices.com`, `doubleclick.net`, `connect.facebook.net`, `facebook.com`, `analytics.ahrefs.com`).
2. `window.dataLayer` e `window.gtag` indefinidos nessas páginas.
3. O layout dessas rotas não importa componentes de rastreamento (T-NL-U22).
4. T-NL-E06 e LC-03 (BL-05) confirmam.
5. O Turnstile só carrega no ramo sem token e é um serviço de segurança, não de medição.

**Opções de arquitetura. Decisão: PRP-10 aprovada com a opção O5.** O impacto sobre a branch de tracking (DEP-07) continua exigindo coordenação com seu responsável.

| Opção | Descrição | Prós | Contras |
|---|---|---|---|
| **O5 (aprovada, PRP-10)** | Mover os rastreadores (script de bootstrap de consentimento, `DelayedGtm`, `PageViewTracker`) do layout raiz para o layout do grupo `(public)`; as rotas de token entram num grupo novo `(newsletter)` com layout sem rastreadores, sob o **mesmo layout raiz** | Sem mover arquivos; páginas estáticas preservadas; URLs inalteradas | Altera `src/app/layout.tsx` (arquivo que a branch de tracking também altera): exige coordenar com a tracking; `/admin`, `not-found` e `error` globais deixam de ter rastreadores, o que precisa de decisão explícita do responsável pela tracking |
| O1 | Múltiplos *root layouts*: remover o `layout.tsx` de topo e criar um por grupo (`(site)`, `(newsletter)`) | Isolamento total, inclusive de CSS e fontes | Move boa parte de `src/app`; exige `global-not-found` (EV-29); *full page load* entre grupos; maior raio de impacto |
| O4 | Páginas de token como *Route Handlers* que devolvem HTML autocontido, sem nenhum layout | Isolamento por construção sem tocar layouts | Estilo fora do sistema de componentes; risco de hex literal e de divergência de marca; mais difícil de testar |
| O2 | Checagem em tempo de execução (`usePathname`) nos componentes de rastreamento | Mudança mínima | **Insuficiente como requisito**: o código de rastreamento ainda é enviado, depende de JS e pode regredir |

A opção O5 está aprovada; o plano detalha a mudança, incluindo o tratamento de `/admin`, `not-found` e `error`, que deixam de ter rastreadores e precisam da decisão explícita do responsável pela tracking. O1 e O4 ficam como alternativas descartadas. Enquanto a O5 não estiver implementada e verificada, **BL-05 permanece aberto**.

### 6.6 Modelo de ameaças dos tokens

| Ameaça | Controle | Risco remanescente |
|---|---|---|
| Adivinhar ou forçar um token | 256 bits de entropia; prefixo e formato rígidos; contador de malformados e não encontrados por IP | Inviável |
| Vazamento de leitura do banco | Só hashes SHA-256; payload bruto apagado no estado terminal e inacessível ao admin | Janela de até 20 h para mensagens ainda em aberto, em tabela restrita ao `service_role` |
| Reuso de C | Uso único (a linha é removida ao consumir) e remoção ao novo pedido | Nenhum |
| Reuso de U | Idempotente por definição | Só descadastra o dono do token |
| Token em log, histórico, e-mail ou *Referer* | Fragmento removido; `no-referrer`; `no-store`; isolamento de rastreadores (§6.5); rastreamento do Resend desativado (PV-25) | **R-05:** U do one-click na query em logs da plataforma (PV-10); U guardado nas mensagens armazenadas pelo Resend; gateways de e-mail do destinatário. Impacto limitado a descadastrar |
| Enumeração de endereços | Respostas neutras; token consumido, expirado, removido ou de assinante excluído são indistinguíveis de token inexistente | Nenhum |
| Scanner de e-mail que segue links | `GET` não muda estado | Nenhum |
| Ataque de descadastro em massa por terceiro | Exige o token de cada assinante | Quem recebe a mensagem pode descadastrar a si mesmo, por design |
| Comprometimento de segredo de aplicação | Não há segredo de token; o pepper do rate limit só afeta pseudonimização | Nenhum para tokens |
| Admin lendo credenciais | `newsletter_tokens` e `newsletter_outbox_payload` sem privilégio para o admin | Admin vê e-mails dos assinantes (R-08) |

### 6.7 Reinscrição e links antigos

| Cenário | Resultado |
|---|---|
| Novo pedido de confirmação | C anteriores removidos; U anteriores continuam |
| Confirmação já usada reaberta | "Este link está inativo ou já foi utilizado." sem revelar mais nada |
| Reinscrição depois de descadastro | segue pelo fluxo C normal (estado permanece `unsubscribed` até confirmar) |
| Link U de uma inscrição anterior | **continua válido** |
| Assinante excluído ou purgado | os tokens saíram por cascade; o link U é "não encontrado": resposta neutra e idempotente (§7.5), sem estado novo |
| Atraso no envio | `expires_at` do C = criação do outbox + 48 h; mensagens não enviadas em 20 h morrem (§8.4), logo o C entregue tem pelo menos 28 h de validade restante |
| Retentativa com o mesmo item | usa os mesmos tokens (payload armazenado) |

## 7. Fluxos

### 7.1 Inscrição

**Versões de consentimento (vínculo exato com o pedido).** As versões do texto de consentimento e da política **não vêm do cliente como verdade**: são constantes do servidor (`CONSENT_TEXT_VERSION`, `POLICY_VERSION`). O formulário envia, junto do checkbox, o identificador da versão que renderizou (`consentTextVersion`); o servidor compara com a constante vigente e, se forem diferentes (página antiga em cache), **rejeita** o pedido com erro genérico de formulário desatualizado, sem gravar nada. Assim, a versão gravada é exatamente a que o titular viu.

RPC `newsletter_request_subscription(email, email_normalized, consent_text_version, policy_version, source_path, ip_hash)`, `service_role`, uma transação, sem retorno ao cliente (as duas versões entram como as constantes validadas acima):

| Estado atual | Ação |
|---|---|
| inexistente | cria `pending`, evento `consent_requested` (com as versões), enfileira `confirmation` **gravando as mesmas versões no item do outbox** |
| `pending` e cooldown liberado (§5.3) | atualiza `last_request_at`, remove C não consumidos, evento `consent_requested` (com as versões vigentes no novo pedido), enfileira com essas versões |
| `unsubscribed` e cooldown liberado (`unsubscribed_at + 7 dias`, §5.3) | idem (permanece `unsubscribed` até confirmar) |
| `active`, ou cooldown ativo, ou item em aberto | **nada** |

As versões percorrem o caminho `pedido → outbox → token C → consent_confirmed` (§4.2); nenhuma etapa as recalcula.

`INSERT … ON CONFLICT (email_normalized) DO NOTHING` seguido de `SELECT … FOR UPDATE` serializa pedidos concorrentes. O índice parcial do outbox impede duas mensagens em aberto.

### 7.2 Confirmação

`confirmSubscription(token)` (Server Action): valida o formato → calcula o SHA-256 → RPC `newsletter_confirm(token_hash, ip_hash)`, atômica. **A RPC não recebe versão de consentimento nenhuma**: trava o token (`FOR UPDATE`), exige `kind='confirm'`, `expires_at` no futuro e assinante em `pending` ou `unsubscribed`; lê `consent_text_version` e `policy_version` **da própria linha do token** (as do pedido original); **remove o token**; define `active`, `confirmed_at`, zera `unsubscribed_at`; remove os demais C do assinante; grava `consent_confirmed` com exatamente aquelas versões. Se o texto vigente mudou entre o pedido e a confirmação, o evento mantém a versão do pedido: é essa a que o titular aceitou. Duas confirmações simultâneas produzem um único evento. Resultados: `confirmed`, `invalid` (token inexistente, consumido, expirado, removido). `invalid` conta em `nl:tok:ip`.

### 7.3 Descadastro

`unsubscribe(token, channel)` → valida o formato → SHA-256 → RPC `newsletter_unsubscribe(token_hash, channel)`: token `unsubscribe` encontrado → assinante: se `pending` ou `active` vira `unsubscribed` com `unsubscribed_at`, remove os C pendentes e grava evento (`unsubscribed_link` ou `unsubscribed_one_click`); se já `unsubscribed`, retorna sucesso sem novo evento; atualiza `last_used_at`. Resultados: `unsubscribed`, `already_unsubscribed`, `not_found` (nenhuma linha de token com esse hash: nunca existiu, foi removida, ou o assinante foi excluído). Efeito imediato (RN-08). A página interativa trata `not_found` com texto neutro e sem afirmar que houve descadastro (§7.5).

### 7.4 Pedido público de descadastro (novo link)

Formulário em `/newsletter/descadastro` (sem token) com e-mail e Turnstile → `POST /api/newsletter/unsubscribe-request` → mesma cadeia do §5.1 (sem o sinalizador de inscrição) → RPC `newsletter_request_unsubscribe_link(email_normalized)`: se `pending` ou `active` e cooldown de 10 min liberado, enfileira `unsubscribe_link`; caso contrário, nada. Resposta uniforme. **Nunca altera o status pelo e-mail digitado** (RF-NL-04, previne descadastro de terceiros). **Este fluxo não é desativável** (§18.5). Se o Turnstile estiver indisponível, o caminho é o canal do titular (BL-01/L5), atendido pela função administrativa de descadastro (§11.3).

### 7.5 One-click RFC 8058

`POST /api/newsletter/unsubscribe?t=<U>` com corpo `application/x-www-form-urlencoded` `List-Unsubscribe=One-Click`:

- Sem origin check, sem Turnstile, sem cookies, sem autenticação (o cliente de e-mail dispara). O servidor não depende de cookie nem de sessão em nenhum ponto.
- Ordem: lê o corpo (limite pequeno) → exige `List-Unsubscribe=One-Click`, senão `400` → valida o **formato** do token → SHA-256 → RPC `newsletter_unsubscribe(token_hash, 'one_click')`.
- **Tabela de resultados (única e sem contradição):**

| Situação | HTTP | Efeito |
|---|---|---|
| corpo ausente ou diferente de `List-Unsubscribe=One-Click` | `400` | nenhum; conta em `nl:tok:ip` |
| token **malformado** (prefixo, tamanho ou charset inválidos) | `400` | nenhum; conta em `nl:tok:ip` |
| token bem formado, **encontrado**, assinante `pending`/`active` | `200` | descadastra |
| token bem formado, **encontrado**, assinante já `unsubscribed` | `200` | nenhum (idempotente) |
| token bem formado, **não encontrado** (nunca existiu, foi removido ou revogado, ou o assinante foi excluído/purgado por cascade) | `200` | **nenhum**; conta em `nl:tok:ip`; resposta idêntica à de sucesso |
| acima do limite de `nl:tok:ip` e token não encontrado ou malformado | `429` | nenhum |
| falha do banco | `503` (nunca `429`) | nenhum; o provedor de e-mail pode repetir depois |

- **Por que `200` para token bem formado e não encontrado:** o servidor não guarda tokens revogados nem excluídos (§4.2), logo não consegue — nem deve — distinguir "nunca existiu" de "existiu e o assinante foi eliminado". Responder `200` neutro e idempotente é o comportamento correto para um link antigo depois da exclusão: o objetivo do opt-out (nenhum envio a esse destinatário) já está satisfeito, e o provedor de e-mail não fica repetindo a tentativa. Não revela existência de assinante, não cria estado novo e não exige armazenar tokens revogados.
- **Página interativa** (`/newsletter/descadastro#t=`): token não encontrado mostra "Este link está inativo ou já foi utilizado. Se você ainda recebe e-mails da RC2, peça um novo link abaixo", **sem** afirmar que houve descadastro, com o formulário do §7.4.
- Responde `200` diretamente, **sem redirecionamento**; corpo mínimo, sem dados do assinante; `Cache-Control: no-store`.
- **Sem rate limit por IP para token válido** (§5.2).
- `GET` na mesma URL não altera estado: responde `303` para `/newsletter/descadastro#t=<U>`.
- **Endpoint obrigatório de manutenção** (§18.5): permanece ativo com a newsletter desativada ou em *rollback*.

**Checklist de conformidade com RFC 8058 (lado servidor)**

| Requisito | Atendimento |
|---|---|
| POST com corpo `List-Unsubscribe=One-Click` | exigido; outro corpo → `400` |
| Link antigo depois da exclusão do assinante | `200` neutro e idempotente (tabela acima); sem armazenar token revogado |
| Sem cookies nem autenticação HTTP | atendido; nenhuma sessão envolvida |
| Sem interação do usuário após o POST | atendido; descadastra e responde `200` |
| Sem redirecionamento na resposta ao POST | atendido; `200` direto |
| URI HTTPS que identifica o destinatário | `…/api/newsletter/unsubscribe?t=<U>`, token único por mensagem |
| Idempotência | atendida |
| Não depender de origem, CSRF ou Turnstile | atendido |
| Não ser bloqueado por IP compartilhado de provedores | atendido (§5.2) |
| Links antigos continuam funcionando | atendido (§6.3: U não expira nem depende de chave) |

O lado remetente está no §9 (cabeçalhos e DKIM).

## 8. Outbox: envio persistente, retry, recuperação e idempotência

### 8.1 Estados e recuperação

```
queued ──claim──▶ sending ──sucesso──────────────────────▶ sent
   ▲                 │ falha transitória / ambígua
   │                 ▼
   └──── retry ◀─────┘
sending com lease vencido ──claim (por qualquer worker, antes do deadline)──▶ sending (attempts+1, outcome_unknown)
queued/retry/sending(lease vencido) com deadline vencido ──expire──▶ dead(deadline_elapsed)
attempts ≥ 12 ──expire──▶ dead(attempts_exhausted)
em aberto ──▶ dead (permanent_error | invalid_state | superseded)
```

| Transição | Condição |
|---|---|
| `queued/retry → sending` | `next_attempt_at ≤ agora`, `deadline_at > agora`, `attempts < 12`; `lease_until = agora + lease`; `attempts + 1`; `first_attempt_at` definido uma vez |
| **`sending → sending` (recuperação)** | `lease_until ≤ agora`, `deadline_at > agora`, `attempts < 12`: o **mesmo claim** que busca itens vencidos também reivindica itens `sending` com lease vencido; incrementa `attempts`, renova o lease e marca `outcome_unknown = true`; mantém a mesma chave de idempotência |
| `sending → sent` | resposta 2xx com id: grava `provider_message_id` e `sent_at`, limpa `lease_until` e `outcome_unknown`, **apaga o payload** |
| `sending → retry` | erro transitório ou ambíguo (§8.3): `next_attempt_at` pelo backoff |
| qualquer em aberto `→ dead` | `permanent_error`, `invalid_state`, `superseded`, `deadline_elapsed` ou `attempts_exhausted`; **apaga o payload** |
| `sent`, `dead` | terminais |

**Quem executa a recuperação.** Não há processo de recuperação separado. A recuperação é uma parte do `newsletter_outbox_claim`, executado por **qualquer** worker: o caminho rápido (`after`) ou a varredura de `pg_cron`/`pg_net`. O item volta a ser processado na primeira chamada de claim depois que o lease vence; latência máxima de recuperação = lease + período da varredura (§8.5).

**Como as corridas são evitadas**
1. **Claim em um só comando** com `FOR UPDATE SKIP LOCKED`: dois workers nunca reivindicam o mesmo item.
2. **Conclusão por comparação e troca** (`newsletter_outbox_complete(id, attempt, outcome, …)`): só altera a linha se continua `sending` e `attempts = attempt`; caso contrário o resultado é descartado (outro worker reivindicou depois do vencimento do lease). A repetição com a mesma chave de idempotência reconcilia o estado real no provedor.
3. **Índice único parcial**: no máximo uma mensagem em aberto por assinante e tipo.
4. **Chave de idempotência fixa** por linha: um segundo envio concorrente recebe `concurrent_idempotent_requests` ou a resposta original.

**Funções (`service_role`)**
- `newsletter_outbox_claim(batch, lease_seconds)`: devolve itens com o valor de `attempts` da reivindicação (inclui recuperação).
- `newsletter_outbox_prepare(id, attempt, confirm_hash, confirm_raw, unsub_hash, unsub_raw, template_version)`: idempotente; se o payload já existe, não faz nada (retentativa reutiliza); grava `newsletter_tokens` e `newsletter_outbox_payload` na mesma transação, só se `attempts = attempt`. Para o token C, **copia `consent_text_version` e `policy_version` da linha do outbox** (as do pedido original) para a linha do token; a função não aceita essas versões como parâmetro.
- `newsletter_outbox_complete(id, attempt, outcome, …)`: compara e troca; apaga o payload em estado terminal.
- `newsletter_outbox_expire()`: marca `dead(deadline_elapsed)` os itens `queued`/`retry` vencidos e os `sending` com **lease vencido** e deadline vencido; marca `dead(attempts_exhausted)` os que atingiram 12 tentativas; **nunca toca um `sending` com lease válido**; apaga payloads dos que morrem; preserva `outcome_unknown`; descarta tokens da mensagem sem `outcome_unknown`.

**Conclusão tardia:** se uma tentativa em voo termina com sucesso depois do `deadline_at` mas com o lease ainda válido, grava `sent`. Se o lease já vencera e a linha foi marcada `dead(deadline_elapsed)`, a comparação falha; a verdade fica em `outcome_unknown = true` e no log do provedor, e o titular pode pedir novo link.

### 8.2 Identificação e idempotência

- `idempotency_key = nl-<outbox.id>`, enviada em todas as tentativas da linha (EV-17).
- O payload é **determinístico por linha**: tokens vêm de `newsletter_outbox_payload`; a versão do template é fixada em `template_version` na preparação; o conteúdo não depende de relógio. Mudar o template exige manter a versão antiga disponível por pelo menos 24 h após o deploy; reutilizar a chave com payload diferente seria `invalid_idempotent_request` (bug, §8.3).
- `provider_message_id` é gravado quando conhecido, inclusive quando uma repetição devolve a resposta original.
- Antes de enviar, o processador revalida o assinante conforme o tipo; se a condição falhar, marca `dead(superseded)` **sem enviar**:

| Tipo | Enviável somente se |
|---|---|
| `confirmation` | o assinante existe; `status ∈ {pending, unsubscribed}`; `unsubscribed_at` é nulo ou **anterior** a `outbox.created_at` (quem se descadastrou depois do pedido não recebe); e, se o item já foi preparado, o token C vinculado ainda existe e não expirou (consumo ou remoção equivalem a "superado") |
| `unsubscribe_link` | o assinante existe e `status ∈ {pending, active}` |

### 8.3 Classificação de resultados

| Resultado do provedor | Classe | Ação |
|---|---|---|
| 2xx com id | sucesso | `sent` |
| `validation_error`, `invalid_from_address`, `invalid_parameter`, `missing_required_field`, `missing_api_key`, `invalid_api_key`, `restricted_api_key`, `invalid_access`, `security_error` | **permanente** | `dead(permanent_error)` + alerta de configuração |
| `rate_limit_exceeded`, `daily_quota_exceeded`, `monthly_quota_exceeded` | transitório | `retry` respeitando o backoff; alerta se for cota |
| `concurrent_idempotent_requests` | transitório | `retry` curto (outra tentativa está em voo) |
| `invalid_idempotent_request` | **bug** | `dead(invalid_state)` + alerta |
| 5xx, `application_error`, `internal_server_error`, erro de rede, timeout, aborto, queda do processo | **ambíguo** | `retry` **com a mesma chave**, `outcome_unknown = true` |

### 8.4 Resultado ambíguo e janela de idempotência

Quando o resultado é desconhecido, a mensagem pode ter sido aceita. A repetição com a **mesma chave** dentro da janela de idempotência do provedor devolve a resposta original em vez de enviar de novo.

| Regra | Valor |
|---|---|
| Janela de idempotência do provedor (PV-12) | 24 h |
| `deadline_at` | `created_at + 20 h`; como `first_attempt_at ≥ created_at`, toda tentativa ocorre a menos de 20 h da primeira, com 4 h de folga |
| Após o `deadline_at` | **nenhuma tentativa automática**. A linha vira `dead(deadline_elapsed)`; se a última tentativa foi ambígua, `outcome_unknown` permanece verdadeiro e aparece no admin |
| Duplicação além da janela | impossível por construção: não há reenvio automático depois de 20 h; um novo e-mail só nasce de um **novo pedido** (nova linha, nova chave) |
| Novo pedido enquanto há item em aberto | bloqueado pelo índice parcial e pelo cooldown |
| Reenvio administrativo | só com o item anterior terminal; revoga os C anteriores |
| Consequência (proposta de aceitação, R-07) | em caso raro de entrega desconhecida seguida de novo pedido, o titular pode receber dois e-mails, e só o último C vale |
| Link da mensagem `dead` com `outcome_unknown` | se foi de fato entregue, o C continua válido até `expires_at` **enquanto não houver novo pedido** |

Backoff após erro explícito: 1 min, 5 min, 15 min, 1 h, 3 h e a cada 3 h até o prazo, com jitter de ±10%. Teto de **12 tentativas** no total (incluindo recuperações de lease); ao atingi-lo o item vira `dead(attempts_exhausted)`, o que impede *loop* de um item que derruba o processo.

### 8.5 Dimensionamento do processador (provisório, PRP-11)

Parâmetros e invariantes. Os valores são provisórios e se calibram em LC-01.

| Símbolo | Significado | Valor inicial |
|---|---|---|
| `T` | timeout de cada chamada ao provedor | 15 s |
| `B` | itens por lote, processados **em sequência** | 5 |
| `D` | `maxDuration` da rota de dispatch | 120 s |
| `L` | lease concedido a cada item | 180 s |
| `P` | período da varredura (`pg_cron`) | 60 s |
| `M` | margem | 30 s |

Invariantes:
1. **`D ≥ B·T + M`** (120 ≥ 105): a invocação termina o lote antes de ser encerrada pela plataforma.
2. **`L > D`** (180 > 120): enquanto a invocação está viva, nenhum de seus itens perde o lease; um item só é recuperado depois que a invocação que o reivindicou já não pode estar executando.
3. **A invocação não reivindica um lote que não caiba no orçamento restante** (`restante ≥ B·T + M`); depois do primeiro lote, normalmente encerra.
4. **Recuperação:** latência máxima = `L + P` = 240 s, muito abaixo do prazo de 20 h.
5. **Vazão nominal:** ~`B` itens por invocação; com a varredura de 1 min e o caminho rápido, é ordens de grandeza acima do volume esperado. Se a idade do mais antigo passar de 15 min, o alerta dispara (§8.6) e se calibra paralelismo (respeitando PV-27).
6. `deadline (20 h) ≫ L + P` e `deadline < 24 h` de idempotência.

Os valores dependem de PV-08 (`maxDuration`) e PV-27 (timeout e taxa do provedor).

### 8.6 Observabilidade da fila (RF-NL-16)

- `GET /api/internal/newsletter/health` (mesmo bearer): `{queued, retry, sending, sending_lease_expired, dead_24h, oldest_ready_age_seconds}`; sem PII.
- Alerta: o processador registra `newsletter_outbox_dead` (severidade `error`) no `admin_audit_logs` e inclui o evento em `ALERT_EVENT_WHITELIST` (EV-27); alerta de cota idem.
- **Sonda externa** (DEP-04) consulta o endpoint de saúde e alerta por canal independente do Resend se a idade do item mais antigo passar de 15 minutos, se houver `sending_lease_expired` persistente ou se a sonda falhar.
- O admin mostra profundidade da fila e idade do item mais antigo (E4-essencial).

### 8.7 Mensagens `dead`: causas, alerta e tratamento

Uma linha `dead` é terminal: **nunca é reenviada automaticamente**. A única forma de nascer um novo e-mail é um novo pedido (nova linha, nova chave).

| `dead_reason` | Causa típica | Alerta | Ação operacional |
|---|---|---|---|
| `permanent_error` | configuração (chave de API, remetente, parâmetro inválido) | **sim**, tipo `config` | corrigir a configuração; os titulares afetados pedem de novo, ou o admin reenvia (só `pending`) |
| `invalid_state` | bug de payload com chave de idempotência | **sim**, tipo `bug` | tratar como incidente de código; não reenviar em lote |
| `deadline_elapsed` | provedor indisponível, cota esgotada ou fila parada por mais de 20 h | **sim**, tipo `delivery` | investigar; `outcome_unknown` indica possível entrega; reenvio só por novo pedido |
| `attempts_exhausted` | 12 tentativas, tipicamente item que derruba o processo | **sim**, tipo `bug` | tratar como incidente de código |
| `superseded` | titular pediu de novo, descadastrou, foi excluído | **não** | nenhuma; é comportamento esperado |

- **Alertas sem inundação:** no máximo um alerta por tipo por hora, com a contagem acumulada; o evento por linha continua registrado no `admin_audit_logs` (sem e-mail). O alerta usa o mesmo provedor; se ele estiver indisponível, a sonda externa cobre.
- **Visibilidade:** detalhe do assinante e indicador da fila mostram estado, tentativas, `last_error_code`, `dead_reason` e `outcome_unknown`.
- **Reenvio administrativo:** apenas para assinante `pending` cujo último item de confirmação é terminal (`sent` ou `dead`), respeitando o cooldown (§11.3).
- **Retenção:** linhas terminais seguem `P-RET-04`; a purga do outbox não afeta assinante, consentimento nem tokens vigentes.

### 8.8 Processamento

| Caminho | Descrição |
|---|---|
| Rápido | Depois de gravar a RPC, o handler chama `after(dispatchOnce)`. Reduz latência; **não é** a garantia (PV-24). Usa o mesmo `claim`, portanto também recupera leases vencidos. |
| Garantia | `pg_cron` a cada `P` → `pg_net` `http_post` para `POST /api/internal/newsletter/dispatch` com `Authorization: Bearer <NEWSLETTER_DISPATCH_SECRET>`. URL e segredo no Vault do Supabase. **Exposição transitória:** no Supabase hospedado, `net.http_request_queue` e `net._http_response` pertencem a `supabase_admin` com SELECT para `PUBLIC` e **não podem ser restringidas por `REVOKE`** (o `postgres` não assume o proprietário e o worker do `pg_net` usa `postgres`); os cabeçalhos HTTP, inclusive o bearer, ficam legíveis ali até o envio. Controles exigidos antes do apply (N2, preflight 15B–15D e gates G-1 a G-3 do runbook 019): `anon`/`authenticated` sem `LOGIN`, nenhum papel com `LOGIN` não previsto, schema `net` fora da Data API (configuração efetiva; sem prova automática → evidência manual) e segredos de Preview e Production segregados. Quando PRE/POS-15D retornar `nao_verificavel`, o SQL continua REPROVADO; o runbook N2 permite apenas uma decisão **operacional condicional e registrada** (17/18, exclusivamente 15D pendente, prova G-1 vinculada ao ambiente, G-2/G-3 aprovados, autorização específica). `exposto` ou qualquer outra falha = NO-GO. Risco residual documentado no runbook. |
| Rota de dispatch | compara o segredo em tempo constante; sem corpo; respeita os invariantes do §8.5; devolve só contagens; nunca registra segredo, e-mail nem tokens. Processa `unsubscribe_link` **sempre**; processa `confirmation` somente se `NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED` (§18.5). |
| Manutenção | job a cada 5 min chama `newsletter_outbox_expire()`; limpeza de tokens C descartáveis; purgas conforme §10. |

### 8.9 Mecanismo de processamento: gate de lançamento (BL-03)

E3 permanece bloqueada (não integra nem liga) até existir um mecanismo confiável **demonstrado**. Candidatos:

| Opção | Condição | Observação |
|---|---|---|
| A. `pg_cron` + `pg_net` | PV-04 confirmado | recomendada; roda a cada minuto, independente do plano da Vercel |
| B. Vercel Cron a cada minuto | plano que permita (PV-08) | exige mudança de plano; mesma rota de dispatch |
| C. Agendador externo dedicado | decisão de infraestrutura | novo componente; mesmo teste de aceite |

**Vercel Cron diário e reenvio manual não contam como alternativa.** Qualquer opção deve passar nos cenários do gate (LC-01):
1. envio normal;
2. processo encerrado no meio do envio, com **recuperação do lease vencido por outro worker antes do deadline** (itens `sending` voltam a ser processados, com a mesma chave);
3. falha 5xx injetada, com repetição na mesma chave e um único e-mail entregue;
4. provedor fora do ar além de 20 h, com `dead` e alerta;
5. dispatcher parado, com a sonda alertando;
6. dois workers concorrentes, sem item processado duas vezes;
7. item que derruba o processo repetidamente chega a `attempts_exhausted` sem laço infinito.

## 9. E-mails

| | Confirmação | Link de descadastro |
|---|---|---|
| Remetente | `RC2 Soluções <newsletter@rc2solucoes.com.br>` (BL-02) | idem |
| Responder para | `contato@rc2solucoes.com.br` | idem |
| Assunto | "Confirme sua inscrição na newsletter da RC2" | "Descadastro da newsletter da RC2" |
| Corpo | texto + HTML simples, tokens de cor da marca, sem imagens remotas; explica que o endereço foi informado no site, nomeia os temas (automação, integração de sistemas, IA aplicada a operações), **não cita frequência**; botão para o link C; "Não foi você? Ignore ou descadastre-se" com o link U | botão para o link U |
| Cabeçalhos RFC 8058 | **sim** | não |

**Cabeçalhos exigidos nos e-mails de newsletter:**

1. `List-Unsubscribe: <https://www.rc2solucoes.com.br/api/newsletter/unsubscribe?t=<U>>`: uma URI HTTPS única por mensagem.
2. `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
3. DKIM assinando ambos os cabeçalhos, com domínio alinhado ao remetente (PV-11, BL-02).
4. O endpoint do §7.5 cumpre o lado servidor.

Os cabeçalhos entram também no e-mail de confirmação porque dão ao titular que não pediu a inscrição uma saída de um clique. O e-mail de "link de descadastro" não os leva. Qualquer mensagem de conteúdo futura **deve** usar o mesmo construtor, que um teste de contrato protege (T-NL-U08).

**Rastreamento de abertura e clique desativado** no domínio e nos envios (PV-25): links com token não podem ser reescritos nem registrados fora do domínio (DEC-24). **Sem imagens remotas**. Condição de LC-02.

**Versão do template:** cada mensagem fixa `template_version` na preparação (§8.2); a versão antiga fica disponível por pelo menos 24 h depois de qualquer mudança.

**Escopo do RFC 8058:** a norma trata de mensagens de lista; aqui os cabeçalhos protegem também a confirmação. As regras de remetentes em massa dos grandes provedores não se aplicam ao volume atual e devem ser reavaliadas quando houver campanhas (fora do escopo).

## 10. Privacidade, retenção e supressão

### 10.1 Conceitos distintos (DEC-23)

| Conceito | O que é | Efeito nos dados |
|---|---|---|
| **Descadastro** | titular revoga o consentimento | status `unsubscribed`; nenhum envio futuro; a linha com o e-mail, os eventos de consentimento e os tokens permanecem |
| **Supressão de envios** | garantia de que ninguém envia a quem saiu | a própria linha `unsubscribed` serve de supressão; qualquer envio futuro **só** para `status='active'` |
| **Retenção de evidências** | guardar prova de consentimento por prazo | os eventos de `newsletter_consents` e o `ip_hash` **vivem tanto quanto a linha do assinante** (vínculo `CASCADE`). Reter evidência além da linha exige a extensão do §10.3 |
| **Exclusão / eliminação** | titular pede eliminação (LGPD art. 18) ou admin exclui | remove assinante, consentimentos, tokens e outbox (cascade); o endereço passa a ser tratado como novo. Exceções só se o jurídico exigir (§10.3) |

**Consequência de modelo, sem contradição:** existe um único relógio de retenção para assinante, evidência e tokens (`P-RET-02` para descadastrados). Não há prazo separado para evidências; um prazo distinto só faz sentido se a extensão do §10.3 for aprovada. A supressão é a própria linha, portanto eliminar a linha elimina a supressão; isso é coerente porque a newsletter só envia a quem confirmou o double opt-in, e um endereço eliminado só volta a receber mensagem se o dono da caixa postal confirmar de novo.

**Hash de e-mail ou de IP é dado pessoal pseudonimizado, não anônimo.** Por isso: não existe lista de supressão por hash; contadores de rate limit têm retenção curta e constam da política; `ip_hash` dos consentimentos segue a retenção da linha. O hash SHA-256 de um token aleatório de 256 bits **não** é reidentificável, mas está ligado ao assinante pela FK e segue o mesmo ciclo de vida.

### 10.2 Inventário e retenção (BL-01)

| Dado | Onde | Finalidade | Retenção |
|---|---|---|---|
| E-mail e estado do assinante | `newsletter_subscribers` | operar o consentimento | enquanto ativo; descadastrado conforme `P-RET-02`, contado a partir de `unsubscribed_at` |
| Eventos de consentimento e `ip_hash` | `newsletter_consents` | prova de consentimento | **mesma duração da linha do assinante** (cascade); prazo próprio só com a extensão do §10.3 |
| Hashes de token | `newsletter_tokens` | validar links já enviados | mesma duração da linha do assinante; C descartáveis limpos em 7 dias |
| Token bruto transitório | `newsletter_outbox_payload` | repetir o envio com o mesmo conteúdo | apagado no estado terminal; no máximo ~20 h |
| Não confirmados | `newsletter_subscribers` (`pending`) | validar o e-mail | `P-RET-01` (proposta 7 dias, contados de `last_request_at`; maior que a validade de 48 h do C) |
| Itens terminais do outbox | `newsletter_outbox` | diagnóstico de entrega | `P-RET-04` (proposta 30 dias); a purga do outbox não afeta assinante, consentimento nem tokens vigentes |
| Contadores de rate limit | `rate_limit_counters` | antiabuso | 2 dias (técnico) |
| Auditoria de ações do admin | `admin_audit_logs` | segurança | política existente, sem prazo definido (dívida) |
| Cópia no provedor de e-mail | Resend | entrega | política do provedor, a declarar |
| Backups | Supabase | continuidade | rotação do provedor, a declarar |

**Todos os `P-RET-*` ficam `PENDENTE` até a validação jurídica (BL-01).** Os parâmetros são `P-RET-01` (pendentes), `P-RET-02` (descadastrados, incluindo evidência e tokens) e `P-RET-04` (outbox). Os jobs de purga só são criados depois que os valores existirem; até lá nenhum dado é apagado automaticamente, e a E3 não é lançada.

### 10.3 Eliminação e evidência de consentimento

Modelo padrão: **eliminação total** (assinante, consentimentos, tokens e outbox saem por cascade). Se o jurídico exigir manter prova mínima após eliminação, o modelo precisa de uma extensão aditiva (registro de evidência sem relação com o e-mail, com retenção própria). Essa extensão **não está especificada aqui** e exige revisão deste SDD (BL-01). Nenhuma implementação pode assumir uma das duas respostas.

**O que a eliminação não alcança.** A ferramenta apaga dados no banco da aplicação. Ela **não** apaga a cópia da mensagem e do endereço mantida pelo provedor de e-mail, os backups do Supabase nem os registros de plataforma (§10.2); esses itens entram no procedimento jurídico de atendimento ao titular. A ferramenta também **não verifica a identidade** de quem solicita; o procedimento de identificação é definido pelo jurídico (BL-01).

**Encerramento da newsletter.** Se o produto for descontinuado, os links já enviados devem continuar respondendo por um período definido pelo jurídico (BL-01, L9) ou ser substituídos por mecanismo equivalente ativo (DEC-26).

### 10.4 Decisões jurídicas que fecham o lançamento (BL-01)

Base legal e texto de consentimento (finalidade específica, destacado, desmarcado) · prazos `P-RET-01`, `P-RET-02` e `P-RET-04` · eliminação versus prova de consentimento (e se a evidência precisa sobreviver à linha, o que exige a extensão do §10.3) · supressão · operadores e transferência internacional (Supabase, Resend, Vercel, Cloudflare) · canal e prazo de atendimento ao titular · retenção de `ip_hash` · informação sobre backups · **período mínimo de manutenção dos links de descadastro após um eventual encerramento (L9)**. A política de privacidade (`docs/06-politica-privacidade.md` e `/privacidade`) é atualizada antes do lançamento (BL-08, RF-NL-17).

## 11. Segurança, RLS, privilégios e funções administrativas

### 11.1 Privilégios por tabela

| Tabela | `anon` | admin autenticado | autenticado não-admin | `service_role` |
|---|---|---|---|---|
| `newsletter_subscribers` | nada | **`SELECT` apenas** | nada | tudo |
| `newsletter_consents` | nada | **`SELECT` apenas** | nada | tudo |
| `newsletter_outbox` | nada | **`SELECT` apenas** | nada | tudo |
| `newsletter_tokens` | nada | **nada** | nada | tudo |
| `newsletter_outbox_payload` | nada | **nada** | nada | tudo |

- Admin = `(select auth.uid()) IN (SELECT id FROM public.admin_users)`.
- O papel `authenticated` **não tem privilégio de `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` nem `TRIGGER`** em nenhuma tabela da newsletter. O admin não escreve nelas pela API. Toda mudança administrativa passa pelas funções do §11.3 (DEC-19 revisada).
- Funções do fluxo público (`newsletter_request_*`, `newsletter_confirm`, `newsletter_unsubscribe`, `newsletter_outbox_*`): `SECURITY INVOKER`, `search_path` fixo, `EXECUTE` apenas para `service_role` (`REVOKE` de `public`, `anon`, `authenticated`).
- Segredos de ambiente: `NEWSLETTER_DISPATCH_SECRET` e `RATE_LIMIT_PEPPER` na Vercel; segredo e URL do dispatch também no Vault do Supabase. A chave da API do Resend deve ser restrita a envio. **Não há segredo de token.**
- CSP: nenhuma origem nova prevista (EV-25).

### 11.2 Modelo de ameaça do admin (R-08)

O admin é confiável para **ler** os dados da newsletter (e-mails, estado, histórico). Ele **não** consegue, pela API: fabricar consentimento, ativar assinante, inserir mensagem de confirmação, editar ou excluir evento de consentimento, ler tokens nem o payload bruto. Consegue apenas executar as três operações de negócio do §11.3, cada uma restrita, atômica e auditada. Um admin comprometido ainda lê todos os e-mails e pode descadastrar ou excluir assinantes: isso é o poder do papel e fica registrado.

### 11.3 Operações administrativas: funções `SECURITY DEFINER` restritas (DEC-19 revisada)

Substitui as *policies* de escrita do admin e o antigo trigger de guarda. Cada operação é **uma função** que representa uma ação de negócio e escreve, na mesma transação, o estado, o evento de consentimento (quando aplicável) e o registro de auditoria.

| Função | Entrada | Efeito | Resultado |
|---|---|---|---|
| `newsletter_admin_unsubscribe(p_subscriber_id, p_reason)` | `reason ∈ {titular_request, bounce_or_complaint, other}` | `pending/active → unsubscribed`; evento `unsubscribed_admin`; revoga C pendentes; auditoria | `unsubscribed`, `already_unsubscribed`, `not_found` |
| `newsletter_admin_resend_confirmation(p_subscriber_id)` | — | só `pending`; exige o último item de confirmação terminal e o cooldown (§5.3) liberado; revoga C anteriores; enfileira `confirmation`; auditoria | `queued`, `not_pending`, `cooldown`, `open_item`, `not_found` |
| `newsletter_admin_delete_subscriber(p_subscriber_id, p_confirmation)` | `p_confirmation` literal `EXCLUIR` | apaga o assinante (cascade para consentimentos, tokens e outbox); **confere a linha removida**; grava auditoria no mesmo comando | `deleted`, `not_found`, `confirmation_invalid` |
| `newsletter_admin_revoke_unsubscribe_tokens(p_subscriber_id)` | — | revoga todos os U do assinante (resposta a vazamento); auditoria | `revoked`, `not_found` |

**Requisitos de segurança de cada função (verificados por T-NL-I16 e T-NL-I17)**

1. **Autorização explícita no corpo:** a primeira instrução verifica `auth.uid()` em `public.admin_users`; caso contrário, `RAISE EXCEPTION` com código `42501`. A autorização não depende só dos privilégios de `EXECUTE`. Como a função roda com os privilégios do **dono**, e não do chamador, o dono precisa conseguir consultar `admin_users` (ver §11.4).
2. **Proprietário adequado:** a função pertence a um papel dedicado `newsletter_ops` (`NOLOGIN`, sem `SUPERUSER`/`BYPASSRLS`), com o inventário exato de privilégios do §11.4 e *policies* `TO newsletter_ops` para esses acessos. O uso de `postgres` como dono é **fallback condicionado** (§11.5).
3. **`search_path` fixo:** `SET search_path = pg_catalog, public`, objetos sempre qualificados, **sem SQL dinâmico**.
4. **Grants mínimos:** `REVOKE ALL ON FUNCTION … FROM PUBLIC, anon, authenticated` seguido de `GRANT EXECUTE … TO authenticated` apenas para essas funções; `service_role` mantém o acesso padrão.
5. **Entrada validada:** UUID, `reason` e `confirmation` conferidos dentro da função; retornam códigos de um conjunto fechado, nunca texto livre nem dados do assinante.
6. **Auditoria na mesma transação:** cada função insere em `admin_audit_logs` (evento `admin_newsletter_*`, `actor_user_id = auth.uid()`, `actor_type = 'admin'`, `method = 'RPC'`, `resource_type`, `resource_id`, `metadata` só com códigos). Se a auditoria falhar, a operação inteira é revertida: a ação **não existe sem registro**, mesmo se chamada direto pela API. O hash do e-mail do ator, calculado pela aplicação, fica fora (o `actor_user_id` basta).
7. **Atômica e idempotente:** repetir a operação não produz efeito duplicado.
8. **Superfície mínima:** funções auxiliares internas (como o enfileiramento compartilhado com o fluxo público) não têm `EXECUTE` para nenhum papel de API.

A aplicação chama estas funções com a **sessão do admin** depois de `requireAdmin()`. Negações geram `admin_newsletter_action_denied` na própria aplicação.

**Notas.** (a) "Revogar" token significa **remover a linha** (§6.3). (b) `newsletter_admin_resend_confirmation` **não introduz versão nova de consentimento**: reutiliza `consent_text_version` e `policy_version` do último evento `consent_requested` do assinante e falha com `no_prior_request` se não houver; reenviar o link é reentregar o mesmo consentimento pedido, não colher outro.

### 11.4 Autorização do papel `newsletter_ops` sobre `admin_users`

`admin_users` tem RLS com a policy "Admin users - can read own admin status", que vale **apenas para `authenticated`** (migration 005). Um dono sem `BYPASSRLS` e sem policy própria **não enxergaria nenhuma linha** e toda chamada falharia como não-admin. Por isso o inventário de acesso do `newsletter_ops` é explícito e mínimo:

| Objeto | Privilégio | Observação |
|---|---|---|
| `public.admin_users` | `SELECT (id)` somente | coluna única; sem `email`; mais *policy* `FOR SELECT TO newsletter_ops USING (id = (select auth.uid()))`: o dono só enxerga **a linha do próprio chamador**, nunca lista os admins |
| `public.newsletter_subscribers`, `newsletter_consents`, `newsletter_outbox`, `newsletter_tokens`, `newsletter_outbox_payload` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` conforme a função, mais *policies* `TO newsletter_ops` | nada além do necessário às quatro funções |
| `public.admin_audit_logs` | `INSERT` somente, mais *policy* `FOR INSERT TO newsletter_ops` | para a auditoria atômica |
| `auth.uid()` | `USAGE` no schema `auth` e `EXECUTE` na função | alternativa, se a plataforma não permitir: ler `sub` de `current_setting('request.jwt.claims', true)` dentro da função (sem conceder acesso ao schema `auth`); a escolha é validada em PV-26 |
| Qualquer outra tabela (incluindo `leads`, `lead_notes`, `posts`, `settings`) | **nada** | verificado por consulta ao catálogo |

Efeito: a verificação de administrador funciona com RLS ativa e sem `BYPASSRLS`, o papel não pode enumerar administradores e não toca dados fora da newsletter. Validação em T-NL-I16 (chamada por admin, por não-admin e por `anon`), T-NL-I17 (catálogo de funções) e T-NL-I30 (inventário exato de privilégios e leitura limitada de `admin_users`).

### 11.5 Fallback: `postgres` como dono das funções (condicional)

`postgres` no Supabase pode contornar RLS. Usá-lo como dono só é aceitável se **todas** as condições forem satisfeitas e registradas, e **não é o padrão**:

1. PV-26 mostrou que o papel dedicado não é viável, com a evidência anexada.
2. **Análise de risco adicional documentada:** como o dono ignora RLS, a única barreira interna é o código das funções; qualquer defeito (autorização esquecida, `search_path`, SQL dinâmico) tem alcance de banco inteiro. Mitigações obrigatórias: verificação de administrador **explícita** em todas as funções (já exigida), `search_path` fixo, nenhum SQL dinâmico, entrada validada e `EXECUTE` mínimo.
3. **Testes adicionais obrigatórios:** T-NL-I31 (não-admin é negado mesmo com RLS contornada pelo dono; nenhuma função toca tabelas fora da newsletter e de `admin_audit_logs`; análise estática de ausência de `EXECUTE`/SQL dinâmico) além de T-NL-I16 e T-NL-I17.
4. **Aprovação explícita de engenharia** antes de adotar, registrada no plano.

## 12. Administração (E4)

Rotas: `/admin/newsletter` (lista) e `/admin/newsletter/[id]` (detalhe); item novo na barra lateral.

### 12.1 E4-essencial (condição de ativação pública, BL-11)

| Elemento | Especificação |
|---|---|
| Lista | busca por e-mail (2–80 caracteres, escape do SDD CMS §6.3), filtro por status, paginação de 20 no servidor, estados carregando, vazio, vazio filtrado e erro |
| Detalhe | status e datas; histórico de consentimento (versões de texto e política, canal, motivo); histórico do outbox (estado, tentativas, código de erro, `outcome_unknown`, `dead_reason`), sem texto de erro livre |
| Ações | **descadastrar** com motivo (`newsletter_admin_unsubscribe`) e **excluir** com confirmação `EXCLUIR` (`newsletter_admin_delete_subscriber`) |
| Fila | indicador de profundidade, idade do mais antigo, `dead` nas últimas 24 h e `sending_lease_expired` (RF-NL-16) |

Esse conjunto dá a quem opera os meios de **atender um pedido de descadastro ou de eliminação, localizar um assinante e perceber uma fila parada** antes de a newsletter ficar pública.

### 12.2 E4-complemento (não bloqueia a ativação)

| Elemento | Especificação |
|---|---|
| Contadores | total por `pending`, `active`, `unsubscribed` (contagem direta) |
| Filtro | por período (`created_at`, Brasília) |
| Ação | reenviar confirmação (**só `pending`**, `newsletter_admin_resend_confirmation`) |
| Ação | revogar tokens de descadastro do assinante (`newsletter_admin_revoke_unsubscribe_tokens`) |

**Proibido:** ativar manualmente; editar e-mail; exportar CSV; enviar conteúdo; ler tokens.

Server Actions: `requireAdmin()` → Zod → função do §11.3 (sessão do admin) → mapeia o código de resultado. A auditoria das ações é feita pela própria função.

**Exclusão:** o resultado `deleted` só é devolvido após a função conferir a linha removida; o cascade remove consentimentos, tokens e outbox. Atende pedido de eliminação do titular no modelo padrão (§10.3).

## 13. Seção da Home (RF-NL-14)

- Componente `NewsletterSignup` posicionado **antes** do `HomeCtaBlock`, sem competir com ele (RN-10). O CTA principal permanece "Falar sobre minha operação". Renderizado **somente** com `NEWSLETTER_SIGNUP_ENABLED`.
- Estrutura: título, uma linha de apoio nomeando os temas, campo de e-mail com rótulo, checkbox de consentimento **desmarcado** com texto versionado e link para `/privacidade`, widget Turnstile, botão primário (texto `--rc2-heading`), link "Quero me descadastrar" para `/newsletter/descadastro`.
- Mensagens em `aria-live`; erros ligados ao campo; foco visível; funciona em 320 px.
- Tokens `--rc2-*` apenas; fundo `--rc2-bg-alt` ou `--rc2-bg`; sem gradiente; Safety Orange só no botão; ícone Lucide de traço fino se houver.
- **Copy e texto de consentimento provisórios**, sem frequência, sem promessa de resultado, sem citar clientes; aprovação em BL-10, texto jurídico em BL-01. O texto tem versão (`consent_text_version`) gravada em cada evento.
- Analytics: `newsletter_signup_submit`, `newsletter_signup_success_shown`, `newsletter_signup_error`, sem e-mail nem token, respeitando o consentimento de analytics; registrados em `docs/ANALYTICS_EVENTS.md`. Eventos existem só na Home, que fica sob o layout com rastreamento; as páginas de token não emitem eventos.

## 14. Integridade

- Assinante único por `email_normalized`.
- CHECKs de coerência entre estado e datas.
- Consentimento, tokens e outbox sempre ligados a assinante existente (FK obrigatória, cascade).
- Máximo de uma mensagem em aberto por assinante e tipo.
- Confirmação atômica e de uso único; descadastro idempotente.
- Eventos de consentimento imutáveis para todos os papéis exceto `service_role`; ordem estável por `created_at` e `id`.
- Nenhum caminho de API cria `active` fora da RPC de confirmação; o `authenticated` não tem privilégio de escrita.
- Toda operação administrativa e sua auditoria são uma única transação.

## 15. Falhas e recuperação

| Falha | Comportamento |
|---|---|
| Banco indisponível na inscrição | 500 genérico ou 429 do rate limit; nada gravado |
| Banco indisponível no rate limit da inscrição | fecha (429 genérico) |
| Banco indisponível no one-click ou no descadastro por token | `503`; o provedor ou o titular repete |
| Resend fora do ar | itens ficam em `retry`; processador tenta até 20 h; depois `dead` + alerta; titular pode pedir de novo |
| Processo cai durante o envio | lease vence (180 s); o próximo claim de qualquer worker recupera o item como ambíguo, com a mesma chave |
| Gravação do resultado falha após envio | idem: repetição devolve a resposta original dentro da janela |
| Dois workers no mesmo item | `SKIP LOCKED` impede o claim duplo; conclusão obsoleta é descartada |
| Item derruba o processo repetidamente | `dead(attempts_exhausted)` após 12 tentativas |
| Segredo de dispatch incorreto | 401 sem corpo; evento de segurança `newsletter_dispatch_unauthorized` |
| Token revogado, expirado, usado ou desconhecido | página neutra com formulário de novo link (§7.4) |
| Turnstile indisponível no pedido de novo link | falha fechada; o canal do titular (L5) e a função administrativa de descadastro cobrem |
| Cota do Resend esgotada | `retry` com alerta; e-mail de leads e alertas disputam a mesma cota (R-04) |
| Assinante excluído durante o envio | revalidação antes do envio; se a linha sumir na conclusão, o resultado é descartado |
| Função administrativa falha na auditoria | a operação inteira é revertida |
| Escrita de auditoria da aplicação falha | engolida por design nas ações fora das funções; operação não é desfeita |

## 16. Observabilidade

Logs estruturados com `event`, `outbox_id`, `attempt`, código de resultado e latência, **sem e-mail, token, URL ou cabeçalhos**. Endpoint de saúde, sonda externa, alertas pelo mecanismo existente de segurança, contadores no admin. Auditoria das ações administrativas gravada pelas próprias funções. Dashboard de produto (taxa de confirmação) calculado a partir de contagens, sem rastrear pessoa.

## 17. Matriz de testes

### Unitários

| ID | Teste | Requisito |
|---|---|---|
| T-NL-U01 | Formato do token: prefixo `nlt_`, tamanho, charset; entradas malformadas ou grandes rejeitadas antes do banco | RF-NL-06 |
| T-NL-U02 | Geração de token: 32 bytes de CSPRNG, unicidade, SHA-256 estável, token bruto nunca persistido fora do payload transitório nem registrado em log | RF-NL-06 |
| T-NL-U03 | Resposta de inscrição idêntica (status, corpo, cabeçalhos) para os quatro estados e honeypot | RF-NL-03 |
| T-NL-U04 | Máquina de estados do outbox, transições válidas e inválidas, inclusive recuperação `sending → sending` | RF-NL-08 |
| T-NL-U05 | Classificação de códigos do provedor (permanente, transitório, ambíguo, bug) | RF-NL-08 |
| T-NL-U06 | Chave de idempotência estável e payload idêntico entre tentativas; `template_version` fixada; tokens reutilizados | RF-NL-08 |
| T-NL-U07 | Nenhuma tentativa agendada após `deadline_at`; backoff; teto de 12 tentativas | RF-NL-08 |
| T-NL-U08 | Construtor de e-mail: cabeçalhos RFC 8058 na confirmação e ausentes no e-mail de link; sem imagens remotas | RF-NL-05 |
| T-NL-U09 | Inscrição sem consentimento é rejeitada; a versão gravada é a constante do servidor | RF-NL-01 |
| T-NL-U10 | Teste estático: módulos de newsletter não importam módulos de leads | RF-NL-10 |
| T-NL-U11 | Handlers de token não registram URL, cabeçalhos, corpo nem token (espiona `console` e logger) | RF-NL-15 |
| T-NL-U12 | Payload de analytics não contém e-mail nem token | RF-NL-18 |
| T-NL-U13 | Rate limit: 429 genérico; falha do banco fecha | RF-NL-07 |
| T-NL-U14 | Página de token: remove o fragmento, não muta em GET, metadados `noindex`/`no-referrer`, `no-store`; Turnstile só no ramo sem token | RF-NL-15 |
| T-NL-U15 | Rate limit de tokens: só malformados e não encontrados contam por IP; one-click com token encontrado, repetido do mesmo IP, nunca recebe 429; falha do banco responde 503 | RF-NL-05, RF-NL-07 |
| T-NL-U16 | Revalidação antes do envio por tipo, incluindo descadastro posterior ao pedido (`unsubscribed_at` ≥ `created_at`) | RF-NL-08 |
| T-NL-U17 | One-click, tabela do §7.5: corpo ausente ou diferente → 400; token **malformado** → 400; token bem formado e **não encontrado** → 200 neutro, idêntico ao sucesso, sem alterar estado; encontrado → 200; 200 sem redirecionamento e sem `Set-Cookie`; sem token bruto em log | RF-NL-05 |
| T-NL-U24 | Contrato de inscrição: `consentTextVersion` ecoada pelo cliente diferente da vigente → pedido rejeitado sem gravar nada; versão gravada = constante do servidor, nunca valor do cliente | RF-NL-01, RF-NL-02 |
| T-NL-U18 | Alertas de `dead` agrupados: no máximo um e-mail por tipo por hora | RF-NL-08 |
| T-NL-U19 | Invariantes do processador: `D ≥ B·T + M`, `L > D`; a invocação não reivindica lote que não cabe no orçamento restante | RF-NL-08 |
| T-NL-U20 | Sinalizadores: inscrição desativada → 503; descadastro, one-click, pedido de novo link e confirmação seguem ativos; `confirmation` pausado não bloqueia `unsubscribe_link` | RF-NL-19 |
| T-NL-U21 | Manifesto de rotas de manutenção obrigatória: o teste falha se alguma for removida | RF-NL-19 |
| T-NL-U22 | Isolamento: o layout das rotas de token não importa componentes de rastreamento nem o script de bootstrap de consentimento | RF-NL-15 |
| T-NL-U23 | Server Actions administrativas mapeiam os códigos das funções (`forbidden`, `not_found`, `deleted`, `cooldown`…) sem expor detalhes | RF-NL-12 |

### Integração (ambiente isolado, DEC-16)

| ID | Teste | Requisito |
|---|---|---|
| T-NL-I01 | `anon` e autenticado não-admin sem acesso a nenhuma tabela da newsletter, a tokens, ao payload e a `rate_limit_counters` | RF-NL-09 |
| T-NL-I02 | Admin lê (`SELECT`) subscribers, consents e outbox; **sem acesso** a `newsletter_tokens` e `newsletter_outbox_payload` | RF-NL-11 |
| T-NL-I03 | Consentimentos append-only e FK obrigatória | RF-NL-09 |
| T-NL-I04 | CHECKs de coerência entre estado e datas | RF-NL-02 |
| T-NL-I05 | Matriz de estados da RPC de inscrição: cooldown de `unsubscribed` contado de `unsubscribed_at` (não de `last_request_at`), 10 min, 3 por 24 h incluindo `dead`, `active` sem efeito | RF-NL-02, 03 |
| T-NL-I06 | Pedidos concorrentes idênticos: um assinante e um item em aberto | RF-NL-08 |
| T-NL-I07 | Claim concorrente com N workers: nenhum item reivindicado duas vezes | RF-NL-08 |
| T-NL-I08 | **Recuperação:** item `sending` com lease vencido e `deadline_at` futuro é reivindicado pelo próximo claim de qualquer worker, com `attempts + 1`, `outcome_unknown = true` e a mesma chave | RF-NL-08 |
| T-NL-I09 | Lease vencido com `deadline_at` vencido: não é reivindicado; `expire` o marca `dead(deadline_elapsed)` e preserva `outcome_unknown` | RF-NL-08 |
| T-NL-I10 | Item que atinge 12 tentativas vira `dead(attempts_exhausted)` | RF-NL-08 |
| T-NL-I11 | Conclusão com `attempts` obsoleto é descartada; a nova tentativa prevalece | RF-NL-08 |
| T-NL-I12 | `expire` não toca `sending` com lease válido | RF-NL-08 |
| T-NL-I13 | Confirmação atômica e de uso único (a linha do token é **removida** ao consumir); confirmações simultâneas geram um evento; novo pedido remove os C anteriores sem remover U | RF-NL-02, 06 |
| T-NL-I14 | Descadastro idempotente; U válido após reinscrição; U removido por revogação individual passa a "não encontrado"; ausência total de segredo global de token | RF-NL-05, 06 |
| T-NL-I15 | Só o hash do token fica em `newsletter_tokens`; a tabela não tem `used_at` nem `revoked_at`; o payload bruto é apagado nos estados `sent` e `dead`; tokens de mensagem `dead` sem `outcome_unknown` são descartados | RF-NL-06 |
| T-NL-I16 | Funções administrativas: sem `EXECUTE` para `anon`; não-admin autenticado recebe `42501`; admin executa **com RLS ativa em `admin_users` e o dono sem `BYPASSRLS`** (a autorização consulta `admin_users` através dos grants do §11.4); falha na auditoria reverte a operação inteira | RF-NL-12 |
| T-NL-I17 | Catálogo das funções administrativas: `prosecdef`, `search_path` fixo, dono `newsletter_ops` (ou o dono alternativo documentado), ACL mínima, ausência de SQL dinâmico | RF-NL-12 |
| T-NL-I18 | Admin **não consegue** `INSERT`, `UPDATE` nem `DELETE` direto em subscribers, consents, outbox, tokens e payload | RF-NL-12 |
| T-NL-I19 | `newsletter_admin_delete_subscriber`: exclui assinante e filhos (cascade com RLS ativa), confere a linha, audita; sem confirmação literal não exclui | RF-NL-13 |
| T-NL-I20 | `newsletter_admin_resend_confirmation`: só `pending`, item anterior terminal, cooldown respeitado | RF-NL-12 |
| T-NL-I21 | Jobs de purga conforme `P-RET-*` (somente depois de definidos) | RF-NL-13 |
| T-NL-I22 | Evidência acompanha a linha: excluir ou purgar o assinante remove eventos e tokens | RF-NL-13 |
| T-NL-I23 | Nenhuma FK, coluna ou view ligando `newsletter_*` a `leads*` | RF-NL-10 |
| T-NL-I24 | `rate_limit_hit` atômico (T-RL-I01) usado pelos buckets da newsletter | RF-NL-07 |
| T-NL-I25 | Descadastro de `pending` remove os C pendentes | RF-NL-06 |
| T-NL-I27 | **Versão do consentimento no `consent_confirmed`:** a RPC de confirmação não aceita parâmetro de versão; o evento grava exatamente `consent_text_version` e `policy_version` do token (que vieram do pedido original, via outbox); alterar as constantes vigentes entre o pedido e a confirmação não muda o evento; um novo pedido com texto novo gera novo token com as versões novas | RF-NL-02 |
| T-NL-I28 | `newsletter_admin_resend_confirmation` reutiliza as versões do último `consent_requested` e falha com `no_prior_request` se não houver | RF-NL-12 |
| T-NL-I29 | Link antigo após exclusão ou purga do assinante (cascade): o token deixa de existir, nenhuma linha de token revogado é criada, e o POST one-click bem formado devolve `200` neutro e idempotente sem estado novo; a página interativa mostra a mensagem neutra com novo link | RF-NL-05 |
| T-NL-I30 | Inventário exato de privilégios do `newsletter_ops` (§11.4): lê **apenas a linha do chamador** em `admin_users` e apenas a coluna `id`; sem acesso a `leads`, `posts`, `settings` e demais tabelas | RF-NL-12 |
| T-NL-I31 | Condicional ao fallback `postgres` (§11.5): não-admin continua negado com RLS contornada pelo dono; funções não tocam tabelas fora da newsletter e de `admin_audit_logs`; ausência de SQL dinâmico | RF-NL-12 |
| T-NL-I26 | Dois itens de dispatch com sinalizador de confirmação desligado: `confirmation` espera, `unsubscribe_link` é enviado | RF-NL-19 |

### E2E (com sumidouro de e-mail no ambiente isolado)

| ID | Teste | Requisito |
|---|---|---|
| T-NL-E01 | Inscrição pela Home: mensagem uniforme, e-mail recebido | RF-NL-01, 03 |
| T-NL-E02 | Link de confirmação: GET não confirma; clique no botão confirma | RF-NL-02, 15 |
| T-NL-E03 | Descadastro pela página e pedido por e-mail | RF-NL-04, 05 |
| T-NL-E04 | POST one-click: 200, sem cookie, sem redirecionamento, idempotente; repetir depois da exclusão do assinante devolve o mesmo 200 neutro | RF-NL-05 |
| T-NL-E05 | Pedido de descadastro para e-mail desconhecido: mesma mensagem | RF-NL-03, 04 |
| T-NL-E06 | **Isolamento:** nas páginas de token, nenhuma requisição a domínios de medição, `window.dataLayer` e `window.gtag` indefinidos, token ausente da URL após a carga e de qualquer requisição a terceiros | RF-NL-15, 18 |
| T-NL-E07 | Link expirado, reutilizado, removido ou de assinante excluído levam à mensagem neutra e ao formulário de novo link | RF-NL-06 |
| T-NL-E08 | Reinscrição depois do descadastro | RF-NL-02 |
| T-NL-E09 | Acessibilidade (axe) da seção, das páginas de token e do admin | RNF-02 |
| T-NL-E10 | `npm run audit:brand` limpo | RF-NL-14, RNF-03 |
| T-NL-E11 | Admin essencial: busca, detalhe, descadastrar, excluir, indicador da fila | RF-NL-11, 12, 16 |
| T-NL-E12 | **Desativação:** com a inscrição desligada, `POST /subscribe` responde 503 e a Home não mostra a seção; descadastro, one-click, pedido de novo link e confirmação seguem funcionando | RF-NL-19 |
| T-NL-E13 | Admin complementar: contadores, filtro por período, reenviar confirmação, revogar tokens | RF-NL-11, 12 |

### Verificações de lançamento (não automatizáveis)

| ID | Verificação | Bloqueio |
|---|---|---|
| LC-01 | Gate do processador (§8.9), sete cenários, incluindo recuperação de lease | BL-03 |
| LC-02 | DNS e cabeçalhos DKIM com e-mail real, incluindo DKIM cobrindo `List-Unsubscribe` e `List-Unsubscribe-Post`, e rastreamento de abertura e clique desativado | BL-02 |
| LC-03 | Exposição de token em ambiente isolado: GTM Preview, logs da plataforma, `Referer`; confirma o isolamento do §6.5 | BL-05 |
| LC-04 | Aprovação jurídica e publicação da política | BL-01, BL-08 |
| LC-05 | Aprovação da copy da Home | BL-10 |
| LC-06 | Branch de tracking integrada e opção de isolamento (PRP-10) implementada | BL-07, BL-05 |
| LC-07 | Administração essencial (E4-essencial) implantada e verificada em produção | BL-11 |
| LC-08 | Checklist de ativação: sinalizadores, ponto sem retorno e implantações-base registradas (§18.5) | — |

## 18. Operação, migração e rollback

### 18.1 Variáveis de ambiente (DEP-05)

`NEWSLETTER_DISPATCH_SECRET`, `RATE_LIMIT_PEPPER`, `NEWSLETTER_SIGNUP_ENABLED` e `NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED`; sem valores no repositório; `.env.example` ganha só os nomes. **Não existe variável de chave de token.** Os sinalizadores são lidos no servidor e o padrão em produção é **desligado**.

### 18.2 Migrations (artefatos do RF-OPS-01)

| Migration | Conteúdo | Entrega | Observação |
|---|---|---|---|
| N1 | tabelas, índices, constraints, funções do fluxo público e do outbox, privilégios | E3 | nenhum consumidor ainda |
| N2 | jobs de `pg_cron` (dispatch, manutenção) | E3 | só depois de LC-01 |
| N3 | jobs de purga conforme `P-RET-*` | E3 | só depois de BL-01 |
| N4 | papel `newsletter_ops`, funções administrativas `SECURITY DEFINER`, *policies* e grants | E4-essencial | **precisa estar aplicada antes da ativação pública (BL-11)** |

**Regra de apply (revisada em 27/10/2026; substitui "`apply` idempotente").** Cada migration da newsletter tem `preflight`, `apply`, `verify` e `rollback`, e o `apply` é de **primeira aplicação estrita**, não idempotente:

- O apply inicial roda **em uma única transação** e começa por um *guard* que aborta se qualquer objeto da migration já existir ou se faltar um pré-requisito.
- **Reaplicação aborta sem nenhuma alteração** (a transação é revertida). Nenhum `CREATE` usa `IF NOT EXISTS` e o *guard* não é contornado editando o SQL.
- **Qualquer evolução posterior exige uma nova migration**, com o seu próprio ciclo; a migration já aplicada não é editada.
- A operação segue sempre **preflight → apply → verify**, por ambiente, com autorização específica. Ordem: ambiente isolado primeiro, produção com autorização.
- O **rollback permanece um script separado**, nunca executado automaticamente, e depende de autorização específica (e, havendo assinantes reais, de decisão jurídica, BL-01).

Motivo: é o modelo já aprovado e em produção na migration 017 (E0c). A idempotência convergente aceitaria em silêncio um objeto pré-existente com definição diferente. Registro da decisão: `docs/runbooks/migrations/018-newsletter-core/README.md`.

### 18.3 Sequência de implantação e ativação

1. N1 no ambiente isolado → T-NL-I*.
2. Variáveis, DNS, isolamento de rastreadores e processador no ambiente isolado → LC-01, LC-02, LC-03.
3. E4-essencial desenvolvida e N4 verificada no ambiente isolado.
4. Aprovações BL-01, BL-08, BL-10.
5. N1 e N4 em produção (sem consumidores públicos). Deploy do código com `NEWSLETTER_SIGNUP_ENABLED` e `NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED` **desligados**.
6. N2 em produção → validar fila vazia e saúde; verificar a E4-essencial em produção (LC-07).
7. **Ativação pública:** ligar `NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED` e depois `NEWSLETTER_SIGNUP_ENABLED`; monitorar a sonda.

E3 e E4 podem ser desenvolvidas de forma independente, mas **a ativação pública só ocorre com a administração essencial disponível** (DEC-25, BL-11).

### 18.4 Rollback

| Antes do ponto sem retorno (nenhum e-mail com link enviado a destinatário real) | Ação |
|---|---|
| Desligar sinalizadores, reverter o deploy, desagendar jobs, remover tabelas | livres |

| Depois do ponto sem retorno | Ação |
|---|---|
| Primeiro passo | desligar `NEWSLETTER_SIGNUP_ENABLED` (e, se necessário, `NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED`) |
| Defeito no código | corrigir **para frente** (*roll-forward*) |
| Reverter implantação | **somente** para uma implantação que inclua todas as rotas e funções de manutenção obrigatória (§18.5); a lista de implantações-base é mantida no registro de release (LC-08) |
| Remover tabelas de assinantes, consentimentos ou tokens | **proibido** sem decisão jurídica e sem mecanismo equivalente ativo (DEC-26); em produção exige exportação e aprovação |
| Desagendar o dispatch | **proibido** enquanto houver `unsubscribe_link` pendente ou aceitação de pedidos de novo link; usar a pausa de `confirmation` do §18.5 |

### 18.5 Desativação e manutenção obrigatória do descadastro (DEC-26, RF-NL-19)

**Sinalizadores independentes**

| Sinalizador | Desligado faz | Não faz |
|---|---|---|
| `NEWSLETTER_SIGNUP_ENABLED` | esconde a seção da Home; `POST /api/newsletter/subscribe` responde 503; | não afeta nada do descadastro, da confirmação de quem já pediu nem do pedido de novo link |
| `NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED` | o processador deixa de reivindicar itens `confirmation` (eles esperam e, se passarem do prazo, morrem por `deadline_elapsed`) | não pausa itens `unsubscribe_link` |

**Manutenção obrigatória, sem sinalizador e sem remoção por rollback ou limpeza de código**

| Componente | Motivo |
|---|---|
| `POST /api/newsletter/unsubscribe` (one-click) e seu `GET` | links já enviados |
| `/newsletter/descadastro` (com token e sem token) | links já enviados e pedido de novo link |
| `POST /api/newsletter/unsubscribe-request` | pedido legítimo de novo link de descadastro |
| `/newsletter/confirmar` | quem já pediu a inscrição precisa poder concluir ou rejeitar |
| Validação de tokens, funções `newsletter_unsubscribe`/`newsletter_confirm` e tabelas de assinantes, consentimentos e tokens | validar os links |
| Despacho de `unsubscribe_link` (processador, varredura e saúde) | entregar o novo link pedido |
| Função administrativa de descadastro | atendimento manual quando o Turnstile ou o e-mail falham |

Garantias: T-NL-U20, T-NL-U21, T-NL-I26 e T-NL-E12. Se a newsletter for descontinuada, os componentes acima só podem ser retirados após o período definido pelo jurídico (L9) ou com mecanismo equivalente ativo.

## 19. Dependências e bloqueios

| Item | Situação |
|---|---|
| DEP-02 domínio e DNS de `newsletter@` | pendente (BL-02) |
| DEP-03 processador confiável | pendente (BL-03); PV-04 |
| DEP-04 sonda externa | pendente |
| DEP-05 variáveis de ambiente | pendente |
| DEP-06 revisão jurídica | pendente (BL-01, BL-08) |
| DEP-07 branch de tracking integrada | pendente (BL-07): Footer, `/privacidade`, CSP, rota de contato **e o layout raiz do isolamento de rastreadores (PRP-10)** |
| E0a, E0b.4, E0c | precedem a E3 (início). E0b.4 e E0c alteram `api/contact/route.ts`; empilhadas sobre a tracking (R-10) |
| E1 | precede a E4: o admin usa os utilitários de lista da E1. A E3 não depende da E1 |
| E3 ↔ E4 | desenvolvimento independente (E4 precisa da E3 no ambiente isolado para testar); **a ativação pública exige E4-essencial** (BL-11) |
| BL-03 | a E3 pode ser **desenvolvida** enquanto o processador é demonstrado, mas **não integra nem liga** sem a demonstração |
| BL-04 suíte de RLS | bloqueia merge de E3 e E4 |
| BL-05 isolamento e exposição de token | bloqueia a ativação |
| BL-10 copy da Home | bloqueia a ativação |
| BL-11 administração essencial | bloqueia a ativação |

## 20. Alternativas descartadas

| Alternativa | Motivo |
|---|---|
| Somente `after()` para enviar | perde e-mail em falha; sem retry |
| Vercel Cron diário + reenvio manual | não é mecanismo confiável de processamento |
| Tokens HMAC com chaveiro (desenho anterior) | credenciais globais de longa vida; revogação quebra links; rejeitado na revisão externa (PRP-08) |
| Token fixo por assinante cifrado em repouso | chave global de cifra; revogação quebra todos os links |
| Token bruto armazenado de forma permanente | vazamento do banco entrega credenciais |
| Token de descadastro com expiração | contraria o direito de sair a qualquer momento |
| Lista de supressão por hash de e-mail | hash é dado pessoal; o próprio registro `unsubscribed` já cumpre a função |
| Ativação manual de assinante | fabricaria consentimento (DEC-22) |
| Escrita direta do admin por policies e trigger de guarda | permitia inserir eventos e mensagens sem operação de negócio; substituída por funções restritas (DEC-19 revisada) |
| Funções administrativas `SECURITY INVOKER` com policies de escrita | o admin poderia repetir os INSERT pela API |
| Upstash ou outro serviço de rate limit | fornecedor novo sem necessidade (RNF-04) |
| Fornecedor de audiências do próprio provedor de e-mail | não avaliado em profundidade; mover a prova de consentimento para fora do banco próprio e abrir escopo de campanhas |
| Confirmar ao abrir o link (GET) | scanners de e-mail confirmariam sem o titular |
| Isolamento só por checagem em tempo de execução | código de rastreamento continua sendo enviado; não é isolamento por construção |
| Cookie-bridge como padrão | token passaria pelo log da plataforma; fica como contingência (PV-23) |
| Limite de IP também para token válido | IP compartilhado dos provedores de e-mail bloquearia opt-outs legítimos |
| Prazo de retenção de evidência independente da linha do assinante | contradiz o vínculo `CASCADE`; só com a extensão do §10.3 |
| Associar assinante a lead | proibido (DEC-21) |
| Exportação CSV e editor de campanhas | fora do escopo (DEC-22) |
