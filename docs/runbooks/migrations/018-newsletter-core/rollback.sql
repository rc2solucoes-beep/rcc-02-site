-- E3/018 — ROLLBACK. NÃO EXECUTADO. Exige autorização específica por ambiente.
--
-- ORDEM OBRIGATÓRIA: manter NEWSLETTER_SIGNUP_ENABLED e NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED
-- DESLIGADOS (e, se um dia houver consumidores no ar, reverter o código da newsletter) ANTES deste
-- script. Com tabelas e funções removidas, a inscrição responde 500 e o descadastro one-click
-- responde 503. O endpoint de descadastro é de MANUTENÇÃO (SDD §10.3, DEC-26): links já enviados
-- não podem ficar sem resposta. Se já existiram assinantes reais, NÃO execute este rollback sem
-- decisão jurídica (BL-01): ele elimina assinantes, consentimentos e a supressão (a linha
-- `unsubscribed` É a supressão, SDD §10.1).
--
-- O QUE FAZ: remove as funções, as cinco tabelas (policies e triggers saem junto) e o helper de
-- updated_at da 018.
-- O QUE NÃO FAZ: não toca leads, lead_notes, lead_activity, posts, rate_limit_counters, o job
-- publish-scheduled-posts (011) nem o purge-rate-limit-counters (017). A 018 não cria jobs.
-- DADOS: tudo o que estiver nas cinco tabelas é perdido (sem backup completo/PITR testado).
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DROP FUNCTION public.newsletter_outbox_expire();
DROP FUNCTION public.newsletter_outbox_complete(uuid, integer, text, text, text, timestamptz, text, boolean);
DROP FUNCTION public.newsletter_outbox_prepare(uuid, integer, text, text, text, text, text);
DROP FUNCTION public.newsletter_outbox_claim(integer, integer, text[]);
DROP FUNCTION public.newsletter_unsubscribe(text, text);
DROP FUNCTION public.newsletter_confirm(text, text);
DROP FUNCTION public.newsletter_request_unsubscribe_link(text);
DROP FUNCTION public.newsletter_request_subscription(text, text, text, text, text, text);

-- Ordem das tabelas respeita as FKs.
DROP TABLE public.newsletter_outbox_payload;
DROP TABLE public.newsletter_tokens;
DROP TABLE public.newsletter_consents;
DROP TABLE public.newsletter_outbox;
DROP TABLE public.newsletter_subscribers;

-- O helper só pode sair depois das tabelas cujos triggers o usavam.
DROP FUNCTION public.newsletter_touch_updated_at();

COMMIT;
