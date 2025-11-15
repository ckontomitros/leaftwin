// src/lib/plantData.ts
export type Plant = {
    id: string;
    name: string;
    species: string;
    location: { lng: number; lat: number };
    mapX: number;
    mapY: number;
    health: "healthy" | "warning" | "critical";
    soilMoisture: number;
    waterIn: number;
    plantedDate: string;
    lastWatered: string;
  };
  
  export async function getAllPlants(): Promise<Plant[]> {
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 600));
  
    return [
      {
        id: "PLT-001",
        name: "Ελιά Πλατείας",
        species: "Olea europaea",
        location: { lng: 23.7275, lat: 37.9838 },
        mapX: 50, mapY: 50,
        health: "healthy",
        soilMoisture: 68,
        waterIn: 3,
        plantedDate: "2023-04-15",
        lastWatered: "2025-11-12"
      },
      {
        id: "PLT-002",
        name: "Λεβάντα Πάρκου",
        species: "Lavandula angustifolia",
        location: { lng: 23.7300, lat: 37.9800 },
        mapX: 55, mapY: 45,
        health: "warning",
        soilMoisture: 32,
        waterIn: 1,
        plantedDate: "2024-06-20",
        lastWatered: "2025-11-10"
      },
      {
        id: "PLT-003",
        name: "Δεντρολίβανο",
        species: "Rosmarinus officinalis",
        location: { lng: 23.7250, lat: 37.9850 },
        mapX: 45, mapY: 55,
        health: "critical",
        soilMoisture: 18,
        waterIn: 0,
        plantedDate: "2024-03-10",
        lastWatered: "2025-11-05"
      },
    ];
  }
  export async function getPlantById(id: string): Promise<Plant | undefined> {
    const plants = await getAllPlants();
    console.log(id)
    return plants.find(p => p.id === id);
  }