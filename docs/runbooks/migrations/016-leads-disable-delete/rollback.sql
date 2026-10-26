-- E2/016 — CONTINGÊNCIA. NÃO REABRE O DELETE, NÃO CONCEDE NADA.
-- Reabilitar a exclusão definitiva NÃO é um "rollback": exige uma migration NOVA (017),
-- com revisão, preflight/verify próprios e autorização específica por ambiente.
-- Veja README.md (seção "Reabilitação") e recovery.md. NUNCA reabrir acesso anon (DEC-08).
BEGIN READ ONLY;

SELECT 'E2/016: rollback automático indisponível; reabilitar DELETE exige migration 017 autorizada' AS notice;

ROLLBACK;
