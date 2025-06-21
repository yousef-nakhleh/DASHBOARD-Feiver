// src/pages/Trattamenti.tsx
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Clock,
  DollarSign,
  Edit2,
  Trash2,
} from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const categories = ["Tutti", "Capelli", "Barba", "Combo", "Colore", "Trattamenti"];

export default function Trattamenti() {
  const [services, setServices] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tutti");
  const [filtered, setFiltered] = useState<any[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedCategory === "Tutti") setFiltered(services);
    else setFiltered(services.filter(s => s.category === selectedCategory));
  }, [selectedCategory, services]);

  async function fetchServices() {
    const { data, error } = await supabase.from("services").select("*");
    if (!error && data) setServices(data);
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Trattamenti</h2>
        <button className="bg-[#5c3b30] hover:bg-[#472c24] text-white px-4 py-2 rounded">
          + Nuovo Trattamento
        </button>
      </div>
      <p className="text-gray-500 mb-4">Gestisci servizi e prezzi</p>

      <div className="bg-white shadow rounded-lg p-4">
        <input
          type="text"
          placeholder="Cerca trattamento"
          className="w-full p-2 border rounded mb-4"
        />
        <div className="flex gap-2 mb-4 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1 rounded-full ${
                selectedCategory === cat
                  ? "bg-[#5c3b30] text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b font-semibold">
              <tr>
                <th className="p-2">TRATTAMENTO</th>
                <th className="p-2">DURATA</th>
                <th className="p-2">PREZZO</th>
                <th className="p-2">CATEGORIA</th>
                <th className="p-2">POPOLARE</th>
                <th className="p-2">AZIONI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2 flex items-center gap-1">
                    <Clock size={16} className="text-gray-500" />
                    {s.duration_min} min
                  </td>
                  <td className="p-2 flex items-center gap-1">
                    <DollarSign size={16} className="text-gray-500" />
                    €{s.price}
                  </td>
                  <td className="p-2">
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                      {s.category}
                    </span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        s.is_popular
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {s.is_popular ? "Sì" : "No"}
                    </span>
                  </td>
                  <td className="p-2 flex gap-2">
                    <Edit2 size={16} className="text-blue-600 cursor-pointer" />
                    <Trash2 size={16} className="text-red-600 cursor-pointer" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-400">
                    Nessun trattamento trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}