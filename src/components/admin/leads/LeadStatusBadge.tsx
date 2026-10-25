import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/types/lead";

/** Status sempre por texto (nunca só por cor); estilo neutro, sem cor nova fora dos tokens. */
export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className="inline-block border border-rc2-border bg-rc2-surface-2 px-2 py-0.5 text-xs font-medium text-rc2-heading">
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}
