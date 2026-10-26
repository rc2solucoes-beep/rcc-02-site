-- E2/015 — MODELO DE ROLLBACK ESTRUTURAL. NÃO AUTORIZADO PARA EXECUÇÃO.
-- NÃO EXECUTAR. NÃO TESTAR. Este arquivo é um MODELO para revisão: o script a
-- executar num incidente é um DERIVADO específico do alvo, escrito e revisado
-- depois da triagem (recovery-triage.sql), com os atestados A1..A7 comprovados
-- e autorização separada (AUT-ROLLBACK-ESTRUTURAL). rollback.sql continua sendo
-- o marcador de bloqueio e NÃO foi alterado.
--
-- POR QUE É PERIGOSO: DROP TABLE e DROP COLUMN destroem notas, histórico e
-- status SEM volta. Excluir um lead depois da 015 já apagou notas e histórico
-- por CASCADE: nenhum rollback recupera isso (só restauração de backup).
-- Tabelas vazias e ausência de notas/atividade NÃO provam que o rollback é
-- seguro; por isso as precondições abaixo exigem atestados, não só contagens.
--
-- CAMADAS DE PROTEÇÃO CONTRA USO ACIDENTAL:
--   1. A 1ª instrução SEMPRE aborta (RAISE EXCEPTION incondicional).
--   2. Os trechos de restauração são marcadores <<...>> que não são SQL válido.
--   3. Nenhum DROP usa CASCADE.
--   4. O arquivo termina em ROLLBACK.
--   5. As precondições exigem 7 atestados declarados na transação e estado limpo.
-- NUNCA incluir aqui GRANT/CREATE POLICY para anon (DEC-08): a reversão não
-- reabre acesso anônimo, em hipótese alguma.
BEGIN;

-- CAMADA 1: bloqueio incondicional. Remover só no script derivado, revisado.
DO $modelo$
BEGIN
  RAISE EXCEPTION 'MODELO NÃO AUTORIZADO: rollback estrutural da 015 não é executável. Veja export-procedure.md.';
END
$modelo$;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- CAMADA 5: precondições (manter no script derivado).
DO $precondicoes$
DECLARE
  problems text[] := ARRAY[]::text[];
  att text;
  n bigint;
BEGIN
  -- Atestados externos A1..A7, declarados pelo responsável com a referência da evidência:
  --   SET LOCAL rc2.e2_rb_a1 = '<referencia>'; ... SET LOCAL rc2.e2_rb_a7 = '<referencia>';
  FOREACH att IN ARRAY ARRAY['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'] LOOP
    IF coalesce(current_setting('rc2.e2_rb_' || att, true), '') = '' THEN
      problems := problems || format('atestado %s não declarado', upper(att));
    END IF;
  END LOOP;

  -- Estrutura completa (senão: estado PARCIAL ou INDETERMINADO, sem rollback estrutural).
  IF to_regclass('public.lead_notes') IS NULL OR to_regclass('public.lead_activity') IS NULL
     OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'rc2_internal') THEN
    problems := problems || 'estrutura da 015 incompleta (estado parcial/indeterminado)';
  ELSE
    SELECT (SELECT count(*) FROM public.lead_notes) + (SELECT count(*) FROM public.lead_activity) INTO n;
    IF n > 0 THEN problems := problems || 'há notas ou atividade'; END IF;
    SELECT count(*) INTO n FROM public.leads
    WHERE status <> 'new' OR status_updated_at IS NOT NULL OR next_action IS NOT NULL
       OR next_action_at IS NOT NULL OR archived_at IS NOT NULL OR updated_at <> created_at;
    IF n > 0 THEN problems := problems || 'há leads alterados após o backfill'; END IF;
    SELECT coalesce(sum(n_tup_ins + n_tup_del), 0) INTO n FROM pg_catalog.pg_stat_user_tables
    WHERE schemaname = 'public' AND relname IN ('lead_notes', 'lead_activity');
    IF n > 0 THEN problems := problems || 'estatísticas acusam inserção/exclusão em notas ou atividade'; END IF;
    SELECT coalesce(sum(n_tup_del), 0) INTO n FROM pg_catalog.pg_stat_user_tables
    WHERE schemaname = 'public' AND relname = 'leads';
    IF n > 0 THEN problems := problems || 'estatísticas acusam exclusão de leads'; END IF;
    IF to_regclass('public.admin_audit_logs') IS NULL THEN
      problems := problems || 'admin_audit_logs ausente: sem evidência de auditoria';
    ELSE
      SELECT count(*) INTO n FROM public.admin_audit_logs
      WHERE left(event, 11) = 'admin_lead_' OR resource_type = 'lead';
      IF n > 0 THEN problems := problems || 'auditoria registra eventos de lead da E2'; END IF;
    END IF;
  END IF;

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'ROLLBACK ESTRUTURAL BLOQUEADO:\n - %\nAusência de notas/atividade não basta; ver export-procedure.md.',
      array_to_string(problems, E'\n - ');
  END IF;
END
$precondicoes$;

-- Remoção (ordem inversa da criação; SEM CASCADE).
DROP TRIGGER leads_30_activity ON public.leads;
DROP TRIGGER leads_20_set_updated_at ON public.leads;
DROP TRIGGER leads_10_before_update ON public.leads;
DROP FUNCTION rc2_internal.leads_record_activity();
DROP FUNCTION rc2_internal.leads_before_update();
DROP SCHEMA rc2_internal;
DROP TABLE public.lead_activity;
DROP TABLE public.lead_notes;
DROP POLICY leads_e2_admin_select ON public.leads;
DROP POLICY leads_e2_admin_update ON public.leads;
DROP POLICY leads_e2_admin_delete ON public.leads;
DROP INDEX public.leads_e2_active_created_idx;
DROP INDEX public.leads_e2_status_created_idx;
DROP INDEX public.leads_e2_next_action_idx;
ALTER TABLE public.leads DROP CONSTRAINT leads_e2_status_check;
ALTER TABLE public.leads DROP CONSTRAINT leads_e2_next_action_check;
ALTER TABLE public.leads
  DROP COLUMN status,
  DROP COLUMN status_updated_at,
  DROP COLUMN next_action,
  DROP COLUMN next_action_at,
  DROP COLUMN archived_at,
  DROP COLUMN updated_at;

-- CAMADA 2: restauração FIEL ao snapshot pré-015 (preflight.sql, EVD-* e DIGEST-*).
-- Nada é reconstruído de memória: cada marcador abaixo vira SQL gerado a partir
-- da evidência guardada, revisado por pessoa independente.
<<RESTAURAR as policies de leads a partir de EVD-POLICY (nome, permissive, roles, cmd, qual, with_check)>>;
<<RESTAURAR a ACL de tabela e de coluna de leads a partir de EVD-ACL-TABELA e EVD-ACL-COLUNA>>;
<<CONFERIR: re-executar preflight.sql — RESULTADO = APROVADO e DIGEST-* IGUAIS aos guardados>>;

-- SEGURANÇA: nunca efetivar este modelo.
ROLLBACK;
