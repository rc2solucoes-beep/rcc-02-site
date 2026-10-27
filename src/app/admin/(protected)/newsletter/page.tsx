import Link from "next/link";
import Form from "next/form";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Pagination } from "@/components/admin/Pagination";
import { SEARCH_MAX, type RawSearchParams } from "@/lib/admin/listParams";
import {
  NEWSLETTER_PATH, NEWSLETTER_STATUSES, NEWSLETTER_STATUS_LABELS,
  getAdminNewsletterHealth, listNewsletterSubscribers, newsletterHref, parseNewsletterListParams,
} from "@/lib/admin/newsletterAdmin";
import { formatSaoPauloDateTime } from "@/lib/datetime";

export const revalidate = 0;

const fieldClass = "w-full border border-rc2-border bg-rc2-surface px-3 py-2 text-sm text-rc2-text";
export default async function NewsletterAdminPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = parseNewsletterListParams(await searchParams);
  const [result, health] = await Promise.all([listNewsletterSubscribers(params), getAdminNewsletterHealth()]);
  if (result.ok && result.total > 0 && result.page > result.pageCount)
    redirect(newsletterHref(params, { page: result.pageCount }));
  const filtered = Boolean(params.q || params.status);
  return (
    <>
      <AdminHeader title="Newsletter" description="Assinantes, consentimentos e saúde do processamento" />
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <section aria-label="Saúde da fila" className="border border-rc2-border bg-rc2-surface p-4">
          <h2 className="text-base font-semibold text-rc2-heading mb-3">Fila de envio</h2>
          {!health.ok ? (
            <p role="alert" className="text-sm text-rc2-error">Não foi possível consultar a fila. Verifique a configuração e tente novamente.</p>
          ) : (
            <dl className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {([
                ["Aguardando", health.health.queued], ["Reprocessamento", health.health.retry],
                ["Enviando", health.health.sending], ["Lease vencido", health.health.sending_lease_expired],
                ["Falhas 24h", health.health.dead_24h],
                ["Mais antigo (s)", health.health.oldest_ready_age_seconds ?? "—"],
              ] as const).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-rc2-text-secondary">{label}</dt>
                  <dd className="text-xl font-semibold text-rc2-heading tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
        <Form action={NEWSLETTER_PATH} role="search" aria-label="Buscar assinantes"
          className="grid sm:grid-cols-[1fr_180px_auto] items-end gap-3 border border-rc2-border bg-rc2-surface p-4">
          <div>
            <label htmlFor="newsletter-q" className="block text-xs font-medium text-rc2-text-secondary mb-1">Buscar por e-mail</label>
            <input id="newsletter-q" type="search" name="q" defaultValue={params.q} maxLength={SEARCH_MAX}
              placeholder="Mínimo de 2 caracteres" autoComplete="off" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="newsletter-status" className="block text-xs font-medium text-rc2-text-secondary mb-1">Status</label>
            <select id="newsletter-status" name="status" defaultValue={params.status ?? ""} className={fieldClass}>
              <option value="">Todos</option>
              {NEWSLETTER_STATUSES.map(s => <option key={s} value={s}>{NEWSLETTER_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="flex gap-3 items-center">
            <button type="submit" className="bg-rc2-brand hover:bg-rc2-brand-hover text-rc2-heading px-4 py-2 text-sm font-medium">Filtrar</button>
            {filtered && <Link className="text-sm text-rc2-brand-text underline" href={NEWSLETTER_PATH}>Limpar</Link>}
          </div>
        </Form>
        {!result.ok ? (
          <div role="alert" className="border border-rc2-border bg-rc2-surface p-8 text-sm">
            <p className="text-rc2-error">Não foi possível carregar os assinantes. Isso não significa que a lista esteja vazia.</p>
            <Link className="underline text-rc2-brand-text" href={newsletterHref(params)}>Tentar novamente</Link>
          </div>
        ) : result.total === 0 ? (
          <p className="border border-rc2-border bg-rc2-surface p-8 text-sm text-rc2-text-secondary">
            {filtered ? "Nenhum assinante corresponde aos filtros." : "Nenhum assinante cadastrado."}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto border border-rc2-border bg-rc2-surface">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-rc2-border text-rc2-text-secondary">
                  <th scope="col" className="p-3">E-mail</th><th scope="col" className="p-3">Status</th>
                  <th scope="col" className="p-3">Inscrição</th><th scope="col" className="p-3">Detalhe</th>
                </tr></thead>
                <tbody>{result.items.map(sub => <tr key={sub.id} className="border-b border-rc2-border-soft">
                  <td className="p-3 break-all">{sub.email}</td>
                  <td className="p-3">{NEWSLETTER_STATUS_LABELS[sub.status]}</td>
                  <td className="p-3 whitespace-nowrap">{formatSaoPauloDateTime(sub.created_at)}</td>
                  <td className="p-3"><Link className="underline text-rc2-brand-text" href={NEWSLETTER_PATH + "/" + sub.id}>Abrir</Link></td>
                </tr>)}</tbody>
              </table>
            </div>
            <Pagination page={result.page} pageCount={result.pageCount} total={result.total}
              noun={{ singular: "assinante", plural: "assinantes" }}
              hrefFor={page => newsletterHref(params, { page })} />
          </>
        )}
      </div>
    </>
  );
}
