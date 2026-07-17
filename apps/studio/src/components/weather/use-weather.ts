"use client"

import * as React from "react"
import type { ForecastData, ForecastItem, WeatherData } from "@/lib/weather/types"

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
const FORECAST_DAYS = 5

export function useWeather() {
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
      if (!forecastEntry) {
        return {
          date,
          temp: 0,
          description: "",
          icon: "01d",
          humidity: 0,
          windSpeed: 0,
        }
      }
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

  return {
    cityInput,
    setCityInput,
    currentWeather,
    forecast,
    recentCities,
    showDropdown,
    setShowDropdown,
    loading,
    error,
    handleSearch,
    handleCurrentLocation,
    handleRecentCityClick,
  }
}
