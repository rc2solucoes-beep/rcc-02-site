-- =====================================================================
-- Categorização A/B/C dos CTAs do blog — 11 posts publicados
--
-- Rodar no Supabase SQL Editor. NÃO executado por Claude Code: a conexão
-- MCP é read-only e a RLS de `posts` só permite escrita a admin.
--
-- Tabela aprovada em `docs/30-categorizacao-ctas-blog.md`:
--   A (5) → Zapbox  · botão "Conhecer Zapbox"          · /zapbox
--   B (3) → RC2     · botão "Falar sobre minha operação" · /contato
--   C (3) → RC2     · botão "Falar sobre minha operação" · /contato
--
-- Três superfícies num lote só:
--   1. `cta_block` — 8 atualizados + 2 criados (os dois A que caíam no
--      bloco padrão do código e mandavam para /contato)
--   2. texto das âncoras de CTA no `content`
--   3. normalização dos hrefs absolutos/apex para relativos
--
-- ---------------------------------------------------------------------
-- DECISÕES EMBUTIDAS — confira antes de rodar
-- ---------------------------------------------------------------------
-- (a) Os textos das categorias foram divididos em `title` (a pergunta) e
--     `description` (a frase seguinte), que é a estrutura que o
--     `cta_block` já usava. Se preferir tudo no `title`, ajuste abaixo.
--
-- (b) `ia-para-pequenas-empresas` é categoria C e NÃO ganha `cta_block`:
--     continua no bloco padrão do código, cujo botão "Falar sobre o meu
--     caso →" já está na taxonomia e aponta para /contato.
--
-- (c) O padrão das âncoras exige prefixo (Solicitar|solicite um|Agendar o)
--     E a seta `→`. Isso protege a prosa legítima: "comece por uma
--     solicitação frequente", "tipo de solicitação", "Governança começa no
--     diagnóstico" e "é um diagnóstico gratuito de 30 minutos" não têm a
--     combinação prefixo + seta e ficam intactas.
--
-- (d) `processos-manuais-o-que-automatizar` tem 1 link para /contato que
--     NÃO é CTA (texto "próximo passo adequado à operação"). Ele é
--     categoria B, então o href não muda — mas por isso o script nunca
--     troca href em bloco por post, só dentro da âncora de CTA.
-- =====================================================================

-- ---------------------------------------------------------------------
-- VALIDAÇÃO PRÉVIA — feita em SELECT, sem escrever, contra o banco real
-- ---------------------------------------------------------------------
-- 1) O padrão do passo 4 casa exatamente 20 âncoras, distribuídas assim:
--    2 em cada post, exceto `mensagens-servico-...` e `processos-manuais`
--    com 1 cada. Bate com o catálogo de `docs/30`.
--
-- 2) A prosa não é tocada. Contando "solicita[cç]" antes e depois do
--    replace simulado, os 11 posts mantêm o MESMO número de ocorrências
--    (8, 8, 0, 0, 0, 4, 1, 0, 0, 1, 1). Nenhuma frase corrente foi afetada.
--
-- 3) Pipeline completo simulado em dois posts, um de cada lado:
--      automacao-whatsapp-ia (A)  → 2 âncoras viram
--                                   href=/zapbox  · "Conhecer Zapbox →"
--      processos-manuais (B)      → 1 âncora vira
--                                   href=/contato · "Falar sobre minha operação →"
--                                   e o link NÃO-CTA "próximo passo adequado
--                                   à operação" permanece intacto em /contato
-- ---------------------------------------------------------------------

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Mapa de categorias. Fonte única para todos os passos seguintes.
-- ---------------------------------------------------------------------
CREATE TEMP TABLE cta_map (
  slug         text PRIMARY KEY,
  categoria    char(1),
  cta_title    text,
  cta_desc     text,
  botao        text,
  destino      text
) ON COMMIT DROP;

INSERT INTO cta_map VALUES
  -- A — Zapbox
  ('atendimento-automatizado-contexto',       'A',
   'Seu problema é atendimento e vendas pelo WhatsApp?',
   'Conheça o Zapbox, produto da RC2 para organizar equipe, histórico, CRM, automações e Sales AI.',
   'Conhecer Zapbox', '/zapbox'),
  ('atendimento-omnichannel-pme',             'A',
   'Seu problema é atendimento e vendas pelo WhatsApp?',
   'Conheça o Zapbox, produto da RC2 para organizar equipe, histórico, CRM, automações e Sales AI.',
   'Conhecer Zapbox', '/zapbox'),
  ('automacao-whatsapp-ia',                   'A',
   'Seu problema é atendimento e vendas pelo WhatsApp?',
   'Conheça o Zapbox, produto da RC2 para organizar equipe, histórico, CRM, automações e Sales AI.',
   'Conhecer Zapbox', '/zapbox'),
  ('leads-sem-resposta-primeiro-retorno',     'A',
   'Seu problema é atendimento e vendas pelo WhatsApp?',
   'Conheça o Zapbox, produto da RC2 para organizar equipe, histórico, CRM, automações e Sales AI.',
   'Conhecer Zapbox', '/zapbox'),
  ('mensagens-servico-whatsapp-business-api', 'A',
   'Seu problema é atendimento e vendas pelo WhatsApp?',
   'Conheça o Zapbox, produto da RC2 para organizar equipe, histórico, CRM, automações e Sales AI.',
   'Conhecer Zapbox', '/zapbox'),
  -- B — integração / ERP / automação
  ('e-commerce-para-pme-operacao',            'B',
   'Tem sistemas que ainda não conversam?',
   'Mostre para a RC2 como sua operação funciona hoje.',
   'Falar sobre minha operação', '/contato'),
  ('processos-manuais-o-que-automatizar',     'B',
   'Tem sistemas que ainda não conversam?',
   'Mostre para a RC2 como sua operação funciona hoje.',
   'Falar sobre minha operação', '/contato'),
  ('solucoes-automatizadas-7-criterios-para-avaliar-fornecedores', 'B',
   'Tem sistemas que ainda não conversam?',
   'Mostre para a RC2 como sua operação funciona hoje.',
   'Falar sobre minha operação', '/contato'),
  -- C — IA interna / processos
  ('custo-de-agente-de-ia',                   'C',
   'Quer entender onde IA realmente pode ajudar sua operação?',
   'A primeira conversa serve para identificar se existe um processo que vale automatizar ou apoiar com IA.',
   'Falar sobre minha operação', '/contato'),
  ('governanca-agentes-ia-pmes',              'C',
   'Quer entender onde IA realmente pode ajudar sua operação?',
   'A primeira conversa serve para identificar se existe um processo que vale automatizar ou apoiar com IA.',
   'Falar sobre minha operação', '/contato'),
  ('ia-para-pequenas-empresas',               'C',
   'Quer entender onde IA realmente pode ajudar sua operação?',
   'A primeira conversa serve para identificar se existe um processo que vale automatizar ou apoiar com IA.',
   'Falar sobre minha operação', '/contato');

-- Confere que os 11 slugs do mapa existem e estão publicados.
-- Deve retornar 11. Se não, PARE e rode ROLLBACK.
SELECT count(*) AS slugs_encontrados
FROM cta_map m JOIN public.posts p ON p.slug = m.slug AND p.status = 'published';

-- ---------------------------------------------------------------------
-- 1. BACKUP — guarde este resultado antes de seguir.
--    É com ele que a reversão do rodapé é montada.
-- ---------------------------------------------------------------------
CREATE TEMP TABLE cta_backup ON COMMIT DROP AS
SELECT p.id, p.slug, p.cta_block AS cta_block_anterior, p.content AS content_anterior
FROM public.posts p JOIN cta_map m ON m.slug = p.slug;

SELECT id, slug, cta_block_anterior, length(content_anterior) AS tamanho_content
FROM cta_backup ORDER BY slug;

-- ---------------------------------------------------------------------
-- 2. `cta_block` — atualiza os 8 e cria os 2 de categoria A.
--    `coalesce(cta_block, '{}'::jsonb)` cobre os que ainda não têm o
--    campo; `jsonb_set` com `true` no final cria a chave se faltar.
-- ---------------------------------------------------------------------
UPDATE public.posts p
SET cta_block =
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              coalesce(p.cta_block, '{}'::jsonb),
              '{type}',        to_jsonb('contact'::text),   true),
            '{title}',         to_jsonb(m.cta_title),       true),
          '{description}',     to_jsonb(m.cta_desc),        true),
        '{primaryButton}',
        jsonb_build_object('url', m.destino, 'text', m.botao || ' →'),
        true)
FROM cta_map m
WHERE p.slug = m.slug
  AND p.slug <> 'ia-para-pequenas-empresas';  -- decisão (b): fica no bloco padrão

-- ---------------------------------------------------------------------
-- 3. Normalização de href — apex e absoluto viram relativo.
--    Feito antes da troca de texto para o passo 4 lidar com um só formato.
-- ---------------------------------------------------------------------
UPDATE public.posts p
SET content = replace(
                replace(p.content,
                  'https://www.rc2solucoes.com.br/contato', '/contato'),
                'https://rc2solucoes.com.br/contato',       '/contato')
FROM cta_map m
WHERE p.slug = m.slug;

-- ---------------------------------------------------------------------
-- 4. Texto das âncoras de CTA no corpo.
--
--    O padrão exige prefixo E seta, e para de casar no primeiro `<`:
--      (Solicitar|solicite um|Agendar o) … diagnóstico … →
--    Isso mira o rótulo do link e não encosta na prosa.
-- ---------------------------------------------------------------------
UPDATE public.posts p
SET content = regexp_replace(
      p.content,
      '(Solicitar|solicite um|Agendar o)[^<]{0,60}?diagn[oó]stico[^<]{0,60}?→',
      m.botao || ' →',
      'g')
FROM cta_map m
WHERE p.slug = m.slug;

-- ---------------------------------------------------------------------
-- 5. Destino das âncoras nos posts de categoria A.
--    Só depois do passo 4: agora a âncora de CTA é reconhecível pelo
--    texto "Conhecer Zapbox →", então o href muda apenas nela.
--    (O link não-CTA de `processos-manuais` é categoria B e não entra.)
-- ---------------------------------------------------------------------
UPDATE public.posts p
SET content = regexp_replace(
      p.content,
      '(<a[^>]*href=")/contato("[^>]*>(?:[^<]|<(?!/a>))*Conhecer Zapbox →)',
      '\1/zapbox\2',
      'g')
FROM cta_map m
WHERE p.slug = m.slug AND m.categoria = 'A';

-- ---------------------------------------------------------------------
-- 6. CONFERÊNCIA — nenhuma linha deve voltar. Se voltar, ROLLBACK.
-- ---------------------------------------------------------------------
-- 6a. Sobrou CTA vetado em botão ou corpo?
SELECT p.slug, 'cta_block' AS onde, p.cta_block->'primaryButton'->>'text' AS resto
FROM public.posts p JOIN cta_map m ON m.slug = p.slug
WHERE p.cta_block->'primaryButton'->>'text' ~* 'diagn'
UNION ALL
SELECT p.slug, 'content', 'âncora remanescente'
FROM public.posts p JOIN cta_map m ON m.slug = p.slug
WHERE p.content ~ '(Solicitar|solicite um|Agendar o)[^<]{0,60}diagn[oó]stico[^<]{0,60}→';

-- 6b. Sobrou href absoluto para contato?
SELECT p.slug FROM public.posts p JOIN cta_map m ON m.slug = p.slug
WHERE p.content ~ 'https://(www\.)?rc2solucoes\.com\.br/contato';

-- 6c. Categoria A ainda apontando para /contato no CTA do corpo?
SELECT p.slug FROM public.posts p JOIN cta_map m ON m.slug = p.slug
WHERE m.categoria = 'A'
  AND p.content ~ '<a[^>]*href="/contato"[^>]*>(?:[^<]|<(?!/a>))*Conhecer Zapbox →';

-- ---------------------------------------------------------------------
-- 7. VISÃO FINAL — 10 linhas com cta_block, 1 sem (ia-para-pequenas).
-- ---------------------------------------------------------------------
SELECT p.slug, m.categoria,
       p.cta_block->'primaryButton'->>'text' AS botao,
       p.cta_block->'primaryButton'->>'url'  AS destino,
       p.cta_block->>'title'                 AS titulo
FROM public.posts p JOIN cta_map m ON m.slug = p.slug
ORDER BY m.categoria, p.slug;

COMMIT;
-- ROLLBACK;  -- use no lugar do COMMIT se qualquer conferência do passo 6 retornar linha

-- =====================================================================
-- REVERSÃO depois do COMMIT
-- ---------------------------------------------------------------------
-- A tabela `cta_backup` é TEMP e some no COMMIT. Para poder reverter,
-- SALVE o resultado do passo 1 antes de commitar — ou troque a criação
-- por uma tabela real, que sobrevive:
--
--   CREATE TABLE public.cta_backup_20260904 AS
--   SELECT p.id, p.slug, p.cta_block, p.content
--   FROM public.posts p JOIN cta_map m ON m.slug = p.slug;
--
-- Com ela, a reversão é:
--
--   UPDATE public.posts p
--   SET cta_block = b.cta_block, content = b.content
--   FROM public.cta_backup_20260904 b
--   WHERE p.id = b.id;
-- =====================================================================
