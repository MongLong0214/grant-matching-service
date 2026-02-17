export default function ResultLoading() {
  return (
    <div className="mx-auto max-w-[960px] px-4 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-8">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="mt-3 flex items-center gap-2">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-emerald-100" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-blue-100" />
        </div>
      </div>

      {/* Search conditions */}
      <div className="mb-10 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-5 w-72 animate-pulse rounded bg-muted" />
      </div>

      {/* Tier header */}
      <div className="mb-5 rounded-xl border border-emerald-200/60 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-pulse rounded bg-emerald-200" />
          <div className="h-5 w-32 animate-pulse rounded bg-emerald-200" />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`skel-${i}`}
            className="flex h-52 flex-col rounded-xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-6 w-12 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="mb-2 h-6 w-full animate-pulse rounded bg-muted" />
            <div className="mb-4 h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="mt-auto flex items-center gap-3">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-2 flex-1 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
