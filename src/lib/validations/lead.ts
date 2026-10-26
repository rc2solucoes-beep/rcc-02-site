import { z } from "zod";
import { saoPauloInputToUtcIso } from "@/lib/datetime";
import {
  LEAD_DELETE_CONFIRMATION,
  LEAD_NEXT_ACTION_MAX_LENGTH,
  LEAD_NOTE_MAX_LENGTH,
  LEAD_NOTE_MIN_LENGTH,
  LEAD_STATUSES,
} from "@/lib/types/lead";

// Entradas das Server Actions de leads (E2). Lista FIXA de campos por action: campo extra é
// descartado e nunca chega ao UPDATE. Limites espelham os CHECKs da migration 015; o banco
// continua sendo a barreira final. `char_length` do Postgres conta pontos de código, por isso
// o tamanho aqui também (Array.from) e não `.length` (unidades UTF-16).

const codePoints = (value: string): number => Array.from(value).length;

const leadId = z.guid();
/** Texto opaco devolvido pelo PostgREST (microssegundos): nunca converter por `Date`. */
const expectedUpdatedAt = z.string().min(1).max(64);

export const leadStatusInput = z.object({
  id: leadId,
  status: z.enum(LEAD_STATUSES),
  expectedUpdatedAt,
});

export const leadNextActionInput = z.object({
  id: leadId,
  nextAction: z.string().nullish(),
  nextActionAt: z.string().nullish(),
  expectedUpdatedAt,
});

export const leadNoteInput = z.object({
  id: leadId,
  body: z.string(),
});

export const leadArchiveInput = z.object({
  id: leadId,
  expectedUpdatedAt,
});

export { LEAD_DELETE_CONFIRMATION };
export const leadDeleteInput = z.object({
  id: leadId,
  confirmation: z.string(),
});

/** `trim`; vazio vira nulo (a mesma normalização do trigger `leads_before_update`); mais de 280 caracteres é inválido. */
export function normalizeNextAction(value: string | null | undefined): { ok: true; value: string | null } | { ok: false } {
  const trimmed = (value ?? "").trim();
  if (trimmed === "") return { ok: true, value: null };
  if (codePoints(trimmed) > LEAD_NEXT_ACTION_MAX_LENGTH) return { ok: false };
  return { ok: true, value: trimmed };
}

/** Data da próxima ação (`datetime-local`, Brasília) para ISO UTC. Vazio = nulo; ilegível = inválido. */
export function normalizeNextActionAt(value: string | null | undefined): { ok: true; value: string | null } | { ok: false } {
  const trimmed = (value ?? "").trim();
  if (trimmed === "") return { ok: true, value: null };
  const iso = saoPauloInputToUtcIso(trimmed);
  return iso ? { ok: true, value: iso } : { ok: false };
}

/** Corpo da nota: `trim` e entre 1 e 2000 caracteres. */
export function normalizeNoteBody(value: string): { ok: true; value: string } | { ok: false } {
  const trimmed = value.trim();
  const length = codePoints(trimmed);
  if (length < LEAD_NOTE_MIN_LENGTH || length > LEAD_NOTE_MAX_LENGTH) return { ok: false };
  return { ok: true, value: trimmed };
}
