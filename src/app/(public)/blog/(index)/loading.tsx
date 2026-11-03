export default function BlogLoading() {
  // Espelha o índice: abertura compacta clara, busca, destaque e grade.
  return (
    <>
      <section className="bg-rc2-bg pt-12 pb-8 md:pt-16 md:pb-10 animate-pulse">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="h-3 w-20 bg-rc2-border rounded mb-4" />
          <div className="h-9 w-2/3 bg-rc2-border rounded" />
          <div className="h-4 w-1/2 bg-rc2-border rounded mt-4" />
        </div>
      </section>

      <section className="bg-rc2-bg pb-16 md:pb-20">
        <div className="container mx-auto px-4 max-w-5xl animate-pulse">
          <div className="h-11 w-full max-w-xl bg-rc2-border rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-3">
              <div className="aspect-[3/2] w-full bg-rc2-border" />
              <div className="h-3 w-24 bg-rc2-border rounded" />
              <div className="h-6 w-3/4 bg-rc2-border rounded" />
              <div className="h-3 w-full bg-rc2-border rounded" />
              <div className="h-3 w-5/6 bg-rc2-border rounded" />
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[4/3] w-full bg-rc2-border" />
                <div className="h-3 w-20 bg-rc2-border rounded" />
                <div className="h-5 w-3/4 bg-rc2-border rounded" />
                <div className="h-3 w-full bg-rc2-border rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
