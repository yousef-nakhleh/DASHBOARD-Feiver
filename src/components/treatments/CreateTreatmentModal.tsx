import { Dialog } from "@headlessui/react";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const categories = ["Capelli", "Barba", "Combo", "Colore", "Trattamenti"];

export default function CreateTreatmentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    duration_min: 30,
    price: 30,
    category: "Capelli",
    is_popular: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await supabase.from("services").insert([form]);
    setLoading(false);

    if (error) {
      alert("Errore durante la creazione.");
    } else {
      onCreated();
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
      <div className="bg-white p-6 rounded shadow max-w-md w-full z-10">
        <Dialog.Title className="text-lg font-semibold mb-4">Nuovo Trattamento</Dialog.Title>

        <div className="space-y-3">
          <input
            type="text"
            name="name"
            placeholder="Nome"
            value={form.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <input
            type="number"
            name="duration_min"
            placeholder="Durata (minuti)"
            value={form.duration_min}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <input
            type="number"
            name="price"
            placeholder="Prezzo (€)"
            value={form.price}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_popular"
              checked={form.is_popular}
              onChange={handleChange}
            />
            Popolare
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded border">
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#5c3b30] text-white px-4 py-2 text-sm rounded"
          >
            {loading ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}