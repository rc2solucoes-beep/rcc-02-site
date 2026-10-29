import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkReadOnlySql } from "../../integration/support/readOnlySql";

// Verificação ESTÁTICA do runbook da migration 018. Nada é executado. O comportamento em Postgres
// (preflight aprova antes e reprova depois, verify aprova depois, rollback limpa) foi exercitado
// à parte no PGlite e será provado no isolado pelo operador.
const root = process.cwd();
const dir = "docs/runbooks/migrations/018-newsletter-core";
const read = (p: string) => readFileSync(resolve(root, p), "utf8").replace(/\r\n/g, "\n");
const noComments = (sql: string) => sql.replace(/--[^\n]*/g, "");

const migration = noComments(read("supabase/migrations/018_newsletter_core.sql"));
const preflight = read(`${dir}/preflight.sql`);
const verify = read(`${dir}/verify.sql`);
const rollback = noComments(read(`${dir}/rollback.sql`));
const readme = read(`${dir}/README.md`);

const declaredChecks = (sql: string) => (noComments(sql).match(/^\s+\(\d+, '[A-Z0-9-]+', /gm) ?? []).length;
const resultCount = (sql: string) => Number(/count\(\*\) = (\d+) AND bool_and\(pass\)/.exec(sql)?.[1]);

describe("runbook da migration 018", () => {
  it("tem README, preflight, verify e rollback", () => {
    for (const f of ["README.md", "preflight.sql", "verify.sql", "rollback.sql"]) {
      expect(existsSync(resolve(root, dir, f)), f).toBe(true);
    }
  });

  it("preflight e verify são READ ONLY (BEGIN READ ONLY … ROLLBACK) e passam no validador do harness", () => {
    for (const sql of [preflight, verify]) {
      expect(sql).toMatch(/^BEGIN READ ONLY;/m);
      expect(sql.trimEnd().endsWith("ROLLBACK;")).toBe(true);
      expect(checkReadOnlySql(sql).ok, "checkReadOnlySql").toBe(true);
    }
  });

  it("o total de checks declarado bate com o número de linhas (sem check silenciosamente ausente)", () => {
    expect(declaredChecks(preflight)).toBe(17);
    expect(resultCount(preflight)).toBe(17);
    expect(declaredChecks(verify)).toBe(40);
    expect(resultCount(verify)).toBe(40);
    expect(readme).toContain("17 checks");
    expect(readme).toContain("40 checks");
  });

  it("preflight cobre: projeto, 017, objetos ausentes, papéis, extensões e compatibilidade", () => {
    for (const id of [
      "PRE-02-ALVO-ESPERADO-MARCADOR-DE-AMBIENTE", "PRE-03-PAPEIS", "PRE-07-MIGRATION-017-TABELA-PRESENTE",
      "PRE-08-MIGRATION-017-FUNCAO-PRESENTE", "PRE-09-MIGRATION-017-JOB-DE-PURGA-PRESENTE", "PRE-10-JOB-PUBLISH-SCHEDULED-POSTS",
      "PRE-11-PG-CRON-HABILITADO", "PRE-12-GEN-RANDOM-UUID", "PRE-13-NENHUMA-TABELA-DA-018", "PRE-14-NENHUMA-FUNCAO",
      "PRE-15-NENHUM-INDICE", "PRE-16-NENHUMA-POLICY", "PRE-06-AUTHENTICATED-LE-ADMIN-USERS",
    ]) expect(preflight, id).toContain(id);
  });

  it("verify cobre: tabelas, constraints, índices, RLS, privilégios, funções, tokens e leads", () => {
    for (const id of [
      "POS-02-CINCO-TABELAS", "POS-CHAVES-PRIMARIAS-5", "POS-FKS-E-REGRAS-DE-EXCLUSAO", "POS-CHECKS-TOTAL", "POS-INDICES-TOTAL",
      "POS-INDICE-PARCIAL-UMA-MENSAGEM-EM-ABERTO", "POS-RLS-LIGADO-EM-TODAS", "POS-POLICIES-SOMENTE-SELECT-ADMIN",
      "POS-ADMIN-NAO-LE-TOKENS-NEM-PAYLOAD", "POS-NENHUMA-FUNCAO-COM-PRIVILEGIOS-DO-DONO", "POS-ANON-AUTHENTICATED-SEM-EXECUTE",
      "POS-PUBLIC-SEM-EXECUTE", "POS-TOKENS-SEM-COLUNA-DE-TOKEN-BRUTO", "POS-TOKEN-BRUTO-SOMENTE-NO-PAYLOAD-TRANSITORIO",
      "POS-SEM-VINCULO-COM-LEADS", "POS-SEM-COLUNA-LEAD", "POS-NENHUM-JOB-NEWSLETTER-AGENDADO", "POS-JOB-DA-011-INTACTO", "POS-JOB-DA-017-INTACTO",
    ]) expect(verify, id).toContain(id);
  });

  it("os números esperados pelo verify batem com a migration (colunas, checks, índices, funções)", () => {
    const tables = [...migration.matchAll(/CREATE TABLE public\.(newsletter_\w+) \(([\s\S]*?)\n\);/g)];
    expect(tables).toHaveLength(5);
    let checks = 0;
    for (const [, name, body] of tables) {
      checks += (body.match(/CONSTRAINT \w+ CHECK/g) ?? []).length;
      const cols = body
        .split("\n")
        .map((l) => /^ {2}([a-z_]+)\s+(uuid|text|integer|boolean|timestamptz)\b/.exec(l)?.[1])
        .filter((c): c is string => Boolean(c))
        .sort((a, b) => (a < b ? -1 : 1))
        .join(",");
      expect(verify, name).toContain(`'${cols}'`);
    }
    expect(verify).toContain(`'${checks}'`); // POS-CHECKS-TOTAL
    const indexes = (migration.match(/CREATE (UNIQUE )?INDEX /g) ?? []).length;
    const implicit = (migration.match(/CONSTRAINT \w+ (PRIMARY KEY|UNIQUE)/g) ?? []).length;
    expect(verify).toContain(`'${indexes + implicit}'`); // POS-INDICES-TOTAL
    expect((migration.match(/CREATE FUNCTION public\.newsletter_/g) ?? []).length).toBe(9);
  });

  it("rollback remove só objetos da 018, na ordem das dependências, sem tocar leads, 011 ou 017", () => {
    const drops = [...rollback.matchAll(/DROP (?:TABLE|FUNCTION) public\.(\w+)/g)].map((m) => m[1]);
    expect(drops).toHaveLength(14);
    for (const name of drops) expect(name).toMatch(/^newsletter_/);
    for (const forbidden of [/leads/i, /lead_notes/i, /lead_activity/i, /rate_limit/i, /cron\./i, /publish-scheduled-posts/, /CASCADE/i]) {
      expect(rollback).not.toMatch(forbidden);
    }
    expect(drops.indexOf("newsletter_outbox_payload")).toBeLessThan(drops.indexOf("newsletter_outbox"));
    expect(drops.indexOf("newsletter_tokens")).toBeLessThan(drops.indexOf("newsletter_outbox"));
    expect(drops.indexOf("newsletter_outbox")).toBeLessThan(drops.indexOf("newsletter_subscribers"));
    expect(drops.at(-1)).toBe("newsletter_touch_updated_at"); // o helper sai depois das tabelas que o usavam
  });

  it("README registra a decisão sobre o guard estrito × idempotência do SDD §18.2, sem alterar o contrato em silêncio", () => {
    expect(readme).toMatch(/Decisão técnica: guard de primeira aplicação estrita × "apply idempotente" \(SDD §18\.2\)/);
    expect(readme).toMatch(/não foi alterado em silêncio/);
    expect(readme).toMatch(/aborta no guard/);
    // Estado após a homologação no isolado (27/10/2026): produção continua NÃO aplicada.
    expect(readme).toMatch(/APLICADA, VERIFICADA E HOMOLOGADA NO ISOLADO/);
    expect(readme).toMatch(/PRODUÇÃO: NÃO APLICADA/);
    expect(readme).toMatch(/NÃO REAPLICAR/);
    expect(readme).toContain("31/31");
  });
});
