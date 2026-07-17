export function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function getWeatherBgColor(description: string) {
  const normalized = description.toLowerCase()
  if (normalized.includes("cloud")) return "bg-gray-500/80"
  if (normalized.includes("rain")) return "bg-blue-600/80"
  if (normalized.includes("clear")) return "bg-yellow-400/80"
  return "bg-blue-600/80"
}

export function getForecastCardStyle(description: string) {
  const baseClasses =
    "text-white p-4 rounded-lg text-center transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
  const normalized = description.toLowerCase()

  if (normalized.includes("cloud")) {
    return `${baseClasses} bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700`
  } else if (normalized.includes("rain") || normalized.includes("drizzle")) {
    return `${baseClasses} bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700`
  } else if (normalized.includes("clear") || normalized.includes("sun")) {
    return `${baseClasses} bg-amber-500 hover:bg-amber-600 dark:bg-yellow-600 dark:hover:bg-yellow-700`
  } else if (normalized.includes("snow")) {
    return `${baseClasses} bg-blue-300 hover:bg-blue-400 dark:bg-blue-400 dark:hover:bg-blue-500`
  } else if (normalized.includes("thunder") || normalized.includes("storm")) {
    return `${baseClasses} bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700`
  } else if (normalized.includes("fog") || normalized.includes("mist")) {
    return `${baseClasses} bg-gray-400 hover:bg-gray-500 dark:bg-gray-500 dark:hover:bg-gray-600`
  } else {
    return `${baseClasses} bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700`
  }
}

export function getForecastTextColor(description: string) {
  const normalized = description.toLowerCase()

  if (normalized.includes("clear") || normalized.includes("sun")) {
    return "text-yellow-100"
  } else if (normalized.includes("cloud")) {
    return "text-gray-100"
  } else if (normalized.includes("rain") || normalized.includes("drizzle")) {
    return "text-blue-100"
  } else if (normalized.includes("snow")) {
    return "text-blue-100"
  } else if (normalized.includes("thunder") || normalized.includes("storm")) {
    return "text-purple-100"
  } else if (normalized.includes("fog") || normalized.includes("mist")) {
    return "text-gray-100"
  } else {
    return "text-blue-100"
  }
}

export function getForecastDetailColor(description: string) {
  const normalized = description.toLowerCase()

  if (normalized.includes("clear") || normalized.includes("sun")) {
    return "text-yellow-200"
  } else if (normalized.includes("cloud")) {
    return "text-gray-200"
  } else if (normalized.includes("rain") || normalized.includes("drizzle")) {
    return "text-blue-200"
  } else if (normalized.includes("snow")) {
    return "text-blue-200"
  } else if (normalized.includes("thunder") || normalized.includes("storm")) {
    return "text-purple-200"
  } else if (normalized.includes("fog") || normalized.includes("mist")) {
    return "text-gray-200"
  } else {
    return "text-blue-200"
  }
}
