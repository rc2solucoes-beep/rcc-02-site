import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// T-NL-U10 (estático: a newsletter não importa leads) e verificação ESTÁTICA da migration 018.
// Nada é executado e nenhum banco é acessado; o comportamento em Postgres foi exercitado à parte
// (PGlite) e ainda precisa ser provado no isolado antes de qualquer uso.
const root = process.cwd();
const read = (p: string) => readFileSync(resolve(root, p), "utf8").replace(/\r\n/g, "\n");
const noComments = (sql: string) => sql.replace(/--[^\n]*/g, "");

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

describe("T-NL-U10 — independência de leads", () => {
  it("módulos de newsletter não importam módulos de leads", () => {
    const files = listFiles(resolve(root, "src/lib/newsletter")).filter((f) => /\.tsx?$/.test(f));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/from\s+["'][^"']*\/leads[^"']*["']/);
      expect(source, file).not.toMatch(/lead_id|public\.leads/);
    }
  });
});

const sql = read("supabase/migrations/018_newsletter_core.sql");
const code = noComments(sql);
const signatureOf = (name: string) => {
  const start = code.indexOf(`CREATE FUNCTION public.${name}(`);
  return code.slice(start, code.indexOf("LANGUAGE plpgsql", start));
};

describe("migration 018 — núcleo da newsletter", () => {
  it("é a próxima migration e não repete numeração", () => {
    expect(existsSync(resolve(root, "supabase/migrations/017_rate_limit_counters.sql"))).toBe(true);
    expect(existsSync(resolve(root, "supabase/migrations/019_newsletter_core.sql"))).toBe(false);
  });

  it("cria as cinco tabelas com RLS, em transação, com guard e autoverificação", () => {
    for (const t of ["newsletter_subscribers", "newsletter_outbox", "newsletter_tokens", "newsletter_outbox_payload", "newsletter_consents"]) {
      expect(code).toMatch(new RegExp(`CREATE TABLE public\\.${t}\\b`));
      expect(code).toMatch(new RegExp(`ALTER TABLE public\\.${t}\\s+ENABLE ROW LEVEL SECURITY`));
    }
    expect(code.indexOf("BEGIN;")).toBeLessThan(code.indexOf("$guard$"));
    expect(code.indexOf("$guard$")).toBeLessThan(code.indexOf("CREATE TABLE"));
    expect(code.lastIndexOf("$selfcheck$")).toBeLessThan(code.lastIndexOf("COMMIT;"));
    expect(code).not.toMatch(/CREATE\s+(TABLE|INDEX|FUNCTION|POLICY|TRIGGER)\s+IF\s+NOT\s+EXISTS/i);
  });

  it("independente de leads e da E2; sem cron, pg_net, Vault, SECURITY DEFINER nem DROP", () => {
    for (const forbidden of [/public\.leads/i, /lead_notes/i, /lead_activity/i, /public\.posts/i, /cron\.schedule/i, /pg_net/i, /vault\./i, /SECURITY DEFINER/i, /\bDROP\s+(TABLE|FUNCTION|POLICY)/i, /\bTRUNCATE\s+(TABLE\s+)?\w/i]) {
      expect(code).not.toMatch(forbidden);
    }
  });

  it("privilégios: REVOKE de PUBLIC/anon/authenticated; admin só SELECT em 3 tabelas; tokens e payload sem policy", () => {
    expect(code).toMatch(/REVOKE ALL ON TABLE public\.newsletter_subscribers, public\.newsletter_outbox, public\.newsletter_tokens,\s*public\.newsletter_outbox_payload, public\.newsletter_consents FROM PUBLIC, anon, authenticated/);
    expect(code).toMatch(/GRANT SELECT ON TABLE public\.newsletter_subscribers, public\.newsletter_outbox, public\.newsletter_consents TO authenticated/);
    expect([...code.matchAll(/GRANT[^;]*TO authenticated;/g)]).toHaveLength(1);
    expect(code.match(/CREATE POLICY/g)).toHaveLength(3);
    expect(code).not.toMatch(/CREATE POLICY[^;]*FOR (INSERT|UPDATE|DELETE|ALL)/i);
    expect(code).not.toMatch(/CREATE POLICY[^;]*newsletter_(tokens|outbox_payload)/i);
  });

  it("funções: SECURITY INVOKER, search_path fixo, EXECUTE só para service_role, sem SQL dinâmico", () => {
    const functions = [...code.matchAll(/CREATE FUNCTION public\.(newsletter_\w+)\(/g)].map((m) => m[1]);
    expect(functions).toEqual([
      "newsletter_touch_updated_at", "newsletter_request_subscription", "newsletter_request_unsubscribe_link",
      "newsletter_confirm", "newsletter_unsubscribe", "newsletter_outbox_claim", "newsletter_outbox_prepare",
      "newsletter_outbox_complete", "newsletter_outbox_expire",
    ]);
    expect(code.match(/SECURITY INVOKER/g)).toHaveLength(functions.length);
    expect(code.match(/SET search_path = pg_catalog, public/g)).toHaveLength(functions.length);
    const grants = [...code.matchAll(/GRANT EXECUTE ON FUNCTION[^;]*;/g)].map((m) => m[0]);
    expect(grants).toHaveLength(functions.length - 1); // o trigger não precisa de EXECUTE
    for (const grant of grants) expect(grant).toMatch(/TO service_role;$/);
    expect(code.match(/REVOKE ALL ON FUNCTION[^;]*FROM PUBLIC, anon, authenticated;/g)).toHaveLength(functions.length);
    expect(code).not.toMatch(/EXECUTE\s+format|EXECUTE\s+'/i);
  });

  it("token só como hash; confirmação e preparação não aceitam versão de consentimento do chamador", () => {
    expect(code).toMatch(/token_hash\s+text\s+NOT NULL/);
    expect(code).toContain("token_hash ~ '^[0-9a-f]{64}$'");
    expect(signatureOf("newsletter_confirm")).not.toMatch(/version/i);
    expect(signatureOf("newsletter_outbox_prepare")).not.toMatch(/consent|policy/i);
  });

  it("modelo: índice parcial de uma mensagem em aberto, cascade e sem user_agent", () => {
    expect(code).toMatch(/CREATE UNIQUE INDEX newsletter_outbox_one_open_per_kind[\s\S]*?WHERE status IN \('queued', 'sending', 'retry'\)/);
    expect(code.match(/ON DELETE CASCADE/g)?.length).toBeGreaterThanOrEqual(4);
    expect(code).toMatch(/ON DELETE SET NULL/);
    expect(code).not.toMatch(/user_agent/i);
  });
});
