import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { NewsletterAdminActions } from "@/components/admin/newsletter/NewsletterAdminActions";
import { getNewsletterSubscriber, NEWSLETTER_PATH, NEWSLETTER_STATUS_LABELS } from "@/lib/admin/newsletterAdmin";
import { formatSaoPauloDateTime } from "@/lib/datetime";

export const revalidate = 0;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const when = (v: string | null) => v ? formatSaoPauloDateTime(v) : "—";
const cell = "px-3 py-2 text-sm border-b border-rc2-border-soft";

export default async function NewsletterSubscriberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const result = await getNewsletterSubscriber(id);
  if (!result.ok && result.error === "not_found") notFound();
  if (!result.ok) return <>
    <AdminHeader title="Assinante da newsletter" />
    <div role="alert" className="p-6 text-rc2-error">
      Não foi possível carregar o assinante. Isso não significa que ele não exista.
      <Link className="ml-2 underline" href={NEWSLETTER_PATH + "/" + id}>Tentar novamente</Link>
    </div>
  </>;
  const { subscriber, consents, outbox, consentsTruncated, outboxTruncated } = result;
  return <>
    <AdminHeader title="Assinante da newsletter" description={subscriber.email} />
    <div className="p-4 md:p-6 lg:p-8 space-y-6 text-rc2-text">
      <Link href={NEWSLETTER_PATH} className="underline text-sm text-rc2-brand-text">Voltar para a newsletter</Link>
      <section className="border border-rc2-border bg-rc2-surface p-5">
        <h2 className="font-semibold text-rc2-heading mb-3">Cadastro</h2>
        <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {([
            ["Status", NEWSLETTER_STATUS_LABELS[subscriber.status]],
            ["Criado em", when(subscriber.created_at)],
            ["Atualizado em", when(subscriber.updated_at)],
            ["Confirmado em", when(subscriber.confirmed_at)],
            ["Descadastrado em", when(subscriber.unsubscribed_at)],
            ["Último pedido", when(subscriber.last_request_at)],
          ] as const).map(([label, value]) => <div key={label}><dt className="text-rc2-text-secondary text-xs">{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </section>
      <section className="border border-rc2-border bg-rc2-surface p-5">
        <h2 className="font-semibold text-rc2-heading mb-2">Ações administrativas</h2>
        {process.env.NEWSLETTER_ADMIN_MUTATIONS_ENABLED === "true" ? (
          <NewsletterAdminActions id={subscriber.id} status={subscriber.status} />
        ) : (
          <p className="text-sm text-rc2-text-secondary">
            Descadastro e exclusão desabilitados até a homologação da migration N4 e autorização específica de ativação.
          </p>
        )}
      </section>
      <section className="border border-rc2-border bg-rc2-surface p-5 overflow-x-auto">
        <h2 className="font-semibold text-rc2-heading mb-3">Histórico de consentimento</h2>
        {consentsTruncated && <p role="status" className="text-sm mb-2">Mostrando os 200 eventos mais recentes.</p>}
        {!consents.length ? <p className="text-sm text-rc2-text-secondary">Nenhum evento registrado.</p> : (
          <table className="w-full text-sm text-left"><thead><tr>
            {["Data", "Evento", "Versão do texto", "Política", "Canal", "Motivo"].map(x => <th key={x} scope="col" className={cell}>{x}</th>)}
          </tr></thead><tbody>{consents.map(x => <tr key={x.id}>
            <td className={cell}>{when(x.created_at)}</td><td className={cell}>{x.event}</td>
            <td className={cell}>{x.consent_text_version ?? "—"}</td><td className={cell}>{x.policy_version ?? "—"}</td>
            <td className={cell}>{x.source_path ?? "—"}</td><td className={cell}>{x.reason ?? "—"}</td>
          </tr>)}</tbody></table>
        )}
      </section>
      <section className="border border-rc2-border bg-rc2-surface p-5 overflow-x-auto">
        <h2 className="font-semibold text-rc2-heading mb-3">Histórico de mensagens</h2>
        {outboxTruncated && <p role="status" className="text-sm mb-2">Mostrando as 200 mensagens mais recentes.</p>}
        {!outbox.length ? <p className="text-sm text-rc2-text-secondary">Nenhuma mensagem registrada.</p> : (
          <table className="w-full text-sm text-left"><thead><tr>
            {["Criada em", "Tipo", "Estado", "Tentativas", "Código", "Resultado incerto", "Motivo de falha"].map(x => <th key={x} scope="col" className={cell}>{x}</th>)}
          </tr></thead><tbody>{outbox.map(x => <tr key={x.id}>
            <td className={cell}>{when(x.created_at)}</td><td className={cell}>{x.kind}</td>
            <td className={cell}>{x.status}</td><td className={cell}>{x.attempts}</td>
            <td className={cell}>{x.last_error_code ?? "—"}</td><td className={cell}>{x.outcome_unknown ? "Sim" : "Não"}</td>
            <td className={cell}>{x.dead_reason ?? "—"}</td>
          </tr>)}</tbody></table>
        )}
      </section>
    </div>
  </>;
}
