import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkReadOnlySql } from "../../integration/support/readOnlySql";

// Verificação ESTÁTICA da migration 016 (suspende o DELETE de authenticated em leads), do runbook e da
// camada de aplicação. Nada é executado e nenhum banco é acessado. Não substitui o preflight/verify no alvo.
const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const eol = (text: string) => text.replace(/\r\n/g, "\n");
const noComments = (sql: string) => sql.replace(/--[^\n]*/g, "");
const noLiterals = (sql: string) => noComments(sql).replace(/'(?:[^']|'')*'/g, "''").replace(/::name\[\]/g, "");
const dir = "docs/runbooks/migrations/016-leads-disable-delete";

const sql = eol(read("supabase/migrations/016_leads_disable_delete.sql"));
const code = noComments(sql);
// Instruções de TOPO: remove os blocos DO $tag$ … $tag$ (guard, fingerprint, autoverificação).
const topLevel = code
  .replace(/DO\s+\$(\w+)\$[\s\S]*?\$\1\$\s*;/g, "")
  .split(";")
  .map((statement) => statement.replace(/\s+/g, " ").trim())
  .filter(Boolean);

describe("migration 016 — só retira o DELETE de authenticated e a policy da 015", () => {
  it("as únicas instruções de topo são a transação, os timeouts, o lock, o REVOKE e o DROP POLICY", () => {
    expect(topLevel).toEqual([
      "BEGIN",
      "SET LOCAL lock_timeout = '5s'",
      "SET LOCAL statement_timeout = '60s'",
      "LOCK TABLE public.leads IN ACCESS EXCLUSIVE MODE",
      "REVOKE DELETE ON TABLE public.leads FROM authenticated",
      "DROP POLICY leads_e2_admin_delete ON public.leads",
      "COMMIT",
    ]);
  });

  it("não concede nada, não cria objetos e não toca dados nem outros papéis", () => {
    expect(code).not.toMatch(/\bGRANT\b/i);
    expect(code).not.toMatch(/\bCREATE\b/i);
    expect(code).not.toMatch(/\bALTER\b/i);
    expect(code).not.toMatch(/\bTRUNCATE\s+(TABLE\s+)?\w/i);
    expect(code).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(code).not.toMatch(/\bUPDATE\s+public\./i);
    expect(code).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(code).not.toMatch(/\bDROP\s+(TABLE|TRIGGER|FUNCTION|SCHEMA|COLUMN)\b/i);
    expect(code).not.toMatch(/DROP\s+POLICY\s+IF\s+EXISTS/i); // primeira aplicação estrita
    // Nenhuma instrução de topo menciona anon, service_role, notas ou atividade.
    for (const statement of topLevel) expect(statement).not.toMatch(/anon|service_role|lead_notes|lead_activity/i);
  });

  it("tem guard, fingerprint antes, autoverificação e lock ANTES da leitura de estado", () => {
    expect(sql).toMatch(/\$guard\$/);
    expect(sql).toMatch(/\$before\$/);
    expect(sql).toMatch(/\$after\$/);
    const at = (needle: string) => code.indexOf(needle);
    expect(at("LOCK TABLE")).toBeGreaterThan(-1);
    expect(at("LOCK TABLE")).toBeLessThan(at("$guard$"));
    expect(at("$guard$")).toBeLessThan(at("$before$"));
    expect(at("$before$")).toBeLessThan(at("REVOKE DELETE"));
    expect(at("REVOKE DELETE")).toBeLessThan(at("DROP POLICY"));
    expect(at("DROP POLICY")).toBeLessThan(at("$after$"));
    expect(sql.match(/RAISE EXCEPTION/g)?.length).toBeGreaterThanOrEqual(3);
    expect(sql).toMatch(/lock_timeout = '5s'/);
  });

  it("o fingerprint é feito na própria transação, só com hashes, e compara dados, policies, ACLs, triggers e service_role", () => {
    expect(sql).toMatch(/set_config\('rc2_m016\.leads_rows'[\s\S]*?true\)/);
    expect(sql).toMatch(/set_config\('rc2_m016\.leads_data'[\s\S]*?md5\(/);
    for (const key of ["leads_rows", "leads_data", "kept_policies", "other_acl", "other_policies", "triggers", "service_acl"]) {
      expect(sql.match(new RegExp(`rc2_m016\\.${key}`, "g"))?.length, key).toBeGreaterThanOrEqual(2); // antes e depois
    }
    // Nenhuma coluna pessoal é selecionada por nome; só o JSON da linha entra em md5.
    expect(noLiterals(sql)).not.toMatch(/\b(name|email|whatsapp|message|ip_hash)\b/);
    expect(code).not.toMatch(/RAISE NOTICE/i);
  });

  it("preserva SELECT, UPDATE por coluna, RLS, anon e service_role na autoverificação", () => {
    for (const fragment of [
      "archived_at,next_action,next_action_at,status",
      "leads_e2_admin_select:SELECT:{authenticated};leads_e2_admin_update:UPDATE:{authenticated}",
      "relrowsecurity",
      "'service_role'",
      "'anon'",
    ]) {
      expect(sql).toContain(fragment);
    }
    // 012: o guard exige anon sem policy nem privilégio, e a autoverificação repete a checagem.
    expect(sql.match(/has_any_column_privilege\('anon'/g)?.length).toBe(2);
  });

  it("nenhuma ocorrência de execução fora do esperado e o arquivo é o próprio destino da 016", () => {
    expect(sql).toMatch(/PROPOSTA NÃO APLICADA/);
    expect(sql).toMatch(/db push, pull ou repair/);
  });
});

describe("migration 015 permanece exatamente a homologada", () => {
  it("o SHA-256 do arquivo (fins de linha normalizados) é o pinado; equivale a 3C7826D9…769E8 com CRLF", () => {
    const hash = createHash("sha256").update(eol(read("supabase/migrations/015_leads_management.sql"))).digest("hex");
    expect(hash).toBe("e6e6baad3d526c1829c3fc9f2e1fe7159e5b8a58304377616e953ca8ede81226");
  });
});

describe("runbook da 016", () => {
  const files = ["README.md", "preflight.sql", "verify.sql", "rollback.sql", "recovery.md"];
  const preflight = read(`${dir}/preflight.sql`);
  const verify = read(`${dir}/verify.sql`);

  it("tem README, preflight, verify, rollback (marcador) e recuperação", () => {
    for (const file of files) expect(existsSync(resolve(root, dir, file)), file).toBe(true);
    const rollback = noLiterals(read(`${dir}/rollback.sql`));
    expect(rollback).not.toMatch(/\b(GRANT|REVOKE|CREATE|DROP|ALTER|INSERT|DELETE|UPDATE)\b/i);
  });

  it("preflight e verify são somente leitura (lint) e terminam em RESULTADO", () => {
    expect(checkReadOnlySql(preflight)).toEqual({ ok: true });
    expect(checkReadOnlySql(verify)).toEqual({ ok: true });
    expect(preflight).toMatch(/'RESULTADO', 'APROVADO'/);
    expect(verify).toMatch(/'RESULTADO', 'APROVADO'/);
  });

  it("a contagem de checks declarada confere com os checks existentes", () => {
    const count = (sqlText: string, prefix: string) =>
      [...noComments(sqlText).matchAll(new RegExp(`\\(\\d+, '${prefix}-\\d{2}-`, "g"))].length;
    expect(count(preflight, "PRE")).toBe(14);
    expect(preflight.match(/\(SELECT count\(\*\) FROM graded\) = 14/g)?.length).toBe(2);
    expect(count(verify, "POS")).toBe(16);
    expect(verify.match(/\(SELECT count\(\*\) FROM graded\) = 16/g)?.length).toBe(2);
  });

  it("nenhuma coluna pessoal é lida e o volume é só informativo (não é critério de aprovação)", () => {
    for (const source of [preflight, verify]) {
      expect(noLiterals(source)).not.toMatch(/\b(name|email|whatsapp|message|ip_hash)\b/);
      expect(source).toMatch(/VOLUME-LEADS', '\(informativo\)'/);
    }
  });

  it("o preflight guarda a definição da policy removida; o verify da 016 espera só select e update", () => {
    expect(preflight).toMatch(/EVD-POLICY-DELETE-DEFINICAO/);
    expect(verify).toMatch(/leads_e2_admin_select:SELECT:\{authenticated\};leads_e2_admin_update:UPDATE:\{authenticated\}/);
    expect(verify).not.toMatch(/leads_e2_admin_delete/);
  });

  it("o README documenta o verify histórico da 015, a reabilitação por migration nova e o flag insuficiente", () => {
    const readme = read(`${dir}/README.md`);
    expect(readme).toMatch(/POS-23/);
    expect(readme).toMatch(/POS-47/);
    expect(readme).toMatch(/Não o reutilize como critério de\s+aprovação após a 016/);
    expect(readme).toMatch(/migration 017/);
    expect(readme).toMatch(/LEADS_DELETE_ENABLED=true/);
    expect(readme).toMatch(/Não comparar totais entre o preflight e o verify/);
    expect(read(`${dir}/verify.sql`)).toMatch(/NÃO o use como critério de aprovação/);
  });
});

describe("camada de aplicação — exclusão suspensa por padrão", () => {
  const actions = eol(read("src/app/admin/(protected)/leads/actions.ts"));
  const features = read("src/lib/admin/leadFeatures.ts");
  const page = read("src/app/admin/(protected)/leads/[id]/page.tsx");
  const body = actions.slice(actions.indexOf("export async function deleteLead"));

  it("o flag só vale com o texto exato `true`", () => {
    expect(features).toMatch(/process\.env\.LEADS_DELETE_ENABLED === "true"/);
  });

  it("a ordem em deleteLead é autorização → validação → bloqueio → banco", () => {
    const order = [
      body.indexOf("requireAdminForLeads()"),
      body.indexOf("leadDeleteInput.safeParse"),
      body.indexOf("isLeadDeletionEnabled()"),
      body.indexOf("createSessionClient()"),
      body.indexOf('.delete()'),
    ];
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(body).toMatch(/admin_lead_delete_blocked/);
  });

  it("o botão de exclusão só é renderizado com o flag e a alternativa de arquivamento é exibida", () => {
    expect(page).toMatch(/isLeadDeletionEnabled\(\) \? \(\s*<DeleteLeadDialog/);
    expect(page).toMatch(/Exclusão definitiva suspensa\. Arquive o lead/);
  });
});
