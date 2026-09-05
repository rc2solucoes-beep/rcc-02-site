-- =====================================================================
-- Correção do slug corrompido — post d049fc80-5e04-4944-8000-5f417f881b14
--
-- Rodar no Supabase SQL Editor. NÃO foi executado por Claude Code: a
-- conexão MCP é read-only e a RLS da tabela `posts` só permite escrita a
-- admin ("Only admins can modify posts").
--
-- Base da correção: o slug proposto é exatamente `slugify(title)`.
--
--   title    : "Soluções automatizadas: 7 critérios para avaliar fornecedores"
--   slugify  : solucoes-automatizadas-7-criterios-para-avaliar-fornecedores
--   atual    : solucosolucoes-automatizadas-avaliar-fornecedoreses-
--              automatizadas-7-criterios-para-avaliar-fornecedores  (103 chars)
--
-- O slug atual contém, a partir do índice 6, um fragmento de uma geração
-- anterior (`solucoes-automatizadas-avaliar-fornecedores`) fundido com a
-- geração nova — duas slugificações concatenadas com sobreposição.
--
-- Verificado antes: nenhuma referência à URL corrompida em `content` de
-- outros posts, em `related_post_ids` ou em `settings` (0 ocorrências).
-- Portanto não há link interno para atualizar junto.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. BACKUP — estado anterior. Guarde este resultado antes de seguir.
--    Se algo sair errado, o UPDATE de reversão está no rodapé.
-- ---------------------------------------------------------------------
SELECT
  id,
  slug        AS slug_anterior,
  length(slug) AS tamanho_anterior,
  title,
  status,
  published_at
FROM public.posts
WHERE id = 'd049fc80-5e04-4944-8000-5f417f881b14';

-- ---------------------------------------------------------------------
-- 2. UPDATE — aplica o slug derivado do título.
--    A cláusula `AND slug = <valor corrompido>` torna a operação idempotente:
--    rodar duas vezes não faz nada na segunda, e se o slug já tiver sido
--    alterado por outra via, o UPDATE não acerta o registro errado.
-- ---------------------------------------------------------------------
UPDATE public.posts
SET slug = 'solucoes-automatizadas-7-criterios-para-avaliar-fornecedores'
WHERE id = 'd049fc80-5e04-4944-8000-5f417f881b14'
  AND slug = 'solucosolucoes-automatizadas-avaliar-fornecedoreses-automatizadas-7-criterios-para-avaliar-fornecedores';

-- ---------------------------------------------------------------------
-- 3. CONFERÊNCIA — deve retornar exatamente 1 linha, com o slug novo.
--    Se retornar 0, o UPDATE não acertou: NÃO faça COMMIT, rode ROLLBACK.
-- ---------------------------------------------------------------------
SELECT id, slug, length(slug) AS tamanho_novo, title
FROM public.posts
WHERE id = 'd049fc80-5e04-4944-8000-5f417f881b14'
  AND slug = 'solucoes-automatizadas-7-criterios-para-avaliar-fornecedores';

COMMIT;
-- ROLLBACK;  -- use no lugar do COMMIT se o passo 3 não retornar 1 linha

-- =====================================================================
-- REVERSÃO, se necessário depois do COMMIT
-- =====================================================================
-- UPDATE public.posts
-- SET slug = 'solucosolucoes-automatizadas-avaliar-fornecedoreses-automatizadas-7-criterios-para-avaliar-fornecedores'
-- WHERE id = 'd049fc80-5e04-4944-8000-5f417f881b14';
