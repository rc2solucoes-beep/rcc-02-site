import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LEAD_ACTIVITY_KINDS,
  LEAD_NEXT_ACTION_MAX_LENGTH,
  LEAD_NOTE_MAX_LENGTH,
  LEAD_NOTE_MIN_LENGTH,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadActivity,
  type LeadRecord,
} from "@/lib/types/lead";

// Paridade estática entre a migration 015 PROPOSTA e os contratos TypeScript.
// Análise de texto offline: nada é executado em banco e o resultado NÃO
// substitui os testes de integração no ambiente isolado (T-LEAD-I*).
const root = process.cwd();
const readSql = (path: string) =>
  readFileSync(resolve(root, path), "utf8").replace(/--[^\n]*/g, "");

const m015 = readSql("supabase/migrations/015_leads_management.sql");
const m001 = readSql("supabase/migrations/001_leads.sql");

const quotedList = (raw: string) =>
  [...raw.matchAll(/'([^']*)'/g)].map((match) => match[1]);

// Colunas conhecidas do contrato. O `satisfies` e o tipo `Missing` fazem o
// `tsc` falhar se `LeadRecord` ganhar ou perder uma coluna sem atualizar o teste.
const LEGACY_COLUMNS = [
  "id", "name", "company", "email", "whatsapp", "segment", "size",
  "solution", "message", "source", "ip_hash", "created_at",
] as const satisfies readonly (keyof LeadRecord)[];

const MANAGEMENT_COLUMNS = [
  "status", "status_updated_at", "next_action", "next_action_at",
  "archived_at", "updated_at",
] as const satisfies readonly (keyof LeadRecord)[];

type Missing = Exclude<
  keyof LeadRecord,
  (typeof LEGACY_COLUMNS)[number] | (typeof MANAGEMENT_COLUMNS)[number]
>;
const noMissingColumns: [Missing] extends [never] ? true : false = true;

// Nulabilidade conferida pelo compilador contra `LeadRecord`.
const TS_NULLABLE: { [K in keyof LeadRecord]: null extends LeadRecord[K] ? true : false } = {
  id: false, name: false, company: false, email: false, whatsapp: false,
  segment: false, size: false, solution: false, message: false, source: false,
  ip_hash: true, created_at: false,
  status: false, status_updated_at: true, next_action: true,
  next_action_at: true, archived_at: true, updated_at: false,
};

function legacyNullability(): Record<string, boolean> {
  const block = m001.match(/CREATE TABLE IF NOT EXISTS public\.leads \(([\s\S]*?)\n\);/);
  if (!block) throw new Error("CREATE TABLE public.leads não encontrado na 001");
  const result: Record<string, boolean> = {};
  for (const line of block[1].split(/\r?\n/)) {
    const column = line.trimEnd().match(/^\s*([a-z_]+)\s+(UUID|TEXT|TIMESTAMPTZ)\b(.*)$/i);
    if (column) result[column[1]] = !/NOT NULL|PRIMARY KEY/i.test(column[3]);
  }
  return result;
}

function managementNullability(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const column of m015.matchAll(/ADD COLUMN (\w+) ([^,;]*)/g)) {
    result[column[1]] = !/NOT NULL/i.test(column[2]);
  }
  // `updated_at` nasce nulável e vira NOT NULL depois do backfill.
  for (const column of m015.matchAll(/ALTER COLUMN (\w+) SET NOT NULL/g)) {
    result[column[1]] = false;
  }
  return result;
}

describe("contrato de leads — migration 015 × TypeScript", () => {
  it("LeadRecord cobre exatamente as colunas históricas e as de gestão", () => {
    expect(noMissingColumns).toBe(true);
    expect(Object.keys(legacyNullability()).sort()).toEqual([...LEGACY_COLUMNS].sort());
    expect(Object.keys(managementNullability()).sort()).toEqual([...MANAGEMENT_COLUMNS].sort());
  });

  it("a nulabilidade do SQL coincide com a do tipo (ip_hash é nulável)", () => {
    const sql = { ...legacyNullability(), ...managementNullability() };
    expect(sql).toEqual(TS_NULLABLE);
    expect(sql.ip_hash).toBe(true);
  });

  it("os status do SQL (CHECK de leads e de lead_activity) coincidem com LEAD_STATUSES", () => {
    const lists = [...m015.matchAll(/\b(?:status|from_value|to_value) IN \(([^)]*)\)/g)].map(
      (match) => quotedList(match[1]),
    );
    expect(lists).toHaveLength(3);
    for (const list of lists) expect([...list].sort()).toEqual([...LEAD_STATUSES].sort());
    expect(Object.keys(LEAD_STATUS_LABELS).sort()).toEqual([...LEAD_STATUSES].sort());
  });

  it("os tipos de evento do SQL coincidem com LEAD_ACTIVITY_KINDS", () => {
    const match = m015.match(/\bkind IN \(([^)]*)\)/);
    expect(match).not.toBeNull();
    expect([...quotedList(match![1])].sort()).toEqual([...LEAD_ACTIVITY_KINDS].sort());
  });

  it("os limites do SQL coincidem com as constantes", () => {
    const nextAction = m015.match(/char_length\(next_action\) <= (\d+)/);
    const note = m015.match(/char_length\(body\) BETWEEN (\d+) AND (\d+)/);
    expect(Number(nextAction?.[1])).toBe(LEAD_NEXT_ACTION_MAX_LENGTH);
    expect(Number(note?.[1])).toBe(LEAD_NOTE_MIN_LENGTH);
    expect(Number(note?.[2])).toBe(LEAD_NOTE_MAX_LENGTH);
  });

  it("o UPDATE de coluna concedido ao admin é só o das colunas operacionais (PRP-01)", () => {
    const grant = m015.match(/GRANT UPDATE \(([^)]*)\)\s+ON TABLE public\.leads/);
    expect(grant).not.toBeNull();
    const columns = grant![1].split(",").map((c) => c.trim()).sort();
    const operational = ["status", "next_action", "next_action_at", "archived_at"] as const satisfies readonly (keyof LeadRecord)[];
    expect(columns).toEqual([...operational].sort());
    expect(columns).not.toContain("updated_at");
    expect(columns).not.toContain("status_updated_at");
  });
});

describe("LeadActivity discriminada", () => {
  it("exige valores de status só em status_changed", () => {
    const changed: LeadActivity = {
      id: "a", lead_id: "l", actor_id: null, created_at: "t",
      kind: "status_changed", from_value: "new", to_value: "contacted",
    };
    const archived: LeadActivity = {
      id: "b", lead_id: "l", actor_id: "u", created_at: "t",
      kind: "archived", from_value: null, to_value: null,
    };
    // @ts-expect-error status_changed não aceita valor fora do enum de status
    const invalidValue: LeadActivity = { ...changed, to_value: "arquivado" };
    // @ts-expect-error eventos sem valores não aceitam from_value preenchido
    const invalidArchived: LeadActivity = { ...archived, from_value: "new" };
    expect([changed.kind, archived.kind]).toEqual(["status_changed", "archived"]);
    expect([invalidValue, invalidArchived]).toHaveLength(2);
  });
});
