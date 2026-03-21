import { Spinner } from "@/components/ui/spinner"

export function PageSpinner() {
  return (
    <div className="flex min-h-[50vh] flex-1 items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
