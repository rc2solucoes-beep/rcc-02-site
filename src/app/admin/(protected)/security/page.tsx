import { Shield } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  getAdminAuditEvents,
  getAdminAuditSummary,
  type AdminActorType,
  type AdminAuditSeverity,
} from "@/lib/admin/auditLogQueries";
import { formatAuditMetadataPreview } from "@/lib/admin/auditLogSanitizer";
import { getAuditEventRiskLevel } from "@/lib/admin/securityRisk";

export const dynamic = "force-dynamic";

type SearchParamsInput = {
  severity?: string | string[];
  event?: string | string[];
  actorType?: string | string[];
  from?: string | string[];
  to?: string | string[];
};

function firstValue(value: string | string[] | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

function toSeverity(value: string | undefined): AdminAuditSeverity | undefined {
  if (value === "info" || value === "warn" || value === "error") {
    return value;
  }
  return undefined;
}

function toActorType(value: string | undefined): AdminActorType | undefined {
  if (
    value === "anonymous" ||
    value === "authenticated" ||
    value === "admin" ||
    value === "system" ||
    value === "unknown"
  ) {
    return value;
  }
  return undefined;
}

function badgeClasses(value: "info" | "warn" | "error" | "low" | "medium" | "high"): string {
  if (value === "error" || value === "high") {
    return "bg-red-100 text-red-800 border border-red-200";
  }
  if (value === "warn" || value === "medium") {
    return "bg-amber-100 text-amber-800 border border-amber-200";
  }
  return "bg-emerald-100 text-emerald-800 border border-emerald-200";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatResource(resourceType: string | null, resourceId: string | null): string {
  if (!resourceType && !resourceId) {
    return "—";
  }

  if (resourceType && resourceId) {
    return `${resourceType}:${resourceId}`;
  }

  return resourceType ?? resourceId ?? "—";
}

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const params = await searchParams;

  const severity = toSeverity(firstValue(params.severity));
  const event = firstValue(params.event);
  const actorType = toActorType(firstValue(params.actorType));
  const from = firstValue(params.from);
  const to = firstValue(params.to);

  const [summary, events] = await Promise.all([
    getAdminAuditSummary(),
    getAdminAuditEvents({
      severity,
      event,
      actorType,
      from,
      to,
      limit: 100,
    }),
  ]);

  return (
    <>
      <AdminHeader
        title="Segurança"
        description="Monitoramento de eventos administrativos (cards fixos em 24h; filtros aplicam somente na tabela)."
      />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <SummaryCard title="Eventos (24h)" value={summary.events24h} />
          <SummaryCard title="Warn (24h)" value={summary.warn24h} />
          <SummaryCard title="Error (24h)" value={summary.error24h} />
          <SummaryCard title="Tentativas negadas (24h)" value={summary.denied24h} />
          <SummaryCard title="Bootstrap bloqueado (24h)" value={summary.bootstrapBlocked24h} />
          <SummaryCard title="Uploads admin (24h)" value={summary.uploads24h} />
        </div>

        <section className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-rc2-ebony">Eventos recentes</h2>
            <p className="text-xs text-rc2-ebony/60">Limite: 100 | Ordem: mais recentes primeiro</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-rc2-ebony/60">
                <tr>
                  <th className="px-3 py-2">Data/hora</th>
                  <th className="px-3 py-2">Severidade</th>
                  <th className="px-3 py-2">Risco</th>
                  <th className="px-3 py-2">Evento</th>
                  <th className="px-3 py-2">Ator</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Path</th>
                  <th className="px-3 py-2">Recurso</th>
                  <th className="px-3 py-2">Metadata resumida</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-rc2-ebony/60">
                      Nenhum evento para os filtros informados.
                    </td>
                  </tr>
                ) : (
                  events.map((item) => {
                    const risk = getAuditEventRiskLevel(item.event, item.severity);
                    const actor = item.actor_email_hash ?? item.actor_user_id ?? item.actor_type;
                    return (
                      <tr key={item.id} className="border-t border-border align-top">
                        <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(item.created_at)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${badgeClasses(item.severity)}`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${badgeClasses(risk)}`}>
                            {risk}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{item.event}</td>
                        <td className="px-3 py-2 font-mono text-xs">{actor}</td>
                        <td className="px-3 py-2">{item.status ?? "—"}</td>
                        <td className="px-3 py-2 font-mono text-xs">{item.path ?? "—"}</td>
                        <td className="px-3 py-2 font-mono text-xs">{formatResource(item.resource_type, item.resource_id)}</td>
                        <td className="px-3 py-2 max-w-[380px] truncate" title={formatAuditMetadataPreview(item.metadata, 200)}>
                          {formatAuditMetadataPreview(item.metadata, 200)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <article className="bg-white border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-rc2-ebony/60">{title}</p>
        <Shield size={16} className="text-rc2-orange" />
      </div>
      <p className="mt-2 text-3xl font-semibold text-rc2-ebony">{value}</p>
    </article>
  );
}
