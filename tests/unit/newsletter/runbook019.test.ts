import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkReadOnlySql } from "../../integration/support/readOnlySql";

// Verificação ESTÁTICA do runbook da migration 019 (N2). Nada é executado. O comportamento foi
// exercitado à parte no PGlite com stubs de cron/net/vault; a prova real é o LC-01.
const root = process.cwd();
const dir = "docs/runbooks/migrations/019-newsletter-dispatch";
const read = (p: string) => readFileSync(resolve(root, p), "utf8").replace(/\r\n/g, "\n");
const noComments = (sql: string) => sql.replace(/--[^\n]*/g, "");

const migration = read("supabase/migrations/019_newsletter_dispatch_jobs.sql");
const code = noComments(migration);
const preflight = read(`${dir}/preflight.sql`);
const verify = read(`${dir}/verify.sql`);
const rollback = noComments(read(`${dir}/rollback.sql`));
const readme = read(`${dir}/README.md`);
const declared = (sql: string) => (noComments(sql).match(/^\s+\(\d+, '[A-Z0-9-]+', /gm) ?? []).length;
const total = (sql: string) => Number(/count\(\*\) = (\d+) AND bool_and\(pass\)/.exec(sql)?.[1]);

describe("migration 019 — proposta N2", () => {
  it("é a próxima migration, não repete numeração e está marcada como NÃO aplicada", () => {
    expect(existsSync(resolve(root, "supabase/migrations/018_newsletter_core.sql"))).toBe(true);
    expect(existsSync(resolve(root, "supabase/migrations/020_newsletter_dispatch_jobs.sql"))).toBe(false);
    expect(migration).toMatch(/PROPOSTA NÃO APLICADA/);
    expect(readme).toMatch(/NÃO APLICADA EM NENHUM AMBIENTE/);
    expect(readme).toMatch(/NENHUMA EXTENSÃO FOI INSTALADA/);
  });

  it("em transação, com guard ANTES de agendar e autoverificação ANTES do COMMIT", () => {
    expect(code.indexOf("BEGIN;")).toBeLessThan(code.indexOf("$guard$"));
    expect(code.indexOf("$guard$")).toBeLessThan(code.indexOf("cron.schedule("));
    expect(code.lastIndexOf("$selfcheck$")).toBeLessThan(code.lastIndexOf("COMMIT;"));
    expect(code.indexOf("cron.schedule(")).toBeLessThan(code.indexOf("$selfcheck$"));
  });

  it("exige 018, pg_cron, pg_net, Vault, os segredos e a ausência dos jobs; NÃO instala nem escreve segredos", () => {
    for (const needle of ["public.newsletter_outbox", "newsletter_outbox_expire()", "newsletter_outbox_claim", "'pg_cron'", "'pg_net'", "'supabase_vault'",
      "newsletter_dispatch_url", "newsletter_dispatch_secret", "publish-scheduled-posts", "purge-rate-limit-counters", "newsletter-dispatch", "newsletter-maintenance"]) {
      expect(code, needle).toContain(needle);
    }
    for (const forbidden of [/CREATE\s+EXTENSION/i, /vault\.create_secret/i, /INSERT\s+INTO\s+vault\./i, /UPDATE\s+vault\./i, /cron\.unschedule/i, /\bDROP\s/i, /\bALTER\s/i, /CREATE\s+(TABLE|FUNCTION)/i]) {
      expect(code, String(forbidden)).not.toMatch(forbidden);
    }
    expect(code.match(/cron\.schedule\(/g)).toHaveLength(2);
  });

  it("jobs: dispatch a cada minuto e manutenção a cada 5 min; URL e segredo lidos do Vault; timeout 125 s", () => {
    expect(code).toMatch(/cron\.schedule\(\s*'newsletter-dispatch',\s*'\* \* \* \* \*'/);
    expect(code).toMatch(/cron\.schedule\(\s*'newsletter-maintenance',\s*'\*\/5 \* \* \* \*'/);
    expect(code).toContain("net.http_post(");
    expect(code).toMatch(/url := \(SELECT decrypted_secret FROM vault\.decrypted_secrets WHERE name = 'newsletter_dispatch_url'\)/);
    expect(code).toMatch(/'Bearer ' \|\| \(SELECT decrypted_secret FROM vault\.decrypted_secrets WHERE name = 'newsletter_dispatch_secret'\)/);
    expect(code).toContain("timeout_milliseconds := 125000");
    expect(code).toContain("SELECT public.newsletter_outbox_expire()");
  });

  it("bypass opcional: vem do Vault, vai em cabeçalho (nunca na URL) e nunca é literal", () => {
    expect(code).toMatch(/jsonb_build_object\('x-vercel-protection-bypass', decrypted_secret\) FROM vault\.decrypted_secrets WHERE name = 'newsletter_dispatch_bypass'/);
    expect(code).not.toMatch(/\?[^'\n]*(bypass|token|secret)=/i); // nada de segredo na query
    expect(code).not.toMatch(/Bearer [A-Za-z0-9_-]{16,}/);
    expect(code).not.toMatch(/x-vercel-protection-bypass'\s*,\s*'[A-Za-z0-9]{16,}/);
  });

  it("não cria jobs de purga nem funções administrativas e preserva as migrations anteriores", () => {
    expect(code).not.toMatch(/purge-newsletter|newsletter_admin_|newsletter_ops/);
    expect(code).toContain("jobname = 'publish-scheduled-posts' AND schedule = '*/5 * * * *'");
    expect(code).toContain("jobname = 'purge-rate-limit-counters' AND schedule = '17 * * * *'");
  });
});

describe("runbook da 019", () => {
  it("tem README, preflight, verify e rollback", () => {
    for (const f of ["README.md", "preflight.sql", "verify.sql", "rollback.sql"]) expect(existsSync(resolve(root, dir, f)), f).toBe(true);
  });

  it("preflight e verify são READ ONLY e passam no validador do harness", () => {
    for (const sql of [preflight, verify]) {
      expect(sql).toMatch(/^BEGIN READ ONLY;/m);
      expect(sql.trimEnd().endsWith("ROLLBACK;")).toBe(true);
      expect(checkReadOnlySql(sql).ok, "checkReadOnlySql").toBe(true);
    }
  });

  it("o total de checks declarado bate com as linhas (16 e 16) e com o README", () => {
    expect(declared(preflight)).toBe(16);
    expect(total(preflight)).toBe(16);
    expect(declared(verify)).toBe(16);
    expect(total(verify)).toBe(16);
    expect(readme.match(/\*\*16 checks\*\*/g)).toHaveLength(2);
  });

  it("o preflight reprova de propósito sem pg_net/Vault/segredos e nunca lê o VALOR de um segredo", () => {
    for (const id of ["PRE-05-MIGRATION-018", "PRE-09-PG-NET-INSTALADO", "PRE-10-VAULT-INSTALADO", "PRE-12-SEGREDOS-DO-VAULT-CRIADOS-SO-OS-NOMES",
      "PRE-13-JOB-PUBLISH-SCHEDULED-POSTS-DA-011", "PRE-14-JOB-PURGE-RATE-LIMIT-COUNTERS-DA-017", "PRE-15-NENHUM-JOB-NEWSLETTER-AGENDADO", "PRE-15B-NET-SEM-ACESSO"]) {
      expect(preflight, id).toContain(id);
    }
    // Mencionar a view (to_regclass) é permitido; ler a coluna do valor ou consultar a view, não.
    for (const sql of [preflight, verify]) {
      expect(noComments(sql)).not.toMatch(/decrypted_secret/);
      expect(noComments(sql)).not.toMatch(/FROM\s+vault\.decrypted_secrets/i);
    }
    // As consultas a relações que podem não existir são tolerantes (não dão erro de parse).
    expect(preflight).toContain("query_to_xml");
  });

  it("o verify cobre jobs, comando sem credencial literal, timeout, preservação e acesso ao pg_net", () => {
    for (const id of ["POS-02-DISPATCH-AGENDADO-A-CADA-MINUTO", "POS-03-MANUTENCAO-AGENDADA", "POS-05-DISPATCH-USA-NET-HTTP-POST-E-VAULT",
      "POS-06-DISPATCH-TIMEOUT-125000", "POS-07-DISPATCH-SEM-CREDENCIAL-LITERAL", "POS-09-EXATAMENTE-2-JOBS-NEWSLETTER", "POS-10-JOB-DA-011-INTACTO",
      "POS-11-JOB-DA-017-INTACTO", "POS-12-MIGRATION-018-INTACTA", "POS-13B-DISPATCH-BYPASS-OPCIONAL", "POS-13C-NET-SEM-ACESSO"]) {
      expect(verify, id).toContain(id);
    }
  });

  it("rollback desagenda só os dois jobs, sem tocar no Vault, em extensões, tabelas ou jobs 011/017", () => {
    expect([...rollback.matchAll(/cron\.unschedule\('([^']+)'\)/g)].map((m) => m[1])).toEqual(["newsletter-dispatch", "newsletter-maintenance"]);
    for (const forbidden of [/vault\./i, /DROP\s/i, /EXTENSION/i, /publish-scheduled/, /purge-rate-limit/, /DELETE\s/i]) expect(rollback).not.toMatch(forbidden);
    expect(read(`${dir}/rollback.sql`)).toMatch(/PROIBIDO enquanto houver `unsubscribe_link`/);
  });

  it("README: estado real da infraestrutura, análise do Preview protegido e etapas do LC-01", () => {
    expect(readme).toMatch(/`pg_cron`\s*\| \*\*instalado\*\*/);
    expect(readme).toMatch(/`pg_net`\s*\| \*\*disponível, NÃO instalado\*\*/);
    expect(readme).toMatch(/all_except_custom_domains/);
    expect(readme).toMatch(/Protection Bypass for Automation/);
    expect(readme).toMatch(/Cabeçalho HTTP, nunca token na URL/);
    expect(readme).toMatch(/Desativar o SSO do projeto[\s\S]*Descartada/);
    expect(readme).toMatch(/A\. Processador em processo/);
    expect(readme).toMatch(/B\. Salto/);
    expect(readme).toMatch(/proibida em Production|PROIBIDA em Production|proibida em Production/i);
    expect(readme).not.toMatch(/ESTADO: (APLICADA|HOMOLOGADA)/);
  });
});
