-- Verificação pós-aplicação da migration 014. SOMENTE LEITURA (BEGIN READ ONLY).
BEGIN READ ONLY;

-- 1. sort_at é coluna gerada armazenada, NOT NULL, timestamptz.
-- Esperado: 1 linha; attgenerated = 's'; attnotnull = true; tipo "timestamp with time zone".
SELECT a.attname, a.attgenerated, a.attnotnull, pg_catalog.format_type(a.atttypid, a.atttypmod) AS tipo
FROM pg_catalog.pg_attribute a
WHERE a.attrelid = 'public.posts'::regclass AND a.attname = 'sort_at' AND NOT a.attisdropped;

-- 2. Expressão registrada. Esperado: CASE sobre status com published/scheduled/ELSE updated_at.
SELECT pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS expressao
FROM pg_catalog.pg_attrdef d
JOIN pg_catalog.pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
WHERE d.adrelid = 'public.posts'::regclass AND a.attname = 'sort_at';

-- 3. Nenhum valor nulo e nenhuma divergência da tabela de verdade (SDD CMS §5.1).
-- Esperado: nulos = 0; divergentes = 0.
SELECT count(*) FILTER (WHERE sort_at IS NULL) AS nulos,
       count(*) FILTER (WHERE sort_at IS DISTINCT FROM (
         CASE status
           WHEN 'published' THEN coalesce(published_at, created_at)
           WHEN 'scheduled' THEN coalesce(scheduled_publish_at, updated_at)
           ELSE updated_at
         END)) AS divergentes
FROM public.posts;

-- 4. Índice presente, válido e com a definição prevista.
-- Esperado: 1 linha; indisvalid = true; indexdef contendo (sort_at DESC, id DESC).
SELECT i.indexname, i.indexdef, x.indisvalid
FROM pg_catalog.pg_indexes i
JOIN pg_catalog.pg_class c ON c.relname = i.indexname
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = i.schemaname
JOIN pg_catalog.pg_index x ON x.indexrelid = c.oid
WHERE i.schemaname = 'public' AND i.tablename = 'posts' AND i.indexname = 'posts_sort_at_id_idx';

-- 5. Índices anteriores preservados. Esperado: posts_slug e posts_status_published_at.
SELECT indexname FROM pg_catalog.pg_indexes
WHERE schemaname = 'public' AND tablename = 'posts'
  AND indexname IN ('posts_slug', 'posts_status_published_at')
ORDER BY indexname;

-- 6. Total de linhas. Esperado: igual ao total_posts do preflight.
SELECT count(*) AS total_posts FROM public.posts;

-- 7. Policies de posts inalteradas. Esperado: as mesmas do preflight (leitura pública de published + acesso admin).
SELECT policyname, cmd FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'posts'
ORDER BY policyname;

-- 8. Job do cron intacto. Esperado: 1 linha, active = true.
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'publish-scheduled-posts';

ROLLBACK;
