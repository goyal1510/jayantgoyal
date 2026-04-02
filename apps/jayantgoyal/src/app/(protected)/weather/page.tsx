import type { Metadata } from "next"
import WeatherDashboard from "@/components/weather/weather-dashboard"

export const metadata: Metadata = {
  title: "Weather | Jayant",
  description: "Check the current weather conditions.",
}

export default function Page() {
  return <WeatherDashboard />;
}
