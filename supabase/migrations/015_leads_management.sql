-- E2 / 015 — Gestão operacional de leads. PROPOSTA NÃO HOMOLOGADA.
-- NÃO EXECUTAR: revisão independente, preflight do alvo, autorização do
-- isolado e testes PV-06/PV-28 são obrigatórios antes de qualquer aplicação.
-- Não altera POST /api/contact; esquema aditivo sobre public.leads.
-- O histórico remoto é manual: NÃO usar db push, pull ou repair.
--
-- PRIMEIRA APLICAÇÃO ESTRITA: esta migration não é idempotente. Se qualquer
-- objeto da 015 já existir, o guard aborta (transação inteira revertida) em
-- vez de aceitar o objeto em silêncio. Os CREATE seguintes também não usam
-- IF NOT EXISTS, como segunda barreira.
--
-- Dependência da 012: a 015 NÃO altera grants de anon em public.leads. Ela
-- exige que a 012 já tenha removido a policy leads_anon_insert e todo
-- privilégio de anon. O guard comprova SOMENTE esse estado técnico; não
-- comprova que inexistem consumidores externos da chave anon (PV-20), que
-- continua sendo aprovação humana obrigatória ANTES da 012 em produção.

BEGIN;

-- Limites de espera. A migration toma ACCESS EXCLUSIVE em public.leads ANTES de
-- qualquer leitura de guard e o segura até o COMMIT (ver LOCK TABLE abaixo). O
-- /api/contact insere nessa tabela: enquanto a migration espera ou executa, os
-- INSERTs do formulário público ficam em fila. Se o lock não vier em 5s a
-- migration falha (55P03) e NADA é aplicado; repetir em janela de baixo tráfego.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- ─── Guard 1: pré-requisitos ─────────────────────────────────────────────
DO $prereq$
DECLARE
  problems text[] := ARRAY[]::text[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    problems := problems || 'papel anon inexistente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    problems := problems || 'papel authenticated inexistente';
  END IF;
  IF to_regclass('public.leads') IS NULL THEN
    problems := problems || 'public.leads inexistente';
  END IF;
  IF to_regclass('public.admin_users') IS NULL THEN
    problems := problems || 'public.admin_users inexistente';
  END IF;
  IF to_regclass('auth.users') IS NULL THEN
    problems := problems || 'auth.users inexistente';
  END IF;
  IF to_regprocedure('gen_random_uuid()') IS NULL THEN
    problems := problems || 'gen_random_uuid() indisponível';
  END IF;
  IF to_regprocedure('public.update_updated_at()') IS NULL THEN
    problems := problems || 'public.update_updated_at() inexistente';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p
    WHERE p.oid = to_regprocedure('public.update_updated_at()')
      AND p.prorettype = 'pg_catalog.trigger'::regtype
      AND NOT p.prosecdef
      AND p.prosrc ~* 'new\.updated_at\s*=\s*now\(\)'
  ) THEN
    problems := problems || 'public.update_updated_at() com definição incompatível (esperado: trigger, SECURITY INVOKER, new.updated_at = now())';
  END IF;

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'015 ABORTADA — pré-requisitos ausentes:\n - %',
      array_to_string(problems, E'\n - ');
  END IF;
END
$prereq$;

-- ─── Lock: antes de qualquer leitura de estado ou do fingerprint ───────────
-- Sem este lock, um INSERT do formulário público poderia ser confirmado entre a
-- captura do fingerprint (Guard 2) e o ALTER TABLE, e a autoverificação final
-- abortaria por uma diferença legítima de contagem. Com o lock, o estado lido
-- pelo Guard 2, o fingerprint, o backfill e a autoverificação enxergam a MESMA
-- tabela. Sujeito ao lock_timeout acima: se não vier, a transação falha e nada
-- é aplicado. Janela adicional de bloqueio = duração do Guard 2 (consultas de
-- catálogo + um hash sobre as linhas; milissegundos no volume atual); o ALTER
-- TABLE tomaria o mesmo lock logo depois de qualquer forma, então o custo extra
-- é só o tempo do guard. Um lock em modo menor não serviria: ele permitiria
-- INSERTs concorrentes e reabriria a janela.
LOCK TABLE public.leads IN ACCESS EXCLUSIVE MODE;

-- ─── Guard 2: gate técnico da 012 e preexistência ────────────────────────
-- Estado técnico apenas. NÃO substitui o PV-20 (consumidores externos).
DO $state$
DECLARE
  problems text[] := ARRAY[]::text[];
  rec record;
  legacy_count integer;
BEGIN
  -- 012: anon não pode ter policy nem privilégio em public.leads.
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'leads'
      AND policyname = 'leads_anon_insert'
  ) THEN
    problems := problems || 'policy leads_anon_insert ainda existe: aplique a 012 (após PV-20) antes da 015';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'leads'
      AND roles && ARRAY['anon', 'public']::name[]
  ) THEN
    problems := problems || 'há policy em leads que alcança anon/public: aplique a 012 antes da 015';
  END IF;
  IF has_table_privilege('anon', 'public.leads',
       'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
    problems := problems || 'anon tem privilégio de tabela em leads: aplique a 012 antes da 015';
  END IF;
  IF has_any_column_privilege('anon', 'public.leads',
       'SELECT,INSERT,UPDATE,REFERENCES') THEN
    problems := problems || 'anon tem privilégio de coluna em leads: aplique a 012 antes da 015';
  END IF;

  -- Policies desconhecidas em leads (policies permissivas somam por OR).
  FOR rec IN
    SELECT policyname FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'leads'
      AND policyname NOT IN (
        'leads_anon_insert',
        'Only admins can read leads', 'Only admins can update leads',
        'leads_auth_select', 'leads_auth_update'
      )
  LOOP
    problems := problems || format('policy desconhecida ou da 015 já existente em leads: %I', rec.policyname);
  END LOOP;

  -- Triggers: nenhum trigger de usuário em leads é aceito.
  FOR rec IN
    SELECT t.tgname FROM pg_catalog.pg_trigger t
    WHERE t.tgrelid = 'public.leads'::regclass AND NOT t.tgisinternal
  LOOP
    problems := problems || format('trigger preexistente em leads: %I', rec.tgname);
  END LOOP;

  -- Colunas da 015 não podem existir; as 12 históricas precisam existir.
  FOR rec IN
    SELECT a.attname FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = 'public.leads'::regclass AND a.attnum > 0 AND NOT a.attisdropped
      AND a.attname IN ('status', 'status_updated_at', 'next_action',
                        'next_action_at', 'archived_at', 'updated_at')
  LOOP
    problems := problems || format('coluna da 015 já existe em leads: %I', rec.attname);
  END LOOP;
  SELECT count(*) INTO legacy_count FROM pg_catalog.pg_attribute a
  WHERE a.attrelid = 'public.leads'::regclass AND a.attnum > 0 AND NOT a.attisdropped
    AND a.attname IN ('id', 'name', 'company', 'email', 'whatsapp', 'segment',
                      'size', 'solution', 'message', 'source', 'ip_hash', 'created_at');
  IF legacy_count <> 12 THEN
    problems := problems || format('leads não tem as 12 colunas históricas (encontradas: %s)', legacy_count);
  END IF;

  -- Objetos novos não podem existir.
  IF to_regclass('public.lead_notes') IS NOT NULL THEN
    problems := problems || 'public.lead_notes já existe';
  END IF;
  IF to_regclass('public.lead_activity') IS NOT NULL THEN
    problems := problems || 'public.lead_activity já existe';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'rc2_internal') THEN
    problems := problems || 'schema rc2_internal já existe';
  END IF;
  FOR rec IN
    SELECT c.conname FROM pg_catalog.pg_constraint c
    WHERE c.conrelid = 'public.leads'::regclass
      AND c.conname IN ('leads_e2_status_check', 'leads_e2_next_action_check')
  LOOP
    problems := problems || format('constraint da 015 já existe em leads: %I', rec.conname);
  END LOOP;
  FOR rec IN
    SELECT n AS relname FROM unnest(ARRAY[
      'leads_e2_active_created_idx', 'leads_e2_status_created_idx',
      'leads_e2_next_action_idx', 'lead_notes_lead_created_idx',
      'lead_activity_lead_created_idx'
    ]) AS n
  LOOP
    IF to_regclass(format('public.%I', rec.relname)) IS NOT NULL THEN
      problems := problems || format('relação da 015 já existe: %I', rec.relname);
    END IF;
  END LOOP;

  -- Dependências de leads que a 015 não analisa (views/regras e FKs externas).
  FOR rec IN
    SELECT DISTINCT v.relname FROM pg_catalog.pg_depend d
    JOIN pg_catalog.pg_rewrite rw ON rw.oid = d.objid
    JOIN pg_catalog.pg_class v ON v.oid = rw.ev_class
    WHERE d.classid = 'pg_catalog.pg_rewrite'::regclass
      AND d.refobjid = 'public.leads'::regclass
      AND v.oid <> 'public.leads'::regclass
  LOOP
    problems := problems || format('objeto dependente de leads (view/regra): %I — revisão manual', rec.relname);
  END LOOP;
  FOR rec IN
    SELECT c.conname FROM pg_catalog.pg_constraint c
    WHERE c.confrelid = 'public.leads'::regclass
  LOOP
    problems := problems || format('FK externa referencia leads: %I — revisão manual', rec.conname);
  END LOOP;

  -- A função SECURITY DEFINER pertencerá ao executor; ele precisa ser o dono de leads.
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    WHERE c.oid = 'public.leads'::regclass AND pg_catalog.pg_get_userbyid(c.relowner) = current_user
  ) THEN
    problems := problems || format('o executor (%s) não é o dono de public.leads', current_user);
  END IF;

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'015 ABORTADA — estado incompatível (nada foi aplicado):\n - %\nO guard comprova só o estado técnico; não substitui o PV-20 nem o preflight.',
      array_to_string(problems, E'\n - ');
  END IF;

  -- Impressão das colunas históricas, para provar no fim que não foram alteradas.
  PERFORM set_config(
    'rc2.e2_015_legacy_fingerprint',
    (SELECT count(*)::text || ':' || coalesce(md5(string_agg(
       md5(row(l.id, l.name, l.company, l.email, l.whatsapp, l.segment, l.size,
               l.solution, l.message, l.source, l.ip_hash, l.created_at)::text),
       '' ORDER BY l.id)), '')
     FROM public.leads l),
    true);
END
$state$;

-- ─── Colunas e backfill ──────────────────────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN status text NOT NULL DEFAULT 'new',
  ADD COLUMN status_updated_at timestamptz,
  ADD COLUMN next_action text,
  ADD COLUMN next_action_at timestamptz,
  ADD COLUMN archived_at timestamptz,
  ADD COLUMN updated_at timestamptz;

-- Backfill: o histórico disponível de um lead antigo é o seu created_at.
-- Roda ANTES de existir qualquer trigger em leads, portanto não gera
-- atividade nem passa pelo update_updated_at(). Só updated_at é escrito;
-- status_updated_at permanece NULL (nenhuma transição de status ocorreu).
UPDATE public.leads SET updated_at = created_at;

ALTER TABLE public.leads
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_e2_status_check
    CHECK (status IN ('new','in_review','contacted','qualified','closed')) NOT VALID,
  ADD CONSTRAINT leads_e2_next_action_check
    CHECK (next_action IS NULL OR char_length(next_action) <= 280) NOT VALID;

ALTER TABLE public.leads VALIDATE CONSTRAINT leads_e2_status_check;
ALTER TABLE public.leads VALIDATE CONSTRAINT leads_e2_next_action_check;

CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Contrato: status_changed carrega from_value e to_value (ambos não nulos e
-- válidos); os demais eventos não carregam valor algum. IS NOT NULL é
-- explícito porque um CHECK que avalia NULL é tratado como satisfeito.
CREATE TABLE public.lead_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN (
    'status_changed', 'next_action_changed', 'archived', 'restored'
  )),
  from_value text,
  to_value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_activity_status_values_check CHECK (
    (kind = 'status_changed'
      AND from_value IS NOT NULL AND to_value IS NOT NULL
      AND from_value IN ('new','in_review','contacted','qualified','closed')
      AND to_value IN ('new','in_review','contacted','qualified','closed'))
    OR (kind <> 'status_changed' AND from_value IS NULL AND to_value IS NULL)
  )
);

CREATE INDEX leads_e2_active_created_idx
  ON public.leads (archived_at, created_at DESC, id DESC);
CREATE INDEX leads_e2_status_created_idx
  ON public.leads (status, created_at DESC, id DESC);
CREATE INDEX leads_e2_next_action_idx
  ON public.leads (next_action_at ASC NULLS LAST, id ASC);
CREATE INDEX lead_notes_lead_created_idx
  ON public.lead_notes (lead_id, created_at DESC);
CREATE INDEX lead_activity_lead_created_idx
  ON public.lead_activity (lead_id, created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activity ENABLE ROW LEVEL SECURITY;

-- anon em leads NÃO é tocado aqui: o gate acima exige que a 012 já o tenha
-- removido. Os REVOKE de anon abaixo valem só para as tabelas NOVAS.
REVOKE ALL ON TABLE public.leads FROM authenticated;
REVOKE ALL ON TABLE public.lead_notes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.lead_activity FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.leads TO authenticated;
GRANT UPDATE (status, next_action, next_action_at, archived_at)
  ON TABLE public.leads TO authenticated;
GRANT SELECT, INSERT ON TABLE public.lead_notes TO authenticated;
GRANT SELECT ON TABLE public.lead_activity TO authenticated;

-- Policies legadas de admin (003) ou anteriores à 003, substituídas abaixo.
-- Qualquer outra policy em leads já teria abortado o guard.
DROP POLICY IF EXISTS "Only admins can read leads" ON public.leads;
DROP POLICY IF EXISTS "Only admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "leads_auth_select" ON public.leads;
DROP POLICY IF EXISTS "leads_auth_update" ON public.leads;

CREATE POLICY leads_e2_admin_select ON public.leads
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM public.admin_users));

CREATE POLICY leads_e2_admin_update ON public.leads
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM public.admin_users))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT id FROM public.admin_users));

CREATE POLICY leads_e2_admin_delete ON public.leads
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM public.admin_users));

CREATE POLICY lead_notes_e2_admin_select ON public.lead_notes
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM public.admin_users));
CREATE POLICY lead_notes_e2_admin_insert ON public.lead_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND (SELECT auth.uid()) IN (SELECT id FROM public.admin_users)
  );

CREATE POLICY lead_activity_e2_admin_select ON public.lead_activity
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM public.admin_users));

-- Funções de trigger no schema NÃO exposto ao Data API, sem EXECUTE público.
CREATE SCHEMA rc2_internal;
REVOKE ALL ON SCHEMA rc2_internal FROM PUBLIC, anon, authenticated;

CREATE FUNCTION rc2_internal.leads_before_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  NEW.next_action := NULLIF(btrim(NEW.next_action), '');
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at := now();
  ELSE
    NEW.status_updated_at := OLD.status_updated_at;
  END IF;
  RETURN NEW;
END;
$$;

-- O trigger 2 reutiliza public.update_updated_at() SEM alterar a função
-- (definição conferida pelo Guard 1). O Guard 2 garante que leads não tinha
-- nenhum trigger de usuário; nenhum trigger desconhecido é removido.

CREATE FUNCTION rc2_internal.leads_record_activity()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_activity
      (lead_id, actor_id, kind, from_value, to_value)
    VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status, NEW.status);
  END IF;

  IF OLD.next_action IS DISTINCT FROM NEW.next_action
     OR OLD.next_action_at IS DISTINCT FROM NEW.next_action_at THEN
    INSERT INTO public.lead_activity (lead_id, actor_id, kind)
    VALUES (NEW.id, auth.uid(), 'next_action_changed');
  END IF;

  IF OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN
    INSERT INTO public.lead_activity (lead_id, actor_id, kind)
    VALUES (NEW.id, auth.uid(), 'archived');
  ELSIF OLD.archived_at IS NOT NULL AND NEW.archived_at IS NULL THEN
    INSERT INTO public.lead_activity (lead_id, actor_id, kind)
    VALUES (NEW.id, auth.uid(), 'restored');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION rc2_internal.leads_before_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION rc2_internal.leads_record_activity() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER leads_10_before_update
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION rc2_internal.leads_before_update();

CREATE TRIGGER leads_20_set_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER leads_30_activity
AFTER UPDATE ON public.leads
FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION rc2_internal.leads_record_activity();

-- ─── Autoverificação na própria transação ────────────────────────────────
-- Qualquer falha reverte tudo. Não expõe PII (só contagens e hash).
DO $post$
DECLARE
  problems text[] := ARRAY[]::text[];
  v_before text := current_setting('rc2.e2_015_legacy_fingerprint', true);
  v_after text;
  trigger_names text;
  v_owner oid;
BEGIN
  SELECT count(*)::text || ':' || coalesce(md5(string_agg(
           md5(row(l.id, l.name, l.company, l.email, l.whatsapp, l.segment, l.size,
                   l.solution, l.message, l.source, l.ip_hash, l.created_at)::text),
           '' ORDER BY l.id)), '')
    INTO v_after FROM public.leads l;
  IF v_before IS NULL OR v_before IS DISTINCT FROM v_after THEN
    problems := problems || 'colunas históricas de leads divergem da impressão anterior';
  END IF;
  IF EXISTS (SELECT 1 FROM public.leads WHERE updated_at IS DISTINCT FROM created_at) THEN
    problems := problems || 'updated_at diferente de created_at após o backfill';
  END IF;
  IF EXISTS (SELECT 1 FROM public.leads WHERE status <> 'new' OR status_updated_at IS NOT NULL
             OR next_action IS NOT NULL OR next_action_at IS NOT NULL OR archived_at IS NOT NULL) THEN
    problems := problems || 'lead histórico com campo de gestão diferente do padrão';
  END IF;
  IF EXISTS (SELECT 1 FROM public.lead_activity) OR EXISTS (SELECT 1 FROM public.lead_notes) THEN
    problems := problems || 'o backfill gerou atividade ou nota';
  END IF;

  SELECT string_agg(t.tgname::text, ',' ORDER BY t.tgname) INTO trigger_names
  FROM pg_catalog.pg_trigger t
  WHERE t.tgrelid = 'public.leads'::regclass AND NOT t.tgisinternal;
  IF trigger_names IS DISTINCT FROM 'leads_10_before_update,leads_20_set_updated_at,leads_30_activity' THEN
    problems := problems || format('triggers de leads inesperados: %s', coalesce(trigger_names, '(nenhum)'));
  END IF;

  IF has_table_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_table_privilege('anon', 'public.lead_notes', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_table_privilege('anon', 'public.lead_activity', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
    problems := problems || 'anon com privilégio em tabela de leads';
  END IF;
  IF has_table_privilege('authenticated', 'public.leads', 'INSERT,UPDATE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_column_privilege('authenticated', 'public.leads', 'name', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.leads', 'updated_at', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.leads', 'status_updated_at', 'UPDATE')
     OR NOT has_column_privilege('authenticated', 'public.leads', 'status', 'UPDATE') THEN
    problems := problems || 'grants de authenticated em leads divergem do PRP-01';
  END IF;
  IF has_table_privilege('authenticated', 'public.lead_activity', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_table_privilege('authenticated', 'public.lead_notes', 'UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
    problems := problems || 'authenticated com escrita indevida em notas/atividade';
  END IF;
  IF has_function_privilege('authenticated', 'rc2_internal.leads_record_activity()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'rc2_internal.leads_before_update()', 'EXECUTE')
     OR has_function_privilege('anon', 'rc2_internal.leads_record_activity()', 'EXECUTE')
     OR has_function_privilege('anon', 'rc2_internal.leads_before_update()', 'EXECUTE')
     OR has_schema_privilege('authenticated', 'rc2_internal', 'USAGE')
     OR has_schema_privilege('anon', 'rc2_internal', 'USAGE') THEN
    problems := problems || 'API com acesso ao schema rc2_internal';
  END IF;

  -- Função SECURITY DEFINER do histórico: dono, definer, search_path e capacidade
  -- de executar auth.uid() com o papel EFETIVO da função (o dono). Falha explícita
  -- se algo faltar; a migration NUNCA concede GRANT para contornar.
  SELECT p.proowner INTO v_owner
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'rc2_internal' AND p.proname = 'leads_record_activity';
  IF v_owner IS NULL THEN
    problems := problems || 'rc2_internal.leads_record_activity() não existe';
  ELSE
    IF pg_catalog.pg_get_userbyid(v_owner) <> current_user THEN
      problems := problems || 'o dono da função de atividade difere do executor';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_class c
      WHERE c.oid = 'public.lead_activity'::regclass AND c.relowner = v_owner
        AND NOT c.relforcerowsecurity
    ) THEN
      problems := problems || 'o dono da função não é dono de lead_activity, ou há FORCE RLS (o INSERT do histórico seria barrado)';
    END IF;
    IF has_function_privilege(v_owner, to_regprocedure('auth.uid()')::oid, 'EXECUTE') IS NOT TRUE THEN
      problems := problems || 'o dono da função não pode executar auth.uid()';
    END IF;
    IF has_schema_privilege(v_owner, 'auth', 'USAGE') IS NOT TRUE THEN
      problems := problems || 'o dono da função não tem USAGE no schema auth';
    END IF;
    IF has_schema_privilege(v_owner, 'public', 'USAGE') IS NOT TRUE THEN
      problems := problems || 'o dono da função não tem USAGE no schema public';
    END IF;
    IF has_table_privilege(v_owner, 'public.lead_activity', 'INSERT') IS NOT TRUE THEN
      problems := problems || 'o dono da função não pode inserir em lead_activity';
    END IF;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'rc2_internal' AND p.proname = 'leads_record_activity'
      AND p.prosecdef AND 'search_path=""' = ANY (p.proconfig)
  ) THEN
    problems := problems || 'leads_record_activity() deve ser SECURITY DEFINER com search_path vazio';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'rc2_internal' AND p.proname = 'leads_before_update'
      AND NOT p.prosecdef AND 'search_path=""' = ANY (p.proconfig)
  ) THEN
    problems := problems || 'leads_before_update() deve ser SECURITY INVOKER com search_path vazio';
  END IF;

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'015 ABORTADA — autoverificação falhou (transação revertida):\n - %',
      array_to_string(problems, E'\n - ');
  END IF;
END
$post$;

COMMIT;
