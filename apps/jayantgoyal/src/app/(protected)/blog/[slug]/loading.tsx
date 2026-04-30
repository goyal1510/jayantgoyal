export default function BlogPostLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-lg border">
      {/* Header skeleton */}
      <div className="shrink-0 border-b p-6 space-y-3">
        <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
        <div className="flex gap-3">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-6 space-y-4">
        <div className="h-7 w-1/3 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-11/12 rounded bg-muted animate-pulse" />
        <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-7 w-2/5 rounded bg-muted animate-pulse mt-4" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-10/12 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-7 w-1/4 rounded bg-muted animate-pulse mt-4" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}
