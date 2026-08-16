export function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getWeatherBgColor(description: string) {
  const normalized = description.toLowerCase();
  if (normalized.includes("clear") || normalized.includes("sun")) {
    return "border-[#d8c5a6] bg-[#f2e2c8] text-[#211512] dark:border-[#5e5143] dark:bg-[#332d28] dark:text-[#fff8ef]";
  }
  if (normalized.includes("thunder") || normalized.includes("storm")) {
    return "border-[#cfc0e4] bg-[#e8dcf5] text-[#211512] dark:border-[#5c5068] dark:bg-[#2f2938] dark:text-[#fff8ef]";
  }
  if (normalized.includes("rain") || normalized.includes("drizzle")) {
    return "border-[#a8c3e7] bg-[#dce9f8] text-[#211512] dark:border-[#40536b] dark:bg-[#243142] dark:text-[#fff8ef]";
  }
  return "border-[#b9c0c9] bg-[#d9dee5] text-[#211512] dark:border-[#4b535d] dark:bg-[#2a3038] dark:text-[#fff8ef]";
}

export function getForecastCardStyle(description: string) {
  const normalized = description.toLowerCase();

  if (normalized.includes("clear") || normalized.includes("sun")) {
    return "border-[#d8c5a6] bg-[#f2e2c8] text-[#211512] dark:border-[#5e5143] dark:bg-[#332d28] dark:text-[#fff8ef]";
  }
  if (normalized.includes("thunder") || normalized.includes("storm")) {
    return "border-[#cfc0e4] bg-[#e8dcf5] text-[#211512] dark:border-[#5c5068] dark:bg-[#2f2938] dark:text-[#fff8ef]";
  }
  if (
    normalized.includes("rain") ||
    normalized.includes("drizzle") ||
    normalized.includes("snow")
  ) {
    return "border-[#a8c3e7] bg-[#dce9f8] text-[#211512] dark:border-[#40536b] dark:bg-[#243142] dark:text-[#fff8ef]";
  }
  return "border-[#b9c0c9] bg-[#d9dee5] text-[#211512] dark:border-[#4b535d] dark:bg-[#2a3038] dark:text-[#fff8ef]";
}
