import { DareX } from "@/components/games/DareX"

export default function DareXPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Dare X</h1>
        <p className="text-sm text-muted-foreground">
          Local two-player challenge. Record each dare to keep your history.
        </p>
      </div>
      <DareX />
    </div>
  )
}
