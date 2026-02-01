export default function ResultLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="animate-pulse space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted" />
          <div className="mx-auto h-8 w-64 rounded bg-muted" />
          <div className="mx-auto h-5 w-48 rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border p-5 space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-12 rounded-full bg-muted" />
                <div className="h-5 w-16 rounded-full bg-muted" />
              </div>
              <div className="h-6 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
