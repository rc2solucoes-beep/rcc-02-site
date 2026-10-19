// Conversão de horários entre o fuso da aplicação (Brasília) e UTC.
//
// Os inputs <input type="datetime-local"> emitem "YYYY-MM-DDTHH:mm" SEM fuso.
// Uma string assim, passada a `new Date(...)`, é interpretada no fuso do runtime
// — e as Functions da Vercel rodam em UTC. Sem tratamento, "14:00" digitado pelo
// editor (pensando em Brasília) vira 14:00 UTC (= 11:00 em Brasília).
//
// Brasília é UTC-03:00 FIXO: o Brasil aboliu o horário de verão em 2019
// (Decreto 9.772/2019). Por isso usamos um offset fixo, exato e sem dependências.
// Caso o horário de verão volte, trocar por conversão via Intl com
// `timeZone: "America/Sao_Paulo"`.
const SAO_PAULO_OFFSET = "-03:00";
const SAO_PAULO_OFFSET_MINUTES = -180;

const HAS_TZ = /([zZ]|[+-]\d{2}:?\d{2})$/;
const NO_SECONDS = /T\d{2}:\d{2}$/;

/**
 * Converte um valor de <input datetime-local> ("YYYY-MM-DDTHH:mm"), interpretado
 * como horário de Brasília, para uma string ISO 8601 em UTC.
 * Valores que já trazem fuso (sufixo Z ou ±HH:mm) são respeitados.
 * Retorna null para entrada vazia ou inválida.
 */
export function saoPauloInputToUtcIso(local: string): string | null {
  const trimmed = local.trim();
  if (!trimmed) return null;

  let normalized = trimmed;
  if (!HAS_TZ.test(trimmed)) {
    const withSeconds = NO_SECONDS.test(trimmed) ? `${trimmed}:00` : trimmed;
    normalized = `${withSeconds}${SAO_PAULO_OFFSET}`;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Converte um instante UTC (string ISO) para o valor de <input datetime-local>
 * ("YYYY-MM-DDTHH:mm") no horário de Brasília.
 * Retorna string vazia para entrada inválida.
 */
export function utcIsoToSaoPauloInput(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  const shifted = new Date(parsed.getTime() + SAO_PAULO_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 16);
}

// ─── Fuso America/Sao_Paulo para listagens (E1) ───────────────────────────────
//
// Filtros por dia e agrupamento por mês usam ESTE helper, para que ambos
// concordem sobre "em que dia/mês" um instante cai. Usa Intl com o fuso IANA
// (e não o offset fixo acima) para ficar correto mesmo em datas históricas com
// horário de verão.
export const SAO_PAULO_TZ = "America/Sao_Paulo";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SAO_PAULO_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export type SaoPauloParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

/** Decompõe um instante (ISO ou Date) no calendário de Brasília. Null se inválido. */
export function saoPauloParts(value: string | Date): SaoPauloParts | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const raw: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(date)) raw[part.type] = part.value;
  return {
    year: Number(raw.year),
    month: Number(raw.month),
    day: Number(raw.day),
    hour: Number(raw.hour),
    minute: Number(raw.minute),
  };
}

/** Chave `YYYY-MM` do mês de Brasília em que o instante cai. Null se inválido. */
export function saoPauloMonthKey(value: string | Date): string | null {
  const p = saoPauloParts(value);
  if (!p) return null;
  return `${p.year}-${String(p.month).padStart(2, "0")}`;
}

/** Valida um `YYYY-MM-DD` de calendário (rejeita 2026-02-30 etc.). */
export function isValidYmd(ymd: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
}

/** Soma dias a um `YYYY-MM-DD` (aritmética de calendário, sem fuso). */
export function addDaysToYmd(ymd: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) throw new Error("ymd inválido");
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return d.toISOString().slice(0, 10);
}

/**
 * Instante UTC (ISO) em que começa o dia `YYYY-MM-DD` em Brasília.
 * Null para data inválida.
 */
export function saoPauloDayStartUtcIso(ymd: string): string | null {
  if (!isValidYmd(ymd)) return null;
  const [y, mo, d] = ymd.split("-").map(Number);
  // Brasília está entre UTC-02 e UTC-03; testa a meia-noite local em cada offset.
  for (const hours of [3, 2, 4]) {
    const candidate = new Date(Date.UTC(y, mo - 1, d, hours));
    const p = saoPauloParts(candidate);
    if (p && p.year === y && p.month === mo && p.day === d && p.hour === 0 && p.minute === 0) {
      return candidate.toISOString();
    }
  }
  return new Date(Date.UTC(y, mo - 1, d, 3)).toISOString();
}

/** `dd/MM/yyyy HH:mm` em Brasília. String vazia para entrada inválida. */
export function formatSaoPauloDateTime(value: string | Date): string {
  const p = saoPauloParts(value);
  if (!p) return "";
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(p.day)}/${two(p.month)}/${p.year} ${two(p.hour)}:${two(p.minute)}`;
}

/** Rótulo de mês em pt-BR (ex.: "Outubro de 2026") para uma chave `YYYY-MM`. */
export function formatMonthKeyPtBr(key: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return key;
  // Meio do mês, meio-dia UTC: nunca cruza a fronteira do mês em nenhum fuso.
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 15, 12));
  const label = new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TZ,
    month: "long",
    year: "numeric",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
