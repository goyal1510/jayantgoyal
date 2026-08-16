export default function WritingLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-10 w-40 rounded bg-muted" />
      <div className="space-y-4 rounded-xl border p-6">
        <div className="h-6 w-2/3 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-4/5 rounded bg-muted" />
      </div>
    </div>
  );
}
