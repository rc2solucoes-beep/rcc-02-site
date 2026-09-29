-- =====================================================================
-- IDX-02 — REVERSÃO de docs/sql/32-idx02-links-internos-canonicos.sql
--
--   Rodar SÓ se for preciso desfazer a migração. Copiar o arquivo inteiro no
--   Supabase SQL Editor (role postgres).
--
-- Restaura content e updated_at do backup public.idx02_links_backup_20260928
-- apenas onde o content ainda é exatamente o que a migração gravou
-- (md5 = md5_migrado). Se algum post foi editado depois da migração, PARA
-- sem sobrescrever nada.
-- =====================================================================

BEGIN;

DO $$
DECLARE
  backup_rec record; restaurados int := 0;
  r_slug text; atual text; md5_orig text; md5_mig text; conteudo_orig text; v_rb text;
BEGIN
  IF to_regclass('public.idx02_links_backup_20260928') IS NULL THEN
    RAISE EXCEPTION 'backup public.idx02_links_backup_20260928 não existe';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.posts'::regclass
                 AND tgname = 'posts_updated_at' AND tgenabled = 'O') THEN
    RAISE EXCEPTION 'trigger posts_updated_at ausente ou desativado';
  END IF;

  EXECUTE 'ALTER TABLE public.posts DISABLE TRIGGER posts_updated_at';
  FOR backup_rec IN SELECT backup_row.*, post_row.content, md5(post_row.content) AS md5_atual
           FROM public.idx02_links_backup_20260928 AS backup_row JOIN public.posts AS post_row ON post_row.id = backup_row.id
           ORDER BY backup_row.slug
           FOR UPDATE OF post_row
  LOOP
    r_slug := backup_rec.slug; atual := backup_rec.content; md5_orig := backup_rec.md5_original;
    md5_mig := backup_rec.md5_migrado; conteudo_orig := backup_rec.content_original;

    IF md5(atual) = md5_orig THEN
      v_rb := atual;  -- já está no original
    ELSIF md5_mig IS NOT NULL AND md5(atual) = md5_mig THEN
      v_rb := conteudo_orig;
    ELSE
      RAISE EXCEPTION 'conflito: % foi editado depois da migração — reverter manualmente', r_slug;
    END IF;
    IF md5(v_rb) <> md5(atual) THEN
      UPDATE public.posts SET content = v_rb, updated_at = backup_rec.updated_at_original
      WHERE id = backup_rec.id AND md5(content) = md5(atual);
      IF NOT FOUND THEN RAISE EXCEPTION 'conflito: % mudou durante a reversão', backup_rec.slug; END IF;
      restaurados := restaurados + 1;
    END IF;
  END LOOP;
  EXECUTE 'ALTER TABLE public.posts ENABLE TRIGGER posts_updated_at';

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.posts'::regclass
                 AND tgname = 'posts_updated_at' AND tgenabled = 'O') THEN
    RAISE EXCEPTION 'trigger posts_updated_at não foi reativado';
  END IF;
  IF EXISTS (SELECT 1 FROM public.idx02_links_backup_20260928 AS backup_row JOIN public.posts AS post_row ON post_row.id = backup_row.id
             WHERE md5(post_row.content) <> backup_row.md5_original
                OR post_row.updated_at IS DISTINCT FROM backup_row.updated_at_original) THEN
    RAISE EXCEPTION 'conferência da reversão falhou';
  END IF;
  RAISE NOTICE 'posts restaurados: %', restaurados;
END $$;

COMMIT;

-- Visão final: todas as linhas com restaurado = true.
SELECT backup_row.slug, md5(post_row.content) = backup_row.md5_original AS restaurado,
       post_row.updated_at = backup_row.updated_at_original AS updated_at_original
FROM public.idx02_links_backup_20260928 AS backup_row JOIN public.posts AS post_row ON post_row.id = backup_row.id
ORDER BY backup_row.slug;
