export default function BlogLoading() {
  return (
    <div className="space-y-1">
      <div className="rounded-lg border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-4 px-4 py-3 ${i !== 4 ? "border-b" : ""}`}>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
            </div>
            <div className="hidden sm:flex shrink-0 gap-1">
              <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
              <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="h-3 w-20 shrink-0 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
