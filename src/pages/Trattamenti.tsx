import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Clock, DollarSign, Edit2, Trash2 } from "lucide-react";
import EditTreatmentModal from "@/components/treatments/EditTreatmentModal";
import CreateTreatmentModal from "@/components/treatments/CreateTreatmentModal";
import { Dialog } from "@headlessui/react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const categories = ["Tutti", "Capelli", "Barba", "Combo", "Colore", "Trattamenti"];

export default function Trattamenti() {
  const [services, setServices] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tutti");
  const [filtered, setFiltered] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedCategory === "Tutti") setFiltered(services);
    else setFiltered(services.filter((s) => s.category === selectedCategory));
  }, [selectedCategory, services]);

  async function fetchServices() {
    const { data, error } = await supabase.from("services").select("*");
    if (!error && data) setServices(data);
  }

  async function handleConfirmDelete(id: string) {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert("Errore durante l'eliminazione.");
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Trattamenti</h2>
        <button
          className="bg-[#5c3b30] hover:bg-[#472c24] text-white px-4 py-2 rounded"
          onClick={() => setCreating(true)}
        >
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
                  <td className="p-2">
                    <div className="inline-flex items-center gap-1 text-gray-700">
                      <Clock size={16} className="text-gray-500" />
                      {s.duration_min} min
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="inline-flex items-center gap-1 text-gray-700">
                      <DollarSign size={16} className="text-gray-500" />
                      €{s.price}
                    </div>
                  </td>
                  <td className="p-2">
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                      {s.category || "—"}
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
                    <Edit2
                      size={16}
                      className="text-blue-600 cursor-pointer"
                      onClick={() => setEditing(s)}
                    />
                    <Trash2
                      size={16}
                      className="text-red-600 cursor-pointer"
                      onClick={() => setToDelete(s)}
                    />
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

      {editing && (
        <EditTreatmentModal
          treatment={editing}
          onClose={() => setEditing(null)}
          onSave={async () => {
            await fetchServices();
            setEditing(null);
          }}
        />
      )}

      {/* ✅ Confirm Delete Modal */}
      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Panel className="bg-white p-6 rounded shadow max-w-sm w-full">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Conferma eliminazione
            </Dialog.Title>
            <p className="mb-6">Sei sicuro di voler eliminare questo trattamento?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setToDelete(null)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Annulla
              </button>
              <button
                onClick={async () => {
                  await handleConfirmDelete(toDelete.id);
                  setToDelete(null);
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Elimina
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* ✅ Create Treatment Modal */}
      {creating && (
        <CreateTreatmentModal
          onClose={() => setCreating(false)}
          onCreated={async () => {
            await fetchServices();
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}