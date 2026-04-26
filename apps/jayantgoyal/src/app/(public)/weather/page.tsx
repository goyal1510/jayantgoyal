import type { Metadata } from "next"
import WeatherDashboard from "@/components/weather/weather-dashboard"

export const metadata: Metadata = {
  title: "Weather",
  description: "Live weather updates with city search, geolocation, and 5-day forecast powered by OpenWeather API.",
}

export default function Page() {
  return <WeatherDashboard />
}
