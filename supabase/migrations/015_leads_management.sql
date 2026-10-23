-- E2 / 015 — Gestão operacional de leads. PROPOSTA NÃO HOMOLOGADA.
-- NÃO EXECUTAR: revisão independente, preflight do alvo, autorização do
-- isolado e testes PV-06/PV-28 são obrigatórios antes de qualquer aplicação.
-- Não altera POST /api/contact; esquema aditivo sobre public.leads.
-- O histórico remoto é manual: NÃO usar db push, pull ou repair.

BEGIN;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Idempotência por nome pressupõe que o preflight compare a DEFINIÇÃO.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.leads'::regclass AND conname = 'leads_e2_status_check'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_e2_status_check
      CHECK (status IN ('new','in_review','contacted','qualified','closed')) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.leads'::regclass AND conname = 'leads_e2_next_action_check'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_e2_next_action_check
      CHECK (next_action IS NULL OR char_length(next_action) <= 280) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.leads VALIDATE CONSTRAINT leads_e2_status_check;
ALTER TABLE public.leads VALIDATE CONSTRAINT leads_e2_next_action_check;

CREATE TABLE IF NOT EXISTS public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_activity (
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
      AND from_value IN ('new','in_review','contacted','qualified','closed')
      AND to_value IN ('new','in_review','contacted','qualified','closed'))
    OR (kind <> 'status_changed' AND from_value IS NULL AND to_value IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS leads_e2_active_created_idx
  ON public.leads (archived_at, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS leads_e2_status_created_idx
  ON public.leads (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS leads_e2_next_action_idx
  ON public.leads (next_action_at ASC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS lead_notes_lead_created_idx
  ON public.lead_notes (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lead_activity_lead_created_idx
  ON public.lead_activity (lead_id, created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activity ENABLE ROW LEVEL SECURITY;

-- A 012 deve ter retirado toda permissão/policy anon no ambiente-alvo.
-- Este DDL também revoga grants, mas NÃO substitui o gate PV-20 da 012.
REVOKE ALL ON TABLE public.leads FROM anon, authenticated;
REVOKE ALL ON TABLE public.lead_notes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.lead_activity FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.leads TO authenticated;
GRANT UPDATE (status, next_action, next_action_at, archived_at)
  ON TABLE public.leads TO authenticated;
GRANT SELECT, INSERT ON TABLE public.lead_notes TO authenticated;
GRANT SELECT ON TABLE public.lead_activity TO authenticated;

DROP POLICY IF EXISTS "Only admins can read leads" ON public.leads;
DROP POLICY IF EXISTS "Only admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "leads_auth_select" ON public.leads;
DROP POLICY IF EXISTS "leads_auth_update" ON public.leads;
DROP POLICY IF EXISTS "leads_e2_admin_select" ON public.leads;
DROP POLICY IF EXISTS "leads_e2_admin_update" ON public.leads;
DROP POLICY IF EXISTS "leads_e2_admin_delete" ON public.leads;

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

DROP POLICY IF EXISTS "lead_notes_e2_admin_select" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_e2_admin_insert" ON public.lead_notes;
CREATE POLICY lead_notes_e2_admin_select ON public.lead_notes
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM public.admin_users));
CREATE POLICY lead_notes_e2_admin_insert ON public.lead_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND (SELECT auth.uid()) IN (SELECT id FROM public.admin_users)
  );

DROP POLICY IF EXISTS "lead_activity_e2_admin_select" ON public.lead_activity;
CREATE POLICY lead_activity_e2_admin_select ON public.lead_activity
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM public.admin_users));

-- Funções de trigger no schema NÃO exposto ao Data API, sem EXECUTE público.
CREATE SCHEMA IF NOT EXISTS rc2_internal;
REVOKE ALL ON SCHEMA rc2_internal FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rc2_internal.leads_before_update()
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

-- O trigger 2 reutiliza public.update_updated_at() SEM alterar a função.
-- PRECONDIÇÃO: conferir nome, assinatura, comportamento e eventual trigger
-- pré-existente em leads no preflight. NUNCA remover triggers desconhecidos.

CREATE OR REPLACE FUNCTION rc2_internal.leads_record_activity()
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

DROP TRIGGER IF EXISTS leads_10_before_update ON public.leads;
CREATE TRIGGER leads_10_before_update
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION rc2_internal.leads_before_update();

DROP TRIGGER IF EXISTS leads_20_set_updated_at ON public.leads;
CREATE TRIGGER leads_20_set_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS leads_30_activity ON public.leads;
CREATE TRIGGER leads_30_activity
AFTER UPDATE ON public.leads
FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION rc2_internal.leads_record_activity();

COMMIT;
