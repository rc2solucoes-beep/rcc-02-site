-- Rollback da migration 014: SEGURO E COMPLETO.
--
-- `sort_at` é dado derivado: remover a coluna não perde informação nem toca nos dados dos
-- posts, no cron `publish-scheduled-posts` ou nas policies.
--
-- ORDEM OBRIGATÓRIA: reverter primeiro o DEPLOY DO CÓDIGO (a listagem do CMS referencia
-- `sort_at`; sem a coluna ela passa ao estado de erro). Só então executar este script.
--
-- Ponto de não retorno: não há.
BEGIN;

SET LOCAL lock_timeout = '5s';

DROP INDEX IF EXISTS public.posts_sort_at_id_idx;

ALTER TABLE public.posts DROP COLUMN IF EXISTS sort_at;

COMMIT;
