import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Verificações estáticas e offline da migration 015 PROPOSTA (nada é executado
// em banco). Análise de texto: NÃO substitui a revisão independente nem os
// testes de integração no ambiente isolado (T-LEAD-I*, PV-06, PV-28).
const raw = readFileSync(resolve(process.cwd(), "supabase/migrations/015_leads_management.sql"), "utf8");
const sql = raw.replace(/--[^\n]*/g, "");
const at = (re: RegExp) => {
  const index = sql.search(re);
  if (index < 0) throw new Error(`não encontrado: ${re}`);
  return index;
};

describe("migration 015 — guard 012 × 015 e primeira aplicação estrita", () => {
  it("é uma única transação com limites de lock e de execução", () => {
    expect(sql).toMatch(/^\s*BEGIN;/);
    expect(sql).toMatch(/COMMIT;\s*$/);
    expect(sql).toMatch(/SET LOCAL lock_timeout = '\d+s'/);
    expect(sql).toMatch(/SET LOCAL statement_timeout = '\d+s'/);
    expect(at(/SET LOCAL lock_timeout/)).toBeLessThan(at(/ALTER TABLE public\.leads/));
  });

  it("os guards rodam antes de qualquer DDL e abortam com RAISE EXCEPTION", () => {
    const firstDdl = at(/ALTER TABLE public\.leads/);
    expect(at(/DO \$prereq\$/)).toBeLessThan(firstDdl);
    expect(at(/DO \$state\$/)).toBeLessThan(firstDdl);
    expect(sql.match(/RAISE EXCEPTION/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("o gate da 012 exige ausência da policy e de privilégios de anon", () => {
    expect(sql).toMatch(/policyname = 'leads_anon_insert'/);
    expect(sql).toMatch(/roles && ARRAY\['anon', 'public'\]/);
    expect(sql).toMatch(/has_table_privilege\('anon', 'public\.leads'/);
    expect(sql).toMatch(/has_any_column_privilege\('anon', 'public\.leads'/);
  });

  it("não concede nem revoga nada de anon em public.leads", () => {
    for (const statement of sql.split(";")) {
      if (/^\s*(GRANT|REVOKE)\b/i.test(statement) && /ON TABLE public\.leads\b/.test(statement)) {
        expect(statement, statement.trim().slice(0, 60)).not.toMatch(/\banon\b/);
      }
    }
  });

  it("o texto do guard declara que só comprova estado técnico (PV-20 segue humano)", () => {
    const header = raw.replace(/^--\s?/gm, "");
    expect(header).toMatch(/PV-20/);
    expect(header).toMatch(/SOMENTE esse estado técnico/);
    expect(header).toMatch(/não\s+comprova que inexistem consumidores externos/);
  });

  it("verifica policies, triggers, colunas, objetos, dependências e dono", () => {
    expect(sql).toMatch(/policy desconhecida/);
    expect(sql).toMatch(/trigger preexistente em leads/);
    expect(sql).toMatch(/coluna da 015 já existe/);
    expect(sql).toMatch(/public\.lead_notes já existe/);
    expect(sql).toMatch(/public\.lead_activity já existe/);
    expect(sql).toMatch(/schema rc2_internal já existe/);
    expect(sql).toMatch(/constraint da 015 já existe/);
    expect(sql).toMatch(/relação da 015 já existe/);
    expect(sql).toMatch(/objeto dependente de leads/);
    expect(sql).toMatch(/FK externa referencia leads/);
    expect(sql).toMatch(/não é o dono de public\.leads/);
    expect(sql).toMatch(/update_updated_at\(\) com definição incompatível/);
  });

  it("não aceita objetos preexistentes em silêncio", () => {
    expect(sql).not.toMatch(/(CREATE|ADD COLUMN)[^;]*IF NOT EXISTS/i);
    expect(sql).not.toMatch(/CREATE OR REPLACE/i);
    expect(sql).not.toMatch(/DROP TRIGGER/i);
    const drops = [...sql.matchAll(/DROP POLICY IF EXISTS\s+("[^"]+"|\w+)/gi)].map((m) => m[1].replace(/"/g, ""));
    expect(drops.sort()).toEqual(
      ["Only admins can read leads", "Only admins can update leads", "leads_auth_select", "leads_auth_update"].sort(),
    );
  });
});

describe("migration 015 — backfill de updated_at", () => {
  it("inicializa updated_at com created_at antes de existir qualquer trigger", () => {
    const backfill = at(/UPDATE public\.leads SET updated_at = created_at;/);
    expect(backfill).toBeGreaterThan(at(/ADD COLUMN updated_at timestamptz,?\s*(\n|;)/));
    expect(backfill).toBeLessThan(at(/CREATE TRIGGER/));
    expect(backfill).toBeLessThan(at(/CREATE FUNCTION rc2_internal/));
  });

  it("é o único UPDATE de dados e só escreve updated_at", () => {
    expect(sql.match(/\bUPDATE\s+public\.leads\s+SET\b/g)).toHaveLength(1);
    expect(sql).not.toMatch(/\b(INSERT\s+INTO\s+public\.leads|DELETE\s+FROM)\b/i);
  });

  it("aplica default e NOT NULL só depois da inicialização, sem default no ADD COLUMN", () => {
    const backfill = at(/UPDATE public\.leads SET updated_at = created_at;/);
    expect(sql).toMatch(/ADD COLUMN updated_at timestamptz[,;\s]/);
    expect(sql).not.toMatch(/ADD COLUMN updated_at[^,;]*(DEFAULT|NOT NULL)/);
    expect(at(/ALTER COLUMN updated_at SET DEFAULT now\(\)/)).toBeGreaterThan(backfill);
    expect(at(/ALTER COLUMN updated_at SET NOT NULL/)).toBeGreaterThan(backfill);
  });

  it("prova no fim que as colunas históricas, a atividade e o backfill estão íntegros", () => {
    expect(sql).toMatch(/rc2\.e2_015_legacy_fingerprint/);
    expect(sql).toMatch(/updated_at IS DISTINCT FROM created_at/);
    expect(sql).toMatch(/o backfill gerou atividade ou nota/);
    expect(at(/DO \$post\$/)).toBeGreaterThan(at(/CREATE TRIGGER leads_30_activity/));
    expect(at(/DO \$post\$/)).toBeLessThan(at(/COMMIT;/));
  });
});

describe("migration 015 — contrato de lead_activity (cobertura planejada em T-LEAD-I09)", () => {
  const constraint = sql.match(/CONSTRAINT lead_activity_status_values_check CHECK \(([\s\S]*?)\r?\n  \)\r?\n\);/)?.[1] ?? "";

  it("status_changed exige from_value e to_value não nulos e válidos", () => {
    expect(constraint).toMatch(/kind = 'status_changed'\s+AND from_value IS NOT NULL AND to_value IS NOT NULL/);
    expect(constraint).toMatch(/AND from_value IN \(/);
    expect(constraint).toMatch(/AND to_value IN \(/);
  });

  it("os demais eventos exigem from_value e to_value nulos", () => {
    expect(constraint).toMatch(/kind <> 'status_changed' AND from_value IS NULL AND to_value IS NULL/);
  });
});

describe("migration 015 — lock antes do fingerprint (A4.1)", () => {
  it("toma ACCESS EXCLUSIVE em public.leads depois do Guard 1 e antes de qualquer leitura de estado", () => {
    expect(sql).toMatch(/LOCK TABLE public\.leads IN ACCESS EXCLUSIVE MODE;/);
    const lock = at(/LOCK TABLE public\.leads IN ACCESS EXCLUSIVE MODE;/);
    expect(lock).toBeGreaterThan(at(/SET LOCAL lock_timeout/));
    expect(lock).toBeGreaterThan(at(/DO \$prereq\$/));
    expect(lock).toBeLessThan(at(/DO \$state\$/));
    expect(lock).toBeLessThan(at(/rc2\.e2_015_legacy_fingerprint/));
    expect(lock).toBeLessThan(at(/ALTER TABLE public\.leads/));
  });

  it("é o único LOCK e não usa modo menor que permitiria INSERT concorrente", () => {
    expect(sql.match(/\bLOCK TABLE\b/g)).toHaveLength(1);
    expect(sql).not.toMatch(/LOCK TABLE[^;]*\b(ROW SHARE|ROW EXCLUSIVE|SHARE UPDATE EXCLUSIVE|SHARE MODE)\b/i);
    expect(sql).not.toMatch(/\bNOWAIT\b|\bSKIP LOCKED\b/i);
  });

  it("documenta o impacto operacional no próprio arquivo", () => {
    const header = raw.replace(/^--\s?/gm, "");
    expect(header).toMatch(/INSERTs do formulário público ficam em fila/);
    expect(header).toMatch(/55P03/);
    expect(header).toMatch(/Janela adicional de bloqueio/);
  });

  it("o lock e a autoverificação ficam na mesma transação (sem COMMIT antes do fim)", () => {
    expect(sql.match(/\bCOMMIT;/g)).toHaveLength(1);
    expect(sql.match(/\bBEGIN;/g)).toHaveLength(1);
    expect(at(/LOCK TABLE/)).toBeLessThan(at(/DO \$post\$/));
    expect(at(/DO \$post\$/)).toBeLessThan(at(/COMMIT;/));
  });
});

describe("migration 015 — verificação da função SECURITY DEFINER na autoverificação (A4.2)", () => {
  const post = sql.slice(at(/DO \$post\$/), at(/COMMIT;/));

  it("valida o dono da função, o dono de lead_activity e a ausência de FORCE RLS", () => {
    expect(post).toMatch(/p\.proname = 'leads_record_activity'/);
    expect(post).toMatch(/SELECT p\.proowner INTO v_owner/);
    expect(post).toMatch(/pg_get_userbyid\(v_owner\) <> current_user/);
    expect(post).toMatch(/c\.relowner = v_owner\s+AND NOT c\.relforcerowsecurity/);
  });

  it("valida a execução de auth.uid() e o acesso do dono aos schemas e à tabela, tratando NULL como falha", () => {
    expect(post).toMatch(/has_function_privilege\(v_owner, to_regprocedure\('auth\.uid\(\)'\)::oid, 'EXECUTE'\) IS NOT TRUE/);
    expect(post).toMatch(/has_schema_privilege\(v_owner, 'auth', 'USAGE'\) IS NOT TRUE/);
    expect(post).toMatch(/has_schema_privilege\(v_owner, 'public', 'USAGE'\) IS NOT TRUE/);
    expect(post).toMatch(/has_table_privilege\(v_owner, 'public\.lead_activity', 'INSERT'\) IS NOT TRUE/);
  });

  it("exige SECURITY DEFINER com search_path vazio na função de atividade e INVOKER na outra", () => {
    expect(post).toMatch(/p\.proname = 'leads_record_activity'\s+AND p\.prosecdef AND 'search_path=""' = ANY \(p\.proconfig\)/);
    expect(post).toMatch(/p\.proname = 'leads_before_update'\s+AND NOT p\.prosecdef AND 'search_path=""' = ANY \(p\.proconfig\)/);
    expect(post).toMatch(/deve ser SECURITY DEFINER com search_path vazio/);
    expect(post).toMatch(/deve ser SECURITY INVOKER com search_path vazio/);
  });

  it("falha explícita (RAISE) e nunca concede GRANT para contornar", () => {
    expect(post).toMatch(/RAISE EXCEPTION E'015 ABORTADA/);
    expect(post).not.toMatch(/\bGRANT\b/i);
    // Os únicos GRANT da migration são para authenticated, nas tabelas de leads.
    const targets = [...sql.matchAll(/\bGRANT\b[^;]*?\bTO\s+(\w+)/gi)].map((m) => m[1]);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) expect(target).toBe("authenticated");
  });
});
