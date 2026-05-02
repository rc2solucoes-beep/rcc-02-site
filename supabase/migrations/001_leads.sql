-- ─────────────────────────────────────────────────────────────────────────────
-- Leads table — captação de leads do formulário de contato
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leads (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL,
  company    TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  whatsapp   TEXT        NOT NULL,
  segment    TEXT        NOT NULL,
  size       TEXT        NOT NULL,
  solution   TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  source     TEXT        NOT NULL DEFAULT 'website',
  ip_hash    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS leads_email_idx        ON public.leads (email);
CREATE INDEX IF NOT EXISTS leads_created_at_idx   ON public.leads (created_at DESC);

-- ─── Row-Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Formulário público pode inserir leads (anon)
CREATE POLICY "leads_anon_insert" ON public.leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- Admin autenticado pode ler todos os leads
CREATE POLICY "leads_auth_select" ON public.leads
  FOR SELECT TO authenticated
  USING (true);

-- Admin autenticado pode atualizar leads (ex: marcar como contatado)
CREATE POLICY "leads_auth_update" ON public.leads
  FOR UPDATE TO authenticated
  USING (true);
