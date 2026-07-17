export type AmountFilter = "all" | "positive" | "negative"
export type LoadOptions = {
  target?: "first" | "last"
  keepDetailOpen?: boolean
}

export function parseISTTimestamp(timestamp: string) {
  try {
    if (timestamp.includes("T") || timestamp.includes("Z")) {
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? null : date
    }

    const parts = timestamp.split(" ")
    if (parts.length !== 2) return null

    const [day, month, year] = parts[0]?.split("/") ?? []
    const [hours, minutes, seconds] = parts[1]?.split(":") ?? []
    if (!day || !month || !year || !hours || !minutes || !seconds) return null

    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    )
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

export function formatDateDisplay(timestamp: string | null) {
  if (!timestamp) return "Invalid Date"
  const date = parseISTTimestamp(timestamp)
  if (!date) return "Invalid Date"
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatTimeDisplay(timestamp: string | null) {
  if (!timestamp) return "Invalid Time"
  const date = parseISTTimestamp(timestamp)
  if (!date) return "Invalid Time"
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function formatDateKeyLabel(key: string) {
  const [year, month, day] = key.split("-")
  if (!year || !month || !day) return key
  return `${day}/${month}/${year}`
}

export function getTotalAmount(denominations: { denomination: number; count: number }[]) {
  return denominations.reduce((total, denom) => total + denom.denomination * denom.count, 0)
}
