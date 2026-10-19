-- CONTINGÊNCIA — NÃO APLICAR, NÃO FAZ PARTE DA MIGRATION 014.
--
-- Rascunho da RPC parametrizada que substitui o filtro PostgREST da busca do CMS
-- (SDD CMS §6.3, §14; PRP-07). Só deve ser promovida a migration própria (015) SE o teste
-- de integração T-CMS-I03 reprovar a busca literal por filtro PostgREST (em especial o `*`,
-- ver DECISAO-D2.md). Antes disso, este arquivo é apenas documentação.
--
-- Propriedades:
--  * SECURITY INVOKER: a RLS de `posts` continua sendo a barreira (admin lê tudo, anon só published).
--  * Busca literal sem LIKE/regex: strpos(lower(coluna), lower(termo)) — `%`, `_`, `\`, `*`, aspas,
--    vírgula e parênteses são caracteres comuns. Sem SQL dinâmico.
--  * Mesma ordenação determinística (sort_at, id na mesma direção), mesmo recorte de período
--    (o chamador já envia os limites em UTC) e mesma paginação.
--  * `total` vem de count(*) OVER (): uma única ida ao banco. Página além do alcance devolve
--    zero linhas (o chamador trata com uma contagem separada).
--  * Não devolve `content`.
--
-- Concessões previstas ao promover: REVOKE EXECUTE de PUBLIC/anon; GRANT EXECUTE a authenticated.

CREATE OR REPLACE FUNCTION public.admin_list_posts(
  p_term   text,
  p_status text,
  p_gte    timestamptz,
  p_lt     timestamptz,
  p_desc   boolean,
  p_limit  integer,
  p_offset integer
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  status text,
  published_at timestamptz,
  scheduled_publish_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  sort_at timestamptz,
  total bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT p.id, p.slug, p.title, p.status, p.published_at, p.scheduled_publish_at,
         p.created_at, p.updated_at, p.sort_at,
         count(*) OVER () AS total
  FROM public.posts p
  WHERE (p_status IS NULL OR p.status = p_status)
    AND (p_gte IS NULL OR p.sort_at >= p_gte)
    AND (p_lt  IS NULL OR p.sort_at <  p_lt)
    AND (
      p_term IS NULL OR p_term = ''
      OR strpos(lower(p.title),   lower(p_term)) > 0
      OR strpos(lower(p.slug),    lower(p_term)) > 0
      OR strpos(lower(p.summary), lower(p_term)) > 0
    )
  ORDER BY
    CASE WHEN p_desc THEN p.sort_at END DESC, CASE WHEN p_desc THEN p.id END DESC,
    CASE WHEN NOT p_desc THEN p.sort_at END ASC, CASE WHEN NOT p_desc THEN p.id END ASC
  LIMIT p_limit OFFSET p_offset
$$;
