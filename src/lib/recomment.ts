// src/lib/recommend.ts
import { getWeather, WeatherData } from "./weather";
import { searchPlants, TreflePlant } from "./trefle";

/**
 * Plant database with known characteristics for Mediterranean region
 * Since Trefle API doesn't reliably return growth data, we maintain a local database
 */
const PLANT_DATABASE: Record<string, {
  drought: "low" | "medium" | "high";
  sun: number; // 1-10
  humidity: number; // 1-10
  temp_min: number;
  temp_max: number;
  native_regions: string[];
}> = {
  // Mediterranean Trees
  "olea europaea": { drought: "high", sun: 9, humidity: 4, temp_min: -10, temp_max: 40, native_regions: ["mediterranean"] },
  "pinus halepensis": { drought: "high", sun: 9, humidity: 3, temp_min: -15, temp_max: 40, native_regions: ["mediterranean"] },
  "quercus ilex": { drought: "high", sun: 8, humidity: 5, temp_min: -15, temp_max: 40, native_regions: ["mediterranean"] },
  "cupressus sempervirens": { drought: "high", sun: 9, humidity: 4, temp_min: -15, temp_max: 40, native_regions: ["mediterranean"] },
  
  // Mediterranean Herbs
  "lavandula angustifolia": { drought: "high", sun: 8, humidity: 3, temp_min: -15, temp_max: 35, native_regions: ["mediterranean"] },
  "rosmarinus officinalis": { drought: "high", sun: 8, humidity: 4, temp_min: -10, temp_max: 40, native_regions: ["mediterranean"] },
  "salvia officinalis": { drought: "high", sun: 8, humidity: 4, temp_min: -15, temp_max: 35, native_regions: ["mediterranean"] },
  "thymus vulgaris": { drought: "high", sun: 8, humidity: 3, temp_min: -20, temp_max: 35, native_regions: ["mediterranean"] },
  "origanum vulgare": { drought: "high", sun: 7, humidity: 4, temp_min: -15, temp_max: 35, native_regions: ["mediterranean"] },
  
  // Mediterranean Shrubs
  "nerium oleander": { drought: "high", sun: 9, humidity: 4, temp_min: -10, temp_max: 45, native_regions: ["mediterranean"] },
  "myrtus communis": { drought: "high", sun: 8, humidity: 5, temp_min: -10, temp_max: 40, native_regions: ["mediterranean"] },
  "cistus": { drought: "high", sun: 9, humidity: 3, temp_min: -10, temp_max: 40, native_regions: ["mediterranean"] },
  "laurus nobilis": { drought: "medium", sun: 7, humidity: 5, temp_min: -10, temp_max: 35, native_regions: ["mediterranean"] },
  
  // Common Garden Plants
  "rosa": { drought: "medium", sun: 7, humidity: 6, temp_min: -20, temp_max: 35, native_regions: ["temperate"] },
  "geranium": { drought: "medium", sun: 6, humidity: 5, temp_min: -5, temp_max: 30, native_regions: ["temperate"] },
  "bougainvillea": { drought: "high", sun: 9, humidity: 4, temp_min: 0, temp_max: 40, native_regions: ["tropical", "mediterranean"] },
  
  // Vegetables/Herbs
  "allium": { drought: "medium", sun: 6, humidity: 5, temp_min: -15, temp_max: 30, native_regions: ["temperate"] },
  "ocimum basilicum": { drought: "low", sun: 7, humidity: 6, temp_min: 10, temp_max: 35, native_regions: ["tropical"] },
  "petroselinum crispum": { drought: "medium", sun: 5, humidity: 6, temp_min: -5, temp_max: 30, native_regions: ["temperate"] },
};

/**
 * Determine climate type based on weather data
 */
function getClimateType(weather: WeatherData): string {
  const { temp, humidity, rain_days } = weather;
  
  if (temp > 25 && rain_days < 2 && humidity < 60) return "mediterranean";
  if (temp > 20 && humidity > 70) return "tropical";
  if (temp < 15 && rain_days > 4) return "temperate_wet";
  if (temp < 10) return "cold";
  if (rain_days < 1 && temp > 20) return "arid";
  
  return "temperate";
}

/**
 * Score a plant based on weather match using our database
 */
function scorePlant(
  plant: TreflePlant, 
  weather: WeatherData,
  plantData?: typeof PLANT_DATABASE[string]
): number {
  // If we don't have data for this plant, give it a low baseline score
  if (!plantData) return 10;
  
  let score = 0;

  // Drought tolerance vs rain (0-35 points)
  if (plantData.drought === "high" && weather.rain_days < 2) {
    score += 35;
  } else if (plantData.drought === "high" && weather.rain_days < 4) {
    score += 25;
  } else if (plantData.drought === "medium" && weather.rain_days >= 2 && weather.rain_days <= 5) {
    score += 30;
  } else if (plantData.drought === "low" && weather.rain_days > 5) {
    score += 35;
  } else if (plantData.drought === "medium") {
    score += 20;
  }

  // Light requirements vs temperature (0-30 points)
  const idealLight = weather.temp > 25 ? 8 : weather.temp > 15 ? 6 : 4;
  const lightDiff = Math.abs(plantData.sun - idealLight);
  
  if (lightDiff === 0) score += 30;
  else if (lightDiff <= 1) score += 25;
  else if (lightDiff <= 2) score += 15;
  else if (lightDiff <= 3) score += 5;

  // Humidity match (0-20 points)
  if (weather.humidity > 70 && plantData.humidity > 6) {
    score += 20;
  } else if (weather.humidity < 50 && plantData.humidity < 5) {
    score += 20;
  } else if (Math.abs(weather.humidity / 10 - plantData.humidity) <= 2) {
    score += 10;
  }

  // Temperature range (0-15 points)
  if (weather.temp >= plantData.temp_min && weather.temp <= plantData.temp_max) {
    score += 15;
  } else if (weather.temp >= plantData.temp_min - 5 && weather.temp <= plantData.temp_max + 5) {
    score += 8;
  }

  return score;
}

/**
 * Find plant data by matching scientific name
 */
function findPlantData(scientificName: string): typeof PLANT_DATABASE[string] | undefined {
  const normalized = scientificName.toLowerCase();
  
  // Exact match
  if (PLANT_DATABASE[normalized]) {
    return PLANT_DATABASE[normalized];
  }
  
  // Genus match (e.g., "Allium schoenoprasum" matches "allium")
  const genus = normalized.split(' ')[0];
  if (PLANT_DATABASE[genus]) {
    return PLANT_DATABASE[genus];
  }
  
  // Partial match
  for (const [key, data] of Object.entries(PLANT_DATABASE)) {
    if (normalized.includes(key) || key.includes(genus)) {
      return data;
    }
  }
  
  return undefined;
}

/**
 * Main recommendation function
 */
export async function recommendPlants(lat: number, lng: number) {
  try {
    // 1. Get weather data
    const weather = await getWeather(lat, lng);
    const climate = getClimateType(weather);
    console.log("Weather:", { 
      temp: weather.temp, 
      rain: weather.rain_days, 
      humidity: weather.humidity,
      climate 
    });
    
    // 2. Search for diverse plant types
    const searchTerms = [
      "mediterranean",
      "lavender",
      "olive",
      "rosemary",
      "sage",
      "thyme"
    ];
    
    const allPlants: TreflePlant[] = [];
    const seenIds = new Set<number>();
    
    for (const term of searchTerms) {
      try {
        const plants = await searchPlants(term, 10);
        plants.forEach(p => {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            allPlants.push(p);
          }
        });
      } catch (err) {
        console.warn(`Search failed for "${term}"`);
      }
    }
    
    console.log(`Found ${allPlants.length} unique plants from Trefle`);
    
    // 3. Score plants using our database
    const scored = allPlants
      .map(p => {
        const plantData = findPlantData(p.scientific_name);
        const score = scorePlant(p, weather, plantData);
        return { plant: p, plantData, score };
      })
      .filter(({ plantData, score }) => plantData && score > 30) // Only plants we know about with good scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    console.log("Top plants:", scored.map(s => ({ 
      name: s.plant.common_name,
      scientific: s.plant.scientific_name,
      score: s.score 
    })));
    
    // 4. If we got results, format them
    if (scored.length > 0) {
      return scored.map(({ plant, plantData, score }) => ({
        name: plant.common_name || plant.scientific_name,
        species: plant.scientific_name,
        family: plant.family,
        drought: plantData!.drought,
        sun: plantData!.sun,
        humidity: plantData!.humidity,
        image: plant.image_url || undefined,
        score: score,
        weather_note: `Ideal for ${weather.description} (${weather.temp.toFixed(1)}°C, ${weather.rain_days.toFixed(1)} rainy days)`,
        climate: climate,
      }));
    }
    
    // 5. Fallback to database plants if Trefle failed
    console.log("Using fallback recommendations from database");
    return getWeatherBasedRecommendations(weather);
    
  } catch (error) {
    console.error("Recommendation error:", error);
    // Return Mediterranean defaults for Greek locations
    return [
      { 
        name: "Olive Tree", 
        species: "Olea europaea", 
        family: "Oleaceae",
        drought: "high", 
        sun: 9, 
        humidity: 4,
        image: undefined,
        score: 95,
        weather_note: "Perfect Mediterranean climate plant",
        climate: "mediterranean"
      },
      { 
        name: "Lavender", 
        species: "Lavandula angustifolia", 
        family: "Lamiaceae",
        drought: "high", 
        sun: 8, 
        humidity: 3,
        image: undefined,
        score: 90,
        weather_note: "Drought-tolerant and aromatic",
        climate: "mediterranean"
      },
      { 
        name: "Rosemary", 
        species: "Rosmarinus officinalis", 
        family: "Lamiaceae",
        drought: "high", 
        sun: 8, 
        humidity: 4,
        image: undefined,
        score: 88,
        weather_note: "Hardy herb for dry conditions",
        climate: "mediterranean"
      },
    ];
  }
}

/**
 * Get recommendations directly from database based on weather
 */
function getWeatherBasedRecommendations(weather: WeatherData) {
  const climate = getClimateType(weather);
  
  // Score all database plants
  const scored = Object.entries(PLANT_DATABASE)
    .map(([scientificName, plantData]) => {
      const fakePlant: TreflePlant = {
        id: 0,
        common_name: scientificName,
        scientific_name: scientificName,
        family: "Unknown",
        growth: {},
      };
      const score = scorePlant(fakePlant, weather, plantData);
      return { scientificName, plantData, score };
    })
    .filter(({ score }) => score > 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  
  return scored.map(({ scientificName, plantData, score }) => ({
    name: formatCommonName(scientificName),
    species: scientificName,
    family: "Mediterranean Native",
    drought: plantData.drought,
    sun: plantData.sun,
    humidity: plantData.humidity,
    image: undefined,
    score: score,
    weather_note: `Perfect for ${weather.description} (${weather.temp.toFixed(1)}°C)`,
    climate: climate,
  }));
}

function formatCommonName(scientificName: string): string {
  const names: Record<string, string> = {
    "olea europaea": "Olive Tree",
    "lavandula angustifolia": "Lavender",
    "rosmarinus officinalis": "Rosemary",
    "salvia officinalis": "Sage",
    "thymus vulgaris": "Thyme",
    "origanum vulgare": "Oregano",
    "nerium oleander": "Oleander",
    "myrtus communis": "Myrtle",
    "laurus nobilis": "Bay Laurel",
  };
  return names[scientificName.toLowerCase()] || scientificName;
}