-- E0c/017 — ROLLBACK. NÃO EXECUTADO. Exige autorização específica por ambiente.
--
-- ORDEM OBRIGATÓRIA: reverter/desfazer o deploy do CÓDIGO da E0c ANTES deste script. A rota
-- /api/contact da E0c chama rate_limit_hit e FECHA (HTTP 429) quando a função não existe:
-- remover a função com o código novo no ar bloqueia o formulário de contato.
--
-- O QUE FAZ: remove o job de purga, a função e a tabela (e os contadores pseudonimizados).
-- O QUE NÃO FAZ: não toca public.leads nem o job publish-scheduled-posts (011).
-- Os contadores são descartáveis (janela de 1 h): perdê-los apenas reinicia os limites.
-- Depois deste script, a rota ANTERIOR (que conta linhas de leads) volta a funcionar sozinha.
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

SELECT cron.unschedule('purge-rate-limit-counters');
DROP FUNCTION public.rate_limit_hit(text, integer, integer);
DROP TABLE public.rate_limit_counters;

COMMIT;
