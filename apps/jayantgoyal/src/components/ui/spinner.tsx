import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface SpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
}

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-muted-foreground", sizeMap[size], className)}
      aria-label="Loading"
    />
  )
}

export function SpinnerWithText({
  text = "Loading...",
  className,
  size = "md",
}: SpinnerProps & { text?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Spinner size={size} />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  )
}
