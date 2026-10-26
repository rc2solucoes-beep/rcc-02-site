-- E2/015 — CONTINGÊNCIA, NÃO EXECUTA DROP NEM REVOGA DADOS.
-- Sem autorização de recuperação não desmontar schema que possa conter notas
-- ou histórico de leads. NÃO REABRIR acesso anon (DEC-08).
-- Ordem segura: primeiro reverter código em deployment autorizado; depois
-- preservar/exportar dados e revisar situação real do banco; só então aprovar
-- um SQL de retorno específico para o alvo e a janela.
BEGIN READ ONLY;

SELECT 'E2/015: rollback automático indisponível; requer plano específico e autorização' AS notice;

ROLLBACK;