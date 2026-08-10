import { describe, expect, it } from "vitest";
import { saoPauloInputToUtcIso, utcIsoToSaoPauloInput } from "@/lib/datetime";

describe("saoPauloInputToUtcIso", () => {
  it("interpreta datetime-local como horário de Brasília (UTC-3)", () => {
    // 14:00 em Brasília = 17:00 UTC
    expect(saoPauloInputToUtcIso("2026-08-12T14:00")).toBe("2026-08-12T17:00:00.000Z");
  });

  it("lida com virada de dia (madrugada em Brasília vira mesmo dia em UTC)", () => {
    // 23:30 BRT de 12/08 = 02:30 UTC de 13/08
    expect(saoPauloInputToUtcIso("2026-08-12T23:30")).toBe("2026-08-13T02:30:00.000Z");
  });

  it("aceita segundos no input", () => {
    expect(saoPauloInputToUtcIso("2026-08-12T14:00:30")).toBe("2026-08-12T17:00:30.000Z");
  });

  it("respeita valores que já trazem fuso (Z ou offset explícito)", () => {
    expect(saoPauloInputToUtcIso("2026-08-12T17:00:00.000Z")).toBe("2026-08-12T17:00:00.000Z");
    expect(saoPauloInputToUtcIso("2026-08-12T14:00:00-03:00")).toBe("2026-08-12T17:00:00.000Z");
  });

  it("retorna null para vazio ou inválido", () => {
    expect(saoPauloInputToUtcIso("")).toBeNull();
    expect(saoPauloInputToUtcIso("   ")).toBeNull();
    expect(saoPauloInputToUtcIso("não é data")).toBeNull();
  });
});

describe("utcIsoToSaoPauloInput", () => {
  it("converte instante UTC para wall-clock de Brasília no formato datetime-local", () => {
    expect(utcIsoToSaoPauloInput("2026-08-12T17:00:00.000Z")).toBe("2026-08-12T14:00");
  });

  it("retorna string vazia para entrada inválida", () => {
    expect(utcIsoToSaoPauloInput("")).toBe("");
    expect(utcIsoToSaoPauloInput("lixo")).toBe("");
  });
});

describe("round-trip", () => {
  it("input -> UTC -> input preserva o horário digitado", () => {
    const input = "2026-12-31T09:15";
    const utc = saoPauloInputToUtcIso(input);
    expect(utc).not.toBeNull();
    expect(utcIsoToSaoPauloInput(utc as string)).toBe(input);
  });
});
