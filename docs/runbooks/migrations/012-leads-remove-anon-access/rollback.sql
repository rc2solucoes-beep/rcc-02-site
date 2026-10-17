-- Rollback da migration 012: INTENCIONALMENTE INDISPONÍVEL (DEC-08).
--
-- Esta migration REMOVE uma permissão insegura. Este arquivo NÃO recria
-- leads_anon_insert nem qualquer privilégio de escrita para anon, e não executa DDL.
--
-- Contingência segura se algo quebrar depois da aplicação:
--  * Consumidor inesperado: corrija o consumidor para usar a rota do servidor
--    (POST /api/contact, service_role). NÃO reabra anon.
--  * Necessidade excepcional de escrita pública: exige nova decisão registrada e um
--    mecanismo de menor privilégio (por exemplo, função restrita chamada pelo
--    servidor), nunca uma policy WITH CHECK (true).
--  * Auditoria do estado anterior: a saída do preflight está no README, apenas
--    como registro.
--
-- Verificação do estado atual (somente leitura):
BEGIN READ ONLY;

SELECT pg_catalog.has_table_privilege('anon', 'public.leads', 'INSERT') AS anon_ins;

ROLLBACK;
