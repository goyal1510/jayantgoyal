export default function HistoryPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">
          Gameplay history and stats are turned off. All games run locally and nothing is stored.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        No records to show—each session clears when you leave the page.
      </div>
    </div>
  )
}
