-- Preflight da migration 014 (posts.sort_at). SOMENTE LEITURA.
-- A garantia de somente leitura é a transação BEGIN READ ONLY abaixo. O lint
-- automático é complementar e não substitui a revisão humana.
-- Só pode ser executado em produção com AUTORIZAÇÃO EXPRESSA (migrations-manuais.md, regra 1).
-- Se qualquer resultado divergir do esperado, NÃO aplique.
BEGIN READ ONLY;

-- 1. Versão do Postgres. Coluna gerada exige 12 ou superior.
-- Esperado: server_version_num >= 120000.
SHOW server_version_num;

-- 2. Colunas-fonte existem, com os tipos e a nulabilidade que a expressão pressupõe.
-- Esperado (6 linhas): id uuid; status text; published_at timestamptz (YES); scheduled_publish_at timestamptz (YES);
-- created_at timestamptz (NO); updated_at timestamptz (NO).
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'posts'
  AND column_name IN ('id', 'status', 'published_at', 'scheduled_publish_at', 'created_at', 'updated_at')
ORDER BY column_name;

-- 3. A coluna e o índice ainda NÃO existem.
-- Esperado: 0 linhas em cada consulta. Se sort_at existir, NÃO aplique sem entender por quê
-- (IF NOT EXISTS não detecta definição diferente).
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'sort_at';

SELECT indexname FROM pg_catalog.pg_indexes
WHERE schemaname = 'public' AND tablename = 'posts' AND indexname = 'posts_sort_at_id_idx';

-- 4. CHECK de status só com draft, scheduled e published (sem archived).
-- Esperado: uma definição de CHECK contendo exatamente esses três valores.
SELECT conname, pg_catalog.pg_get_constraintdef(oid) AS definicao
FROM pg_catalog.pg_constraint
WHERE conrelid = 'public.posts'::regclass AND contype = 'c'
ORDER BY conname;

-- 5. Trigger que atualiza updated_at em todo UPDATE (inclusive o do cron).
-- Esperado: posts_updated_at habilitado (tgenabled = 'O').
SELECT tgname, tgenabled
FROM pg_catalog.pg_trigger
WHERE tgrelid = 'public.posts'::regclass AND NOT tgisinternal
ORDER BY tgname;

-- 6. PV-13: contagem de posts por status e com datas nulas nos estados que as exigem. SOMENTE contagens.
-- Esperado: informativo. sem_published_at > 0 em 'published' ou sem_scheduled > 0 em 'scheduled'
-- serão sinalizados como anomalia na lista (RF-CMS-13); não bloqueiam a migration.
SELECT status,
       count(*) AS total,
       count(*) FILTER (WHERE published_at IS NULL) AS sem_published_at,
       count(*) FILTER (WHERE scheduled_publish_at IS NULL) AS sem_scheduled_publish_at
FROM public.posts
GROUP BY status
ORDER BY status;

-- 7. Agendamentos vencidos há mais de 15 minutos (o cron deveria tê-los publicado).
-- Esperado: informativo; valor > 0 sugere cron parado.
SELECT count(*) AS agendados_vencidos
FROM public.posts
WHERE status = 'scheduled' AND scheduled_publish_at IS NOT NULL
  AND scheduled_publish_at < now() - interval '15 minutes';

-- 8. Total de linhas (comparar com o verify).
SELECT count(*) AS total_posts FROM public.posts;

-- 9. Views que mencionam posts (adicionar coluna não as quebra, mas convém conhecê-las).
-- Esperado: 0 linhas ou revisão humana.
SELECT schemaname, viewname FROM pg_catalog.pg_views
WHERE schemaname = 'public' AND definition ILIKE '%posts%';

-- 10. Job de publicação agendada ativo (não é alterado por esta migration).
-- Esperado: 1 linha, active = true.
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'publish-scheduled-posts';

-- 11. Policies de posts ANTES da migration (o verify #7 compara com este resultado).
-- Esperado: registrar a lista (policyname, cmd) e compará-la com o verify.
SELECT policyname, cmd FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'posts'
ORDER BY policyname;

ROLLBACK;
