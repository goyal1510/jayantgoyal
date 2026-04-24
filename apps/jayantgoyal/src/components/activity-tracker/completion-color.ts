export function getCompletionBgColor(
  completedCount: number,
  totalActivities: number
): string {
  if (totalActivities === 0) return ""
  const completionPercentage = (completedCount / totalActivities) * 100

  if (completionPercentage < 50) {
    return "bg-red-100 dark:bg-red-950/50"
  } else if (completionPercentage >= 50 && completionPercentage <= 80) {
    return "bg-yellow-100 dark:bg-yellow-700/50"
  } else {
    return "bg-green-100 dark:bg-green-900/40"
  }
}
