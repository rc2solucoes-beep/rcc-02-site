import Link from "next/link";
import { LEADS_LIST_PATH, isNextActionOverdue, leadSolutionLabel } from "@/lib/admin/leadList";
import { formatSaoPauloDateTime } from "@/lib/datetime";
import type { LeadListItem } from "@/lib/types/lead";
import { LeadStatusBadge } from "./LeadStatusBadge";

function NextAction({ lead, now }: { lead: LeadListItem; now: Date }) {
  if (!lead.next_action && !lead.next_action_at) return <span className="text-rc2-text-secondary">—</span>;
  const overdue = isNextActionOverdue(lead, now);
  return (
    <span className="block">
      {lead.next_action && <span className="block text-rc2-text">{lead.next_action}</span>}
      {lead.next_action_at && (
        <span className="block text-xs text-rc2-text-secondary">
          {formatSaoPauloDateTime(lead.next_action_at)}
          {overdue && <strong className="ml-2 font-semibold text-rc2-error">Vencida</strong>}
        </span>
      )}
    </span>
  );
}

function Archived({ lead }: { lead: LeadListItem }) {
  return lead.archived_at ? (
    <span className="ml-2 inline-block border border-rc2-border-soft px-1.5 py-0.5 text-xs text-rc2-text-secondary">
      Arquivado
    </span>
  ) : null;
}

/** Lista de leads: tabela a partir de `md`, cartões abaixo. Mostra só colunas sem texto livre do lead. */
export function LeadsList({ items, now }: { items: readonly LeadListItem[]; now: Date }) {
  return (
    <>
      <ul className="md:hidden space-y-3" aria-label="Leads">
        {items.map((lead) => (
          <li key={lead.id} className="bg-rc2-surface border border-rc2-border p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`${LEADS_LIST_PATH}/${lead.id}`} className="font-medium text-rc2-heading underline">
                  {lead.name}
                </Link>
                <Archived lead={lead} />
                <p className="text-sm text-rc2-text-secondary">{lead.company}</p>
              </div>
              <LeadStatusBadge status={lead.status} />
            </div>
            <p className="text-sm text-rc2-text">{leadSolutionLabel(lead.solution)}</p>
            <div className="text-sm">
              <NextAction lead={lead} now={now} />
            </div>
            <time dateTime={lead.created_at} className="block text-xs text-rc2-text-secondary">
              Recebido em {formatSaoPauloDateTime(lead.created_at)}
            </time>
          </li>
        ))}
      </ul>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm bg-rc2-surface border border-rc2-border">
          <caption className="sr-only">Leads recebidos</caption>
          <thead className="bg-rc2-surface-2 border-b border-rc2-border">
            <tr>
              {["Lead", "Solução", "Status", "Próxima ação", "Recebido em"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-rc2-text-secondary uppercase tracking-[0.06em] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rc2-border">
            {items.map((lead) => (
              <tr key={lead.id} className="hover:bg-rc2-surface-2 transition-colors align-top">
                <td className="px-4 py-3">
                  <Link href={`${LEADS_LIST_PATH}/${lead.id}`} className="font-medium text-rc2-heading underline">
                    {lead.name}
                  </Link>
                  <Archived lead={lead} />
                  <span className="block text-rc2-text-secondary">{lead.company}</span>
                </td>
                <td className="px-4 py-3 text-rc2-text">{leadSolutionLabel(lead.solution)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3">
                  <NextAction lead={lead} now={now} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-rc2-text-secondary">
                  <time dateTime={lead.created_at}>{formatSaoPauloDateTime(lead.created_at)}</time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
