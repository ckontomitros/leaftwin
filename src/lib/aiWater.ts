// src/lib/aiWater.ts
import { WeatherData } from "./weather";
export function predictWaterNeed(plant: any, weather: WeatherData): number {
    let days = 7;
  
    if (weather.precipitation > 50) days += 3;
    if (weather.temp > 30) days -= 2;
    if (plant.drought === "high") days += 2;
  
    return Math.max(0, days);
  }