export interface WeatherData {
  name: string
  main: {
    temp: number
    humidity: number
  }
  weather: Array<{
    description: string
    icon: string
  }>
  wind: {
    speed: number
  }
}

export interface ForecastData {
  list: Array<{
    dt: number
    dt_txt: string
    main: {
      temp: number
      humidity: number
    }
    weather: Array<{
      description: string
      icon: string
    }>
    wind: {
      speed: number
    }
  }>
  city: {
    name: string
  }
}

export interface ForecastItem {
  date: Date
  temp: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
}
