export default function BlogPostLoading() {
  return (
    <article className="bg-rc2-sand">
      <header className="bg-rc2-ink py-20 px-4 animate-pulse">
        <div className="container mx-auto max-w-3xl">
          <div className="h-3 w-12 bg-rc2-sand/20 rounded mb-8" />
          <div className="h-3 w-32 bg-rc2-orange/30 rounded mb-4" />
          <div className="h-10 w-3/4 bg-rc2-sand/20 rounded mb-4" />
          <div className="h-5 w-full bg-rc2-sand/10 rounded" />
        </div>
      </header>

      <div className="aspect-video w-full max-h-[480px] bg-border animate-pulse" />

      <div className="container mx-auto max-w-3xl px-4 py-16 animate-pulse">
        <div className="space-y-3">
          {[1, 0.9, 1, 0.8, 1, 0.95, 0.7].map((w, i) => (
            <div key={i} className="h-4 bg-border rounded" style={{ width: `${w * 100}%` }} />
          ))}
          <div className="h-4 bg-border rounded w-0" />
          {[1, 0.85, 1, 0.6].map((w, i) => (
            <div key={`b-${i}`} className="h-4 bg-border rounded" style={{ width: `${w * 100}%` }} />
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border flex justify-between">
          <div className="h-4 w-32 bg-border rounded" />
          <div className="h-4 w-28 bg-border rounded" />
        </div>
      </div>
    </article>
  );
}
