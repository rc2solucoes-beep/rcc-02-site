-- Preflight da migration NNN. SOMENTE LEITURA.
-- A garantia de somente leitura é a transação BEGIN READ ONLY abaixo. O lint
-- automático é complementar e não substitui a revisão humana.
-- Confirma o estado esperado ANTES de aplicar. Se qualquer resultado divergir
-- do esperado descrito nos comentários, NÃO aplique.
BEGIN READ ONLY;

-- 1. (exemplo) O objeto que a migration cria ainda não existe.
-- Esperado: 0 linhas.
SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'tabela_nova';

ROLLBACK;
