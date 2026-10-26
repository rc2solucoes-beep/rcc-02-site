-- E2/015 — CONTENÇÃO NÃO DESTRUTIVA. NÃO EXECUTADO. NÃO AUTORIZADO PARA EXECUÇÃO.
--
-- O QUE FAZ: retira de `authenticated` as ESCRITAS da E2 (UPDATE das 4 colunas
-- operacionais e DELETE em leads; INSERT em lead_notes). Leituras, dados,
-- policies, triggers, funções e o schema interno permanecem intactos, e o
-- service_role (formulário de contato) não é afetado.
-- O QUE NUNCA FAZ: apagar ou alterar dados; conceder privilégio a qualquer
-- papel; tocar em anon (se anon tiver acesso, o script ABORTA: é incidente de
-- segurança e anon NUNCA é reaberto, DEC-08).
--
-- PROTEÇÕES CONTRA EXECUÇÃO ACIDENTAL (todas precisam ser desfeitas de forma
-- deliberada, por quem tem autorização):
--   1. O script termina em ROLLBACK: por padrão é um ensaio sem efeito. Só
--      efetiva trocando a última linha por COMMIT.
--   2. O 1º bloco aborta se a autorização não for declarada na transação:
--        SET LOCAL rc2.e2_containment_authorized = '<ID-DA-AUTORIZACAO>';
--      (inserir logo depois do BEGIN, só com autorização escrita AUT-CONTAIN).
--   3. Exige ser executado pelo dono de public.leads.
--
-- REVERSÃO DA CONTENÇÃO: não automatizada. Re-conceder SOMENTE a partir do
-- snapshot de ACL (EVD-ACL-* do verify.sql guardado), em script revisado.
-- ORDEM NO INCIDENTE: reverter o código E2 antes de qualquer alteração de banco;
-- depois conter; depois exportar (export-procedure.md); só então decidir.
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $autoriza$
BEGIN
  IF coalesce(current_setting('rc2.e2_containment_authorized', true), '') = '' THEN
    RAISE EXCEPTION 'CONTENÇÃO NÃO AUTORIZADA: declare SET LOCAL rc2.e2_containment_authorized = ''<ID>'' com autorização escrita.';
  END IF;
  IF to_regclass('public.leads') IS NULL OR to_regclass('public.lead_notes') IS NULL
     OR to_regclass('public.lead_activity') IS NULL THEN
    RAISE EXCEPTION 'CONTENÇÃO ABORTADA: as tabelas da 015 não existem; rode recovery-triage.sql.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    WHERE c.oid = 'public.leads'::regclass
      AND pg_catalog.pg_get_userbyid(c.relowner) = current_user
  ) THEN
    RAISE EXCEPTION 'CONTENÇÃO ABORTADA: o executor (%) não é o dono de public.leads.', current_user;
  END IF;
  IF has_table_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_table_privilege('anon', 'public.lead_notes', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_table_privilege('anon', 'public.lead_activity', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_any_column_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,REFERENCES')
     OR has_any_column_privilege('anon', 'public.lead_notes', 'SELECT,INSERT,UPDATE,REFERENCES')
     OR has_any_column_privilege('anon', 'public.lead_activity', 'SELECT,INSERT,UPDATE,REFERENCES') THEN
    RAISE EXCEPTION 'CONTENÇÃO ABORTADA: anon tem privilégio em tabela de leads. Isto é um INCIDENTE de segurança; não reabra nem conceda nada a anon.';
  END IF;
END
$autoriza$;

REVOKE UPDATE (status, next_action, next_action_at, archived_at)
  ON TABLE public.leads FROM authenticated;
REVOKE DELETE ON TABLE public.leads FROM authenticated;
REVOKE INSERT ON TABLE public.lead_notes FROM authenticated;

DO $confere$
BEGIN
  IF has_table_privilege('authenticated', 'public.leads', 'INSERT,UPDATE,DELETE,TRUNCATE')
     OR has_any_column_privilege('authenticated', 'public.leads', 'INSERT,UPDATE')
     OR has_table_privilege('authenticated', 'public.lead_notes', 'INSERT,UPDATE,DELETE,TRUNCATE')
     OR has_any_column_privilege('authenticated', 'public.lead_notes', 'INSERT,UPDATE')
     OR has_table_privilege('authenticated', 'public.lead_activity', 'INSERT,UPDATE,DELETE,TRUNCATE')
     OR has_any_column_privilege('authenticated', 'public.lead_activity', 'INSERT,UPDATE') THEN
    RAISE EXCEPTION 'CONTENÇÃO FALHOU: authenticated ainda tem privilégio de escrita (verifique PUBLIC e papéis herdados).';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.leads', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.lead_notes', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.lead_activity', 'SELECT') THEN
    RAISE EXCEPTION 'CONTENÇÃO FALHOU: a leitura de authenticated foi afetada indevidamente.';
  END IF;
END
$confere$;

-- SEGURANÇA: ensaio por padrão. Efetivar somente com AUT-CONTAIN registrada,
-- trocando a linha abaixo por COMMIT.
ROLLBACK;
