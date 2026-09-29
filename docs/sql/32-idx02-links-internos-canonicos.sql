-- =====================================================================
-- IDX-02 — Links internos do CMS para URLs redirecionadas (SCRIPT FINAL)
--
--   *** DG-2 APROVADO PARA 31/32 — PRONTO PARA EXECUÇÃO MANUAL ***
--   *** #4 BLOQUEADO — NÃO EXECUTAR ESTA OCORRÊNCIA (aprovado = false) ***
--   *** NÃO EXECUTADO COM SUCESSO. A 1ª tentativa manual (2026-09-28) abortou
--       antes do COMMIT (record "m" is not assigned yet) e não gravou nada;
--       nenhuma migração foi concluída. Corrigido na Fase B.0.2. ***
--   Decisões: docs/seo/02-idx02-links-internos.md (Fases A, B.0, B.0.1 e B.0.2).
--
-- Como executar: copiar o arquivo INTEIRO no Supabase SQL Editor (role
-- postgres) e rodar. Não precisa editar nada. Se qualquer verificação
-- falhar, o script para com erro e nada é gravado (transação única).
--
-- Escopo: campo `content` de 13 posts publicados. Mapa de 32 ocorrências:
--   31 aprovadas  (27 href-only · 3 href+anchor · 1 sentence-rewrite)
--   1 bloqueada  (#4, aprovado = false — fica no mapa, não é aplicada)
-- updated_at: PRESERVADO (trigger posts_updated_at desligado só durante o lote).
-- Reversão: docs/sql/32-idx02-links-internos-canonicos-reversao.sql
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Estado auditado — 13 posts, md5 do content em 2026-09-28
-- ---------------------------------------------------------------------
CREATE TEMP TABLE idx02_posts (
  id uuid PRIMARY KEY, slug text UNIQUE NOT NULL, md5_auditado text NOT NULL
) ON COMMIT DROP;
INSERT INTO idx02_posts VALUES
  ('d7cac85e-5a99-4da8-988d-66399d14bad3'::uuid, $q$atendimento-automatizado-contexto$q$, 'fd8ee8d5b3abaa8e9e722928a4fcbb59'),
  ('d4e83ef6-23e9-459e-ac2a-1978ff0fc3ea'::uuid, $q$atendimento-omnichannel-pme$q$, 'ce2662af0bbefbb07d27c332863a1767'),
  ('7c773332-426d-46e8-a71b-4b4842e6a1a6'::uuid, $q$automacao-whatsapp-ia$q$, 'fab5179e7c9aef9e3c20913dc1a9aff5'),
  ('8614e2ba-9252-490d-9a2e-d4d40173fc04'::uuid, $q$custo-de-agente-de-ia$q$, '2a129f8d39502c3d4a0de6dc0d0c73d3'),
  ('5b9fdc60-365e-400d-bbdb-da7b9b0456cf'::uuid, $q$e-commerce-para-pme-operacao$q$, 'fe0eaea14de582226c9135d1a20ce2f2'),
  ('f49736b1-d514-47a5-a27d-2cdd1412f9df'::uuid, $q$governanca-agentes-ia-pmes$q$, 'f42ff377957a7ef396e0d43b084e5748'),
  ('38fec436-73d3-4195-bfa8-cb34ba7138c4'::uuid, $q$ia-para-pequenas-empresas$q$, 'c2a2d2f6e2f42899908fba554a49f8c5'),
  ('955c527b-2658-4e43-a4d1-886cc7b827b7'::uuid, $q$integracao-canais-atendimento$q$, '75cd76706f47cc7f4eb17d1eaa200bb8'),
  ('3984645e-1b85-4a05-b46f-d83f852d93b1'::uuid, $q$leads-sem-resposta-primeiro-retorno$q$, '704c080efca2f3039cf37debb77561a2'),
  ('16d2bdc9-6050-4f04-96ec-bb7323d7723a'::uuid, $q$mensagens-servico-whatsapp-business-api$q$, 'b4adc4b76452e48e761ea7db9c51b4ab'),
  ('16ab2756-d82a-48f9-8a31-34034ed8f55a'::uuid, $q$processos-manuais-o-que-automatizar$q$, '0e468597c86bb6eb4abc49e2b6f1f4b7'),
  ('5c085ad9-2b8d-45cb-aaff-47fc8fe7c928'::uuid, $q$seguranca-de-agente-de-ia$q$, '58fbcc4a8d4ba7357957b12a39d629ba'),
  ('d049fc80-5e04-4944-8000-5f417f881b14'::uuid, $q$solucoes-automatizadas-7-criterios-para-avaliar-fornecedores$q$, 'db8ab8341441f44bf602a9ee93817043');

-- ---------------------------------------------------------------------
-- 2. Mapa — 32 ocorrências. old_tag/new_tag são o trecho HTML exato
--    (a tag <a> inteira; no #22, a frase inteira). aprovado = false → não aplica.
-- ---------------------------------------------------------------------
CREATE TEMP TABLE idx02_map (
  ord int PRIMARY KEY, slug text NOT NULL, acao text NOT NULL,
  aprovado boolean NOT NULL, old_tag text NOT NULL, new_tag text NOT NULL
) ON COMMIT DROP;
INSERT INTO idx02_map VALUES
  ( 1, $q$atendimento-automatizado-contexto$q$, 'href-only', true, $q$<a href="/servicos/automacoes-com-ia">atendimento automatizado com IA</a>$q$, $q$<a href="/zapbox">atendimento automatizado com IA</a>$q$),
  ( 2, $q$atendimento-automatizado-contexto$q$, 'href-only', true, $q$<a href="/servicos/automacoes-com-ia">automações com IA para atendimento</a>$q$, $q$<a href="/zapbox">automações com IA para atendimento</a>$q$),
  ( 3, $q$atendimento-automatizado-contexto$q$, 'href+anchor', true, $q$<a href="/servicos/automacoes-com-ia">Conhecer as automações com IA para atendimento da RC2 →</a>$q$, $q$<a href="/zapbox">Ver como o Zapbox usa IA no atendimento pelo WhatsApp →</a>$q$),
  ( 4, $q$atendimento-omnichannel-pme$q$, 'blocked', false, $q$<a href="https://rc2solucoes.com.br/servicos/agentes-de-ia">agente de IA</a>$q$, $q$<a href="/zapbox">agente de IA de atendimento</a>$q$),
  ( 5, $q$atendimento-omnichannel-pme$q$, 'href-only', true, $q$<a href="https://rc2solucoes.com.br/servicos/automacao-de-processos">n8n</a>$q$, $q$<a href="/solucoes#automacao-de-processos">n8n</a>$q$),
  ( 6, $q$atendimento-omnichannel-pme$q$, 'href-only', true, $q$<a href="https://rc2solucoes.com.br/servicos/agentes-de-ia">agentes de IA</a>$q$, $q$<a href="/solucoes#ia-para-operacoes">agentes de IA</a>$q$),
  ( 7, $q$atendimento-omnichannel-pme$q$, 'href-only', true, $q$<a href="https://rc2solucoes.com.br/servicos/automacoes-com-ia">Ver soluções de automação e atendimento →</a>$q$, $q$<a href="/zapbox">Ver soluções de automação e atendimento →</a>$q$),
  ( 8, $q$automacao-whatsapp-ia$q$, 'href-only', true, $q$<a href="https://rc2solucoes.com.br/servicos/automacoes-com-ia">agentes de IA</a>$q$, $q$<a href="/zapbox">agentes de IA</a>$q$),
  ( 9, $q$automacao-whatsapp-ia$q$, 'href-only', true, $q$<a href="https://rc2solucoes.com.br/servicos/automacoes-com-ia">Ver soluções de automação com IA →</a>$q$, $q$<a href="/solucoes">Ver soluções de automação com IA →</a>$q$),
  (10, $q$custo-de-agente-de-ia$q$, 'href-only', true, $q$<a href="/servicos/agentes-de-ia">agentes de IA para operação</a>$q$, $q$<a href="/solucoes#ia-para-operacoes">agentes de IA para operação</a>$q$),
  (11, $q$custo-de-agente-de-ia$q$, 'href-only', true, $q$<a href="/servicos/automacoes-com-ia">automações de atendimento com IA</a>$q$, $q$<a href="/zapbox">automações de atendimento com IA</a>$q$),
  (12, $q$e-commerce-para-pme-operacao$q$, 'href-only', true, $q$<a href="/servicos/e-commerce">e-commerce da RC2</a>$q$, $q$<a href="/solucoes#operacoes-digitais-commerce">e-commerce da RC2</a>$q$),
  (13, $q$e-commerce-para-pme-operacao$q$, 'href-only', true, $q$<a href="/servicos/automacao-de-processos">automação de processos</a>$q$, $q$<a href="/solucoes#automacao-de-processos">automação de processos</a>$q$),
  (14, $q$e-commerce-para-pme-operacao$q$, 'href-only', true, $q$<a href="/servicos/sites-e-landing-pages">landing page de conversão</a>$q$, $q$<a href="/solucoes">landing page de conversão</a>$q$),
  (15, $q$e-commerce-para-pme-operacao$q$, 'href-only', true, $q$<a href="/servicos/e-commerce">Conhecer as soluções de e-commerce da RC2 →</a>$q$, $q$<a href="/solucoes#operacoes-digitais-commerce">Conhecer as soluções de e-commerce da RC2 →</a>$q$),
  (16, $q$governanca-agentes-ia-pmes$q$, 'href-only', true, $q$<a href="https://www.rc2solucoes.com.br/servicos/agentes-de-ia">implementação de agentes de IA para empresas</a>$q$, $q$<a href="/solucoes#ia-para-operacoes">implementação de agentes de IA para empresas</a>$q$),
  (17, $q$governanca-agentes-ia-pmes$q$, 'href-only', true, $q$<a href="https://www.rc2solucoes.com.br/servicos/automacao-de-processos">automação de processos com integrações</a>$q$, $q$<a href="/solucoes#automacao-de-processos">automação de processos com integrações</a>$q$),
  (18, $q$ia-para-pequenas-empresas$q$, 'href-only', true, $q$<a target="_blank" rel="noopener noreferrer nofollow" class="underline underline underline-offset-2 decoration-1 decoration-current/40 hover:decoration-current focus:decoration-current" href="https://rc2solucoes.com.br/servicos/automacoes-com-ia">Ver soluções de automação da RC2 →</a>$q$, $q$<a target="_blank" rel="noopener noreferrer nofollow" class="underline underline underline-offset-2 decoration-1 decoration-current/40 hover:decoration-current focus:decoration-current" href="/solucoes">Ver soluções de automação da RC2 →</a>$q$),
  (19, $q$integracao-canais-atendimento$q$, 'href-only', true, $q$<a href="/servicos/automacoes-com-ia">automação de atendimento com IA</a>$q$, $q$<a href="/zapbox">automação de atendimento com IA</a>$q$),
  (20, $q$integracao-canais-atendimento$q$, 'href-only', true, $q$<a href="/servicos/automacao-de-processos">integração entre processos</a>$q$, $q$<a href="/solucoes#automacao-de-processos">integração entre processos</a>$q$),
  (21, $q$integracao-canais-atendimento$q$, 'href+anchor', true, $q$<a href="/servicos/automacoes-com-ia">Conhecer as soluções de automação de atendimento da RC2 →</a>$q$, $q$<a href="/zapbox">Conhecer o Zapbox, produto da RC2 para atendimento e vendas no WhatsApp →</a>$q$),
  (22, $q$leads-sem-resposta-primeiro-retorno$q$, 'sentence-rewrite', true, $q$<p>A página da RC2 sobre <a href="/solucoes/leads-sem-resposta">leads sem resposta no atendimento</a> trata essa dor como um gargalo operacional, não como falta de esforço da equipe.$q$, $q$<p>No <a href="/zapbox">Zapbox</a>, leads que chegam pelo WhatsApp podem ser organizados e acompanhados em um pipeline comercial, ajudando a tratar a falta de resposta como um gargalo operacional, não como falta de esforço da equipe.$q$),
  (23, $q$leads-sem-resposta-primeiro-retorno$q$, 'href-only', true, $q$<a href="/servicos/automacoes-com-ia">automação de atendimento com IA</a>$q$, $q$<a href="/zapbox">automação de atendimento com IA</a>$q$),
  (24, $q$leads-sem-resposta-primeiro-retorno$q$, 'href+anchor', true, $q$<a href="/servicos/automacoes-com-ia">Conhecer as soluções de automação de atendimento com IA da RC2 →</a>$q$, $q$<a href="/zapbox">Ver como o Zapbox organiza leads em pipeline comercial →</a>$q$),
  (25, $q$mensagens-servico-whatsapp-business-api$q$, 'href-only', true, $q$<a href="/servicos/automacoes-com-ia">agente de IA integrado ao atendimento</a>$q$, $q$<a href="/zapbox">agente de IA integrado ao atendimento</a>$q$),
  (26, $q$mensagens-servico-whatsapp-business-api$q$, 'href-only', true, $q$<a href="/servicos/automacoes-com-ia">automações de atendimento com IA</a>$q$, $q$<a href="/zapbox">automações de atendimento com IA</a>$q$),
  (27, $q$processos-manuais-o-que-automatizar$q$, 'href-only', true, $q$<a href="https://www.rc2solucoes.com.br/servicos/automacao-de-processos">automação de processos com n8n</a>$q$, $q$<a href="/solucoes#automacao-de-processos">automação de processos com n8n</a>$q$),
  (28, $q$seguranca-de-agente-de-ia$q$, 'href-only', true, $q$<a href="/servicos/agentes-de-ia">agentes de IA em produção</a>$q$, $q$<a href="/solucoes#ia-para-operacoes">agentes de IA em produção</a>$q$),
  (29, $q$seguranca-de-agente-de-ia$q$, 'href-only', true, $q$<a href="/servicos/agentes-de-ia">agentes de IA que rodam com registro e permissão definidos</a>$q$, $q$<a href="/solucoes#ia-para-operacoes">agentes de IA que rodam com registro e permissão definidos</a>$q$),
  (30, $q$seguranca-de-agente-de-ia$q$, 'href-only', true, $q$<a href="/servicos/automacao-de-processos">automação de processos desenhada para ser auditada</a>$q$, $q$<a href="/solucoes#automacao-de-processos">automação de processos desenhada para ser auditada</a>$q$),
  (31, $q$solucoes-automatizadas-7-criterios-para-avaliar-fornecedores$q$, 'href-only', true, $q$<a href="/solucoes/processos-manuais">gargalos causados por processos manuais</a>$q$, $q$<a href="/solucoes">gargalos causados por processos manuais</a>$q$),
  (32, $q$solucoes-automatizadas-7-criterios-para-avaliar-fornecedores$q$, 'href-only', true, $q$<a href="https://www.rc2solucoes.com.br/servicos/automacao-de-processos">integração entre ferramentas via API</a>$q$, $q$<a href="/solucoes#automacao-de-processos">integração entre ferramentas via API</a>$q$);

-- ---------------------------------------------------------------------
-- 3. PREFLIGHT — antes de qualquer escrita. Qualquer divergência → RAISE.
-- ---------------------------------------------------------------------
DO $$
DECLARE audit_rec record; backup_existe boolean; tem_backup boolean;
BEGIN
  IF (SELECT count(*) FROM idx02_posts AS audit_row
      JOIN public.posts AS post_row ON post_row.id = audit_row.id AND post_row.slug = audit_row.slug AND post_row.status = 'published') <> 13 THEN
    RAISE EXCEPTION 'preflight: esperado 13 posts publicados com id/slug auditados';
  END IF;
  IF (SELECT count(*) FROM idx02_map) <> 32
     OR (SELECT count(*) FROM idx02_map WHERE aprovado) <> 31
     OR (SELECT count(*) FROM idx02_map WHERE NOT aprovado) <> 1 THEN
    RAISE EXCEPTION 'preflight: mapa deveria ter 32 linhas, 31 aprovadas e 1 bloqueada(s)';
  END IF;
  IF (SELECT array_agg(ord ORDER BY ord) FROM idx02_map WHERE NOT aprovado)
     IS DISTINCT FROM ARRAY[4] THEN
    RAISE EXCEPTION 'preflight: linhas bloqueadas deveriam ser exatamente #4';
  END IF;
  IF EXISTS (SELECT 1 FROM idx02_map AS map_row LEFT JOIN idx02_posts AS audit_row USING (slug) WHERE audit_row.id IS NULL) THEN
    RAISE EXCEPTION 'preflight: mapa referencia slug fora da auditoria';
  END IF;
  IF EXISTS (SELECT 1 FROM idx02_map
             WHERE aprovado AND substring(new_tag FROM 'href="([^"]*)"') NOT IN
               ('/zapbox', '/solucoes', '/solucoes#ia-para-operacoes', '/solucoes#automacao-de-processos', '/solucoes#operacoes-digitais-commerce')) THEN
    RAISE EXCEPTION 'preflight: destino fora da lista aprovada';
  END IF;
  -- md5: cada post tem de estar no estado auditado, ou já ter backup deste lote
  -- (reexecução; o passo 5 confere o conteúdo exato contra o backup).
  backup_existe := to_regclass('public.idx02_links_backup_20260928') IS NOT NULL;
  FOR audit_rec IN SELECT audit_row.slug, audit_row.id, audit_row.md5_auditado, md5(post_row.content) AS md5_atual
           FROM idx02_posts AS audit_row JOIN public.posts AS post_row ON post_row.id = audit_row.id LOOP
    IF audit_rec.md5_atual <> audit_rec.md5_auditado THEN
      tem_backup := false;
      IF backup_existe THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.idx02_links_backup_20260928 WHERE id = $1)' INTO tem_backup USING audit_rec.id;
      END IF;
      IF NOT tem_backup THEN
        RAISE EXCEPTION 'conflito: % foi editado depois da auditoria (md5 atual %)', audit_rec.slug, audit_rec.md5_atual;
      END IF;
    END IF;
  END LOOP;
  -- Trigger precisa existir e estar ativo antes de ser desligado.
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.posts'::regclass
                 AND tgname = 'posts_updated_at' AND tgenabled = 'O') THEN
    RAISE EXCEPTION 'preflight: trigger posts_updated_at ausente ou desativado';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 4. BACKUP persistente (sobrevive ao COMMIT), só das linhas afetadas.
--    Se já existir, precisa ser deste lote (mesmos ids e md5); senão, PARA.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.idx02_links_backup_20260928 (
  id                  uuid PRIMARY KEY,
  slug                text NOT NULL,
  content_original    text NOT NULL,
  md5_original        text NOT NULL,
  updated_at_original timestamptz,
  backup_at           timestamptz NOT NULL DEFAULT now(),
  md5_migrado         text
);
-- Tabela em public fica exposta pela API: sem acesso para anon/authenticated.
ALTER TABLE public.idx02_links_backup_20260928 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.idx02_links_backup_20260928 FROM anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.idx02_links_backup_20260928 AS backup_row LEFT JOIN idx02_posts AS audit_row ON audit_row.id = backup_row.id
             WHERE audit_row.id IS NULL OR backup_row.md5_original <> audit_row.md5_auditado) THEN
    RAISE EXCEPTION 'backup existente não corresponde a esta auditoria — não sobrescrevo';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 5. APLICAÇÃO — trava as linhas, confere concorrência, faz backup e troca.
--    updated_at preservado: trigger desligado e religado no mesmo bloco.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  post_rec record; map_rec record;
  r_slug text; atual text; md5_aud text; bkp text;
  v text; esperado text;
  n_old int; n_new int; aplicadas int; total int := 0;
BEGIN
  EXECUTE 'ALTER TABLE public.posts DISABLE TRIGGER posts_updated_at';

  FOR post_rec IN
    SELECT audit_row.id, audit_row.slug, audit_row.md5_auditado, post_row.content, post_row.updated_at
    FROM idx02_posts AS audit_row JOIN public.posts AS post_row ON post_row.id = audit_row.id
    ORDER BY audit_row.slug
    FOR UPDATE OF post_row
  LOOP
    r_slug := post_rec.slug; atual := post_rec.content; md5_aud := post_rec.md5_auditado;
    SELECT content_original INTO bkp FROM public.idx02_links_backup_20260928 WHERE id = post_rec.id;

    -- Concorrência: o conteúdo tem de ser o auditado — ou, numa reexecução,
    -- exatamente o backup deste lote + as trocas já aplicadas.
    IF md5(atual) <> md5_aud THEN
      IF bkp IS NULL THEN
        RAISE EXCEPTION 'conflito: % foi editado depois da auditoria (md5 atual %)', r_slug, md5(atual);
      END IF;
      esperado := bkp;
      FOR map_rec IN SELECT * FROM idx02_map WHERE slug = r_slug ORDER BY ord LOOP
        IF position(map_rec.old_tag IN atual) = 0 AND position(map_rec.new_tag IN atual) > 0 THEN
          esperado := replace(esperado, map_rec.old_tag, map_rec.new_tag);
        END IF;
      END LOOP;
      IF md5(esperado) <> md5(atual) THEN
        RAISE EXCEPTION 'conflito: % foi editado depois da migração anterior', r_slug;
      END IF;
    END IF;

    -- Trocas aprovadas: exatamente 1 antiga e 0 nova; ou 0/1 = já aplicada.
    v := atual; aplicadas := 0;
    FOR map_rec IN SELECT * FROM idx02_map WHERE slug = r_slug AND aprovado ORDER BY ord LOOP
      n_old := (length(v) - length(replace(v, map_rec.old_tag, ''))) / length(map_rec.old_tag);
      n_new := (length(v) - length(replace(v, map_rec.new_tag, ''))) / length(map_rec.new_tag);
      IF n_old = 1 AND n_new = 0 THEN
        v := replace(v, map_rec.old_tag, map_rec.new_tag);
        aplicadas := aplicadas + 1;
      ELSIF n_old = 0 AND n_new = 1 THEN
        NULL;  -- já aplicada numa execução anterior
      ELSE
        RAISE EXCEPTION 'ocorrência #% (%): esperado 1 antiga/0 nova, obtido %/%', map_rec.ord, r_slug, n_old, n_new;
      END IF;
    END LOOP;

    IF aplicadas > 0 THEN
      INSERT INTO public.idx02_links_backup_20260928 (id, slug, content_original, md5_original, updated_at_original)
      VALUES (post_rec.id, post_rec.slug, post_rec.content, post_rec.md5_auditado, post_rec.updated_at)
      ON CONFLICT (id) DO NOTHING;
      UPDATE public.posts
      SET content = v, updated_at = post_rec.updated_at
      WHERE id = post_rec.id AND md5(content) = md5(post_rec.content);
      IF NOT FOUND THEN
        RAISE EXCEPTION 'conflito: % mudou durante o lote', post_rec.slug;
      END IF;
      UPDATE public.idx02_links_backup_20260928 SET md5_migrado = md5(v) WHERE id = post_rec.id;
      total := total + aplicadas;
      RAISE NOTICE '% — % troca(s)', post_rec.slug, aplicadas;
    END IF;
  END LOOP;

  EXECUTE 'ALTER TABLE public.posts ENABLE TRIGGER posts_updated_at';
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.posts'::regclass
                 AND tgname = 'posts_updated_at' AND tgenabled = 'O') THEN
    RAISE EXCEPTION 'trigger posts_updated_at não foi reativado';
  END IF;
  RAISE NOTICE 'total de trocas nesta execução: %', total;
END $$;

-- ---------------------------------------------------------------------
-- 6. CONFERÊNCIA — tudo em RAISE: se algo falhar, o COMMIT vira ROLLBACK.
-- ---------------------------------------------------------------------
DO $$
DECLARE falhas text := ''; backup_rec record; map_rec record; inv text;
BEGIN
  -- 6A. nenhum trecho antigo aprovado restante
  IF EXISTS (SELECT 1 FROM idx02_map AS map_row JOIN public.posts AS post_row USING (slug)
             WHERE map_row.aprovado AND position(map_row.old_tag IN post_row.content) > 0) THEN
    falhas := falhas || ' [6A trecho antigo aprovado ainda presente]';
  END IF;
  -- 6B/6C. hrefs IDX-02 restantes (relativos, www ou apex) = só os das linhas bloqueadas
  IF (SELECT count(*) FROM idx02_posts AS audit_row JOIN public.posts AS post_row ON post_row.id = audit_row.id,
        regexp_matches(post_row.content, 'href="(https?://(www\.)?rc2solucoes\.com\.br)?/(servicos/|solucoes/(leads-sem-resposta|processos-manuais))', 'g'))
     <> (SELECT count(*) FROM idx02_map WHERE NOT aprovado) THEN
    falhas := falhas || ' [6B/6C hrefs IDX-02 restantes além dos bloqueados]';
  END IF;
  -- 6D. cada trecho novo aprovado presente exatamente 1 vez; nº de links igual ao backup
  IF EXISTS (SELECT 1 FROM idx02_map AS map_row JOIN public.posts AS post_row USING (slug)
             WHERE map_row.aprovado
               AND (length(post_row.content) - length(replace(post_row.content, map_row.new_tag, ''))) / length(map_row.new_tag) <> 1) THEN
    falhas := falhas || ' [6D trecho novo ausente ou duplicado]';
  END IF;
  IF EXISTS (SELECT 1 FROM public.idx02_links_backup_20260928 AS backup_row JOIN public.posts AS post_row ON post_row.id = backup_row.id
             WHERE (SELECT count(*) FROM regexp_matches(post_row.content, '<a\s', 'g'))
                <> (SELECT count(*) FROM regexp_matches(backup_row.content_original, '<a\s', 'g'))) THEN
    falhas := falhas || ' [6D número de links mudou]';
  END IF;
  -- 6E. HTML balanceado (<a>/</a> e <p>/</p>) e só as regiões mapeadas mudaram:
  --     desfazer as trocas aprovadas tem de devolver exatamente o original.
  IF EXISTS (SELECT 1 FROM public.idx02_links_backup_20260928 AS backup_row JOIN public.posts AS post_row ON post_row.id = backup_row.id
             WHERE (SELECT count(*) FROM regexp_matches(post_row.content, '<a\s', 'g'))
                <> (SELECT count(*) FROM regexp_matches(post_row.content, '</a>', 'g'))
                OR (SELECT count(*) FROM regexp_matches(post_row.content, '<p[\s>]', 'g'))
                <> (SELECT count(*) FROM regexp_matches(backup_row.content_original, '<p[\s>]', 'g'))) THEN
    falhas := falhas || ' [6E HTML desbalanceado]';
  END IF;
  FOR backup_rec IN SELECT backup_row.slug, backup_row.content_original, post_row.content
           FROM public.idx02_links_backup_20260928 AS backup_row JOIN public.posts AS post_row ON post_row.id = backup_row.id LOOP
    inv := backup_rec.content;
    FOR map_rec IN SELECT * FROM idx02_map WHERE slug = backup_rec.slug AND aprovado ORDER BY ord DESC LOOP
      inv := replace(inv, map_rec.new_tag, map_rec.old_tag);
    END LOOP;
    IF md5(inv) <> md5(backup_rec.content_original) THEN
      falhas := falhas || format(' [6E %s: conteúdo fora das regiões mapeadas mudou]', backup_rec.slug);
    END IF;
  END LOOP;
  -- 6F. updated_at preservado
  IF EXISTS (SELECT 1 FROM public.idx02_links_backup_20260928 AS backup_row JOIN public.posts AS post_row ON post_row.id = backup_row.id
             WHERE post_row.updated_at IS DISTINCT FROM backup_row.updated_at_original) THEN
    falhas := falhas || ' [6F updated_at mudou]';
  END IF;
  -- 6G. trigger reativado
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.posts'::regclass
                 AND tgname = 'posts_updated_at' AND tgenabled = 'O') THEN
    falhas := falhas || ' [6G trigger desativado]';
  END IF;
  IF falhas <> '' THEN
    RAISE EXCEPTION 'conferência falhou:%', falhas;
  END IF;
END $$;

COMMIT;

-- ---------------------------------------------------------------------
-- 7. VISÃO FINAL (depois do COMMIT, só leitura). Esperado: 13 linhas, todas
--    com migrado = true e updated_at_preservado = true; hrefs_antigos = 0,
--    exceto nos posts com linha bloqueada (#4 em atendimento-omnichannel-pme: 1).
-- ---------------------------------------------------------------------
SELECT backup_row.slug,
       md5(post_row.content) = backup_row.md5_migrado AS migrado,
       post_row.updated_at = backup_row.updated_at_original AS updated_at_preservado,
       (SELECT count(*) FROM regexp_matches(post_row.content, 'href="(https?://(www\.)?rc2solucoes\.com\.br)?/(servicos/|solucoes/(leads-sem-resposta|processos-manuais))', 'g')) AS hrefs_antigos,
       length(post_row.content) - length(backup_row.content_original) AS delta_chars
FROM public.idx02_links_backup_20260928 AS backup_row JOIN public.posts AS post_row ON post_row.id = backup_row.id
ORDER BY backup_row.slug;
