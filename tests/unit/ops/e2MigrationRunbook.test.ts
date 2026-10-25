import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkReadOnlySql } from "../../integration/support/readOnlySql";

// Verificação estática e offline do runbook da migration 015 (nada é executado
// em banco). Lint por regex: NÃO substitui a transação `BEGIN READ ONLY`, que é
// a garantia real, nem a revisão independente do SQL, nem o preflight no alvo.
const root = process.cwd();
const dir = "docs/runbooks/migrations/015-leads-management";
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const comments = (sql: string) => sql.replace(/--[^\n]*/g, "");
const literals = (sql: string) => comments(sql).replace(/'(?:[^']|'')*'/g, "''");

const preflight = comments(read(join(dir, "preflight.sql")));
const verify = comments(read(join(dir, "verify.sql")));

const idsOf = (sql: string, prefix: "PRE" | "POS") =>
  [...sql.matchAll(new RegExp(`SELECT\\s+'(${prefix}-[A-Z0-9-]+)'`, "g"))].map((m) => m[1]);
const metaOf = (sql: string) => Number(sql.match(/SELECT (\d+) AS expected_checks/)?.[1]);

describe("runbook da migration 015 — arquivos e lint somente leitura", () => {
  it("tem README, preflight, verify, rollback e os artefatos de recuperação", () => {
    for (const f of [
      "README.md", "preflight.sql", "verify.sql", "rollback.sql",
      "recovery-triage.sql", "containment.sql", "rollback-structural.sql", "export-procedure.md",
    ]) {
      expect(existsSync(resolve(root, dir, f)), f).toBe(true);
    }
  });

  it.each(["preflight.sql", "verify.sql", "recovery-triage.sql"])("%s passa no lint somente leitura", (file) => {
    expect(checkReadOnlySql(read(join(dir, file))), file).toEqual({ ok: true });
  });

  it("o lint continua rejeitando escrita e falta de READ ONLY nesses arquivos (controle negativo)", () => {
    for (const file of ["preflight.sql", "verify.sql", "recovery-triage.sql"]) {
      const sql = read(join(dir, file));
      const withWrite = sql.replace(/ROLLBACK;\s*$/, "DELETE FROM public.leads;\nROLLBACK;");
      expect(checkReadOnlySql(withWrite).ok, `${file} + DELETE`).toBe(false);
      const withoutReadOnly = sql.replace(/BEGIN READ ONLY;/, "BEGIN;");
      expect(checkReadOnlySql(withoutReadOnly).ok, `${file} sem READ ONLY`).toBe(false);
    }
  });
});

describe("preflight/verify com asserções (check_id, expected, actual, pass)", () => {
  it("cada check tem id único, com prefixo próprio, e a contagem confere com expected_checks", () => {
    const pre = idsOf(preflight, "PRE");
    const pos = idsOf(verify, "POS");
    expect(new Set(pre).size).toBe(pre.length);
    expect(new Set(pos).size).toBe(pos.length);
    expect(pre.length).toBe(metaOf(preflight));
    expect(pos.length).toBe(metaOf(verify));
    expect(pre.length).toBeGreaterThan(20);
    expect(pos.length).toBeGreaterThan(45);
    expect(idsOf(preflight, "POS")).toHaveLength(0);
    expect(idsOf(verify, "PRE")).toHaveLength(0);
  });

  it.each([["preflight", preflight], ["verify", verify]])(
    "%s consolida o resultado e trata ausência, NULL e leitura fora de READ ONLY como falha",
    (_name, sql) => {
      expect(sql).toMatch(/coalesce\(actual = expected, false\) AS pass/);
      expect(sql).toMatch(/'RESULTADO' AS check_id/);
      expect(sql).toMatch(/THEN 'APROVADO'/);
      expect(sql).toMatch(/'REPROVADO: '/);
      expect(sql).toMatch(/\(SELECT count\(\*\) FROM checks\) = \(SELECT expected_checks FROM meta\)/);
      expect(sql).toMatch(/\(SELECT count\(\*\) FROM checks WHERE NOT pass\) = 0/);
      expect(sql).toMatch(/current_setting\('transaction_read_only'\)/);
      expect(sql).toMatch(/SELECT check_id, expected, actual, pass FROM checks/);
    },
  );

  it("o preflight cobre cada guard da A2 e o gate da 012", () => {
    const required = [
      "PAPEIS-ANON-E-AUTHENTICATED", "AUTH-USERS", "GEN-RANDOM-UUID", "UPDATE-UPDATED-AT",
      "EXECUTOR-E-DONO-DE-LEADS", "COLUNAS-HISTORICAS", "SEM-COLUNAS-DA-015",
      "SEM-LEAD-NOTES-E-LEAD-ACTIVITY", "SEM-SCHEMA-RC2-INTERNAL", "SEM-CONSTRAINTS-DA-015",
      "SEM-INDICES-DA-015", "012-SEM-POLICY-LEADS-ANON-INSERT", "012-NENHUMA-POLICY",
      "SO-POLICIES-CONHECIDAS", "SEM-TRIGGERS-DE-USUARIO", "012-ANON-SEM-PRIVILEGIO-DE-TABELA",
      "012-ANON-SEM-PRIVILEGIO-DE-COLUNA", "SEM-ACL-CONCEDIDA-A-PUBLIC",
      "SEM-VIEWS-OU-REGRAS-DEPENDENTES", "SEM-FK-EXTERNA", "NEM-BYPASSRLS", "ADMIN-USERS",
    ];
    const ids = idsOf(preflight, "PRE").join("\n");
    for (const fragment of required) expect(ids, fragment).toContain(fragment);
  });

  it("o verify cobre estrutura, grants efetivos, policies, triggers, funções e dados", () => {
    const required = [
      "COLUNAS-DE-GESTAO", "ACTIVITY-REJEITA-NULL", "FKS-DE-LEAD-NOTES", "FKS-DE-LEAD-ACTIVITY",
      "CINCO-INDICES", "RLS-LIGADA", "RLS-NAO-FORCADA", "POLICIES-EXATAS-EM-LEADS",
      "POLICIES-EXATAS-EM-LEAD-NOTES", "POLICIES-EXATAS-EM-LEAD-ACTIVITY", "TRIGGER-10",
      "TRIGGER-20", "TRIGGER-30", "SECURITY-DEFINER", "SEARCH-PATH-VAZIO", "UM-UNICO-DONO",
      "CHAMA-AUTH-UID", "SEM-EXECUTE", "SEM-USAGE", "ANON-SEM-PRIVILEGIO-DE-TABELA",
      "ANON-SEM-PRIVILEGIO-DE-COLUNA", "SEM-ACL-CONCEDIDA-A-PUBLIC",
      "AUTHENTICATED-EM-LEADS-SO-SELECT-E-DELETE", "AUTHENTICATED-ATUALIZA-SO-QUATRO-COLUNAS",
      "LEAD-NOTES-SO-SELECT-E-INSERT", "LEAD-ACTIVITY-SO-SELECT", "JANELA", "INVARIANTES-DE-DADOS",
    ];
    const ids = idsOf(verify, "POS").join("\n");
    for (const fragment of required) expect(ids, fragment).toContain(fragment);
  });

  it("preflight e verify exigem estados opostos (nenhum aprova o estado do outro)", () => {
    expect(preflight).toMatch(/SELECT 'PRE-11-SEM-COLUNAS-DA-015', '\(nenhum\)'/);
    expect(preflight).toMatch(/SELECT 'PRE-12-SEM-LEAD-NOTES-E-LEAD-ACTIVITY', 'true'/);
    expect(preflight).toMatch(/SELECT 'PRE-13-SEM-SCHEMA-RC2-INTERNAL', 'true'/);
    expect(preflight).toMatch(/SELECT 'PRE-19-SEM-TRIGGERS-DE-USUARIO-EM-LEADS', '\(nenhum\)'/);
    expect(verify).toMatch(/SELECT 'POS-05-COLUNAS-DE-GESTAO-EM-LEADS', 'archived_at:/);
    expect(verify).toMatch(/SELECT 'POS-04-TRES-TABELAS-DE-LEADS-EXISTEM', '3'/);
    expect(verify).toMatch(/SELECT 'POS-36-FUNCOES-DO-SCHEMA-INTERNO-E-SECURITY-DEFINER', 'leads_before_update:false;leads_record_activity:true'/);
    expect(verify).toMatch(/SELECT 'POS-30-TRES-TRIGGERS-EM-LEADS-HABILITADOS', 'leads_10_before_update:O/);
    // O estado de grants da 012 (anon sem nada) vale nos dois lados.
    expect(preflight).toMatch(/'false',\s*\(SELECT \(p_select OR p_insert/);
    expect(verify).toMatch(/SELECT 'POS-44-ANON-SEM-PRIVILEGIO-DE-TABELA-NAS-TRES-TABELAS', '0'/);
  });

  it("os grants são avaliados de forma efetiva (inclui PUBLIC e herança) por tabela e por coluna", () => {
    for (const sql of [preflight, verify]) {
      expect(sql).toMatch(/has_table_privilege\(rl\.oid, rel\.oid, 'SELECT'\)/);
      expect(sql).toMatch(/has_column_privilege\(rl\.oid, rel\.oid, a\.attnum, 'UPDATE'\)/);
      expect(sql).toMatch(/aclexplode\(rel\.relacl\)/);
      expect(sql).toMatch(/aclexplode\(a\.attacl\)/);
      expect(sql).toMatch(/x\.grantee = 0/);
    }
    expect(verify).toMatch(/aclexplode\(p\.proacl\)/);
    expect(verify).toMatch(/aclexplode\(ns\.nspacl\)/);
  });

  it("o preflight preserva snapshots e digests para a recuperação", () => {
    for (const evidence of ["EVD-ACL-TABELA", "EVD-ACL-COLUNA", "EVD-ACL-PADRAO", "EVD-ACL-SCHEMA",
      "EVD-POLICY", "EVD-TRIGGER", "EVD-FUNCAO", "EVD-CONSTRAINT", "EVD-INDICE", "EVD-VOLUME"]) {
      expect(preflight, evidence).toContain(`'${evidence}'`);
    }
    for (const digest of ["DIGEST-ACL", "DIGEST-POLICIES", "DIGEST-TRIGGERS", "DIGEST-FUNCAO", "DIGEST-CONSTRAINTS-E-INDICES"]) {
      expect(preflight, digest).toContain(`'${digest}'`);
    }
    expect(verify).toContain("'EVD-POLICY'");
    expect(verify).toContain("'EVD-VOLUME'");
  });

  it.each([["preflight", preflight], ["verify", verify]])(
    "%s não referencia colunas de dado pessoal dos leads fora de literais",
    (_name, sql) => {
      // `(?<!::)` ignora o TIPO `name` de catálogo (ex.: ARRAY[...]::name[]).
      expect(literals(sql)).not.toMatch(/(?<!::)\b(name|company|email|whatsapp|segment|solution|message|ip_hash|source|size)\b/i);
    },
  );
});

describe("recovery-triage.sql — somente leitura e nunca declara rollback seguro", () => {
  const triage = comments(read(join(dir, "recovery-triage.sql")));

  it("emite vereditos por escopo e bloqueia por padrão", () => {
    for (const verdict of ["NAO_APLICADA", "APLICADA_COMPLETA", "PARCIAL_OU_DIVERGENTE", "INDETERMINADO",
      "USO_DETECTADO", "SEM_USO_DETECTADO_NO_BANCO", "EVENTOS_E2_DETECTADOS", "SEM_EVENTOS_E2_NA_AUDITORIA"]) {
      expect(triage, verdict).toContain(verdict);
    }
    expect(triage).toMatch(/BLOQUEADO/);
    expect(triage).toMatch(/DEPENDE_DE_ATESTADOS|BLOQUEADO_ATE_CONCLUIR/);
  });

  it("não classifica nenhum estado como SEGURO", () => {
    expect(literals(triage)).not.toMatch(/\bseguro\b/i);
    expect(triage).not.toMatch(/'SEGURO[A-Z_ ]*'/);
  });

  it("usa estatísticas e auditoria sem ler PII e lista os atestados externos A1..A7", () => {
    expect(triage).toMatch(/pg_stat_user_tables/);
    expect(triage).toMatch(/admin_audit_logs/);
    expect(literals(triage)).not.toMatch(/(?<!::)\b(name|company|email|whatsapp|segment|solution|message|ip_hash|metadata)\b/i);
    for (const id of ["A1", "A2", "A3", "A4", "A5", "A6", "A7"]) expect(triage).toContain(`('${id}',`);
  });
});

describe("containment.sql e rollback-structural.sql — sem caminho destrutivo acionável por acidente", () => {
  const containment = comments(read(join(dir, "containment.sql")));
  const structural = comments(read(join(dir, "rollback-structural.sql")));
  const original = read(join(dir, "rollback.sql"));

  it("a contenção só revoga escrita de authenticated, nunca concede e termina em ROLLBACK", () => {
    // Sem literais: 'DELETE'/'TRUNCATE' aparecem só dentro de strings de has_table_privilege.
    expect(literals(containment)).not.toMatch(/\bGRANT\b/i);
    expect(literals(containment)).not.toMatch(/\b(DROP|DELETE\s+FROM|TRUNCATE|ALTER\s+TABLE|INSERT\s+INTO|UPDATE\s+public)\b/i);
    const revokes = [...containment.matchAll(/REVOKE[\s\S]*?;/gi)].map((m) => m[0]);
    expect(revokes.length).toBeGreaterThanOrEqual(3);
    for (const statement of revokes) {
      expect(statement).toMatch(/FROM authenticated;/);
      // `PUBLIC` (papel, maiúsculas) ≠ `public.leads` (schema, minúsculas).
      expect(statement).not.toMatch(/\banon\b|\bPUBLIC\b/);
    }
    expect(containment).toMatch(/rc2\.e2_containment_authorized/);
    expect(containment.trimEnd()).toMatch(/ROLLBACK;$/);
    expect(containment).not.toMatch(/^\s*COMMIT;/m);
  });

  it("a contenção aborta se anon tiver acesso, em vez de tentar corrigir", () => {
    expect(containment).toMatch(/has_table_privilege\('anon', 'public\.leads'/);
    expect(containment).toMatch(/INCIDENTE/);
  });

  it("o rollback estrutural é modelo: aborta na 1ª instrução, sem CASCADE, sem anon, termina em ROLLBACK", () => {
    const firstRaise = structural.search(/RAISE EXCEPTION 'MODELO NÃO AUTORIZADO/);
    const firstDrop = structural.search(/\bDROP\b/);
    expect(firstRaise).toBeGreaterThan(-1);
    expect(firstRaise).toBeLessThan(firstDrop);
    expect(structural).not.toMatch(/\bCASCADE\b/i);
    expect(structural).not.toMatch(/\b(GRANT|CREATE POLICY)\b[^;]*\banon\b/i);
    expect(structural).toMatch(/<<RESTAURAR/);
    expect(structural.trimEnd()).toMatch(/ROLLBACK;$/);
    expect(structural).not.toMatch(/^\s*COMMIT;/m);
  });

  it("as precondições do modelo exigem atestados A1..A7 e não aceitam só contagem zerada", () => {
    expect(structural).toMatch(/\['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'\]/);
    expect(structural).toMatch(/pg_stat_user_tables/);
    expect(structural).toMatch(/admin_audit_logs/);
    expect(structural).toMatch(/exclusão de leads/);
  });

  it("rollback.sql segue como marcador de bloqueio, inalterado e sem DDL", () => {
    expect(original).toMatch(/rollback automático indisponível/);
    expect(checkReadOnlySql(original)).toEqual({ ok: true });
    expect(comments(original)).not.toMatch(/\b(DROP|ALTER|GRANT|REVOKE)\b/i);
  });

  it("export-procedure.md registra a matriz, os atestados e a regra de não reabrir anon", () => {
    const doc = read(join(dir, "export-procedure.md"));
    for (const state of ["NAO_APLICADA", "PARCIAL_OU_DIVERGENTE", "ANOMALIA_DE_ACESSO", "USO_DETECTADO",
      "EXCLUSAO_DETECTADA", "INDETERMINADO", "ELEGIVEL_COM_ATESTADOS"]) {
      expect(doc, state).toContain(state);
    }
    expect(doc).toMatch(/Nunca reabrir `anon`/);
    expect(doc).toMatch(/Ausência de notas ou atividade não prova/);
    expect(doc).toMatch(/restauração de backup/i);
    expect(doc).toMatch(/DIGEST/);
  });
});

describe("A4.4 — containment.sql e rollback-structural.sql são modelos protegidos, não autorizados", () => {
  const readme = read(join(dir, "README.md"));
  const doc = read(join(dir, "export-procedure.md"));

  it("os próprios scripts se declaram NÃO AUTORIZADOS para execução", () => {
    for (const file of ["containment.sql", "rollback-structural.sql"]) {
      const head = read(join(dir, file)).split("BEGIN;")[0];
      expect(head, file).toMatch(/NÃO AUTORIZADO/);
      expect(head, file).toMatch(/NÃO EXECUTAR|NÃO EXECUTADO/);
    }
  });

  it("README e export-procedure.md dizem que são modelos protegidos e não autorizados", () => {
    for (const text of [readme, doc]) {
      expect(text).toMatch(/containment\.sql[\s\S]*?Modelo protegido, NÃO autorizado para execução/);
      expect(text).toMatch(/rollback-structural\.sql[\s\S]*?Modelo protegido, NÃO autorizado para execução/);
    }
    expect(readme).toMatch(/não devem ser promovidos a scripts executáveis/);
    expect(doc).toMatch(/modelos protegidos e não estão autorizados para execução/);
    expect(doc).toMatch(/nenhum deve ser transformado em script executável automaticamente/);
  });

  it("nenhum documento do runbook sugere executá-los diretamente", () => {
    for (const text of [readme, doc]) {
      expect(text).not.toMatch(/(execute|rode|aplique)\s+(o\s+)?`?(containment|rollback-structural)\.sql/i);
    }
  });
});

describe("A5 — lock documentado, cenários manuais pendentes e SDD I12", () => {
  const readme = read(join(dir, "README.md"));
  const sdd = read("docs/superpowers/specs/2026-10-13-admin-leads-management-design.md");
  const migration = read("supabase/migrations/015_leads_management.sql");

  it("o README distingue espera, duração, limite total e efeito no /api/contact", () => {
    expect(readme).toMatch(/Tempo máximo de espera para adquirir o lock/);
    expect(readme).toMatch(/Duração do lock depois de adquirido/);
    expect(readme).toMatch(/Tempo limite total da transação/);
    expect(readme).toMatch(/Efeito sobre `\/api\/contact`/);
    // Honestidade: não há limite total, e o statement_timeout é por comando.
    expect(readme).toMatch(/Não existe\.[\s\S]*?por comando/);
    expect(readme).toMatch(/Sem limite próprio/);
    expect(readme).toMatch(/pg_locks/);
    expect(readme).toMatch(/log_lock_waits/);
  });

  it("não atribui ao statement_timeout a proteção contra bloqueio indefinido", () => {
    expect(readme).not.toMatch(/evitam bloquear o `\/api\/contact` indefinidamente/);
  });

  it("a documentação não mudou a estratégia: a migration continua com um único LOCK e os dois SET LOCAL", () => {
    expect(migration.match(/^LOCK TABLE public\.leads IN ACCESS EXCLUSIVE MODE;/gm)).toHaveLength(1);
    expect(migration).toMatch(/SET LOCAL lock_timeout = '5s';/);
    expect(migration).toMatch(/SET LOCAL statement_timeout = '60s';/);
    expect(migration).not.toMatch(/transaction_timeout|idle_in_transaction_session_timeout/);
  });

  it("formaliza os cenários manuais como PENDENTES, sem apresentá-los como aprovados", () => {
    const section = readme.slice(readme.indexOf("## Cenários manuais obrigatórios"), readme.indexOf("## Autorizações"));
    for (const id of ["M-1", "M-2", "M-3", "M-4", "M-5"]) {
      const row = section.split("\n").find((line) => line.startsWith(`| ${id} `));
      expect(row, id).toBeDefined();
      expect(row, id).toMatch(/PENDENTE \|\r?$/);
      expect(row?.split("|").at(-2)?.trim(), id).toBe("PENDENTE"); // só a última coluna diz o estado
    }
    expect(section).toMatch(/NÃO EXECUTADOS/);
    expect(section).toMatch(/Banco descartável separado/);
    expect(section).toMatch(/nunca[\s\S]*?reabrindo acesso `anon`/);
    expect(section).toMatch(/GUARD-012-EXECUCAO[\s\S]*?GUARD-REAPLICACAO/);
  });

  it("os cenários que criam estado inseguro só ocorrem em banco descartável separado", () => {
    const section = readme.slice(readme.indexOf("## Cenários manuais obrigatórios"), readme.indexOf("## Autorizações"));
    for (const id of ["M-1", "M-4", "M-5"]) {
      expect(section.split("\n").find((line) => line.startsWith(`| ${id} `)), id).toMatch(/[Dd]escartável separado/);
    }
  });

  it("o SDD (I12 e §9.3) define archived_at não nulo → não nulo como mudança real", () => {
    const i12 = sdd.split("\n").find((line) => /^\|\s*T-LEAD-I12\s*\|/.test(line)) ?? "";
    expect(i12).toMatch(/atualiza `updated_at`/);
    expect(i12).toMatch(/não altera `status_updated_at`/);
    expect(i12).toMatch(/não gera `archived` nem `restored`/);
    expect(i12).not.toMatch(/`archived_at` não nulo → outro não nulo\)/); // saiu da lista de no-ops
    const cenario = sdd.split("\n").find((line) => line.startsWith("| `archived_at` de um valor não nulo para outro não nulo")) ?? "";
    expect(cenario).toMatch(/\| muda \| não muda \| nenhuma \|/);
    expect(sdd.match(/^\|\s*T-LEAD-I12\s*\|/gm)).toHaveLength(1);
  });
});
