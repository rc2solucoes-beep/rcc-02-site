-- 012 — E0b.2 (RF-SEG-01, DEC-08): remover o acesso do papel anon à tabela public.leads.
--
-- O formulário de contato grava pelo servidor (POST /api/contact, service_role). Nenhum código
-- do repositório insere em leads pela chave anônima (EV-07). Premissa PV-20 (scripts e
-- automações externas) deve ser confirmada pelo dono ANTES de aplicar.
--
-- Idempotente: pode ser executada mais de uma vez sem efeito adicional.
-- As policies de admin (SELECT e UPDATE para authenticated) NÃO são alteradas.
-- Não há rollback que reabra o acesso anon: ver docs/runbooks/migrations/012-leads-remove-anon-access/.

BEGIN;

DROP POLICY IF EXISTS "leads_anon_insert" ON public.leads;

REVOKE ALL ON TABLE public.leads FROM anon;

COMMIT;
