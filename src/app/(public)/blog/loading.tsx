export default function BlogLoading() {
  return (
    <>
      <div className="bg-rc2-ink py-16 md:py-20 animate-pulse">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="h-3 w-20 bg-rc2-sand/20 rounded mb-4" />
          <div className="h-9 w-2/3 bg-rc2-sand/20 rounded" />
        </div>
      </div>

      <section className="bg-rc2-sand py-20">
        <div className="container mx-auto px-4 max-w-5xl animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-3">
              <div className="aspect-video w-full bg-border" />
              <div className="h-3 w-24 bg-border rounded" />
              <div className="h-6 w-3/4 bg-border rounded" />
              <div className="h-3 w-full bg-border rounded" />
              <div className="h-3 w-5/6 bg-border rounded" />
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-video w-full bg-border" />
                <div className="h-3 w-20 bg-border rounded" />
                <div className="h-5 w-3/4 bg-border rounded" />
                <div className="h-3 w-full bg-border rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
