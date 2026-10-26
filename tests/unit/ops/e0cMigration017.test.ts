import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkReadOnlySql } from "../../integration/support/readOnlySql";

// Verificação ESTÁTICA da migration 017 (rate limit atômico, E0c), do runbook e da camada de
// aplicação. Nada é executado e nenhum banco é acessado. Não substitui preflight/verify no alvo.
// O comportamento em Postgres foi exercitado à parte (PGlite) e será provado no isolado pelo
// teste de integração tests/integration/rls/e0c-rate-limit.test.ts.
const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const eol = (text: string) => text.replace(/\r\n/g, "\n");
const noComments = (sql: string) => sql.replace(/--[^\n]*/g, "");
const dir = "docs/runbooks/migrations/017-rate-limit-counters";

const sql = eol(read("supabase/migrations/017_rate_limit_counters.sql"));
const code = noComments(sql);
// Corpos entre dólares (guard, função, job, autoverificação) são removidos para ler só as instruções de topo.
const topLevel = code
  .replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, () => "$$")
  .split(";")
  .map((statement) => statement.replace(/\s+/g, " ").trim())
  .filter(Boolean);

describe("migration 017 — contadores de rate limit", () => {
  it("é a próxima migration e não repete numeração", () => {
    expect(existsSync(resolve(root, "supabase/migrations/016_leads_disable_delete.sql"))).toBe(true);
    expect(existsSync(resolve(root, "supabase/migrations/017_rate_limit_counters.sql"))).toBe(true);
    expect(existsSync(resolve(root, "supabase/migrations/018_rate_limit_counters.sql"))).toBe(false);
  });

  it("as instruções de topo criam só os objetos previstos, em transação", () => {
    expect(topLevel.map((statement) => statement.split(" ").slice(0, 3).join(" "))).toEqual([
      "BEGIN",
      "SET LOCAL lock_timeout",
      "SET LOCAL statement_timeout",
      "DO $$",
      "CREATE TABLE public.rate_limit_counters",
      "COMMENT ON TABLE",
      "CREATE INDEX rate_limit_counters_window_start_idx",
      "ALTER TABLE public.rate_limit_counters",
      "REVOKE ALL ON",
      "GRANT SELECT, INSERT,",
      "CREATE FUNCTION public.rate_limit_hit(p_key",
      "COMMENT ON FUNCTION",
      "REVOKE ALL ON",
      "GRANT EXECUTE ON",
      "SELECT cron.schedule( 'purge-rate-limit-counters',",
      "DO $$",
      "COMMIT",
    ]);
  });

  it("não toca leads, notas, atividade, policies nem o job da 011", () => {
    for (const forbidden of [/public\.leads/i, /lead_notes/i, /lead_activity/i, /CREATE\s+POLICY/i, /DROP\s+POLICY/i, /publish-scheduled-posts/, /\bTRUNCATE\s+(TABLE\s+)?\w/i, /\bDROP\s+(TABLE|FUNCTION)/i]) {
      expect(code).not.toMatch(forbidden);
    }
    // Primeira aplicação estrita: nenhum DDL de topo usa IF NOT EXISTS (o do guard é plpgsql).
    expect(topLevel.join(";")).not.toMatch(/\bIF\s+NOT\s+EXISTS\b/i);
  });

  it("tabela: chave primária composta, RLS ligado, sem policies, sem acesso de anon/authenticated", () => {
    expect(code).toMatch(/PRIMARY KEY \(key, window_start\)/);
    expect(code).toMatch(/count\s+integer\s+NOT NULL/);
    expect(code).toMatch(/ALTER TABLE public\.rate_limit_counters ENABLE ROW LEVEL SECURITY/);
    expect(code).toMatch(/REVOKE ALL ON TABLE public\.rate_limit_counters FROM PUBLIC, anon, authenticated/);
    expect(code).toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.rate_limit_counters TO service_role/);
    expect(code).not.toMatch(/GRANT[^;]*rate_limit_counters[^;]*\b(anon|authenticated|PUBLIC)\b/i);
    expect(code).not.toMatch(/FORCE ROW LEVEL SECURITY/i);
  });

  it("função: incremento atômico, SECURITY INVOKER, search_path fixo, validação de parâmetros", () => {
    expect(code).toMatch(/INSERT INTO public\.rate_limit_counters AS c \(key, window_start, count\)/);
    expect(code).toMatch(/ON CONFLICT \(key, window_start\) DO UPDATE SET count = least\(c\.count, 2147483646\) \+ 1/);
    expect(code).toMatch(/RETURNING c\.count INTO v_count/);
    const header = code.slice(code.indexOf("CREATE FUNCTION"), code.indexOf("AS $fn$"));
    expect(header).toMatch(/SECURITY INVOKER/);
    expect(header).not.toMatch(/SECURITY DEFINER/i);
    expect(code).toMatch(/SET search_path = pg_catalog, public/);
    expect(code).toMatch(/RETURNS TABLE \(allowed boolean, count integer, reset_at timestamptz\)/);
    expect(code).toMatch(/v_count <= p_limit/);
    for (const check of [/p_key IS NULL OR char_length\(p_key\) NOT BETWEEN 1 AND 200/, /p_limit NOT BETWEEN 1 AND 10000/, /p_window_seconds NOT BETWEEN 1 AND 86400/]) {
      expect(code).toMatch(check);
    }
    // Não há SELECT-then-INSERT (corrida): o único acesso à tabela é o upsert.
    expect(code.match(/FROM public\.rate_limit_counters/g) ?? []).toHaveLength(1); // só o job de purga
  });

  it("EXECUTE: revogado de PUBLIC, anon e authenticated; concedido só a service_role", () => {
    expect(code).toMatch(/REVOKE ALL ON FUNCTION public\.rate_limit_hit\(text, integer, integer\) FROM PUBLIC, anon, authenticated/);
    const grants = [...code.matchAll(/GRANT EXECUTE ON FUNCTION[^;]*;/g)].map((m) => m[0]);
    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatch(/TO service_role;$/);
    expect(grants[0]).not.toMatch(/\b(anon|authenticated)\b|\bPUBLIC\b/);
    const revokeAt = code.indexOf("REVOKE ALL ON FUNCTION");
    expect(revokeAt).toBeGreaterThan(code.indexOf("CREATE FUNCTION"));
    expect(revokeAt).toBeLessThan(code.indexOf("GRANT EXECUTE"));
  });

  it("retenção: job pg_cron horário que remove window_start com mais de 2 dias", () => {
    expect(code).toMatch(/cron\.schedule\(\s*'purge-rate-limit-counters',\s*'17 \* \* \* \*'/);
    expect(code).toMatch(/DELETE FROM public\.rate_limit_counters WHERE window_start < now\(\) - interval '2 days'/);
  });

  it("tem guard (objetos ausentes, papéis, pg_cron) e autoverificação ANTES do COMMIT", () => {
    expect(sql).toMatch(/\$guard\$/);
    expect(sql).toMatch(/\$selfcheck\$/);
    expect(code.indexOf("$guard$")).toBeLessThan(code.indexOf("CREATE TABLE"));
    expect(code.indexOf("$selfcheck$")).toBeGreaterThan(code.indexOf("cron.schedule"));
    expect(code.lastIndexOf("$selfcheck$")).toBeLessThan(code.indexOf("COMMIT"));
    for (const needle of ["pg_cron", "service_role", "rate_limit_hit(text,integer,integer)", "purge-rate-limit-counters"]) {
      expect(sql.slice(0, sql.indexOf("$guard$", sql.indexOf("$guard$") + 1))).toContain(needle);
    }
  });

  it("o guard monta a lista de problemas com array_append (|| com literal falha em runtime)", () => {
    expect(code).not.toMatch(/problems\s*:=\s*problems\s*\|\|/);
    expect(code).toMatch(/array_append\(problems,/);
  });
});

describe("runbook da 017", () => {
  it("tem README, preflight, verify e rollback", () => {
    for (const file of ["README.md", "preflight.sql", "verify.sql", "rollback.sql"]) expect(existsSync(resolve(root, dir, file)), file).toBe(true);
  });

  it("preflight e verify passam no lint de somente leitura e terminam em RESULTADO", () => {
    for (const file of ["preflight.sql", "verify.sql"]) {
      const text = read(`${dir}/${file}`);
      expect(checkReadOnlySql(text), file).toEqual({ ok: true });
      expect(text).toMatch(/'RESULTADO', 'APROVADO'/);
    }
  });

  it("o verify cobre RLS, ausência de policies, privilégios e EXECUTE por papel, SECURITY INVOKER e o job", () => {
    const text = read(`${dir}/verify.sql`);
    for (const needle of ["RLS-LIGADO", "SEM-POLICIES", "ANON-SEM-PRIVILEGIOS", "AUTHENTICATED-SEM-PRIVILEGIOS", "SECURITY-INVOKER", "SEARCH-PATH-FIXO", "ANON-SEM-EXECUTE", "AUTHENTICATED-SEM-EXECUTE", "SERVICE-ROLE-COM-EXECUTE", "PUBLIC-SEM-EXECUTE", "JOB-DE-PURGA-AGENDADO", "JOB-DA-011-INTACTO"]) {
      expect(text, needle).toContain(needle);
    }
    expect(text).toMatch(/count\(\*\) = 23/); // 23 checks: um check removido reprova
  });

  it("o rollback remove job, função e tabela e avisa a ordem com o código", () => {
    const text = read(`${dir}/rollback.sql`);
    expect(text).toMatch(/cron\.unschedule\('purge-rate-limit-counters'\)/);
    expect(text).toMatch(/DROP FUNCTION public\.rate_limit_hit\(text, integer, integer\)/);
    expect(text).toMatch(/DROP TABLE public\.rate_limit_counters/);
    expect(noComments(text)).not.toMatch(/public\.leads/);
    expect(text).toMatch(/reverter\/desfazer o deploy do CÓDIGO/);
  });

  it("o README declara NÃO APLICADA, a variável nova e a ordem migration antes do código", () => {
    const text = read(`${dir}/README.md`);
    expect(text).toMatch(/NÃO APLICADA EM NENHUM AMBIENTE/);
    expect(text).toMatch(/RATE_LIMIT_PEPPER/);
    expect(text).toMatch(/A migration vem \*\*antes\*\* do código/);
  });
});

describe("aplicação — E0c", () => {
  it("a rota de contato usa rate_limit_hit e não consulta mais leads para limitar", () => {
    const route = eol(read("src/app/api/contact/route.ts"));
    expect(route).toMatch(/checkContactRateLimit/);
    expect(route).not.toMatch(/\.from\("leads"\)\s*\.select/);
    expect(route).not.toMatch(/ip_hash\.eq/);
    // Turnstile e helper de IP da E0b.4 preservados.
    expect(route).toMatch(/verifyTurnstile\(turnstileToken, \{ ip \}\)/);
    expect(route).toMatch(/getClientIp\(req\.headers/);
  });

  it(".env.example documenta RATE_LIMIT_PEPPER sem valor", () => {
    const example = eol(read(".env.example"));
    expect(example).toMatch(/^RATE_LIMIT_PEPPER=$/m);
  });
});
