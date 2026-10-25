import { formatSaoPauloDateTime } from "@/lib/datetime";
import { LEAD_STATUS_LABELS, type LeadActivity } from "@/lib/types/lead";
import { authorLabel } from "./LeadNotes";

/** Texto do evento. O histórico não guarda o texto da próxima ação: só informa que mudou. */
export function describeActivity(activity: LeadActivity): string {
  switch (activity.kind) {
    case "status_changed":
      return `Status alterado de ${LEAD_STATUS_LABELS[activity.from_value]} para ${LEAD_STATUS_LABELS[activity.to_value]}`;
    case "next_action_changed":
      return "Próxima ação alterada";
    case "archived":
      return "Lead arquivado";
    case "restored":
      return "Lead restaurado";
  }
}

/** Histórico operacional, somente leitura (só o trigger do banco escreve). */
export function LeadTimeline({
  activity,
  truncated,
  currentUserId,
}: {
  activity: readonly LeadActivity[];
  truncated: boolean;
  currentUserId: string | null;
}) {
  return (
    <section aria-labelledby="lead-timeline-title" className="bg-rc2-surface border border-rc2-border p-5 space-y-3">
      <h2 id="lead-timeline-title" className="text-base font-medium text-rc2-heading">
        Histórico
      </h2>
      {activity.length === 0 ? (
        <p className="text-sm text-rc2-text-secondary">Nenhuma alteração registrada.</p>
      ) : (
        <ol className="divide-y divide-rc2-border-soft">
          {activity.map((event) => (
            <li key={event.id} className="py-2.5">
              <p className="text-sm text-rc2-text">{describeActivity(event)}</p>
              <p className="text-xs text-rc2-text-secondary">
                {authorLabel(event.actor_id, currentUserId)} · {formatSaoPauloDateTime(event.created_at)}
              </p>
            </li>
          ))}
        </ol>
      )}
      {truncated && (
        <p className="text-xs text-rc2-text-secondary">Mostrando os eventos mais recentes; há eventos mais antigos.</p>
      )}
    </section>
  );
}
