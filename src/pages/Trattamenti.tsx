import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, DollarSign, Edit2, Trash2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration_min: number;
  price: number;
  category: string | null;
  is_popular: boolean;
}

export default function ServicesTable() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, duration_min, price, category, is_popular");

      if (!error && data) setServices(data);
    };

    fetchServices();
  }, []);

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Trattamenti</h1>
      <p className="text-gray-500 mb-4">Gestisci servizi e prezzi</p>

      <input
        type="text"
        placeholder="Cerca trattamento"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 p-2 border rounded-md"
      />

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 uppercase">
            <tr>
              <th className="p-2">Trattamento</th>
              <th className="p-2">Durata</th>
              <th className="p-2">Prezzo</th>
              <th className="p-2">Categoria</th>
              <th className="p-2">Popolare</th>
              <th className="p-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                {/* TRATTAMENTO */}
                <td className="p-2 font-medium">{s.name}</td>

                {/* DURATA */}
                <td className="p-2">
                  <div className="flex items-center gap-1">
                    <Clock size={16} className="text-gray-500" />
                    {s.duration_min} min
                  </div>
                </td>

                {/* PREZZO */}
                <td className="p-2">
                  <div className="flex items-center gap-1">
                    <DollarSign size={16} className="text-gray-500" />
                    €{s.price}
                  </div>
                </td>

                {/* CATEGORIA */}
                <td className="p-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {s.category || "No"}
                  </span>
                </td>

                {/* POPOLARE */}
                <td className="p-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {s.is_popular ? "Sì" : "No"}
                  </span>
                </td>

                {/* AZIONI */}
                <td className="p-2">
                  <div className="flex gap-2">
                    <button>
                      <Edit2 size={16} className="text-blue-600 hover:text-blue-800" />
                    </button>
                    <button>
                      <Trash2 size={16} className="text-red-600 hover:text-red-800" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Nessun trattamento trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}