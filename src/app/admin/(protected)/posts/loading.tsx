export default function PostsLoading() {
  return (
    <div className="animate-pulse" role="status" aria-live="polite">
      <span className="sr-only">Carregando posts…</span>
      <div className="border-b border-rc2-border px-4 sm:px-6 lg:px-8 py-6 bg-rc2-surface">
        <div className="h-6 w-24 bg-rc2-border rounded mb-1.5" />
        <div className="h-3 w-32 bg-rc2-border rounded" />
      </div>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="bg-rc2-surface border border-rc2-border p-4 mb-6 h-24" />
        <div className="h-4 w-36 bg-rc2-border rounded mb-3" />
        <div className="bg-rc2-surface border border-rc2-border divide-y divide-rc2-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-5 py-4 space-y-2">
              <div className="h-3 w-40 bg-rc2-border rounded" />
              <div className="h-4 w-2/3 bg-rc2-border rounded" />
              <div className="h-3 w-1/4 bg-rc2-border rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
