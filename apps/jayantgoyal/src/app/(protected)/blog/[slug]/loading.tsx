export default function BlogPostLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="h-4 w-28 rounded bg-muted animate-pulse" />
      <div className="h-10 w-3/4 rounded bg-muted animate-pulse" />
      <div className="flex gap-3">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
        <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="space-y-3 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-muted animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>
    </div>
  );
}
