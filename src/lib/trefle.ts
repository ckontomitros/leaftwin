// src/lib/trefle.ts

export interface TreflePlant {
    id: number;
    common_name: string;
    scientific_name: string;
    family: string;
    genus?: string;
    growth: Record<string, any>; // Empty object in practice
    image_url?: string | null;
  }
  
  /**
   * Search for plants by query term using the Trefle API
   * Note: The API returns basic info only, growth data is not reliably available
   */
  export async function searchPlants(
    query: string, 
    limit: number = 20
  ): Promise<TreflePlant[]> {
    const token = process.env.NEXT_PUBLIC_TREFLE_TOKEN;
    if (!token) {
      console.warn("Trefle token missing");
      return [];
    }
  
    try {
      // Use your local proxy to avoid CORS issues
      const res = await fetch(
        `/api/trefle/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
  
      if (!res.ok) {
        console.error(`Trefle search error: ${res.status}`);
        return [];
      }
  
      const data = await res.json();
      const plants = data.data || [];
      
      // Map to our interface
      return plants.map((p: any) => ({
        id: p.id,
        common_name: p.common_name || "Unknown",
        scientific_name: p.scientific_name,
        family: p.family || "Unknown",
        genus: p.genus,
        growth: {}, // Trefle doesn't return this reliably
        image_url: p.image_url,
      }));
      
    } catch (error) {
      console.error("Trefle API error:", error);
      return [];
    }
  }
  
  /**
   * Get a single plant by ID
   * In practice, this also doesn't return growth data reliably
   */
  export async function getPlantById(plantId: number): Promise<TreflePlant | null> {
    const token = process.env.NEXT_PUBLIC_TREFLE_TOKEN;
    if (!token) return null;
  
    try {
      const res = await fetch(
        `https://trefle.io/api/v1/plants/${plantId}?token=${token}`
      );
  
      if (!res.ok) return null;
  
      const response = await res.json();
      const plant = response.data;
  
      return {
        id: plant.id,
        common_name: plant.common_name || plant.scientific_name,
        scientific_name: plant.scientific_name,
        family: plant.family || "Unknown",
        genus: plant.genus?.name,
        growth: plant.main_species?.growth || {},
        image_url: plant.image_url || plant.main_species?.image_url,
      };
    } catch (error) {
      console.error(`Failed to fetch plant ${plantId}:`, error);
      return null;
    }
  }