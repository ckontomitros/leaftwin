// src/lib/weather.ts
export interface WeatherData {
    temp: number;          // Current temp °C
    humidity: number;      // Current % 
    precipitation: number; // Next 3h rain chance %
    wind_speed: number;    // Current km/h
    description: string;   // "Clear sky"
    forecast_temp: number; // Median temp next 7 days
    rain_days: number;     // Expected rainy days (next 7 days)
    temp_min: number;      // Min temp in forecast
    temp_max: number;      // Max temp in forecast
    climate_summary: string; // Human-readable summary
  }
  
  /**
   * Calculate median of an array
   */
  function median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }
  
  /**
   * Get comprehensive weather data for plant recommendations
   */
  export async function getWeather(lat: number, lng: number): Promise<WeatherData> {
    const key = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;
    if (!key) throw new Error("OpenWeather API key missing");
  
    // FREE: Current weather
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric`
    );
    if (!currentRes.ok) throw new Error(`Current API error: ${currentRes.status}`);
    const current = await currentRes.json();
  
    // FREE: 5-day forecast (3-hour intervals = 40 data points)
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${key}&units=metric`
    );
    if (!forecastRes.ok) throw new Error(`Forecast API error: ${forecastRes.status}`);
    const forecast = await forecastRes.json();
  
    // Extract temperatures for median calculation
    const temps = forecast.list.map((item: any) => item.main.temp);
    const medianTemp = median(temps);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
  
    // Calculate average humidity
    const humidities = forecast.list.map((item: any) => item.main.humidity);
    const avgHumidity = humidities.reduce((a: number, b: number) => a + b, 0) / humidities.length;
  
    // Calculate rainy days (count intervals with rain, divide by 8 for daily estimate)
    const rainyIntervals = forecast.list.filter((item: any) => 
      (item.rain?.['3h'] || 0) > 0.1 // At least 0.1mm rain
    ).length;
    const rainDays = rainyIntervals / 8; // 8 intervals per day
  
    // Calculate average wind speed
    const windSpeeds = forecast.list.map((item: any) => item.wind.speed * 3.6); // m/s to km/h
    const avgWindSpeed = windSpeeds.reduce((a: number, b: number) => a + b, 0) / windSpeeds.length;
  
    // Generate climate summary
    const climateSummary = generateClimateSummary({
      temp: medianTemp,
      rain_days: rainDays,
      humidity: avgHumidity,
      wind_speed: avgWindSpeed
    });
  
    return {
      temp: current.main.temp,
      humidity: current.main.humidity,
      precipitation: forecast.list[0].pop * 100 || 0, // Probability of precipitation as %
      wind_speed: current.wind.speed * 3.6, // m/s to km/h
      description: current.weather[0].description,
      forecast_temp: medianTemp,
      rain_days: rainDays,
      temp_min: minTemp,
      temp_max: maxTemp,
      climate_summary: climateSummary,
    };
  }
  
  /**
   * Generate a human-readable climate summary
   */
  function generateClimateSummary(data: {
    temp: number;
    rain_days: number;
    humidity: number;
    wind_speed: number;
  }): string {
    const parts: string[] = [];
  
    // Temperature
    if (data.temp > 30) parts.push("Very hot");
    else if (data.temp > 25) parts.push("Hot");
    else if (data.temp > 20) parts.push("Warm");
    else if (data.temp > 15) parts.push("Mild");
    else if (data.temp > 10) parts.push("Cool");
    else parts.push("Cold");
  
    // Rain
    if (data.rain_days < 1) parts.push("dry");
    else if (data.rain_days < 3) parts.push("occasional rain");
    else if (data.rain_days < 5) parts.push("moderate rain");
    else parts.push("rainy");
  
    // Humidity
    if (data.humidity > 80) parts.push("very humid");
    else if (data.humidity > 70) parts.push("humid");
    else if (data.humidity < 40) parts.push("dry air");
  
    // Wind
    if (data.wind_speed > 30) parts.push("windy");
    else if (data.wind_speed > 20) parts.push("breezy");
  
    return parts.join(", ");
  }
  
  /**
   * Get seasonal weather patterns (requires paid API or manual data)
   * This is a placeholder for future enhancement
   */
  export async function getSeasonalPatterns(lat: number, lng: number) {
    // For MVP, return typical Mediterranean patterns
    // In production, you'd use historical weather data or climate APIs
    
    const month = new Date().getMonth(); // 0-11
    
    // Mediterranean climate approximation
    if (lat > 35 && lat < 45 && lng > 15 && lng < 30) {
      if (month >= 5 && month <= 8) {
        // Summer: hot, dry
        return {
          season: "summer",
          typical_temp: 30,
          typical_rain_days: 1,
          drought_risk: "high"
        };
      } else if (month >= 11 || month <= 1) {
        // Winter: mild, wet
        return {
          season: "winter",
          typical_temp: 12,
          typical_rain_days: 8,
          drought_risk: "low"
        };
      }
    }
    
    return {
      season: "transitional",
      typical_temp: 20,
      typical_rain_days: 4,
      drought_risk: "medium"
    };
  }