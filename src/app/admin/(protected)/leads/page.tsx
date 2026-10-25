import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Pagination } from "@/components/admin/Pagination";
import { LeadsFilterBar } from "@/components/admin/leads/LeadsFilterBar";
import { LeadsList } from "@/components/admin/leads/LeadsList";
import { LEADS_LIST_PATH, hasActiveLeadFilters, leadListHref, parseLeadListParams } from "@/lib/admin/leadList";
import { listAdminLeads } from "@/lib/admin/listAdminLeads";
import type { RawSearchParams } from "@/lib/admin/listParams";

export const revalidate = 0;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = parseLeadListParams(await searchParams);
  const result = await listAdminLeads(params);

  // Página além do alcance: leva à última.
  if (result.ok && result.total > 0 && result.page > result.pageCount) {
    redirect(leadListHref(params, { page: result.pageCount }));
  }

  const filtered = hasActiveLeadFilters(params);
  const description = !result.ok
    ? undefined
    : filtered
      ? `${result.total} ${result.total === 1 ? "lead encontrado" : "leads encontrados"}`
      : `${result.total} ${result.total === 1 ? "lead" : "leads"}`;

  return (
    <>
      <AdminHeader title="Leads" description={description} />
      <div className="p-4 md:p-6 lg:p-8">
        <LeadsFilterBar params={params} />

        {params.rangeIgnored && (
          <p role="status" className="mb-4 border border-rc2-border bg-rc2-surface px-4 py-3 text-sm text-rc2-text">
            A data inicial é posterior à final. O período foi ignorado.
          </p>
        )}

        {!result.ok ? (
          <div role="alert" className="bg-rc2-surface border border-rc2-border p-8 text-center text-sm text-rc2-text">
            <p className="font-medium text-rc2-error">Não foi possível carregar os leads.</p>
            <p className="mt-1 text-rc2-text-secondary">Isto não significa que a lista esteja vazia.</p>
            <Link href={leadListHref(params)} className="mt-4 inline-block font-medium text-rc2-brand-text underline">
              Tentar novamente
            </Link>
          </div>
        ) : result.total === 0 ? (
          filtered ? (
            <div className="bg-rc2-surface border border-rc2-border p-12 text-center text-sm text-rc2-text">
              <p className="font-medium text-rc2-heading">Nenhum lead encontrado</p>
              <p className="mt-1 text-rc2-text-secondary">Nenhum lead corresponde aos filtros aplicados.</p>
              <Link href={LEADS_LIST_PATH} className="mt-4 inline-block font-medium text-rc2-brand-text underline">
                Limpar filtros
              </Link>
            </div>
          ) : (
            <div className="bg-rc2-surface border border-rc2-border p-12 text-center text-sm text-rc2-text-secondary space-y-2">
              <p>Nenhum lead ainda.</p>
              <p>Os contatos enviados pelo formulário em /contato aparecem aqui.</p>
            </div>
          )
        ) : (
          <>
            <LeadsList items={result.items} now={new Date()} />
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              hrefFor={(page) => leadListHref(params, { page })}
              noun={{ singular: "lead", plural: "leads" }}
            />
          </>
        )}
      </div>
    </>
  );
}
