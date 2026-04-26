# Weather Dashboard

Weather information with city search and 5-day forecast.

**Live**: [jayantgoyal.com/weather](https://jayantgoyal.com/weather)

## Features

- Current weather conditions
- 5-day forecast with hourly breakdown
- City search with autocomplete
- Geolocation-based weather
- Temperature, humidity, wind, visibility
- Weather icons and descriptions

## Tech Stack

- **OpenWeather API** - Weather data provider
- **Geolocation API** - Browser location access
- **React 19** - UI rendering

## How It Works

1. User grants location permission OR searches for a city
2. App fetches current weather from OpenWeather API
3. Forecast data fetched for 5-day outlook
4. Data displayed with appropriate weather icons

## Files

```
src/
├── app/(protected)/weather/
│   ├── page.tsx                  # Server component
│   └── client.tsx                # Weather UI
├── components/weather/
│   └── weather-dashboard.tsx     # Dashboard component
└── lib/weather/
    └── types.ts                  # TypeScript types
```

## API Integration

```typescript
// Current weather
GET https://api.openweathermap.org/data/2.5/weather
  ?q={city}&appid={API_KEY}&units=metric

// 5-day forecast
GET https://api.openweathermap.org/data/2.5/forecast
  ?q={city}&appid={API_KEY}&units=metric
```

## Environment Variables

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key
```
