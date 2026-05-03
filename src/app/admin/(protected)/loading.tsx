export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="border-b border-border px-8 py-6 bg-white">
        <div className="h-6 w-40 bg-border rounded mb-1.5" />
        <div className="h-3 w-56 bg-border rounded" />
      </div>

      <div className="p-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-border p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-2.5 w-28 bg-border rounded" />
                  <div className="h-8 w-12 bg-border rounded" />
                </div>
                <div className="h-5 w-5 bg-border rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <div className="h-4 w-24 bg-border rounded" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-6 py-4 flex gap-6">
                <div className="h-3 w-32 bg-border rounded" />
                <div className="h-3 w-28 bg-border rounded" />
                <div className="h-3 w-40 bg-border rounded" />
                <div className="h-3 w-20 bg-border rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
