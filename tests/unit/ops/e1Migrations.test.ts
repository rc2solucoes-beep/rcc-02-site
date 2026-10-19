import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkReadOnlySql } from "../../integration/support/readOnlySql";

// Verificações estáticas e offline da migration 014 (nada é executado em banco).
// São análise de texto: NÃO substituem a revisão humana nem a validação no ambiente isolado.
const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const strip = (sql: string) => sql.replace(/--[^\n]*/g, "").replace(/'(?:[^']|'')*'/g, "''");

const dir = "docs/runbooks/migrations/014-posts-sort-at";
const noComments = (sql: string) => sql.replace(/--[^\n]*/g, "");
const apply = strip(read("supabase/migrations/014_posts_sort_at.sql"));
const applyWithLiterals = noComments(read("supabase/migrations/014_posts_sort_at.sql"));

describe("migration 014 — posts.sort_at (RF-CMS-04, RF-CMS-05)", () => {
  it("declara a coluna GENERATED ALWAYS STORED NOT NULL com a tabela de verdade do SDD", () => {
    expect(apply).toMatch(/ADD COLUMN IF NOT EXISTS sort_at timestamptz/);
    expect(apply).toMatch(/GENERATED ALWAYS AS/);
    expect(apply).toMatch(/\)\s*STORED\s+NOT NULL/);
    expect(applyWithLiterals).toMatch(/WHEN 'published' THEN coalesce\(published_at, created_at\)/);
    expect(applyWithLiterals).toMatch(/WHEN 'scheduled' THEN coalesce\(scheduled_publish_at, updated_at\)/);
    expect(apply).toMatch(/ELSE updated_at/);
  });

  it("cria o índice (sort_at DESC, id DESC) de forma idempotente", () => {
    expect(apply).toMatch(/CREATE INDEX IF NOT EXISTS posts_sort_at_id_idx\s+ON public\.posts \(sort_at DESC, id DESC\)/);
  });

  it("é transacional, com lock_timeout, e não toca em dados, policies, grants nem no cron", () => {
    expect(apply).toMatch(/BEGIN;/);
    expect(apply).toMatch(/COMMIT;/);
    expect(apply).toMatch(/SET LOCAL lock_timeout/);
    expect(apply).not.toMatch(/\b(INSERT|UPDATE|DELETE|TRUNCATE)\b/i);
    expect(apply).not.toMatch(/\b(GRANT|REVOKE)\b/i);
    expect(apply).not.toMatch(/POLICY/i);
    expect(apply).not.toMatch(/\bcron\./i);
    expect(apply).not.toMatch(/DROP\s/i);
  });

  it("tem README, preflight, verify e rollback", () => {
    for (const f of ["README.md", "preflight.sql", "verify.sql", "rollback.sql"]) {
      expect(existsSync(resolve(root, dir, f)), f).toBe(true);
    }
  });

  it("preflight e verify passam no lint somente leitura", () => {
    for (const f of ["preflight.sql", "verify.sql"]) {
      expect(checkReadOnlySql(read(join(dir, f))), f).toEqual({ ok: true });
    }
  });

  it("o verify confere geração, nulos, divergência da tabela de verdade, índice e cron", () => {
    const verify = read(join(dir, "verify.sql"));
    expect(verify).toMatch(/attgenerated/);
    expect(verify).toMatch(/attnotnull/);
    expect(verify).toMatch(/IS DISTINCT FROM/);
    expect(verify).toMatch(/posts_sort_at_id_idx/);
    expect(verify).toMatch(/publish-scheduled-posts/);
  });

  it("o preflight exige ausência prévia, versão do Postgres e contagens da PV-13 sem ler conteúdo", () => {
    const preflight = read(join(dir, "preflight.sql"));
    expect(preflight).toMatch(/server_version_num/);
    expect(preflight).toMatch(/column_name = 'sort_at'/);
    expect(preflight).toMatch(/sem_published_at/);
    expect(preflight).not.toMatch(/\bcontent\b/i);
  });

  it("o rollback remove índice e coluna, nessa ordem, e exige reverter o código antes", () => {
    const raw = read(join(dir, "rollback.sql"));
    const rollback = strip(raw);
    expect(rollback.indexOf("DROP INDEX IF EXISTS public.posts_sort_at_id_idx")).toBeGreaterThan(-1);
    expect(rollback.indexOf("DROP COLUMN IF EXISTS sort_at")).toBeGreaterThan(
      rollback.indexOf("DROP INDEX IF EXISTS public.posts_sort_at_id_idx"),
    );
    expect(raw).toMatch(/DEPLOY DO CÓDIGO/);
    expect(rollback).not.toMatch(/\bDROP TABLE\b/i);
  });

  it("o README declara a migration como não aplicada e registra PV-13 e D2", () => {
    const readme = read(join(dir, "README.md"));
    expect(readme).toMatch(/NÃO APLICADA/);
    expect(readme).toMatch(/PV-13/);
    expect(readme).toMatch(/PV-17/);
    expect(readme).toMatch(/NÃO está autorizado/);
  });

  it("a contingência de RPC existe, é SECURITY INVOKER e não usa LIKE nem SQL dinâmico", () => {
    const rpc = strip(read(join(dir, "contingencia-rpc-busca.sql")));
    expect(rpc).toMatch(/SECURITY INVOKER/);
    expect(rpc).toMatch(/strpos\(/);
    expect(rpc).not.toMatch(/\bILIKE\b|\bLIKE\b/i);
    expect(rpc).not.toMatch(/\bEXECUTE\b/i);
    expect(rpc).not.toMatch(/\bcontent\b/i);
  });
});
