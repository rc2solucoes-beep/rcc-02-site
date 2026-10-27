// Regra da sonda externa de saúde da fila (SDD Newsletter §8.6, DEP-04). A sonda roda FORA do Resend
// e do banco da aplicação (canal independente) e chama GET /api/internal/newsletter/health; esta
// função só decide, sobre o JSON recebido, se deve alertar. Sem PII: opera sobre contagens.

import type { QueueHealth } from "@/lib/newsletter/health";

/** Idade máxima aceitável do item pronto mais antigo (SDD §8.5, invariante 5). */
export const MAX_READY_AGE_SECONDS = 15 * 60;

export type ProbeReason = "probe_failed" | "queue_stalled" | "lease_expired_persistent";

export type ProbeDecision = { alert: boolean; reasons: ProbeReason[] };

/**
 * `health = null` significa que a própria sonda falhou (HTTP != 200, timeout, 401): alerta.
 * `previous` é a observação anterior: `sending_lease_expired` só alerta se PERSISTIR (duas
 * observações seguidas), porque um lease vencido recém-detectado é recuperado pelo próximo claim.
 */
export function evaluateProbe(health: QueueHealth | null, previous: QueueHealth | null = null): ProbeDecision {
  if (!health) return { alert: true, reasons: ["probe_failed"] };
  const reasons: ProbeReason[] = [];
  if (health.oldest_ready_age_seconds !== null && health.oldest_ready_age_seconds > MAX_READY_AGE_SECONDS) reasons.push("queue_stalled");
  if (health.sending_lease_expired > 0 && previous !== null && previous.sending_lease_expired > 0) reasons.push("lease_expired_persistent");
  return { alert: reasons.length > 0, reasons };
}
