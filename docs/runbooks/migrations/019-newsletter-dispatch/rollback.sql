-- E3/019 (N2) — ROLLBACK. NÃO EXECUTADO. Exige autorização específica por ambiente.
--
-- ATENÇÃO (SDD §18.4): desagendar o dispatch é PROIBIDO enquanto houver `unsubscribe_link`
-- pendente ou aceitação de pedidos de novo link de descadastro. Antes, esvazie ou pause a fila:
-- para PAUSAR a confirmação use NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED=false (não este script).
-- Este rollback é para um ambiente em que a newsletter nunca foi ativada, ou depois de o processador
-- ter sido substituído por mecanismo equivalente ativo (DEC-26).
--
-- O QUE FAZ: desagenda os dois jobs da 019. O que NÃO faz: não toca no Vault (os segredos seguem
-- onde estão; remova-os à parte, se for o caso), não desinstala pg_net, não altera tabelas,
-- funções, nem os jobs da 011 e da 017.
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

SELECT cron.unschedule('newsletter-dispatch');
SELECT cron.unschedule('newsletter-maintenance');

COMMIT;
