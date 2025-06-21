import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type Props = {
  onClose: () => void;
  onSave: () => void;
  defaultValues?: {
    id?: string;
    name: string;
    price: number;
    duration_min: number;
    category: string;
  };
};

export default function EditTreatmentModal({ onClose, onSave, defaultValues }: Props) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [price, setPrice] = useState(defaultValues?.price ?? 0);
  const [duration, setDuration] = useState(defaultValues?.duration_min ?? 0);
  const [category, setCategory] = useState(defaultValues?.category ?? "");

  const isEditing = !!defaultValues?.id;

  async function handleSave() {
    if (!name || !price || !duration || !category) {
      alert("Per favore, compila tutti i campi.");
      return;
    }

    const { error } = await supabase.from("services").upsert({
      id: defaultValues?.id,
      name,
      price,
      duration_min: duration,
      category,
    });

    if (error) {
      console.error(error);
      alert("Errore durante il salvataggio.");
    } else {
      onSave();
    }
  }

  return (
    <div className="space-y-4 p-4 w-full max-w-md mx-auto">
      <div>
        <label className="block mb-1 font-medium">Nome</label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Durata (minuti)</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Prezzo (€)</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Categoria</label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
        >
          Annulla
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[#5b3623] text-white rounded hover:bg-[#472c1b]"
        >
          {isEditing ? "Aggiorna" : "Salva"}
        </button>
      </div>
    </div>
  );
}