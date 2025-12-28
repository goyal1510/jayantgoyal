/**
 * Get the current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  return `${year}-${month}`
}

/**
 * Format month (YYYY-MM) to display format (e.g., "January 2025")
 */
export function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-")
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

/**
 * Get the previous month in YYYY-MM format
 */
export function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split("-")
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
  date.setMonth(date.getMonth() - 1)
  const newYear = date.getFullYear()
  const newMonth = (date.getMonth() + 1).toString().padStart(2, "0")
  return `${newYear}-${newMonth}`
}

/**
 * Get the next month in YYYY-MM format
 */
export function getNextMonth(month: string): string {
  const [year, monthNum] = month.split("-")
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
  date.setMonth(date.getMonth() + 1)
  const newYear = date.getFullYear()
  const newMonth = (date.getMonth() + 1).toString().padStart(2, "0")
  return `${newYear}-${newMonth}`
}

/**
 * Generate all days in a given month (YYYY-MM format)
 * Returns array of dates in YYYY-MM-DD format
 */
export function getDaysInMonth(month: string): string[] {
  const [year, monthNum] = month.split("-")
  const yearNum = parseInt(year)
  const monthIndex = parseInt(monthNum) - 1
  const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate()

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    return `${year}-${monthNum}-${day.toString().padStart(2, "0")}`
  })
}

/**
 * Get number of days in a month
 */
export function getDaysCount(month: string): number {
  const [year, monthNum] = month.split("-")
  const yearNum = parseInt(year)
  const monthIndex = parseInt(monthNum) - 1
  return new Date(yearNum, monthIndex + 1, 0).getDate()
}

/**
 * Format a Date object to YYYY-MM-DD using local time (not UTC)
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Check if a date (YYYY-MM-DD) is editable (today, yesterday, or day before yesterday)
 * Uses local time, not UTC
 */
export function isDateEditable(date: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const dayBeforeYesterday = new Date(today)
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2)
  
  const todayStr = formatDateLocal(today)
  const yesterdayStr = formatDateLocal(yesterday)
  const dayBeforeYesterdayStr = formatDateLocal(dayBeforeYesterday)
  
  return (
    date === todayStr ||
    date === yesterdayStr ||
    date === dayBeforeYesterdayStr
  )
}

/**
 * Check if a date (YYYY-MM-DD) is in the future
 * Uses local time, not UTC
 */
export function isFutureDate(date: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  return checkDate > today
}

/**
 * Format date (YYYY-MM-DD) to display format (e.g., "Jan 15" or "Today", "Yesterday")
 * Returns short format for table headers
 * Uses local time, not UTC
 */
export function formatDate(date: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const dayBeforeYesterday = new Date(today)
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2)
  
  const todayStr = formatDateLocal(today)
  const yesterdayStr = formatDateLocal(yesterday)
  const dayBeforeYesterdayStr = formatDateLocal(dayBeforeYesterday)
  
  if (date === todayStr) {
    return "Today"
  }
  if (date === yesterdayStr) {
    return "Yest"
  }
  if (date === dayBeforeYesterdayStr) {
    return "DBY"
  }
  
  // Format as "Jan 15" for other dates
  const [year, month, day] = date.split("-")
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

