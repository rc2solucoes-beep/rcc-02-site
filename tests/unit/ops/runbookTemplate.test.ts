import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkReadOnlySql } from "../../integration/support/readOnlySql";

// CHK-OPS-01 (parcial, automatizado): o template do runbook está completo e
// todo preflight/verify versionado em docs/runbooks/ passa no lint de SQL
// somente leitura. O lint é COMPLEMENTAR: não substitui BEGIN READ ONLY nem a
// revisão humana (ver readOnlySql.ts e migrations-manuais.md).
const runbooks = resolve(process.cwd(), "docs/runbooks");
const template = join(runbooks, "migrations/_template");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe("runbook de migrations manuais (RF-OPS-01)", () => {
  it("o template tem README, preflight, verify e rollback", () => {
    for (const file of ["README.md", "preflight.sql", "verify.sql", "rollback.sql"]) {
      expect(existsSync(join(template, file)), file).toBe(true);
    }
  });

  it("o template de preflight e de verify é somente leitura", () => {
    for (const file of ["preflight.sql", "verify.sql"]) {
      expect(checkReadOnlySql(readFileSync(join(template, file), "utf8")), file).toEqual({ ok: true });
    }
  });

  it("todo preflight*.sql e verify*.sql em docs/runbooks passa no lint", () => {
    const files = walk(runbooks).filter((f) => /[\\/](preflight|verify)[^\\/]*\.sql$/.test(f));
    expect(files.length).toBeGreaterThanOrEqual(2);
    for (const file of files) {
      expect(checkReadOnlySql(readFileSync(file, "utf8")), file).toEqual({ ok: true });
    }
  });
});
