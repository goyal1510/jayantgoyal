"use client"

import Image from "next/image"
import * as React from "react"
import { ChevronDown, ChevronUp, MapPin, Search } from "lucide-react"

import type { ForecastData, ForecastItem, WeatherData } from "@/lib/types/weather"

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
const FORECAST_DAYS = 5

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getWeatherBgColor(description: string) {
  const normalized = description.toLowerCase()
  if (normalized.includes("cloud")) return "bg-gray-500/80"
  if (normalized.includes("rain")) return "bg-blue-600/80"
  if (normalized.includes("clear")) return "bg-yellow-400/80"
  return "bg-blue-600/80"
}

function getForecastCardStyle(description: string) {
  const baseClasses =
    "text-white p-4 rounded-lg text-center transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
  const normalized = description.toLowerCase()

  if (normalized.includes("cloud")) {
    return `${baseClasses} bg-gray-600 hover:bg-gray-700`
  } else if (normalized.includes("rain") || normalized.includes("drizzle")) {
    return `${baseClasses} bg-blue-600 hover:bg-blue-700`
  } else if (normalized.includes("clear") || normalized.includes("sun")) {
    return `${baseClasses} bg-yellow-600 hover:bg-yellow-700`
  } else if (normalized.includes("snow")) {
    return `${baseClasses} bg-blue-400 hover:bg-blue-500`
  } else if (normalized.includes("thunder") || normalized.includes("storm")) {
    return `${baseClasses} bg-purple-600 hover:bg-purple-700`
  } else if (normalized.includes("fog") || normalized.includes("mist")) {
    return `${baseClasses} bg-gray-500 hover:bg-gray-600`
  } else {
    return `${baseClasses} bg-blue-600 hover:bg-blue-700`
  }
}

function getForecastTextColor(description: string) {
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

function getForecastDetailColor(description: string) {
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

export function WeatherDashboard() {
  const [cityInput, setCityInput] = React.useState("")
  const [currentWeather, setCurrentWeather] = React.useState<WeatherData | null>(null)
  const [forecast, setForecast] = React.useState<ForecastItem[]>([])
  const [recentCities, setRecentCities] = React.useState<string[]>([])
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("recentCities") : null
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setRecentCities(parsed.filter((value): value is string => typeof value === "string"))
        }
      } catch {
        // ignore corrupted localStorage entries
      }
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("recentCities", JSON.stringify(recentCities))
  }, [recentCities])

  const saveRecentCity = React.useCallback((city: string) => {
    const trimmed = city.trim()
    if (!trimmed) return
    setRecentCities((prev) => {
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase()
      )
      return [trimmed, ...filtered].slice(0, 5)
    })
  }, [])

  const updateForecastUI = React.useCallback((forecastData: ForecastData) => {
    if (!forecastData.list.length) {
      setForecast([])
      return
    }

    const today = new Date()
    const nextFiveDays = Array.from({ length: FORECAST_DAYS }, (_, i) => {
      const nextDay = new Date(today)
      nextDay.setDate(today.getDate() + i + 1)
      return nextDay
    })

    const dailyForecasts = forecastData.list.filter((item) =>
      item.dt_txt.includes("12:00:00")
    )

    const forecastItems: ForecastItem[] = nextFiveDays.map((date, index) => {
      const forecastEntry =
        dailyForecasts[index] || dailyForecasts[0] || forecastData.list[0]
      return {
        date,
        temp: forecastEntry.main.temp,
        description: forecastEntry.weather[0]?.description ?? "",
        icon: forecastEntry.weather[0]?.icon ?? "01d",
        humidity: forecastEntry.main.humidity,
        windSpeed: forecastEntry.wind.speed,
      }
    })

    setForecast(forecastItems)
  }, [])

  const getWeatherByCity = React.useCallback(
    async (city: string) => {
      const trimmed = city.trim()
      if (!trimmed) return null
      if (!API_KEY) {
        setError("Add NEXT_PUBLIC_OPENWEATHER_API_KEY in apps/weather/.env.local")
        return null
      }
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            trimmed
          )}&units=metric&appid=${API_KEY}`
        )
        if (!response.ok) throw new Error("City not found")
        const data: WeatherData = await response.json()
        saveRecentCity(data.name)
        setCurrentWeather(data)
        setCityInput(data.name)
        return data
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load that city right now."
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [saveRecentCity]
  )

  const getForecastByCity = React.useCallback(async (city: string) => {
    const trimmed = city.trim()
    if (!trimmed) return null
    if (!API_KEY) {
      setError("Add NEXT_PUBLIC_OPENWEATHER_API_KEY in apps/weather/.env.local")
      return null
    }
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
          trimmed
        )}&units=metric&appid=${API_KEY}`
      )
      if (!response.ok) throw new Error("Forecast not available")
      const data: ForecastData = await response.json()
      return data
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load the forecast right now."
      setError(message)
      return null
    }
  }, [])

  const getWeatherByLocation = React.useCallback(
    async (lat: number, lon: number) => {
      if (!API_KEY) {
        setError("Add NEXT_PUBLIC_OPENWEATHER_API_KEY in apps/weather/.env.local")
        return null
      }
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        )
        if (!response.ok) throw new Error("Location weather not available")
        const data: WeatherData = await response.json()
        saveRecentCity(data.name)
        setCurrentWeather(data)
        setCityInput(data.name)
        return data
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load your location weather."
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [saveRecentCity]
  )

  const getForecastByLocation = React.useCallback(async (lat: number, lon: number) => {
    if (!API_KEY) {
      setError("Add NEXT_PUBLIC_OPENWEATHER_API_KEY in apps/weather/.env.local")
      return null
    }
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      )
      if (!response.ok) throw new Error("Location forecast not available")
      const data: ForecastData = await response.json()
      return data
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load the forecast right now."
      setError(message)
      return null
    }
  }, [])

  const handleSearch = React.useCallback(async () => {
    if (!cityInput.trim()) {
      setError("Please enter a city to search.")
      return
    }
    const weatherData = await getWeatherByCity(cityInput)
    if (weatherData) {
      const forecastData = await getForecastByCity(cityInput)
      if (forecastData) {
        updateForecastUI(forecastData)
      }
    }
  }, [cityInput, getForecastByCity, getWeatherByCity, updateForecastUI])

  const handleCurrentLocation = React.useCallback(() => {
    if (!navigator?.geolocation) {
      setError("Geolocation is not supported by this browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const weatherData = await getWeatherByLocation(latitude, longitude)
        if (weatherData) {
          const forecastData = await getForecastByLocation(latitude, longitude)
          if (forecastData) {
            updateForecastUI(forecastData)
          }
        }
      },
      (geoError) => {
        setError(`Unable to get your location: ${geoError.message}`)
      }
    )
  }, [getForecastByLocation, getWeatherByLocation, updateForecastUI])

  React.useEffect(() => {
    if (!API_KEY) {
      setError("Add NEXT_PUBLIC_OPENWEATHER_API_KEY in apps/weather/.env.local")
      return
    }

    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          const weatherData = await getWeatherByLocation(latitude, longitude)
          if (weatherData) {
            const forecastData = await getForecastByLocation(latitude, longitude)
            if (forecastData) {
              updateForecastUI(forecastData)
            }
          }
        },
        () => {
          // User denied location or it failed silently; allow manual search.
        }
      )
    }
  }, [getForecastByLocation, getWeatherByLocation, updateForecastUI])

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      void handleSearch()
    }
  }

  const handleRecentCityClick = React.useCallback(
    async (city: string) => {
      setShowDropdown(false)
      const weatherData = await getWeatherByCity(city)
      if (weatherData) {
        const forecastData = await getForecastByCity(city)
        if (forecastData) {
          updateForecastUI(forecastData)
        }
      }
    },
    [getForecastByCity, getWeatherByCity, updateForecastUI]
  )

  return (
    <div className="weather-bg min-h-screen">
      <div className="min-h-screen bg-gradient-to-b from-slate-900/40 to-slate-950/70">
        <div className="container mx-auto px-4 py-8 text-white">
          <h1 className="mb-8 text-center text-3xl font-bold drop-shadow">
            Weather Dashboard
          </h1>

          {error ? (
            <div className="mx-auto mb-6 max-w-3xl rounded-md border border-red-400/60 bg-red-500/20 px-4 py-3 text-sm text-red-50 backdrop-blur">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex w-full flex-col gap-4 rounded-md border border-white/10 bg-gray-800/70 p-6 backdrop-blur md:w-1/4">
              <div className="flex flex-col gap-2">
                <span className="text-lg font-semibold">Enter the city:</span>
                <input
                  type="text"
                  placeholder="Enter a city"
                  value={cityInput}
                  onChange={(event) => setCityInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="mt-2 w-full rounded-md border border-transparent bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => void handleSearch()}
                  disabled={loading}
                  className="mt-2 flex h-10 w-full items-center justify-center rounded-md bg-blue-500 px-2 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </button>
              </div>

              <div className="text-center text-lg font-semibold text-white/80">or</div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCurrentLocation}
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-md bg-gray-600 px-4 py-2 text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Current Location
                </button>

                {recentCities.length > 0 ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown((open) => !open)}
                      className="mt-1 flex w-full items-center justify-between rounded-md bg-gray-600 px-4 py-2 text-white transition hover:bg-gray-700"
                    >
                      <span>Recent Searches</span>
                      {showDropdown ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      )}
                    </button>
                    {showDropdown ? (
                      <div className="absolute mt-1 max-h-32 w-full overflow-y-auto rounded-md bg-gray-700 text-white shadow-lg">
                        <ul className="py-1">
                          {recentCities.map((city) => (
                            <li key={city}>
                              <button
                                onClick={() => void handleRecentCityClick(city)}
                                className="w-full px-4 py-2 text-left transition hover:bg-gray-600"
                              >
                                {city}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex w-full flex-col rounded-md border border-white/10 bg-gray-800/70 p-4 backdrop-blur md:w-3/4">
              {currentWeather ? (
                <div
                  className={`${getWeatherBgColor(
                    currentWeather.weather[0]?.description ?? ""
                  )} mb-4 rounded-md p-4 text-white transition duration-300 hover:scale-y-105 hover:shadow-lg`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold md:text-3xl">
                        {currentWeather.name}
                      </h2>
                      <p className="text-sm md:text-base">{formatDate(new Date())}</p>
                      <p className="text-sm md:text-lg">
                        Wind: {currentWeather.wind.speed} m/s
                      </p>
                      <p className="text-sm md:text-lg">
                        Humidity: {currentWeather.main.humidity}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-semibold md:text-4xl">
                        {Math.round(currentWeather.main.temp)}°C
                      </p>
                    </div>
                    <div className="text-center">
                      <Image
                        src={`https://openweathermap.org/img/wn/${currentWeather.weather[0]?.icon}@2x.png`}
                        alt={currentWeather.weather[0]?.description ?? "Weather icon"}
                        width={96}
                        height={96}
                        className="mx-auto h-12 w-12 md:h-24 md:w-24"
                      />
                      <p className="text-sm capitalize md:text-lg">
                        {currentWeather.weather[0]?.description ?? ""}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded-md border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-white/80">
                  Search for a city or use your current location to see today&apos;s weather.
                </div>
              )}

              {forecast.length > 0 ? (
                <>
                  <h2 className="mb-4 text-center text-xl font-semibold text-white">
                    5-Day Forecast
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {forecast.map((item) => (
                      <div key={item.date.toISOString()} className={getForecastCardStyle(item.description)}>
                        <h3 className={`mb-2 text-sm font-semibold ${getForecastTextColor(item.description)}`}>
                          {item.date.toLocaleDateString("en-US", { weekday: "short" })}
                        </h3>
                        <p className={`mb-3 text-xs ${getForecastDetailColor(item.description)}`}>
                          {item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                        <div className="mb-3">
                          <Image
                            src={`https://openweathermap.org/img/wn/${item.icon}@2x.png`}
                            alt={item.description}
                            width={64}
                            height={64}
                            className="mx-auto mb-2 h-12 w-12"
                          />
                        </div>
                        <p className="mb-2 text-lg font-bold text-white">{Math.round(item.temp)}°C</p>
                        <p className={`mb-2 text-xs capitalize ${getForecastTextColor(item.description)}`}>
                          {item.description}
                        </p>
                        <div className={`space-y-1 text-xs ${getForecastDetailColor(item.description)}`}>
                          <p>Wind: {item.windSpeed} m/s</p>
                          <p>Humidity: {item.humidity}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeatherDashboard
