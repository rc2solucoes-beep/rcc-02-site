import { describe, expect, it } from "vitest";
import {
  SCHEDULE_FUTURE_MESSAGE,
  SCHEDULE_REQUIRED_MESSAGE,
  classifyRowsResult,
  minuteOf,
  validatePostSchedule,
} from "@/lib/admin/postSchedule";

const now = new Date("2026-10-13T12:00:30.000Z");
const future = "2026-10-20T17:00:00.000Z";
const past = "2026-10-01T17:00:00.000Z";

describe("validatePostSchedule (T-CMS-U05, RF-CMS-10)", () => {
  it("não se aplica quando o status não é scheduled", () => {
    for (const status of ["draft", "published"]) {
      expect(validatePostSchedule({ status, scheduledPublishAt: past, existing: null, now })).toEqual({ ok: true });
    }
  });

  it("criação agendada sem data é erro", () => {
    expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: null, existing: null, now })).toEqual({
      ok: false,
      message: SCHEDULE_REQUIRED_MESSAGE,
    });
    expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: undefined, existing: null, now }).ok).toBe(false);
  });

  it("criação agendada com data passada é erro; futura é aceita", () => {
    expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: past, existing: null, now })).toEqual({
      ok: false,
      message: SCHEDULE_FUTURE_MESSAGE,
    });
    expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: future, existing: null, now })).toEqual({ ok: true });
  });

  it("futuro é estritamente maior que agora (sem tolerância)", () => {
    const exactlyNow = now.toISOString();
    expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: exactlyNow, existing: null, now }).ok).toBe(false);
    const plus1s = new Date(now.getTime() + 1000).toISOString();
    expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: plus1s, existing: null, now }).ok).toBe(true);
  });

  it("rascunho/publicado -> agendado exige data presente e futura", () => {
    for (const status of ["draft", "published"]) {
      const existing = { status, scheduled_publish_at: past };
      expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: past, existing, now }).ok).toBe(false);
      expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: null, existing, now }).ok).toBe(false);
      expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: future, existing, now }).ok).toBe(true);
    }
  });

  it("já agendado com data alterada exige futura; apagar a data é erro", () => {
    const existing = { status: "scheduled", scheduled_publish_at: future };
    expect(
      validatePostSchedule({ status: "scheduled", scheduledPublishAt: "2026-10-25T10:00:00.000Z", existing, now }).ok,
    ).toBe(true);
    expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: past, existing, now }).ok).toBe(false);
    expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: null, existing, now })).toEqual({
      ok: false,
      message: SCHEDULE_REQUIRED_MESSAGE,
    });
  });

  it("já agendado com data inalterada é aceito, mesmo vencida (histórico)", () => {
    const existing = { status: "scheduled", scheduled_publish_at: past };
    expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: past, existing, now })).toEqual({ ok: true });
  });

  it("já agendado sem data (legado) e data continua nula é aceito", () => {
    const existing = { status: "scheduled", scheduled_publish_at: null };
    expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: null, existing, now })).toEqual({ ok: true });
  });

  it("D1: compara por instante ao minuto, não por string", () => {
    // O banco devolve +00:00 e com segundos; o formulário devolve .000Z sem segundos.
    const existing = { status: "scheduled", scheduled_publish_at: "2026-10-01T17:00:42+00:00" };
    expect(
      validatePostSchedule({ status: "scheduled", scheduledPublishAt: "2026-10-01T17:00:00.000Z", existing, now }),
    ).toEqual({ ok: true });
    // Outro minuto = alterada.
    expect(
      validatePostSchedule({ status: "scheduled", scheduledPublishAt: "2026-10-01T17:01:00.000Z", existing, now }).ok,
    ).toBe(false);
  });

  it("agendado -> publicado ou rascunho não se aplica", () => {
    const existing = { status: "scheduled", scheduled_publish_at: past };
    expect(validatePostSchedule({ status: "published", scheduledPublishAt: past, existing, now })).toEqual({ ok: true });
    expect(validatePostSchedule({ status: "draft", scheduledPublishAt: null, existing, now })).toEqual({ ok: true });
  });

  it("data inválida é tratada como ausente", () => {
    expect(validatePostSchedule({ status: "scheduled", scheduledPublishAt: "nope", existing: null, now }).ok).toBe(false);
  });
});

describe("minuteOf", () => {
  it("normaliza ao minuto e trata nulos", () => {
    expect(minuteOf("2026-10-01T17:00:59.999Z")).toBe(minuteOf("2026-10-01T17:00:00.000Z"));
    expect(minuteOf(null)).toBeNull();
    expect(minuteOf("x")).toBeNull();
  });
});

describe("classifyRowsResult (T-CMS-U06, RF-CMS-11)", () => {
  it("uma linha = sucesso", () => {
    expect(classifyRowsResult({ data: [{ id: "1" }], error: null })).toBe("affected");
  });
  it("zero linhas = não encontrado/sem permissão", () => {
    expect(classifyRowsResult({ data: [], error: null })).toBe("not_found");
    expect(classifyRowsResult({ data: null, error: null })).toBe("not_found");
  });
  it("erro tem precedência", () => {
    expect(classifyRowsResult({ data: [{ id: "1" }], error: { code: "x" } })).toBe("error");
  });
  it("mais de uma linha é inesperado (id é chave primária)", () => {
    expect(classifyRowsResult({ data: [{ id: "1" }, { id: "2" }], error: null })).toBe("error");
  });
});
