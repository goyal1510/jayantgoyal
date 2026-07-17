"use client";

import * as React from "react";
import { CloudSun, Droplets, LocateFixed, Search, Wind } from "lucide-react";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/ui/lib/utils";

import { StudioWorkspaceHeader } from "@/components/studio/studio-workspace-header";

import { useWeather } from "./use-weather";
import {
  formatDate,
  getForecastCardStyle,
  getWeatherBgColor,
} from "./weather-utils";

export function WeatherDashboard() {
  const {
    cityInput,
    setCityInput,
    currentWeather,
    forecast,
    recentCities,
    loading,
    error,
    handleSearch,
    handleCurrentLocation,
    handleRecentCityClick,
  } = useWeather();

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSearch();
    }
  };

  const currentDescription =
    currentWeather?.weather[0]?.description ?? "Weather conditions";

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-5">
      <StudioWorkspaceHeader
        icon={CloudSun}
        title="Weather"
        description="Check current conditions and the next five days for any city or your current location."
        tone="blue"
      >
        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 opacity-60" />
            <Input
              type="text"
              aria-label="City"
              placeholder="Search a city"
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              className="h-12 rounded-xl border-current/20 bg-white/65 pl-11 text-[#211512] shadow-none placeholder:text-[#211512]/55 focus-visible:ring-[#211512]/40 dark:bg-black/15 dark:text-[#fff8ef] dark:placeholder:text-[#fff8ef]/55"
            />
          </div>
          <Button
            type="button"
            onClick={() => void handleSearch()}
            disabled={loading}
            className="h-12 rounded-xl bg-[#211512] px-6 text-[#fff8ef] shadow-none hover:bg-[#211512]/90 dark:bg-[#fff8ef] dark:text-[#211512] dark:hover:bg-[#fff8ef]/90"
          >
            <Search className="size-4" />
            {loading ? "Checking weather" : "Search"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCurrentLocation}
            disabled={loading}
            className="h-12 rounded-xl border border-current/20 bg-white/20 px-5 text-current shadow-none hover:bg-white/35 hover:text-current dark:bg-black/10 dark:hover:bg-black/20"
          >
            <LocateFixed className="size-4" />
            Current location
          </Button>
        </div>

        {recentCities.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium opacity-70">Recent</span>
            {recentCities.map((city) => (
              <Button
                key={city}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleRecentCityClick(city)}
                disabled={loading}
                className="h-8 rounded-full border border-current/15 bg-white/15 px-3 text-current shadow-none hover:bg-white/30 hover:text-current dark:bg-black/10 dark:hover:bg-black/20"
              >
                {city}
              </Button>
            ))}
          </div>
        ) : null}
      </StudioWorkspaceHeader>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {currentWeather ? (
        <>
          <section
            className={cn(
              "overflow-hidden rounded-[1.75rem] border p-5 sm:p-6",
              getWeatherBgColor(currentDescription),
            )}
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
              <div>
                <h2 className="text-4xl font-semibold leading-none tracking-[-0.05em]">
                  {currentWeather.name}
                </h2>
                <p className="mt-3 text-sm opacity-75 sm:text-base">
                  {formatDate(new Date())}
                </p>
              </div>

              <p className="text-5xl font-semibold tracking-[-0.065em] sm:text-6xl">
                {Math.round(currentWeather.main.temp)}°
              </p>

              <div className="flex items-center gap-3 md:flex-col md:gap-1 md:text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://openweathermap.org/img/wn/${currentWeather.weather[0]?.icon}@2x.png`}
                  alt={currentDescription}
                  width={96}
                  height={96}
                  className="size-16 object-contain md:size-20"
                />
                <p className="text-base font-medium capitalize">
                  {currentDescription}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 border-t border-current/15 pt-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl border border-current/15 bg-white/15 dark:bg-black/10">
                  <Wind className="size-5" />
                </span>
                <div>
                  <p className="text-xs opacity-65">Wind</p>
                  <p className="font-semibold">
                    {currentWeather.wind.speed} m/s
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl border border-current/15 bg-white/15 dark:bg-black/10">
                  <Droplets className="size-5" />
                </span>
                <div>
                  <p className="text-xs opacity-65">Humidity</p>
                  <p className="font-semibold">
                    {currentWeather.main.humidity}%
                  </p>
                </div>
              </div>
            </div>
          </section>

          {forecast.length > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                    Five-day forecast
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Daily conditions at approximately midday.
                  </p>
                </div>
                <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.66rem] uppercase tracking-[0.13em] text-muted-foreground">
                  Metric units
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {forecast.map((item) => (
                  <article
                    key={item.date.toISOString()}
                    className={cn(
                      "rounded-[1.5rem] border p-5",
                      getForecastCardStyle(item.description),
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold tracking-[-0.03em]">
                          {item.date.toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </h3>
                        <p className="mt-1 text-xs opacity-65">
                          {item.date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://openweathermap.org/img/wn/${item.icon}@2x.png`}
                        alt={item.description}
                        width={64}
                        height={64}
                        className="size-14 object-contain"
                      />
                    </div>

                    <p className="mt-5 text-4xl font-semibold tracking-[-0.055em]">
                      {Math.round(item.temp)}°
                    </p>
                    <p className="mt-2 min-h-10 text-sm font-medium capitalize">
                      {item.description}
                    </p>

                    <div className="mt-5 space-y-2 border-t border-current/15 pt-4 text-xs opacity-75">
                      <p className="flex items-center gap-2">
                        <Wind className="size-3.5" />
                        {item.windSpeed} m/s
                      </p>
                      <p className="flex items-center gap-2">
                        <Droplets className="size-3.5" />
                        {item.humidity}% humidity
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="grid min-h-[300px] place-items-center rounded-[1.75rem] border border-dashed border-border/80 bg-muted/15 px-6 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#a8c3e7] bg-[#dce9f8] text-[#211512] dark:border-[#40536b] dark:bg-[#243142] dark:text-[#fff8ef]">
              <CloudSun className="size-7" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">
              Start with a city
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Search above or use your current location to load live conditions
              and the five-day outlook.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

export default WeatherDashboard;
