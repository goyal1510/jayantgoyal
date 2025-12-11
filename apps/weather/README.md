# Weather

Next.js 16 single-page weather dashboard powered by OpenWeather.

## Features
- Search any city to see current conditions plus a 5-day midday forecast.
- Dynamic styling for different weather descriptions and hoverable forecast cards.
- Recent cities persisted to localStorage for quick recall.
- Responsive UI using `@repo/ui` and Tailwind v4 tokens.

## Run locally
From the repo root:
```bash
pnpm dev --filter weather
```

## Environment
Create `.env.local` in `apps/weather` with your OpenWeather API key:
```
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
```
