import { describe, expect, it } from "vitest";
import { checkReadOnlySql } from "../../integration/support/readOnlySql";

const wrap = (body: string) => `BEGIN READ ONLY;\n${body}\nROLLBACK;\n`;

describe("checkReadOnlySql (lint complementar de preflight e verify)", () => {
  it("aceita BEGIN READ ONLY, consultas SELECT e ROLLBACK", () => {
    expect(checkReadOnlySql(wrap("SELECT 1;"))).toEqual({ ok: true });
  });

  it("aceita WITH ... SELECT", () => {
    expect(checkReadOnlySql(wrap("WITH t AS (SELECT 1 AS n) SELECT n FROM t;"))).toEqual({ ok: true });
  });

  it("ignora comentários e literais que contenham palavras proibidas", () => {
    const sql = wrap("-- DELETE aqui é só comentário\nSELECT 'DROP TABLE x' AS texto; /* UPDATE */");
    expect(checkReadOnlySql(sql)).toEqual({ ok: true });
  });

  it("rejeita INSERT, UPDATE e DELETE", () => {
    for (const stmt of ["INSERT INTO t VALUES (1);", "UPDATE t SET a = 1;", "DELETE FROM t;"]) {
      expect(checkReadOnlySql(wrap(stmt)).ok).toBe(false);
    }
  });

  it("rejeita DDL e privilégios", () => {
    for (const stmt of [
      "CREATE TABLE t (a int);",
      "ALTER TABLE t ADD COLUMN b int;",
      "DROP POLICY p ON t;",
      "TRUNCATE t;",
      "GRANT SELECT ON t TO anon;",
      "REVOKE ALL ON t FROM anon;",
    ]) {
      expect(checkReadOnlySql(wrap(stmt)).ok).toBe(false);
    }
  });

  it("rejeita arquivo que não começa com BEGIN READ ONLY", () => {
    expect(checkReadOnlySql("SELECT 1;\nROLLBACK;").ok).toBe(false);
  });

  it("rejeita arquivo que não termina com ROLLBACK", () => {
    expect(checkReadOnlySql("BEGIN READ ONLY;\nSELECT 1;").ok).toBe(false);
    expect(checkReadOnlySql("BEGIN READ ONLY;\nSELECT 1;\nCOMMIT;").ok).toBe(false);
  });

  it("rejeita SELECT ... INTO, FOR UPDATE e CTE que escreve", () => {
    expect(checkReadOnlySql(wrap("SELECT a INTO novo FROM t;")).ok).toBe(false);
    expect(checkReadOnlySql(wrap("SELECT a FROM t FOR UPDATE;")).ok).toBe(false);
    expect(checkReadOnlySql(wrap("WITH d AS (DELETE FROM t RETURNING *) SELECT * FROM d;")).ok).toBe(false);
  });

  it("rejeita chamadas de funções com efeito colateral conhecido", () => {
    for (const call of [
      "SELECT cron.schedule('j', '* * * * *', 'select 1');",
      "SELECT set_config('a', 'b', false);",
      "SELECT nextval('s');",
      "SELECT pg_notify('c', 'p');",
      "SELECT net.http_post('https://x');",
    ]) {
      expect(checkReadOnlySql(wrap(call)).ok).toBe(false);
    }
  });

  it("rejeita COMMIT dentro do arquivo", () => {
    expect(checkReadOnlySql(wrap("SELECT 1;\nCOMMIT;")).ok).toBe(false);
  });

  it("rejeita EXPLAIN ANALYZE (executa a consulta), em qualquer forma", () => {
    expect(checkReadOnlySql(wrap("EXPLAIN ANALYZE SELECT 1;")).ok).toBe(false);
    expect(checkReadOnlySql(wrap("EXPLAIN (ANALYZE, BUFFERS) SELECT 1;")).ok).toBe(false);
  });

  it("aceita EXPLAIN simples e função qualificada de pg_catalog", () => {
    expect(checkReadOnlySql(wrap("EXPLAIN SELECT 1;"))).toEqual({ ok: true });
    expect(
      checkReadOnlySql(wrap("SELECT pg_catalog.has_table_privilege('anon', 'public.leads', 'SELECT');")),
    ).toEqual({ ok: true });
  });

  it("rejeita chamada qualificada fora de pg_catalog e information_schema (função do usuário ou extensão)", () => {
    expect(checkReadOnlySql(wrap("SELECT public.minha_funcao();")).ok).toBe(false);
    expect(checkReadOnlySql(wrap("SELECT cron.alter_job(1);")).ok).toBe(false);
  });

  it("rejeita funções com efeito externo ou de disponibilidade", () => {
    for (const call of ["SELECT pg_sleep(60);", "SELECT pg_read_file('/etc/passwd');", "SELECT http_get('https://x');"]) {
      expect(checkReadOnlySql(wrap(call)).ok).toBe(false);
    }
  });
});
