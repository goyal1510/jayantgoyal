"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, MapPin, Search } from "lucide-react"

import { useWeather } from "./use-weather"
import {
  formatDate,
  getWeatherBgColor,
  getForecastCardStyle,
  getForecastTextColor,
  getForecastDetailColor,
} from "./weather-utils"

export function WeatherDashboard() {
  const {
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
  } = useWeather()

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      void handleSearch()
    }
  }

  return (
    <div className="flex-1 rounded-lg">
      <div className="container mx-auto px-4 py-6 text-gray-900 dark:text-white">
        {error ? (
          <div className="mx-auto mb-6 max-w-3xl rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/60 dark:bg-red-500/20 dark:text-red-50">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex w-full flex-col gap-4 rounded-md border border-gray-200 bg-white/60 p-6 backdrop-blur-md dark:border-white/10 dark:bg-gray-800/50 md:w-1/4">
            <div className="flex flex-col gap-2">
              <span className="text-lg font-semibold">Enter the city:</span>
              <input
                type="text"
                placeholder="Enter a city"
                value={cityInput}
                onChange={(event) => setCityInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-transparent"
              />
              <button
                onClick={() => void handleSearch()}
                disabled={loading}
                className="mt-2 flex h-10 w-full cursor-pointer items-center justify-center rounded-md bg-blue-500 px-2 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
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

            <div className="text-center text-lg font-semibold text-gray-400 dark:text-white/80">or</div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleCurrentLocation}
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Current Location
              </button>

              {recentCities.length > 0 ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown((open) => !open)}
                    className="mt-1 flex w-full cursor-pointer items-center justify-between rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
                  >
                    <span>Recent Searches</span>
                    {showDropdown ? (
                      <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                  </button>
                  {showDropdown ? (
                    <div className="absolute mt-1 max-h-32 w-full overflow-y-auto rounded-md bg-white shadow-lg dark:bg-gray-700 dark:text-white">
                      <ul className="py-1">
                        {recentCities.map((city) => (
                          <li key={city}>
                            <button
                              onClick={() => void handleRecentCityClick(city)}
                              className="w-full cursor-pointer px-4 py-2 text-left transition hover:bg-gray-100 dark:hover:bg-gray-600"
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

          <div className="flex w-full flex-col rounded-md border border-gray-200 bg-white/60 p-4 backdrop-blur-md dark:border-white/10 dark:bg-gray-800/50 md:w-3/4">
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
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
              <div className="mb-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500 dark:border-white/20 dark:bg-white/5 dark:text-white/80">
                Search for a city or use your current location to see today&apos;s weather.
              </div>
            )}

            {forecast.length > 0 ? (
              <>
                <h2 className="mb-4 text-center text-xl font-semibold text-gray-900 dark:text-white">
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
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
  )
}

export default WeatherDashboard
