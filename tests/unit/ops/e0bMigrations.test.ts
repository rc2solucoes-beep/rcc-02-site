import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkReadOnlySql } from "../../integration/support/readOnlySql";

// Verificações estáticas e offline das migrations E0b (nada é executado em banco).
// São análise de texto: NÃO substituem a revisão humana nem a validação no ambiente isolado.
const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const strip = (sql: string) => sql.replace(/--[^\n]*/g, "").replace(/'(?:[^']|'')*'/g, "''");

const apply012 = strip(read("supabase/migrations/012_leads_remove_anon_access.sql"));
const apply013 = strip(read("supabase/migrations/013_admin_audit_logs_admin_select.sql"));
const dir012 = "docs/runbooks/migrations/012-leads-remove-anon-access";
const dir013 = "docs/runbooks/migrations/013-admin-audit-logs-admin-select";

describe("migration 012 — remover acesso anon a leads (RF-SEG-01)", () => {
  it("remove a policy anônima e revoga todos os privilégios de anon", () => {
    expect(apply012).toMatch(/DROP POLICY IF EXISTS "leads_anon_insert" ON public\.leads;/);
    expect(apply012).toMatch(/REVOKE ALL ON TABLE public\.leads FROM anon;/);
  });

  it("não concede nada, não cria policy e não altera as policies de admin", () => {
    expect(apply012).not.toMatch(/\bGRANT\b/i);
    expect(apply012).not.toMatch(/CREATE\s+POLICY/i);
    expect(apply012).not.toMatch(/leads_auth_/);
    expect(apply012).not.toMatch(/DISABLE\s+ROW\s+LEVEL/i);
  });

  it("é idempotente (DROP IF EXISTS e REVOKE) e transacional", () => {
    expect(apply012).toMatch(/BEGIN;/);
    expect(apply012).toMatch(/COMMIT;/);
    expect(apply012).not.toMatch(/DROP POLICY (?!IF EXISTS)/i);
  });

  it("o rollback não reabre acesso: sem DDL e sem recriar a policy", () => {
    const rollback = strip(read(`${dir012}/rollback.sql`));
    expect(rollback).not.toMatch(/\b(GRANT|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\b/i);
    expect(rollback).not.toMatch(/WITH\s+CHECK\s*\(\s*true\s*\)/i);
    expect(checkReadOnlySql(read(`${dir012}/rollback.sql`))).toEqual({ ok: true });
  });

  it("preflight e verify passam no lint somente leitura", () => {
    for (const f of ["preflight.sql", "verify.sql"]) {
      expect(checkReadOnlySql(read(join(dir012, f))), f).toEqual({ ok: true });
    }
  });

  it("o README registra o bloqueio PV-20", () => {
    expect(read(`${dir012}/README.md`)).toMatch(/PV-20/);
  });
});

describe("migration 013 — leitura administrativa de admin_audit_logs (RF-SEG-02)", () => {
  it("cria a policy de SELECT só para authenticated, com (select auth.uid())", () => {
    expect(apply013).toMatch(/CREATE POLICY "admin_audit_logs_admin_select"[\s\S]*FOR SELECT[\s\S]*TO authenticated/);
    expect(apply013).toMatch(/\(SELECT auth\.uid\(\)\) IN \(SELECT id FROM public\.admin_users\)/);
    expect(apply013).not.toMatch(/USING\s*\(\s*true\s*\)/i);
  });

  it("revoga a escrita de anon e authenticated e preserva service_role", () => {
    expect(apply013).toMatch(/REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER[\s\S]*FROM anon, authenticated;/);
    expect(apply013).not.toMatch(/\bGRANT\b/i);
    expect(apply013).not.toMatch(/service_role/i);
  });

  it("cria índices só se ausentes e não toca nas tabelas de backup", () => {
    const creates = apply013.match(/CREATE INDEX[^;]*;/gi) ?? [];
    expect(creates).toHaveLength(3);
    for (const stmt of creates) expect(stmt).toMatch(/IF NOT EXISTS/i);
    expect(apply013).not.toMatch(/idx02_links_backup/);
    expect(apply013).not.toMatch(/DROP\s+(TABLE|INDEX)/i);
  });

  it("não cria policy de escrita para ninguém", () => {
    const policies = apply013.match(/CREATE POLICY[\s\S]*?;/gi) ?? [];
    expect(policies).toHaveLength(1);
    expect(apply013).not.toMatch(/FOR\s+(INSERT|UPDATE|DELETE|ALL)/i);
  });

  it("o rollback só remove a policy de SELECT e não restaura privilégios", () => {
    const rollback = strip(read(`${dir013}/rollback.sql`));
    expect(rollback).toMatch(/DROP POLICY IF EXISTS "admin_audit_logs_admin_select"/);
    expect(rollback).not.toMatch(/\b(GRANT|CREATE)\b/i);
  });

  it("preflight e verify passam no lint somente leitura", () => {
    for (const f of ["preflight.sql", "verify.sql"]) {
      expect(checkReadOnlySql(read(join(dir013, f))), f).toEqual({ ok: true });
    }
  });
});

describe("E0b.1 — preflight remoto", () => {
  const dir = "docs/runbooks/migrations/e0b1-preflight-remoto";
  const sql = read(`${dir}/preflight.sql`);

  it("passa no lint somente leitura e usa BEGIN READ ONLY / ROLLBACK", () => {
    expect(checkReadOnlySql(sql)).toEqual({ ok: true });
    expect(sql).toMatch(/BEGIN READ ONLY;/);
    expect(sql.trim()).toMatch(/ROLLBACK;$/);
  });

  it("cobre policies, grants, funções, cron, extensões e índices exigidos", () => {
    for (const needle of [
      "pg_policies",
      "role_table_grants",
      "bootstrap_first_admin",
      "rls_auto_enable",
      "cron.job",
      "pg_extension",
      "pg_cron",
      "pg_net",
      "pgcrypto",
      "pg_indexes",
      "admin_audit_logs",
      "leads",
      "posts",
    ]) {
      expect(sql, needle).toContain(needle);
    }
  });

  it("não é executado por testes: o README registra o estado e mantém PV-20 pendente", () => {
    const readme = read(`${dir}/README.md`);
    expect(readme).toMatch(/Estado:/);
    expect(readme).toMatch(/PV-20 pendente/);
  });
});
