export default function NewsletterLoading() {
  return <div role="status" aria-live="polite" className="animate-pulse p-6 space-y-6">
    <span className="sr-only">Carregando newsletter…</span>
    <div className="h-8 w-48 bg-rc2-border rounded" />
    <div className="h-24 bg-rc2-surface border border-rc2-border" />
    <div className="h-20 bg-rc2-surface border border-rc2-border" />
    <div className="h-48 bg-rc2-surface border border-rc2-border" />
  </div>;
}
