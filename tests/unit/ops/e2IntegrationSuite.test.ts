import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Verificação ESTÁTICA da suíte de integração da E2 (nada é executado, nenhum banco é acessado).
// Protege: a numeração OFICIAL do SDD, a trava de execução acidental, o uso exclusivo de dados
// sintéticos e o isolamento das chaves. Não substitui a execução no ambiente isolado.
const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const main = read("tests/integration/rls/e2-leads.test.ts");
const pre = read("tests/integration/rls/e2-leads-pre015.test.ts");
const fixtures = read("tests/integration/support/e2Fixtures.ts");
const sdd = read("docs/superpowers/specs/2026-10-13-admin-leads-management-design.md");
const files = [main, pre, fixtures];

// Só as linhas da MATRIZ (começam com o ID); a tabela de PV cita I06/I08 na última coluna.
const officialIds = [...sdd.matchAll(/^\|\s*T-LEAD-I(\d{2})\s*\|/gm)].map((m) => `I${m[1]}`).sort();
const titles = [...main.matchAll(/\bit\(\s*"T-LEAD-(I\d{2}) — ([^"]+)"/g)].map((m) => ({ id: m[1], text: m[2] }));

describe("suíte de integração E2 — numeração oficial do SDD", () => {
  it("o SDD define exatamente I01 a I16", () => {
    expect(officialIds).toEqual(Array.from({ length: 16 }, (_, i) => `I${String(i + 1).padStart(2, "0")}`));
  });

  it("cada identificador oficial tem exatamente um teste, sem renumerar nem inventar IDs", () => {
    expect(titles.map((t) => t.id).sort()).toEqual(officialIds);
    expect(main.match(/T-LEAD-I\d{2}/g)?.every((id) => officialIds.includes(id.slice(7)))).toBe(true);
  });

  it("cada teste descreve o MESMO assunto do SDD (palavras-chave oficiais)", () => {
    const keywords: Record<string, RegExp> = {
      I01: /anon sem acesso/, I02: /não-admin sem acesso/, I03: /admin lê e atualiza/,
      I04: /admin exclui lead/, I05: /notas.*author_id alheio/, I06: /CASCADE/,
      I07: /migration sobre linhas existentes/, I08: /registra atividade/, I09: /constraints/,
      I10: /zera author_id/, I11: /não insere, altera nem exclui lead_activity/, I12: /sem mudança real/,
      I13: /único next_action_changed/, I14: /concorrência/, I15: /compatibilidade das fases/,
      I16: /não grava updated_at nem status_updated_at/,
    };
    for (const { id, text } of titles) expect(text, id).toMatch(keywords[id]);
  });

  it("rastreia PV-05, PV-06 e PV-28 nos testes que o SDD indica", () => {
    const byId = (id: string) => titles.find((t) => t.id === id)?.text ?? "";
    expect(byId("I06")).toContain("PV-05");
    expect(byId("I08")).toContain("PV-06");
    expect(byId("I03")).toContain("PV-06");
    expect(byId("I16")).toContain("PV-06");
    expect(byId("I15")).toContain("PV-28");
  });

  it("cobre a constraint de lead_activity (NULL) em I09 e a escrita direta em I11, sem tocar a numeração de I16", () => {
    expect(main).toMatch(/status_changed com NULL\/NULL/);
    expect(main).toMatch(/status_changed sem to_value/);
    expect(main).toMatch(/status_changed sem from_value/);
    expect(main).toMatch(/\$\{kind\} com from_value/);
    expect(main).toMatch(/UPDATE direto de/); // I16: updated_at/status_updated_at
  });

  it("registra as pré-condições do guard e os casos que exigem executor de SQL como TODO explícito", () => {
    expect(main).toMatch(/GUARD-012 — anon é barrado por PRIVILÉGIO \(42501\)/);
    expect(main).toMatch(/it\.todo\(\s*"GUARD-012-EXECUCAO/);
    expect(main).toMatch(/it\.todo\(\s*"GUARD-REAPLICACAO/);
    expect(main).toMatch(/REGRESSAO-CONTATO/);
  });
});

describe("suíte de integração E2 — segurança de execução e dados sintéticos", () => {
  it("nada roda sem a variável de fase explícita (post015 e pre015 separadas)", () => {
    expect(main).toMatch(/describe\.skipIf\(!e2PhaseIs\("post015"\)\)/);
    expect(pre).toMatch(/describe\.skipIf\(!e2PhaseIs\("pre015"\)\)/);
    expect(fixtures).toMatch(/RC2_E2_PHASE/);
    const gate = main.search(/describe\.skipIf\(!e2PhaseIs\("post015"\)\)/);
    for (const title of main.matchAll(/\bit\(\s*"T-LEAD-I\d{2}/g)) expect(title.index).toBeGreaterThan(gate);
    expect(main.indexOf("beforeAll(")).toBeGreaterThan(gate); // nenhum beforeAll fora da trava
    expect(pre.indexOf("beforeAll(")).toBeGreaterThan(pre.search(/describe\.skipIf/));
  });

  it("usa só o harness existente: sem createClient, sem chave service_role, sem SQL cru", () => {
    for (const source of files) {
      expect(source).not.toMatch(/createClient\s*\(/);
      expect(source).not.toMatch(/SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|DATABASE_URL/);
      expect(source).not.toMatch(/from\s+["']pg["']|from\s+["']postgres["']/);
      expect(source).not.toMatch(/\b(execute_sql|exec_sql|run_sql)\b/);
      expect(source).not.toMatch(/\bit\.only\(|\bdescribe\.only\(/);
    }
    expect(main).toMatch(/from "\.\.\/support\/clients"/);
    expect(main).toMatch(/createRoleClients\(\)/);
  });

  it("usa exclusivamente fixtures sintéticas (example.test) e nenhum e-mail ou telefone reais", () => {
    for (const source of files) {
      const emails = [...source.matchAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)].map((m) => m[0]);
      for (const email of emails) expect(email, email).toMatch(/@example\.test$/);
    }
    expect(main + pre).toMatch(/5500000000000/); // telefone sintético dos fixtures
    expect(main + pre + fixtures).not.toMatch(/@(gmail|hotmail|outlook|yahoo|rc2)\./i);
  });

  it("todo recurso é registrado antes de ser criado e removido no teardown", () => {
    expect(main).toMatch(/registry\.run\(current\.service\)/);
    expect(main).toMatch(/registry\.inspectResidue\(current\.service\)/);
    expect(main).toMatch(/removeLegacySeeds/);
    expect(main).toMatch(/current\.cleanup\(\)/);
    expect(fixtures).toMatch(/registry\.track\("lead_notes"/);
    expect(fixtures).toMatch(/registry\.track\("lead_activity"/);
    // O único lugar onde leads sobrevivem de propósito é a fase pré-015, que o I07 remove.
    expect(pre).toMatch(/NÃO são removidos/);
    expect(pre).toMatch(/aqui de propósito/);
  });

  it("não reproduz conteúdo de erro externo: as asserções usam só códigos controlados", () => {
    expect(main).not.toMatch(/error\.message|error\?\.message|\.message\)/);
    expect(main).toMatch(/describeError/);
  });

  it("a suíte padrão de unidade não inclui a de integração", () => {
    const config = read("vitest.config.ts");
    expect(config).toMatch(/exclude: \["tests\/e2e\/\*\*", "tests\/integration\/\*\*"\]/);
  });
});

describe("suíte de integração E2 — fase explícita nas suítes legadas (A5)", () => {
  const baseline = read("tests/integration/rls/baseline.test.ts");
  const e0b = read("tests/integration/rls/e0b-security.test.ts");

  it("baseline e e0b-security exigem a fase e não a deduzem do banco", () => {
    for (const source of [baseline, e0b]) {
      expect(source).toMatch(/requireLegacyLeadPhase\(\)/);
      expect(source).not.toMatch(/has_table_privilege|has_column_privilege|information_schema|pg_catalog/);
    }
    expect(fixtures).toMatch(/export function requireLegacyLeadPhase/);
    expect(fixtures).toMatch(/Esta suíte não adivinha a fase/);
  });

  it("a fase é lida antes de qualquer cliente ser criado", () => {
    for (const source of [baseline, e0b]) {
      expect(source.indexOf("requireLegacyLeadPhase()")).toBeLessThan(source.indexOf("createRoleClients()"));
    }
  });

  it("as únicas linhas que dependem da fase são o UPDATE de message e o DELETE de leads pelo admin", () => {
    expect(baseline.match(/phase === "post015"/g)).toHaveLength(1);
    expect(baseline).toMatch(/phase === "post015" \? \[DENY, DENY, DENY, ALLOW\] : \[DENY, DENY, ALLOW, ALLOW\]/);
    expect(e0b.match(/phase === "post015"/g)).toHaveLength(1);
    expect(e0b).toMatch(/phase === "post015" \? \[DENY, DENY, ALLOW, ALLOW\] : \[DENY, DENY, DENY, ALLOW\]/);
  });

  it("preserva as asserções de segurança: anon e não-admin seguem DENY, e as contagens não mudam", () => {
    expect(baseline).toMatch(/table: "leads", operation: "SELECT", expected: \[DENY, DENY, ALLOW, ALLOW\]/);
    expect(baseline).toMatch(/toHaveLength\(20 \+ 12 \+ 20 \+ 15\)/);
    expect(e0b).toMatch(/table: "leads", operation: "INSERT", expected: \[DENY, DENY, DENY, ALLOW\]/);
    expect(e0b).toMatch(/toHaveLength\(13 \+ 16\)/);
    expect(e0b).toMatch(/expect\(mismatches\(\)\)\.toEqual\(\[\]\)/);
    expect(baseline).toMatch(/expect\(mismatches\(\)\)\.toEqual\(\[\]\)/);
  });

  it("I12 do teste de integração segue o SDD: archived_at não nulo → outro não nulo muda updated_at", () => {
    expect(main).toMatch(/archived_at de um valor para outro", \{ archived_at: "2026-12-02T10:00:00\+00:00" \}, true\)/);
    expect(main).not.toMatch(/ver relatório da A4/);
  });
});
