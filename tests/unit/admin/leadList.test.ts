import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LEAD_SOLUTION_OPTIONS,
  LEAD_LIST_COLUMNS,
  hasActiveLeadFilters,
  isNextActionOverdue,
  leadListHref,
  leadSolutionLabel,
  parseLeadListParams,
} from "@/lib/admin/leadList";
import {
  LEAD_DELETE_CONFIRMATION,
  normalizeNextAction,
  normalizeNextActionAt,
  normalizeNoteBody,
  leadStatusInput,
} from "@/lib/validations/lead";

describe("parseLeadListParams (T-LEAD-U04, RF-LEAD-01)", () => {
  it("sem parâmetros: ativos, mais recentes, página 1, sem filtros", () => {
    const p = parseLeadListParams({});
    expect(p).toMatchObject({ q: "", status: null, solution: null, archived: "no", from: null, to: null, page: 1, sort: "recent", rangeIgnored: false });
    expect(hasActiveLeadFilters(p)).toBe(false);
  });

  it("aceita valores válidos e descarta inválidos", () => {
    const p = parseLeadListParams({
      q: "  acme  ",
      status: "contacted",
      solution: "E-commerce",
      archived: "only",
      sort: "next_action",
      page: "3",
    });
    expect(p).toMatchObject({ q: "acme", status: "contacted", solution: "E-commerce", archived: "only", sort: "next_action", page: 3 });
    expect(hasActiveLeadFilters(p)).toBe(true);

    const bad = parseLeadListParams({ status: "x", solution: "inexistente", archived: "yes", sort: "zzz", page: "-4", q: "a" });
    expect(bad).toMatchObject({ status: null, solution: null, archived: "no", sort: "recent", page: 1, q: "" });
  });

  it("solução fora da lista só é aceita como `other` (valores históricos = Outros)", () => {
    expect(parseLeadListParams({ solution: "other" }).solution).toBe("other");
    expect(leadSolutionLabel("Valor antigo qualquer")).toBe("Outros");
    expect(leadSolutionLabel("E-commerce")).toBe("E-commerce");
  });

  it("período invertido é ignorado e sinalizado", () => {
    const p = parseLeadListParams({ from: "2026-10-10", to: "2026-10-01" });
    expect(p).toMatchObject({ from: null, to: null, rangeIgnored: true });
    expect(parseLeadListParams({ from: "2026-10-01", to: "2026-10-10" })).toMatchObject({ from: "2026-10-01", to: "2026-10-10" });
  });

  it("monta links preservando filtros e omitindo os padrões", () => {
    expect(leadListHref(parseLeadListParams({}))).toBe("/admin/leads");
    const p = parseLeadListParams({ q: "ana", status: "new", archived: "all", sort: "next_action" });
    expect(leadListHref(p, { page: 2 })).toBe("/admin/leads?q=ana&status=new&archived=all&sort=next_action&page=2");
  });

  it("a lista nunca seleciona message nem ip_hash", () => {
    expect(LEAD_LIST_COLUMNS.split(",")).not.toContain("message");
    expect(LEAD_LIST_COLUMNS.split(",")).not.toContain("ip_hash");
  });

  it("as opções de solução espelham o formulário de contato (paridade)", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/marketing/ContactForm.tsx"), "utf8");
    const block = /const solutionOptions = \[([\s\S]*?)\];/.exec(source)?.[1] ?? "";
    const options = [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect([...LEAD_SOLUTION_OPTIONS]).toEqual(options);
  });
});

describe("isNextActionOverdue (RF-LEAD-05)", () => {
  const now = new Date("2026-10-20T12:00:00.000Z");
  const base = { next_action_at: "2026-10-19T12:00:00.000Z", archived_at: null, status: "new" as const };
  it("vencida só com data passada, lead ativo e não encerrado", () => {
    expect(isNextActionOverdue(base, now)).toBe(true);
    expect(isNextActionOverdue({ ...base, next_action_at: "2026-10-21T12:00:00.000Z" }, now)).toBe(false);
    expect(isNextActionOverdue({ ...base, next_action_at: null }, now)).toBe(false);
    expect(isNextActionOverdue({ ...base, archived_at: "2026-10-01T00:00:00Z" }, now)).toBe(false);
    expect(isNextActionOverdue({ ...base, status: "closed" }, now)).toBe(false);
  });
});

describe("validação das actions (T-LEAD-U01)", () => {
  it("status: só os cinco valores; id precisa ser UUID; expectedUpdatedAt é obrigatório", () => {
    const ok = { id: "450ceabd-d97d-484a-b927-00bce606e87a", status: "qualified", expectedUpdatedAt: "2026-01-15T12:00:00.123456+00:00" };
    expect(leadStatusInput.safeParse(ok).success).toBe(true);
    expect(leadStatusInput.safeParse({ ...ok, status: "won" }).success).toBe(false);
    expect(leadStatusInput.safeParse({ ...ok, id: "1" }).success).toBe(false);
    expect(leadStatusInput.safeParse({ ...ok, expectedUpdatedAt: "" }).success).toBe(false);
  });

  it("campo extra é descartado (lista fixa): nada além dos campos da action chega ao UPDATE", () => {
    const parsed = leadStatusInput.parse({
      id: "450ceabd-d97d-484a-b927-00bce606e87a",
      status: "new",
      expectedUpdatedAt: "x",
      name: "invasor",
      updated_at: "forjado",
    });
    expect(Object.keys(parsed).sort()).toEqual(["expectedUpdatedAt", "id", "status"]);
  });

  it("próxima ação: apara, vazio vira nulo, 280 caracteres é o limite (por pontos de código)", () => {
    expect(normalizeNextAction("  ligar  ")).toEqual({ ok: true, value: "ligar" });
    expect(normalizeNextAction("   ")).toEqual({ ok: true, value: null });
    expect(normalizeNextAction(null)).toEqual({ ok: true, value: null });
    expect(normalizeNextAction("a".repeat(280)).ok).toBe(true);
    expect(normalizeNextAction("a".repeat(281)).ok).toBe(false);
    expect(normalizeNextAction("😀".repeat(280)).ok).toBe(true);
    expect(normalizeNextAction("😀".repeat(281)).ok).toBe(false);
  });

  it("data da próxima ação: datetime-local de Brasília vira UTC; ilegível é inválido", () => {
    expect(normalizeNextActionAt("2026-10-20T09:30")).toEqual({ ok: true, value: "2026-10-20T12:30:00.000Z" });
    expect(normalizeNextActionAt("")).toEqual({ ok: true, value: null });
    expect(normalizeNextActionAt("ontem")).toEqual({ ok: false });
  });

  it("nota: entre 1 e 2000 caracteres após aparar", () => {
    expect(normalizeNoteBody("  oi  ")).toEqual({ ok: true, value: "oi" });
    expect(normalizeNoteBody("   ").ok).toBe(false);
    expect(normalizeNoteBody("a".repeat(2000)).ok).toBe(true);
    expect(normalizeNoteBody("a".repeat(2001)).ok).toBe(false);
  });

  it("a confirmação de exclusão é a palavra literal EXCLUIR", () => {
    expect(LEAD_DELETE_CONFIRMATION).toBe("EXCLUIR");
  });
});
