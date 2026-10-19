-- 014 — E1 (RF-CMS-04, RF-CMS-05, DEC-04): data efetiva `posts.sort_at` para a listagem do CMS.
--
-- Coluna gerada e armazenada, derivada de colunas da própria linha:
--   published -> coalesce(published_at, created_at)
--   scheduled -> coalesce(scheduled_publish_at, updated_at)
--   demais    -> updated_at
-- `created_at` e `updated_at` são NOT NULL, logo `sort_at` nunca é nulo.
--
-- Índice (sort_at DESC, id DESC): serve à ordenação nas duas direções, porque as duas
-- chaves sempre andam juntas (a listagem ordena por sort_at e desempata por id na MESMA direção).
--
-- O job pg_cron `publish-scheduled-posts` NÃO é alterado: ao publicar, a linha é atualizada
-- e a coluna gerada se recalcula. A coluna não é gravável (INSERT/UPDATE explícito é rejeitado).
--
-- Adicionar coluna gerada reescreve a tabela com bloqueio exclusivo breve; `lock_timeout`
-- evita ficar na fila atrás de uma transação longa (por exemplo, o cron). Se estourar, repita.
--
-- Idempotente. Ordem de implantação: ESTA migration antes do código que a usa; na reversão,
-- o código antes (docs/runbooks/migrations/014-posts-sort-at/rollback.sql).

BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS sort_at timestamptz
  GENERATED ALWAYS AS (
    CASE status
      WHEN 'published' THEN coalesce(published_at, created_at)
      WHEN 'scheduled' THEN coalesce(scheduled_publish_at, updated_at)
      ELSE updated_at
    END
  ) STORED NOT NULL;

CREATE INDEX IF NOT EXISTS posts_sort_at_id_idx
  ON public.posts (sort_at DESC, id DESC);

COMMIT;
