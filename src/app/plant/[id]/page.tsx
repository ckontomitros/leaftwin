// src/app/plant/[id]/page.tsx
import { notFound } from "next/navigation";
import Plant3DModel from "@/component/Plant3DModel";
import { getPlantById, getAllPlants, type  Plant } from "@/lib/plantData";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

// THIS IS THE KEY: Pre-render all plant pages
export async function generateStaticParams() {
  const plants = await getAllPlants();
  return plants.map((plant) => ({
    id: plant.id,
  }));
}

export default async function PlantPage({ params }: PageProps) {
  const { id } = await params;

  // Debug: Log the ID
  console.log("Plant ID from params:", id);

  if (!id) {
    notFound();
  }

  const plant = await getPlantById(id);

  if (!plant) {
    notFound();
  }

  return (
    
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-green-800 mb-4">{plant.name}</h2>
            <Plant3DModel plant={plant} />
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-green-700">Πληροφορίες Φυτού</h3>
              <div className="mt-3 space-y-3">
                <InfoRow label="ID" value={plant.id} />
                <InfoRow label="Είδος" value={plant.species} />
                <InfoRow label="Κατάσταση" value={<HealthBadge health={plant.health} />} />
                <InfoRow label="Υγρασία" value={`${plant.soilMoisture}%`} />
                <InfoRow label="Πότισμα σε" value={
                  <span className={plant.waterIn === 0 ? "text-red-600 font-bold" : ""}>
                    {plant.waterIn === 0 ? "ΣΗΜΕΡΑ!" : `${plant.waterIn} ημ.`}
                  </span>
                } />
                <InfoRow label="Φυτεύτηκε" value={new Date(plant.plantedDate).toLocaleDateString("el-GR")} />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Συμβουλή:</strong> {getCareTip(plant)}
              </p>
            </div>
          </div>
        </div>
      </main>
  );
}

// Components
function LeafLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 40 40">
      <path d="M20 2C10 2 2 10 2 20s8 18 18 18 18-8 18-18S30 2 20 2z" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M20 10c-3 0-5 3-5 7 0 2 1 4 3 5 1-1 2-3 2-5 0-4-2-7-5-7z" fill="currentColor"/>
      <path d="M20 18v8m-4-4h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-200 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function HealthBadge({ health }: { health: Plant["health"] }) {
  const colors = {
    healthy: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    critical: "bg-red-100 text-red-800"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[health]}`}>
      {health === "healthy" ? "Υγιές" : health === "warning" ? "Προσοχή" : "Κρίσιμο"}
    </span>
  );
}

function getCareTip(plant: Plant) {
  if (plant.waterIn === 0) return "Ποτίστε ΑΜΕΣΑ! Το φυτό κινδυνεύει.";
  if (plant.soilMoisture < 30) return "Έλεγχος εδάφους. Εξετάστε λίπανση.";
  return "Το φυτό είναι υγιές. Συνεχίστε την καλή φροντίδα!";
}