import type { Metadata } from "next"
import WeatherDashboard from "@/components/weather/weather-dashboard"
import { buildPublicPageMetadata } from "@/lib/seo/config"

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Weather",
  description: "Live weather updates with city search, geolocation, and 5-day forecast powered by OpenWeather API.",
  pathname: "/weather",
})

export default function Page() {
  return <WeatherDashboard />
}
