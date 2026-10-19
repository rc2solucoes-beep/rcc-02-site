import { describe, expect, it } from "vitest";
import {
  addDaysToYmd,
  formatMonthKeyPtBr,
  formatSaoPauloDateTime,
  isValidYmd,
  saoPauloDayStartUtcIso,
  saoPauloMonthKey,
  saoPauloParts,
} from "@/lib/datetime";

describe("helpers de America/Sao_Paulo (E1, D7)", () => {
  it("isValidYmd valida o calendário", () => {
    expect(isValidYmd("2026-02-28")).toBe(true);
    expect(isValidYmd("2028-02-29")).toBe(true);
    expect(isValidYmd("2026-02-29")).toBe(false);
    expect(isValidYmd("2026-13-01")).toBe(false);
    expect(isValidYmd("2026-1-1")).toBe(false);
    expect(isValidYmd("")).toBe(false);
  });

  it("addDaysToYmd cruza mês e ano", () => {
    expect(addDaysToYmd("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToYmd("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("início do dia em Brasília é 03:00 UTC (sem horário de verão desde 2019)", () => {
    expect(saoPauloDayStartUtcIso("2026-10-13")).toBe("2026-10-13T03:00:00.000Z");
    expect(saoPauloDayStartUtcIso("2026-02-30")).toBeNull();
  });

  it("em data histórica com horário de verão, o início do dia é 02:00 UTC", () => {
    expect(saoPauloDayStartUtcIso("2018-12-15")).toBe("2018-12-15T02:00:00.000Z");
  });

  it("23:30 de Brasília ainda é o mesmo dia/mês, apesar de UTC já ser o dia seguinte", () => {
    const p = saoPauloParts("2026-10-14T02:30:00.000Z");
    expect(p).toMatchObject({ year: 2026, month: 10, day: 13, hour: 23, minute: 30 });
    expect(saoPauloMonthKey("2026-11-01T02:30:00.000Z")).toBe("2026-10");
  });

  it("entrada inválida", () => {
    expect(saoPauloParts("lixo")).toBeNull();
    expect(saoPauloMonthKey("lixo")).toBeNull();
    expect(formatSaoPauloDateTime("lixo")).toBe("");
  });

  it("formata data/hora e mês em pt-BR", () => {
    expect(formatSaoPauloDateTime("2026-10-14T02:30:00.000Z")).toBe("13/10/2026 23:30");
    expect(formatMonthKeyPtBr("2026-03")).toBe("Março de 2026");
    expect(formatMonthKeyPtBr("2026-12")).toBe("Dezembro de 2026");
  });
});
