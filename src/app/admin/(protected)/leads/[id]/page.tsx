import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DeleteLeadDialog } from "@/components/admin/leads/DeleteLeadDialog";
import { LeadArchiveButton } from "@/components/admin/leads/LeadArchiveButton";
import { LeadNextActionForm } from "@/components/admin/leads/LeadNextActionForm";
import { LeadNotes } from "@/components/admin/leads/LeadNotes";
import { LeadStatusBadge } from "@/components/admin/leads/LeadStatusBadge";
import { LeadStatusForm } from "@/components/admin/leads/LeadStatusForm";
import { LeadTimeline } from "@/components/admin/leads/LeadTimeline";
import { getLeadDetail } from "@/lib/admin/getLeadDetail";
import { isLeadDeletionEnabled } from "@/lib/admin/leadFeatures";
import { LEADS_LIST_PATH, isNextActionOverdue, leadSolutionLabel } from "@/lib/admin/leadList";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { formatSaoPauloDateTime } from "@/lib/datetime";

export const revalidate = 0;

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-rc2-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm text-rc2-text break-words">{children}</dd>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!GUID.test(id)) notFound();

  const [detail, admin] = await Promise.all([getLeadDetail(id), requireAdmin()]);
  if (!detail.ok && detail.error === "not_found") notFound();

  const back = (
    <Link
      href={LEADS_LIST_PATH}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-rc2-brand-text underline"
    >
      <ArrowLeft size={14} aria-hidden="true" />
      Voltar para leads
    </Link>
  );

  if (!detail.ok) {
    return (
      <>
        <AdminHeader title="Lead" />
        <div className="p-4 md:p-6 lg:p-8 space-y-4">
          {back}
          <div role="alert" className="bg-rc2-surface border border-rc2-border p-8 text-center text-sm text-rc2-text">
            <p className="font-medium text-rc2-error">Não foi possível carregar este lead.</p>
            <p className="mt-1 text-rc2-text-secondary">Isto não significa que ele não exista.</p>
            <Link href={`${LEADS_LIST_PATH}/${id}`} className="mt-4 inline-block font-medium text-rc2-brand-text underline">
              Tentar novamente
            </Link>
          </div>
        </div>
      </>
    );
  }

  const { lead, notes, activity, notesTruncated, activityTruncated } = detail;
  const currentUserId = admin.userId;
  const overdue = isNextActionOverdue(lead);
  const archived = lead.archived_at !== null;

  return (
    <>
      <AdminHeader
        title={lead.name}
        description={lead.company}
        action={
          <div className="flex items-center gap-2">
            {archived && (
              <span className="border border-rc2-border-soft px-2 py-0.5 text-xs text-rc2-text-secondary">Arquivado</span>
            )}
            <LeadStatusBadge status={lead.status} />
          </div>
        }
      />
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {back}

        {overdue && (
          <p role="status" className="border border-rc2-error bg-rc2-surface px-4 py-3 text-sm text-rc2-text">
            <strong className="font-semibold text-rc2-error">Próxima ação vencida</strong>
            {lead.next_action_at ? ` desde ${formatSaoPauloDateTime(lead.next_action_at)}` : ""}.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <section aria-labelledby="lead-data-title" className="bg-rc2-surface border border-rc2-border p-5 space-y-4">
            <h2 id="lead-data-title" className="text-base font-medium text-rc2-heading">
              Dados do contato
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail">
                <a href={`mailto:${lead.email}`} className="font-medium text-rc2-brand-text underline">
                  {lead.email}
                </a>
              </Field>
              <Field label="WhatsApp">
                <a
                  href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-rc2-brand-text underline"
                >
                  {lead.whatsapp}
                </a>
              </Field>
              <Field label="Segmento">{lead.segment}</Field>
              <Field label="Porte">{lead.size}</Field>
              <Field label="Solução de interesse">{leadSolutionLabel(lead.solution)}</Field>
              <Field label="Origem">{lead.source}</Field>
              <Field label="Recebido em">
                <time dateTime={lead.created_at}>{formatSaoPauloDateTime(lead.created_at)}</time>
              </Field>
              {lead.status_updated_at && (
                <Field label="Status alterado em">
                  <time dateTime={lead.status_updated_at}>{formatSaoPauloDateTime(lead.status_updated_at)}</time>
                </Field>
              )}
            </dl>
            <div>
              <h3 className="text-xs font-medium text-rc2-text-secondary">Mensagem</h3>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-rc2-text">{lead.message}</p>
            </div>
          </section>

          <section aria-labelledby="lead-manage-title" className="bg-rc2-surface border border-rc2-border p-5 space-y-6">
            <h2 id="lead-manage-title" className="text-base font-medium text-rc2-heading">
              Gestão
            </h2>
            <LeadStatusForm leadId={lead.id} status={lead.status} expectedUpdatedAt={lead.updated_at} />
            <LeadNextActionForm
              leadId={lead.id}
              nextAction={lead.next_action}
              nextActionAt={lead.next_action_at}
              expectedUpdatedAt={lead.updated_at}
            />
            <div className="flex flex-wrap items-start gap-3 border-t border-rc2-border-soft pt-4">
              <LeadArchiveButton leadId={lead.id} archived={archived} expectedUpdatedAt={lead.updated_at} />
              {isLeadDeletionEnabled() ? (
                <DeleteLeadDialog leadId={lead.id} leadLabel={lead.name} />
              ) : (
                <p className="max-w-xs text-xs text-rc2-text-secondary">
                  Exclusão definitiva suspensa. Arquive o lead para tirá-lo da lista.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <LeadNotes leadId={lead.id} notes={notes} truncated={notesTruncated} currentUserId={currentUserId} />
          <LeadTimeline activity={activity} truncated={activityTruncated} currentUserId={currentUserId} />
        </div>
      </div>
    </>
  );
}
