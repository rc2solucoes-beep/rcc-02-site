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
