-- Verificação pós-aplicação da migration NNN. SOMENTE LEITURA (BEGIN READ ONLY).
BEGIN READ ONLY;

-- 1. (exemplo) O objeto criado existe e tem RLS ativa.
-- Esperado: 1 linha com rowsecurity = true.
SELECT tablename, rowsecurity FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'tabela_nova';

ROLLBACK;
