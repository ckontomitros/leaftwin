// src/app/page.tsx  (replace the whole file with the version below)
"use client";
import { useState, useRef } from "react";
import MapPicker from "@/component/MapPicker";
import { recommendPlants } from "@/lib/recomment";
import { addPlantedPlant } from "@/lib/plantStorage";
import Link from "next/link";

export default function Home() {
  const [location, setLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ---- slide-down state ----
  const [selectedRec, setSelectedRec] = useState<any | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

 // Inside handleSelect
const handleSelect = async ({ lng, lat }: { lng: number; lat: number }) => {
  setLocation({ lng, lat });
  setLoading(true);
  const recs = await recommendPlants(lat, lng);
  setPlants(recs);
  setLoading(false);
};

  const handlePlantHere = () => {
    if (!location || !selectedRec) return;

    // Convert recommendation → real Plant (simplified)
    const newPlant = addPlantedPlant({
      name: selectedRec.name,
      species: selectedRec.species ?? selectedRec.name,
      health: "healthy",
      soilMoisture: 65,
      waterIn: 3,
      location,
      // approximate % for the overlay map (dashboard uses the same projection)
      mapX: ((location.lng + 180) / 360) * 100,
      mapY: ((90 - location.lat) / 180) * 100,
    });

    // close panel & give feedback
    setSelectedRec(null);
    alert(`${selectedRec.name} planted! View it on the Digital Twins map.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white font-sans">
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* ---- MAP ---- */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-green-800">Pick a Planting Spot</h2>
            <MapPicker onLocationSelect={handleSelect} />
            {location && (
              <p className="mt-3 text-sm text-gray-600">
                Selected: <strong>{location.lng.toFixed(4)}°, {location.lat.toFixed(4)}°</strong>
              </p>
            )}
          </div>

          {/* ---- RECOMMENDATIONS ---- */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              {location ? "Recommended for This Spot" : "Tap the map to begin"}
            </h2>

            {loading && (
              <p className="text-gray-500 animate-pulse">Analyzing soil, sun, and climate...</p>
            )}

            <div className="space-y-4">
              {plants.map((plant, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedRec(plant)}
                  className="bg-white p-5 rounded-xl shadow-md border border-green-100 flex gap-4 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="bg-green-100 border-2 border-dashed rounded-xl w-20 h-20 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg text-green-800">{plant.name}</h3>
                    <p className="text-sm text-gray-600">
                      Drought: <span className="text-yellow-600">{'★'.repeat(plant.drought)}</span> |
                      Sun: <span className="text-orange-500">{'☀'.repeat(plant.sun)}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{plant.soil} soil • Native to Mediterranean</p>
                  </div>
                </div>
              ))}
            </div>

            {plants.length > 0 && (
              <Link href="/dashboard">
                <button className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition">
                  View Digital Twins Map
                </button>
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* ---- SLIDE-DOWN PANEL ---- */}
      <div
        ref={panelRef}
        className={`fixed bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-2xl transition-transform duration-300 ${
          selectedRec ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "70vh" }}
     OnClick={(e) => e.stopPropagation()}
      >
        {selectedRec && (
          <div className="p-6 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-green-800">{selectedRec.name}</h3>
              <button
                onClick={() => setSelectedRec(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Drought tolerance</p>
                <p className="font-medium">{'★'.repeat(selectedRec.drought)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sun requirement</p>
                <p className="font-medium">{'☀'.repeat(selectedRec.sun)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Soil</p>
                <p className="font-medium">{selectedRec.soil}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">
                  {location?.lng.toFixed(4)}°, {location?.lat.toFixed(4)}°
                </p>
              </div>
            </div>

            <button
              onClick={handlePlantHere}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Plant Here
            </button>
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-gray-500 py-6">
        © 2025 LeafTwin • Built for Greek Municipalities • @wisper2009
      </footer>
    </div>
  );
}