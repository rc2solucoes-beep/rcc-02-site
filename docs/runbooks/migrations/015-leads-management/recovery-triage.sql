-- E2/015 — TRIAGEM DE RECUPERAÇÃO, READ ONLY. NÃO EXECUTADO.
-- Exige autorização de leitura do alvo, como o preflight.
--
-- PARA QUE SERVE: descrever o estado do banco depois de um incidente e BLOQUEAR
-- por padrão qualquer reversão estrutural. Esta triagem NUNCA classifica um
-- rollback como "seguro": o melhor resultado possível é
-- 'DEPENDE_DE_ATESTADOS_EXTERNOS', porque tabelas vazias não provam ausência
-- de uso (um lead excluído leva notas e histórico junto por CASCADE).
--
-- COMO USAR: execute as consultas S1, S1B, S2 e S3 na ordem. Cada uma tem seu
-- veredito. REGRA DE COMPOSIÇÃO:
--   * consulta que falhar, não rodar ou devolver NULL = INDETERMINADO = BLOQUEADO;
--   * S2 e S3 só fazem sentido se S1 = APLICADA_COMPLETA (senão elas erram de
--     propósito, pois referenciam objetos da 015: erro = BLOQUEADO);
--   * qualquer USO_DETECTADO, EVENTOS_E2_DETECTADOS, EXCLUSAO ou ANOMALIA bloqueia
--     o rollback estrutural; nesses casos vale a matriz de export-procedure.md;
--   * mesmo com tudo "sem uso", o rollback estrutural continua BLOQUEADO até que
--     os atestados externos A1..A7 (última consulta) estejam todos comprovados.
-- Nenhuma consulta lê dado pessoal dos leads (só contagens e metadados).
BEGIN READ ONLY;

-- ─── S1: estrutura da 015 (somente catálogo; roda em qualquer estado) ───────
WITH
sinais(sinal_id, observado, esperado_se_completa) AS (
  SELECT 'T1-01-COLUNAS-DA-015-EM-LEADS',
         (SELECT count(*)::int FROM pg_attribute a
          WHERE a.attrelid = to_regclass('public.leads') AND a.attnum > 0 AND NOT a.attisdropped
            AND a.attname IN ('status', 'status_updated_at', 'next_action',
                              'next_action_at', 'archived_at', 'updated_at')), 6
  UNION ALL
  SELECT 'T1-02-TABELAS-LEAD-NOTES-E-LEAD-ACTIVITY',
         (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relkind = 'r'
            AND c.relname IN ('lead_notes', 'lead_activity')), 2
  UNION ALL
  SELECT 'T1-03-SCHEMA-RC2-INTERNAL',
         (SELECT count(*)::int FROM pg_namespace WHERE nspname = 'rc2_internal'), 1
  UNION ALL
  SELECT 'T1-04-FUNCOES-DO-SCHEMA-INTERNO',
         (SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'rc2_internal'), 2
  UNION ALL
  SELECT 'T1-05-TRIGGERS-DA-015-EM-LEADS',
         (SELECT count(*)::int FROM pg_trigger t
          WHERE t.tgrelid = to_regclass('public.leads') AND NOT t.tgisinternal
            AND t.tgname IN ('leads_10_before_update', 'leads_20_set_updated_at', 'leads_30_activity')), 3
  UNION ALL
  SELECT 'T1-06-POLICIES-DA-015',
         (SELECT count(*)::int FROM pg_policies
          WHERE schemaname = 'public'
            AND policyname IN ('leads_e2_admin_select', 'leads_e2_admin_update', 'leads_e2_admin_delete',
                               'lead_notes_e2_admin_select', 'lead_notes_e2_admin_insert',
                               'lead_activity_e2_admin_select')), 6
  UNION ALL
  SELECT 'T1-07-CONSTRAINTS-DA-015',
         -- Cada constraint só conta na tabela a que pertence: o mesmo nome em outra
         -- tabela (ou schema) não pode mascarar a ausência da constraint da 015.
         (SELECT count(*)::int FROM pg_constraint c
          WHERE (c.conrelid = to_regclass('public.leads')::oid
                 AND c.conname IN ('leads_e2_status_check', 'leads_e2_next_action_check'))
             OR (c.conrelid = to_regclass('public.lead_activity')::oid
                 AND c.conname = 'lead_activity_status_values_check')), 3
  UNION ALL
  SELECT 'T1-08-INDICES-DA-015',
         (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
            AND c.relname IN ('leads_e2_active_created_idx', 'leads_e2_status_created_idx',
                              'leads_e2_next_action_idx', 'lead_notes_lead_created_idx',
                              'lead_activity_lead_created_idx')), 5
),
tot AS (
  SELECT sum(observado) AS observado, sum(esperado_se_completa) AS esperado FROM sinais
)
SELECT sinal_id, observado::text AS observado, esperado_se_completa::text AS esperado_ou_nota
FROM sinais
UNION ALL
SELECT 'VEREDITO-ESTRUTURA',
       CASE WHEN tot.observado IS NULL THEN 'INDETERMINADO'
            WHEN tot.observado = 0 THEN 'NAO_APLICADA'
            WHEN tot.observado = tot.esperado THEN 'APLICADA_COMPLETA'
            ELSE 'PARCIAL_OU_DIVERGENTE' END,
       'objetos presentes: ' || coalesce(tot.observado::text, 'NULL') || ' de ' || coalesce(tot.esperado::text, 'NULL')
FROM tot
UNION ALL
SELECT 'ROLLBACK-ESTRUTURAL',
       CASE WHEN tot.observado = 0 THEN 'NAO_APLICAVEL (nada a reverter)'
            WHEN tot.observado = tot.esperado THEN 'BLOQUEADO_ATE_CONCLUIR_S1B_S2_S3_E_ATESTADOS'
            ELSE 'BLOQUEADO (estado parcial ou indeterminado: plano especifico ou restauracao de backup)' END,
       'rode verify.sql para provar a INTEGRIDADE dos objetos; esta triagem so conta presenca'
FROM tot;

-- ─── S1B: anomalias de acesso e de gatilho (somente catálogo) ───────────────
WITH
rl AS (SELECT oid, rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')),
rel AS (
  SELECT c.oid, c.relname, c.relacl
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND c.relname IN ('leads', 'lead_notes', 'lead_activity')
),
tp AS (
  SELECT rl.rolname, rel.relname,
         has_table_privilege(rl.oid, rel.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS qualquer,
         has_table_privilege(rl.oid, rel.oid, 'INSERT,UPDATE,DELETE,TRUNCATE') AS escrita,
         has_any_column_privilege(rl.oid, rel.oid, 'INSERT,UPDATE') AS escrita_coluna
  FROM rl CROSS JOIN rel
),
sinais(sinal_id, observado, regra) AS (
  SELECT 'T1B-01-ANON-COM-PRIVILEGIO-NAS-TABELAS-DE-LEADS',
         (SELECT CASE WHEN count(*) = 0 THEN NULL ELSE (count(*) FILTER (WHERE qualquer))::text END
          FROM tp WHERE rolname = 'anon'),
         'esperado 0; qualquer outro valor e INCIDENTE: NUNCA reabrir anon (DEC-08); tratar a causa'
  UNION ALL
  SELECT 'T1B-02-TRIGGERS-DA-015-DESABILITADOS',
         (SELECT (count(*) FILTER (WHERE t.tgenabled <> 'O'))::text FROM pg_trigger t
          WHERE t.tgrelid = to_regclass('public.leads') AND NOT t.tgisinternal
            AND t.tgname IN ('leads_10_before_update', 'leads_20_set_updated_at', 'leads_30_activity')),
         'esperado 0; trigger desabilitado = escritas sem historico: ANOMALIA'
  UNION ALL
  SELECT 'T1B-03-POLICIES-DE-LEADS-FORA-DO-CONJUNTO-ESPERADO',
         (SELECT coalesce(string_agg(policyname::text, ', ' ORDER BY policyname), '(nenhum)')
          FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'leads'
            AND policyname NOT IN ('leads_e2_admin_select', 'leads_e2_admin_update', 'leads_e2_admin_delete')
            -- Nomes legados só são aceitos ANTES da 015. Se há qualquer sinal da 015
            -- (tabela, coluna ou policy dela), policy legada remanescente é divergência
            -- (a migration deveria tê-la removido) e pode ser permissiva.
            AND (policyname NOT IN ('Only admins can read leads', 'Only admins can update leads',
                                    'leads_auth_select', 'leads_auth_update')
                 OR to_regclass('public.lead_notes') IS NOT NULL
                 OR to_regclass('public.lead_activity') IS NOT NULL
                 OR EXISTS (SELECT 1 FROM pg_attribute a
                            WHERE a.attrelid = to_regclass('public.leads') AND a.attname = 'archived_at'
                              AND NOT a.attisdropped)
                 OR EXISTS (SELECT 1 FROM pg_policies q
                            WHERE q.schemaname = 'public'
                              AND q.policyname IN ('leads_e2_admin_select', 'leads_e2_admin_update',
                                                   'leads_e2_admin_delete')))),
         'esperado (nenhum); policy desconhecida, ou legada após a 015, pode ser permissiva: ANOMALIA'
  UNION ALL
  SELECT 'T1B-04-AUTHENTICATED-COM-ESCRITA-NAS-TABELAS-DA-015',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE coalesce(string_agg(relname::text, ', ' ORDER BY relname)
                                    FILTER (WHERE escrita OR escrita_coluna), '(nenhuma)') END
          FROM tp WHERE rolname = 'authenticated'),
         'informativo: (nenhuma) = contencao aplicada; tabelas listadas ainda aceitam escrita da API'
  UNION ALL
  SELECT 'T1B-05-ENTRADAS-DE-ACL-CONCEDIDAS-A-PUBLIC',
         (SELECT count(*)::text FROM rel, aclexplode(rel.relacl) AS x WHERE x.grantee = 0),
         'esperado 0; PUBLIC com ACL abre acesso indireto a anon: ANOMALIA'
)
SELECT sinal_id, observado,
       CASE WHEN observado IS NULL THEN 'INDETERMINADO'
            WHEN sinal_id LIKE 'T1B-04%' THEN 'INFORMATIVO'
            WHEN observado IN ('0', '(nenhum)') THEN 'OK'
            ELSE 'ANOMALIA' END AS avaliacao,
       regra
FROM sinais;

-- ─── S2: uso real da E2 no banco (exige estrutura completa) ─────────────────
-- Contagens vazias NÃO provam ausência de uso: as estatísticas (n_tup_ins,
-- n_tup_del) acusam linhas que existiram e já foram apagadas, mas são
-- zeradas por reset/crash; por isso só ajudam a acusar uso, nunca a negá-lo.
WITH
sinais(sinal_id, observado, bloqueia) AS (
  SELECT 'T2-01-NOTAS', (SELECT count(*) FROM public.lead_notes), true
  UNION ALL
  SELECT 'T2-02-ATIVIDADES', (SELECT count(*) FROM public.lead_activity), true
  UNION ALL
  SELECT 'T2-03-LEADS-COM-STATUS-DIFERENTE-DE-NEW',
         (SELECT count(*) FROM public.leads WHERE status <> 'new'), true
  UNION ALL
  SELECT 'T2-04-LEADS-COM-PROXIMA-ACAO',
         (SELECT count(*) FROM public.leads WHERE next_action IS NOT NULL OR next_action_at IS NOT NULL), true
  UNION ALL
  SELECT 'T2-05-LEADS-ARQUIVADOS',
         (SELECT count(*) FROM public.leads WHERE archived_at IS NOT NULL), true
  UNION ALL
  SELECT 'T2-06-LEADS-COM-STATUS-UPDATED-AT',
         (SELECT count(*) FROM public.leads WHERE status_updated_at IS NOT NULL), true
  UNION ALL
  SELECT 'T2-07-LEADS-ALTERADOS-APOS-O-BACKFILL',
         (SELECT count(*) FROM public.leads WHERE updated_at <> created_at), true
  UNION ALL
  SELECT 'T2-08-ESTATISTICA-INSERTS-EM-NOTAS-E-ATIVIDADE',
         (SELECT coalesce(sum(n_tup_ins), 0) FROM pg_stat_user_tables
          WHERE schemaname = 'public' AND relname IN ('lead_notes', 'lead_activity')), true
  UNION ALL
  SELECT 'T2-09-ESTATISTICA-DELETES-EM-NOTAS-E-ATIVIDADE',
         (SELECT coalesce(sum(n_tup_del), 0) FROM pg_stat_user_tables
          WHERE schemaname = 'public' AND relname IN ('lead_notes', 'lead_activity')), true
  UNION ALL
  SELECT 'T2-10-ESTATISTICA-DELETES-EM-LEADS (EXCLUSAO DE LEAD)',
         (SELECT coalesce(sum(n_tup_del), 0) FROM pg_stat_user_tables
          WHERE schemaname = 'public' AND relname = 'leads'), true
  UNION ALL
  SELECT 'T2-11-TOTAL-DE-LEADS (comparar com EVD-VOLUME do preflight/verify)',
         (SELECT count(*) FROM public.leads), false
)
SELECT sinal_id, observado::text AS observado, bloqueia AS bloqueia_rollback,
       CASE WHEN observado IS NULL THEN 'INDETERMINADO'
            WHEN bloqueia AND observado > 0 THEN 'USO_OU_EXCLUSAO_DETECTADO'
            ELSE 'OK' END AS avaliacao
FROM sinais
UNION ALL
SELECT 'VEREDITO-USO',
       CASE WHEN count(*) FILTER (WHERE observado IS NULL) > 0 THEN 'INDETERMINADO'
            WHEN count(*) FILTER (WHERE bloqueia AND observado > 0) > 0 THEN 'USO_DETECTADO'
            ELSE 'SEM_USO_DETECTADO_NO_BANCO' END,
       true,
       'SEM_USO_DETECTADO_NO_BANCO NAO significa seguro: depende dos atestados A1..A7'
FROM sinais
UNION ALL
SELECT 'INFO-ESTATISTICAS-DESDE', coalesce(stats_reset::text, '(nunca zeradas ou indisponivel)'), false,
       'estatisticas zeradas depois do apply nao enxergam o que veio antes'
FROM pg_stat_database WHERE datname = current_database();

-- ─── S3: eventos da E2 na auditoria (exige admin_audit_logs) ────────────────
-- Retenção do log não é garantida: ausência de eventos também NÃO prova ausência
-- de uso. Não lê metadata, IDs nem e-mails.
SELECT 'T3-01-EVENTOS-ADMIN-LEAD-NA-AUDITORIA' AS sinal_id,
       (count(*) FILTER (WHERE left(event, 11) = 'admin_lead_' OR resource_type = 'lead'))::text AS observado,
       'esperado 0' AS regra
FROM public.admin_audit_logs
UNION ALL
SELECT 'T3-02-EVENTOS-DE-EXCLUSAO-DE-LEAD',
       (count(*) FILTER (WHERE event IN ('admin_lead_deleted', 'admin_lead_delete_failed')))::text,
       'esperado 0; exclusao leva notas e historico por CASCADE e NAO e revertida por rollback'
FROM public.admin_audit_logs
UNION ALL
SELECT 'T3-03-PRIMEIRO-E-ULTIMO-EVENTO-DE-LEAD',
       coalesce(min(created_at)::text, '(nenhum)') || ' .. ' || coalesce(max(created_at)::text, '(nenhum)'),
       'informativo'
FROM public.admin_audit_logs WHERE left(event, 11) = 'admin_lead_' OR resource_type = 'lead'
UNION ALL
SELECT 'VEREDITO-AUDITORIA',
       CASE WHEN count(*) FILTER (WHERE left(event, 11) = 'admin_lead_' OR resource_type = 'lead') > 0
            THEN 'EVENTOS_E2_DETECTADOS' ELSE 'SEM_EVENTOS_E2_NA_AUDITORIA' END,
       'SEM_EVENTOS nao e prova: a retencao do log nao esta definida'
FROM public.admin_audit_logs;

-- ─── Atestados externos (o banco NÃO consegue provar) ───────────────────────
-- O rollback estrutural só pode ser considerado com TODOS comprovados, por
-- escrito, em evidência versionada (sem PII). 'PENDENTE' é o padrão.
SELECT a.atestado_id, a.exigencia, 'PENDENTE' AS estado
FROM (VALUES
  ('A1', 'Codigo E2 nunca foi implantado em producao nem recebeu trafego (historico de deploys da Vercel e logs de aplicacao)'),
  ('A2', 'Nenhum lead foi excluido desde o apply (auditoria, estatisticas, comparacao com backup anterior e contagem do preflight)'),
  ('A3', 'Nenhuma escrita manual ou por service_role nos campos novos desde o apply (logs de consulta do Supabase)'),
  ('A4', 'Backup integro feito ANTES da reversao e restauracao testada em ambiente isolado'),
  ('A5', 'Snapshot pre-015 (EVD-* e DIGEST-* do preflight) disponivel, assinado e verificavel'),
  ('A6', 'Autorizacao explicita e separada do responsavel para a reversao estrutural'),
  ('A7', 'Escritas da E2 interrompidas (contencao aplicada) e codigo revertido antes de mexer no banco')
) AS a(atestado_id, exigencia);

ROLLBACK;
