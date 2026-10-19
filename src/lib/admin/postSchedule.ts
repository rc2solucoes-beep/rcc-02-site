import type { PostStatus } from "@/lib/types/post";

// Regra de data de agendamento (DEC-18, RF-CMS-10) e verificação de linhas
// afetadas (RF-CMS-11). Funções puras.

export const SCHEDULE_REQUIRED_MESSAGE = "Informe a data do agendamento.";
export const SCHEDULE_FUTURE_MESSAGE = "A data de agendamento deve estar no futuro.";

export type ScheduleExisting = {
  status: PostStatus | string;
  scheduled_publish_at: string | null;
} | null;

export type ScheduleInput = {
  status: PostStatus | string;
  /** ISO UTC já convertido de `datetime-local`, ou ausente. */
  scheduledPublishAt: string | null | undefined;
  /** Estado atual do post; `null` na criação. */
  existing: ScheduleExisting;
  now: Date;
};

export type ScheduleResult = { ok: true } | { ok: false; message: string };

/** Instante normalizado ao minuto (o `datetime-local` não carrega segundos). */
export function minuteOf(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : Math.floor(ms / 60_000);
}

export function validatePostSchedule({ status, scheduledPublishAt, existing, now }: ScheduleInput): ScheduleResult {
  if (status !== "scheduled") return { ok: true };

  // Já agendado e data inalterada (mesmo minuto; inclusive nula ou vencida legada): não revalida.
  if (existing && existing.status === "scheduled") {
    if (minuteOf(existing.scheduled_publish_at) === minuteOf(scheduledPublishAt)) return { ok: true };
  }

  if (!scheduledPublishAt || minuteOf(scheduledPublishAt) === null) {
    return { ok: false, message: SCHEDULE_REQUIRED_MESSAGE };
  }
  if (new Date(scheduledPublishAt).getTime() <= now.getTime()) {
    return { ok: false, message: SCHEDULE_FUTURE_MESSAGE };
  }
  return { ok: true };
}

export type RowsOutcome = "affected" | "not_found" | "error";

/** Interpreta o retorno de `delete()/update().select('id')`: sucesso só com exatamente 1 linha. */
export function classifyRowsResult(result: {
  data: ReadonlyArray<unknown> | null;
  error: unknown;
}): RowsOutcome {
  if (result.error) return "error";
  const count = result.data?.length ?? 0;
  if (count === 1) return "affected";
  if (count === 0) return "not_found";
  return "error";
}
